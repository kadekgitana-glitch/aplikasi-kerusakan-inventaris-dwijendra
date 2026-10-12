/**
 * =============================================================================
 *  ExcelImport.gs — Sistem Impor Workbook Excel Lama (Januari - Desember)
 * =============================================================================
 *  Mendukung:
 *  - Impor dari file "Data Kerusakan Inventaris 2026" (sheet Jan–Des)
 *  - Normalisasi tanggal teks ('12/03/2026', '12 Maret 2026') dan serial Excel
 *  - Mengabaikan baris judul kop dinas, baris tanda tangan (Mengetahui, Kepala, Wakasek, dsb)
 *  - Penanganan kolom kosong tanpa menggagalkan baris
 *  - Deteksi duplikasi otomatis berbasis sidik jari (fingerprint)
 *  - Mode Pratinjau (Preview) sebelum dieksekusi ke Google Sheets
 *  - Laporan hasil impor terperinci (berhasil, dilewati, gagal)
 * =============================================================================
 */

/** Konversi serial tanggal Excel (misal 46083) ke 'yyyy-MM-dd' */
function excelSerialToIso_(serial) {
  var s = Number(serial);
  if (!s || isNaN(s) || s < 30000 || s > 60000) return '';
  // Excel epoch: 1899-12-30 (dengan bug leap year 1900)
  var utcDays = Math.floor(s - 25569);
  var utcValue = utcDays * 86400;
  var dateInfo = new Date(utcValue * 1000);
  return Utilities.formatDate(dateInfo, APP.TZ, 'yyyy-MM-dd');
}

/** Normalisasi tanggal dari berbagai variasi Excel ke format ISO 'yyyy-MM-dd' */
function parseExcelDateRaw_(val, fallbackYear, fallbackMonth) {
  if (val === null || val === undefined || val === '') return '';

  // 1. Jika sudah berupa Date objek
  if (Object.prototype.toString.call(val) === '[object Date]') {
    return toIsoDate_(val);
  }

  // 2. Jika berupa angka (Excel Serial Date)
  if (typeof val === 'number') {
    return excelSerialToIso_(val);
  }

  var s = String(val).trim();
  if (!s) return '';

  // Jika angka dalam string (misal "46083")
  if (/^\d{5}$/.test(s)) {
    return excelSerialToIso_(Number(s));
  }

  // ISO yyyy-mm-dd
  var iso = toIsoDate_(s);
  if (iso) return iso;

  // Format Indonesia: misal "15 Januari 2026" atau "15 Jan 2026"
  for (var i = 0; i < BULAN_ID.length; i++) {
    var bName = BULAN_ID[i].toLowerCase();
    if (s.toLowerCase().indexOf(bName) >= 0) {
      var nums = s.match(/\d+/g);
      if (nums && nums.length >= 2) {
        var day = parseInt(nums[0], 10);
        var yr = nums.length >= 3 ? parseInt(nums[2], 10) : (fallbackYear || 2026);
        if (day >= 1 && day <= 31) {
          var padM = ('0' + (i + 1)).slice(-2);
          var padD = ('0' + day).slice(-2);
          return yr + '-' + padM + '-' + padD;
        }
      }
    }
  }

  // Format hari saja jika berada di sheet bulanan tertentu (misal "15" atau "15/01")
  var mDayOnly = s.match(/^(\d{1,2})$/);
  if (mDayOnly && fallbackYear && fallbackMonth) {
    var dOnly = parseInt(mDayOnly[1], 10);
    if (dOnly >= 1 && dOnly <= 31) {
      return fallbackYear + '-' + ('0' + fallbackMonth).slice(-2) + '-' + ('0' + dOnly).slice(-2);
    }
  }

  return '';
}

/** Cek apakah suatu baris merupakan blok tanda tangan / footer / kop surat */
function isSignatureOrHeaderRow_(textCombined) {
  var norm = norm_(textCombined);
  if (!norm) return true;

  var blacklistWords = [
    'mengetahui', 'kepala smk', 'wakasek', 'nik.', 'nip.', 'denpasar,',
    'tahun pelajaran', 'data kerusakan inventaris', 'smk dwijendra',
    'bulan:', 'no', 'nama barang', 'kode inventaris'
  ];

  for (var i = 0; i < blacklistWords.length; i++) {
    if (norm.indexOf(blacklistWords[i]) >= 0) {
      // Jika mengandung kata kunci tanda tangan / kop dinas
      if (blacklistWords[i] === 'no' || blacklistWords[i] === 'nama barang') {
        // Baris header kolom
        return true;
      }
      if (norm.indexOf('mengetahui') >= 0 || norm.indexOf('kepala smk') >= 0 || norm.indexOf('wakasek') >= 0 || norm.indexOf('nik.') >= 0) {
        return true;
      }
      if (norm.indexOf('data kerusakan inventaris') >= 0 || norm.indexOf('smk dwijendra') >= 0) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Memetakan baris mentah dari sheet bulanan ke struktur database baru
 */
function parseImportRow_(rawRow, sheetName, rowIdx, fallbackYear) {
  // rawRow diharapkan berupa array 11 kolom atau objek {col0, col1, ...}
  var cells = Array.isArray(rawRow) ? rawRow : Object.keys(rawRow).map(function (k) { return rawRow[k]; });
  if (!cells || cells.length === 0) return null;

  var combined = cells.join(' ').trim();
  if (!combined || isSignatureOrHeaderRow_(combined)) {
    return null; // baris kosong atau tanda tangan
  }

  // Estimasi bulan dari nama sheet (misal 'Januari', 'Jan', 'Sheet 1', dsb)
  var fallbackMonth = 0;
  for (var m = 0; m < BULAN_ID.length; m++) {
    if (norm_(sheetName).indexOf(norm_(BULAN_ID[m])) >= 0) {
      fallbackMonth = m + 1;
      break;
    }
  }

  // Kolom standar Excel 11 kolom:
  // [0] No
  // [1] Nama Barang
  // [2] Kode Inventaris
  // [3] Jumlah
  // [4] Lokasi/Ruangan
  // [5] Kondisi Kerusakan
  // [6] Dokumentasi Kerusakan (URL / Teks)
  // [7] Tanggal Rusak
  // [8] Tanggal Perbaikan
  // [9] Dokumentasi Setelah Perbaikan (URL / Teks)
  // [10] Keterangan

  var nama = cleanText_(cells[1], 150);
  if (!nama) return null; // Nama barang wajib ada

  var kode = cleanText_(cells[2], 50);
  var jumlahRaw = cells[3];
  var jumlah = parseInt(jumlahRaw, 10);
  if (isNaN(jumlah) || jumlah <= 0) {
    jumlah = 1; // Default fallback jika kosong / tidak terbaca
  }

  var lokasi = cleanText_(cells[4], 100) || 'Ruang FO';
  var kondisi = cleanText_(cells[5], 2000) || 'Kerusakan fisik / perlu perbaikan';

  var urlKerusakanRaw = cleanText_(cells[6], 2000);
  var tglRusakRaw = cells[7];
  var tglPerbaikanRaw = cells[8];
  var urlPerbaikanRaw = cleanText_(cells[9], 2000);
  var keterangan = cleanText_(cells[10], 5000);

  var tglRusakIso = parseExcelDateRaw_(tglRusakRaw, fallbackYear, fallbackMonth);
  if (!tglRusakIso) {
    // Jika tidak dapat diuraikan, gunakan hari pertama bulan bersangkutan atau hari ini
    if (fallbackYear && fallbackMonth) {
      tglRusakIso = fallbackYear + '-' + ('0' + fallbackMonth).slice(-2) + '-01';
    } else {
      tglRusakIso = todayIso_();
    }
  }

  var tglPerbaikanIso = parseExcelDateRaw_(tglPerbaikanRaw, fallbackYear, fallbackMonth);

  // Status otomatis berdasarkan tanggal perbaikan
  var status = statusFromDate_(tglPerbaikanIso);

  // Hitung sidik jari untuk cek duplikasi
  var fp = fingerprint_(nama, kode, jumlah, lokasi, kondisi, tglRusakIso);

  return {
    sheetName: sheetName,
    rowNumber: rowIdx,
    nama: nama,
    kode: kode,
    jumlah: jumlah,
    lokasi: lokasi,
    kondisi: kondisi,
    tglRusak: tglRusakIso,
    tglPerbaikan: tglPerbaikanIso,
    status: status,
    keterangan: keterangan,
    urlKerusakan: urlKerusakanRaw,
    urlPerbaikan: urlPerbaikanRaw,
    fingerprint: fp
  };
}

/**
 * Tahap 1: Pratinjau Impor
 * Menerima payload kumpulan sheet dan baris dari frontend,
 * mengecek duplikasi terhadap database Sheets aktif, mengembalikan summary.
 */
function previewExcelImport_(user, payload) {
  requirePerm_(user, 'import.run');
  payload = payload || {};
  var sheetsData = payload.sheets || []; // [{ name: 'Januari', rows: [[...], [...]] }]
  var targetYear = toInt_(payload.year, 2026);

  var existingRecords = loadRecords_({ includeArchived: true });
  var existingFingerprints = {};
  existingRecords.forEach(function (r) {
    // Hitung sidik jari data eksisting
    var fp = fingerprint_(r.nama, r.kode, r.jumlah, r.lokasi, r.kondisi, r.tglRusak);
    existingFingerprints[fp] = r.id;
  });

  var validItems = [];
  var duplicates = [];
  var errors = [];
  var newLokasiSet = {};
  var newBarangSet = {};

  var master = loadMaster_(true);
  var existingLokasiMap = {};
  master.lokasi.forEach(function (l) { existingLokasiMap[norm_(l.nama)] = true; });
  var existingBarangMap = {};
  master.barang.forEach(function (b) { existingBarangMap[norm_(b.nama)] = true; });

  sheetsData.forEach(function (sh) {
    var shName = sh.name || 'Sheet';
    var rows = sh.rows || [];

    for (var rIdx = 0; rIdx < rows.length; rIdx++) {
      try {
        var parsed = parseImportRow_(rows[rIdx], shName, rIdx + 1, targetYear);
        if (!parsed) continue; // diabaikan karena header/footer/kosong

        if (existingFingerprints[parsed.fingerprint]) {
          duplicates.push({
            sheet: shName,
            row: rIdx + 1,
            nama: parsed.nama,
            lokasi: parsed.lokasi,
            tglRusak: parsed.tglRusak,
            alasan: 'Data terdeteksi identik dengan laporan ' + existingFingerprints[parsed.fingerprint]
          });
        } else {
          // Tandai sidik jari dalam batch yang sama agar tidak duplikat ganda di dalam file
          existingFingerprints[parsed.fingerprint] = 'Batch Impor';
          validItems.push(parsed);

          if (!existingLokasiMap[norm_(parsed.lokasi)]) {
            newLokasiSet[parsed.lokasi] = true;
          }
          if (!existingBarangMap[norm_(parsed.nama)]) {
            newBarangSet[parsed.nama] = true;
          }
        }
      } catch (err) {
        errors.push({
          sheet: shName,
          row: rIdx + 1,
          pesan: err.message
        });
      }
    }
  });

  return {
    totalDibaca: validItems.length + duplicates.length + errors.length,
    siapImpor: validItems.length,
    duplikatDilewati: duplicates.length,
    gagal: errors.length,
    items: validItems,
    sampleValid: validItems.slice(0, 15),
    sampleDuplikat: duplicates.slice(0, 10),
    sampleError: errors.slice(0, 10),
    lokasiBaruTerdeteksi: Object.keys(newLokasiSet),
    barangBaruTerdeteksi: Object.keys(newBarangSet)
  };
}

/**
 * Tahap 2: Eksekusi Impor ke Google Sheets
 */
function executeExcelImport_(user, payload) {
  requirePerm_(user, 'import.run');
  payload = payload || {};
  var items = payload.items || [];
  if (!items.length) {
    fail_('Tidak ada data valid yang dapat diimpor.');
  }

  return withLock_(function () {
    var t = readTable_(SHEETS.LAPORAN);
    var now = new Date();
    var newRows = [];
    var countBerhasil = 0;

    // Registrasi lokasi dan barang baru jika belum ada
    items.forEach(function (item) {
      ensureLokasi_(user, item.lokasi);
      ensureBarang_(user, item.nama, item.kode);

      var seq = nextSeq_(t);
      var id = makeLaporanId_(seq);

      var tglRusakIso = toIsoDate_(item.tglRusak) || todayIso_();
      var tglPerbaikanIso = toIsoDate_(item.tglPerbaikan) || '';
      var status = statusFromDate_(tglPerbaikanIso);

      var rowObj = {
        id: id,
        no: seq,
        nama: cleanText_(item.nama, 150),
        kode: cleanText_(item.kode, 50),
        jumlah: Math.max(1, parseInt(item.jumlah, 10) || 1),
        lokasi: cleanText_(item.lokasi, 100),
        kondisi: cleanText_(item.kondisi, 2000),
        urlKerusakan: cleanText_(item.urlKerusakan, 2000),
        tglRusak: parseIsoDate_(tglRusakIso),
        tglPerbaikan: tglPerbaikanIso ? parseIsoDate_(tglPerbaikanIso) : '',
        urlPerbaikan: cleanText_(item.urlPerbaikan, 2000),
        keterangan: cleanText_(item.keterangan, 5000),
        status: status,
        dibuatPada: now,
        dibuatOleh: user.label + ' (Impor Excel)',
        diubahPada: now,
        diubahOleh: user.label,
        arsip: DATA_STATE.AKTIF,
        arsipPada: '',
        arsipOleh: '',
        alasanKoreksi: '',
        sidik: fingerprint_(item.nama, item.kode, item.jumlah, item.lokasi, item.kondisi, tglRusakIso),
        sumber: 'IMPOR_EXCEL',
        requestId: ''
      };

      newRows.push(rowObj);
      countBerhasil++;
    });

    if (newRows.length) {
      appendObjects_(t, newRows);
    }

    logActivity_(user, 'IMPOR', 'Excel', '', 'Berhasil mengimpor ' + countBerhasil + ' data kerusakan dari Excel');

    return {
      sukses: true,
      jumlahDiimpor: countBerhasil,
      pesan: 'Berhasil mengimpor ' + countBerhasil + ' data kerusakan ke Google Sheets.'
    };
  });
}
