/**
 * =============================================================================
 *  ExportReport.gs — Pembuatan Laporan Bulanan & Tahunan Resmi SMK Dwijendra
 * =============================================================================
 *  Menyediakan:
 *  - Data Laporan Bulanan (11 Kolom tabel dinas + Tanda Tangan resmi)
 *  - Data Laporan Tahunan (Rekap 12 bulan, rekap per ruangan, daftar pending)
 *  - Penyiapan data untuk Ekspor Excel (.xlsx / .csv) dan Cetak PDF A4 Landscape
 *  - Pencatatan arsip PDF ke Google Drive
 * =============================================================================
 */

/**
 * Mengambil data laporan bulanan lengkap dengan metadata penandatangan.
 */
function getLaporanBulananData_(user, q) {
  q = q || {};
  var year = toInt_(q.year, new Date().getFullYear());
  var month = toInt_(q.month, (new Date().getMonth() + 1));

  // Pastikan filter tahun dan bulan disetel
  var filterQ = {
    year: year,
    month: month,
    lokasi: q.lokasi || '',
    status: q.status || '',
    search: q.search || '',
    sort: q.sort || 'rusak_asc'
  };

  var records = sortRecords_(filterRecords_(loadRecords_({ includeArchived: false }), filterQ), filterQ.sort);
  var meta = reportMeta_(year, month);

  // Hitung ringkasan
  var totalJumlah = 0;
  var countBelum = 0;
  var countSudah = 0;

  var mappedRows = records.map(function (r, idx) {
    totalJumlah += (Number(r.jumlah) || 0);
    if (r.status === STATUS.SUDAH) countSudah++; else countBelum++;

    return {
      no: idx + 1,
      id: r.id,
      nama: r.nama,
      kode: r.kode || '-',
      jumlah: r.jumlah,
      lokasi: r.lokasi,
      kondisi: r.kondisi,
      fotoKerusakan: r.fotoKerusakan || [],
      tglRusak: r.tglRusak,
      tglRusakIndo: fmtTanggalIndo_(r.tglRusak),
      tglPerbaikan: r.tglPerbaikan || '',
      tglPerbaikanIndo: r.tglPerbaikan ? fmtTanggalIndo_(r.tglPerbaikan) : '-',
      fotoPerbaikan: r.fotoPerbaikan || [],
      status: r.status,
      keterangan: r.keterangan || '-'
    };
  });

  return {
    meta: meta,
    periode: {
      tahun: year,
      bulan: month,
      namaBulan: BULAN_ID[month - 1]
    },
    filter: filterQ,
    ringkasan: {
      totalKejadian: records.length,
      totalBarang: totalJumlah,
      belumDiperbaiki: countBelum,
      sudahDiperbaiki: countSudah,
      persentase: records.length > 0 ? Math.round((countSudah / records.length) * 1000) / 10 : 0
    },
    rows: mappedRows
  };
}

/**
 * Mengambil data laporan tahunan rekapitulasi lengkap.
 */
function getLaporanTahunanData_(user, q) {
  q = q || {};
  var year = toInt_(q.year, new Date().getFullYear());

  var allRecords = loadRecords_({ includeArchived: false });
  var yearRecords = allRecords.filter(function (r) {
    return r.tglRusak && r.tglRusak.substring(0, 4) === String(year);
  });

  var meta = reportMeta_(year, 0);

  var totalKejadian = yearRecords.length;
  var totalBarang = 0;
  var countBelum = 0;
  var countSudah = 0;

  // 1. Rekapitulasi per bulan (12 bulan)
  var rekapBulanan = [];
  for (var m = 1; m <= 12; m++) {
    rekapBulanan.push({
      bulanIndex: m,
      namaBulan: BULAN_ID[m - 1],
      totalKejadian: 0,
      totalBarang: 0,
      belum: 0,
      sudah: 0,
      persentase: 0
    });
  }

  // 2. Rekapitulasi per lokasi
  var lokasiMap = {};

  // 3. Rekapitulasi per nama barang
  var barangMap = {};

  // 4. Daftar belum diselesaikan (pending)
  var pendingList = [];

  yearRecords.forEach(function (r) {
    var j = Number(r.jumlah) || 0;
    totalBarang += j;
    var isSudah = (r.status === STATUS.SUDAH);
    if (isSudah) countSudah++; else countBelum++;

    // Bulanan
    var mo = parseInt(r.tglRusak.substring(5, 7), 10);
    if (mo >= 1 && mo <= 12) {
      rekapBulanan[mo - 1].totalKejadian++;
      rekapBulanan[mo - 1].totalBarang += j;
      if (isSudah) rekapBulanan[mo - 1].sudah++;
      else rekapBulanan[mo - 1].belum++;
    }

    // Lokasi
    var loc = r.lokasi || 'Lainnya';
    if (!lokasiMap[loc]) {
      lokasiMap[loc] = { lokasi: loc, totalKejadian: 0, totalBarang: 0, belum: 0, sudah: 0 };
    }
    lokasiMap[loc].totalKejadian++;
    lokasiMap[loc].totalBarang += j;
    if (isSudah) lokasiMap[loc].sudah++;
    else lokasiMap[loc].belum++;

    // Barang
    var brg = r.nama || 'Lainnya';
    if (!barangMap[brg]) {
      barangMap[brg] = { nama: brg, totalKejadian: 0, totalBarang: 0, belum: 0, sudah: 0 };
    }
    barangMap[brg].totalKejadian++;
    barangMap[brg].totalBarang += j;
    if (isSudah) barangMap[brg].sudah++;
    else barangMap[brg].belum++;

    // Pending
    if (!isSudah) {
      pendingList.push({
        id: r.id,
        no: r.no,
        nama: r.nama,
        kode: r.kode || '-',
        jumlah: r.jumlah,
        lokasi: r.lokasi,
        kondisi: r.kondisi,
        tglRusak: r.tglRusak,
        tglRusakIndo: fmtTanggalIndo_(r.tglRusak),
        keterangan: r.keterangan || '-'
      });
    }
  });

  // Hitung persentase bulanan
  rekapBulanan.forEach(function (b) {
    b.persentase = b.totalKejadian > 0
      ? Math.round((b.sudah / b.totalKejadian) * 1000) / 10
      : 0;
  });

  var rekapLokasi = Object.keys(lokasiMap).map(function (k) {
    var l = lokasiMap[k];
    l.persentase = l.totalKejadian > 0 ? Math.round((l.sudah / l.totalKejadian) * 1000) / 10 : 0;
    return l;
  }).sort(function (a, b) { return b.totalKejadian - a.totalKejadian; });

  var rekapBarang = Object.keys(barangMap).map(function (k) {
    var b = barangMap[k];
    b.persentase = b.totalKejadian > 0 ? Math.round((b.sudah / b.totalKejadian) * 1000) / 10 : 0;
    return b;
  }).sort(function (a, b) { return b.totalKejadian - a.totalKejadian; });

  // Urutkan pending dari kerusakan terlama
  pendingList.sort(function (a, b) {
    return a.tglRusak < b.tglRusak ? -1 : (a.tglRusak > b.tglRusak ? 1 : a.no - b.no);
  });

  return {
    meta: meta,
    tahun: year,
    ringkasan: {
      totalKejadian: totalKejadian,
      totalBarang: totalBarang,
      belumDiperbaiki: countBelum,
      sudahDiperbaiki: countSudah,
      persentase: totalKejadian > 0 ? Math.round((countSudah / totalKejadian) * 1000) / 10 : 0
    },
    rekapBulanan: rekapBulanan,
    rekapLokasi: rekapLokasi,
    rekapBarang: rekapBarang,
    pendingList: pendingList
  };
}
