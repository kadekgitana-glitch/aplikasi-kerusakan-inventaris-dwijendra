/**
 * =============================================================================
 *  Dashboard.gs — Agregasi statistik, grafik visual, dan pemantauan tindak lanjut
 * =============================================================================
 *  Menghitung:
 *  - 6 Kartu Statistik:
 *      1. Total kejadian kerusakan
 *      2. Total barang terdampak (akumulasi kolom jumlah)
 *      3. Jumlah kejadian belum diperbaiki
 *      4. Jumlah kejadian sudah diperbaiki
 *      5. Jumlah kejadian pada bulan berjalan (WITA)
 *      6. Persentase penyelesaian perbaikan: (sudah / total) * 100%
 *  - 4 Visualisasi Grafik:
 *      1. Tren kerusakan per bulan (Jan - Des)
 *      2. Status perbaikan (Sudah vs Belum)
 *      3. Kerusakan berdasarkan lokasi / ruangan
 *      4. Kerusakan berdasarkan nama barang / kategori barang
 *  - Bagian "Perlu Tindak Lanjut" (barang rusak yang tgl perbaikannya masih kosong,
 *    diurutkan dari tanggal rusak terlama)
 *  - Bagian "Aktivitas Terbaru" (data kerusakan yang baru ditambahkan/diperbarui)
 *  - Semua kartu & grafik reaktif terhadap filter: tahun, bulan, lokasi, status.
 * =============================================================================
 */

function getDashboardData_(user, q) {
  q = q || {};
  var allRecords = loadRecords_({ includeArchived: false });
  var filtered = filterRecords_(allRecords, q);

  var now = new Date();
  var currentYear = Utilities.formatDate(now, APP.TZ, 'yyyy');
  var currentMonthIso = Utilities.formatDate(now, APP.TZ, 'yyyy-MM');

  var totalKejadian = filtered.length;
  var totalBarangTerdampak = 0;
  var belumDiperbaiki = 0;
  var sudahDiperbaiki = 0;
  var bulanBerjalanCount = 0;

  // Penghitungan kartu statistik
  filtered.forEach(function (r) {
    totalBarangTerdampak += (Number(r.jumlah) || 0);
    if (r.status === STATUS.SUDAH) {
      sudahDiperbaiki++;
    } else {
      belumDiperbaiki++;
    }

    if (r.tglRusak && r.tglRusak.substring(0, 7) === currentMonthIso) {
      bulanBerjalanCount++;
    }
  });

  // Persentase penyelesaian perbaikan (menghindari division by zero)
  var persentasePenyelesaian = totalKejadian > 0
    ? Math.round((sudahDiperbaiki / totalKejadian) * 1000) / 10
    : 0;

  // 1. Grafik Kerusakan Per Bulan (12 Bulan untuk tahun yang difilter atau tahun berjalan)
  var targetYear = q.year ? String(q.year) : currentYear;
  var trenBulanan = [];
  for (var m = 1; m <= 12; m++) {
    trenBulanan.push({
      bulanIndex: m,
      namaBulan: BULAN_ID[m - 1],
      total: 0,
      belum: 0,
      sudah: 0,
      jumlahBarang: 0
    });
  }

  // Isi data bulanan dari daftar filtered
  filtered.forEach(function (r) {
    if (r.tglRusak && r.tglRusak.substring(0, 4) === targetYear) {
      var mo = parseInt(r.tglRusak.substring(5, 7), 10);
      if (mo >= 1 && mo <= 12) {
        trenBulanan[mo - 1].total++;
        trenBulanan[mo - 1].jumlahBarang += (Number(r.jumlah) || 0);
        if (r.status === STATUS.SUDAH) {
          trenBulanan[mo - 1].sudah++;
        } else {
          trenBulanan[mo - 1].belum++;
        }
      }
    }
  });

  // 2. Grafik Status Perbaikan
  var statusChart = {
    labels: [STATUS.SUDAH, STATUS.BELUM],
    counts: [sudahDiperbaiki, belumDiperbaiki],
    percentages: [
      totalKejadian > 0 ? Math.round((sudahDiperbaiki / totalKejadian) * 100) : 0,
      totalKejadian > 0 ? Math.round((belumDiperbaiki / totalKejadian) * 100) : 0
    ]
  };

  // 3. Grafik Kerusakan Berdasarkan Lokasi / Ruangan (Top 10)
  var lokasiMap = {};
  filtered.forEach(function (r) {
    var loc = r.lokasi || 'Tidak Diketahui';
    if (!lokasiMap[loc]) {
      lokasiMap[loc] = { nama: loc, totalKejadian: 0, totalBarang: 0, belum: 0, sudah: 0 };
    }
    lokasiMap[loc].totalKejadian++;
    lokasiMap[loc].totalBarang += (Number(r.jumlah) || 0);
    if (r.status === STATUS.SUDAH) {
      lokasiMap[loc].sudah++;
    } else {
      lokasiMap[loc].belum++;
    }
  });
  var lokasiList = Object.keys(lokasiMap).map(function (k) { return lokasiMap[k]; });
  lokasiList.sort(function (a, b) { return b.totalKejadian - a.totalKejadian; });

  // 4. Grafik Kerusakan Berdasarkan Nama Barang (Top 10)
  var barangMap = {};
  filtered.forEach(function (r) {
    var bName = r.nama || 'Tanpa Nama';
    if (!barangMap[bName]) {
      barangMap[bName] = { nama: bName, totalKejadian: 0, totalBarang: 0, belum: 0, sudah: 0 };
    }
    barangMap[bName].totalKejadian++;
    barangMap[bName].totalBarang += (Number(r.jumlah) || 0);
    if (r.status === STATUS.SUDAH) {
      barangMap[bName].sudah++;
    } else {
      barangMap[bName].belum++;
    }
  });
  var barangList = Object.keys(barangMap).map(function (k) { return barangMap[k]; });
  barangList.sort(function (a, b) { return b.totalKejadian - a.totalKejadian; });

  // 5. Bagian "Perlu Tindak Lanjut" (Barang rusak yang belum diperbaiki, urut dari terlama)
  var belumList = filtered.filter(function (r) {
    return r.status === STATUS.BELUM;
  });
  belumList.sort(function (a, b) {
    // urutkan dari tanggal rusak terlama ke terbaru
    return a.tglRusak < b.tglRusak ? -1 : (a.tglRusak > b.tglRusak ? 1 : a.no - b.no);
  });
  var perluTindakLanjut = belumList.slice(0, 10);

  // 6. Bagian "Aktivitas Terbaru" (urut tanggal perubahan terakhir)
  var aktivitasTerbaru = filtered.slice().sort(function (a, b) {
    var ta = a.diubahPada || a.dibuatPada || '';
    var tb = b.diubahPada || b.dibuatPada || '';
    return ta < tb ? 1 : (ta > tb ? -1 : b.no - a.no);
  }).slice(0, 10);

  // Daftar tahun yang ada pada dataset untuk dropdown filter
  var tahunSet = {};
  tahunSet[currentYear] = true;
  allRecords.forEach(function (r) {
    if (r.tglRusak && r.tglRusak.length >= 4) {
      tahunSet[r.tglRusak.substring(0, 4)] = true;
    }
  });
  var daftarTahun = Object.keys(tahunSet).sort().reverse();

  return {
    statistik: {
      totalKejadian: totalKejadian,
      totalBarangTerdampak: totalBarangTerdampak,
      belumDiperbaiki: belumDiperbaiki,
      sudahDiperbaiki: sudahDiperbaiki,
      bulanBerjalanCount: bulanBerjalanCount,
      persentasePenyelesaian: persentasePenyelesaian
    },
    grafik: {
      tahunAktif: targetYear,
      trenBulanan: trenBulanan,
      statusChart: statusChart,
      topLokasi: lokasiList.slice(0, 10),
      topBarang: barangList.slice(0, 10)
    },
    perluTindakLanjut: perluTindakLanjut,
    aktivitasTerbaru: aktivitasTerbaru,
    daftarTahun: daftarTahun
  };
}
