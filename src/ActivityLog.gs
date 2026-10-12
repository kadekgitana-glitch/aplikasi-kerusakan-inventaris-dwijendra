/**
 * =============================================================================
 *  ActivityLog.gs — Pencatatan dan penayangan log aktivitas
 * =============================================================================
 */

var AKSI_LABEL = {
  LOGIN: 'Login', LOGIN_GAGAL: 'Login gagal', LOGOUT: 'Logout',
  TAMBAH: 'Menambah laporan', UBAH: 'Mengubah laporan', PERBAIKAN: 'Menandai sudah diperbaiki',
  STATUS: 'Perubahan status', TINDAK_LANJUT: 'Mencatat tindak lanjut',
  ARSIP: 'Mengarsipkan laporan', PULIHKAN: 'Memulihkan laporan', HAPUS_PERMANEN: 'Menghapus permanen',
  FOTO_UNGGAH: 'Mengunggah foto', FOTO_LEPAS: 'Melepas foto',
  MASTER: 'Mengubah master data', PENGATURAN: 'Mengubah pengaturan',
  PENGGUNA: 'Mengelola pengguna', GANTI_SANDI: 'Mengganti kata sandi', RESET_SANDI: 'Reset kata sandi',
  IMPOR: 'Impor data Excel', CADANGAN: 'Membuat cadangan', PEMULIHAN_DATA: 'Memulihkan data dari cadangan',
  LAPORAN_PDF: 'Mengarsipkan laporan PDF', AKSES_DITOLAK: 'Akses ditolak', SETUP: 'Setup sistem'
};

/** Mencatat aktivitas. Kegagalan pencatatan log tidak boleh menggagalkan proses utama. */
function logActivity_(user, aksi, entitas, entitasId, detail) {
  try {
    var sh = getSheet_(SHEETS.LOG);
    sh.appendRow([
      new Date(),
      safeCell_(user ? (user.label || user.username || '-') : 'Sistem'),
      user ? (user.peran || '-') : '-',
      aksi,
      entitas || '',
      entitasId || '',
      safeCell_(cleanText_(detail, 4000))
    ]);
  } catch (e) {
    console.error('Gagal mencatat log: ' + e.message);
  }
}

function logRowToClient_(r) {
  return {
    waktu: toDateTimeStr_(r.waktu),
    pengguna: String(r.pengguna),
    peran: String(r.peran),
    aksi: String(r.aksi),
    aksiLabel: AKSI_LABEL[r.aksi] || String(r.aksi),
    entitas: String(r.entitas),
    entitasId: String(r.entitasId),
    detail: String(r.detail)
  };
}

/** Riwayat perubahan untuk satu laporan (terbaru di atas). */
function historyFor_(laporanId) {
  var t = readTable_(SHEETS.LOG);
  var out = [];
  for (var i = t.rows.length - 1; i >= 0; i--) {
    if (String(t.rows[i].entitasId) === String(laporanId) && String(t.rows[i].entitas) === 'Laporan') {
      out.push(logRowToClient_(t.rows[i]));
      if (out.length >= 100) break;
    }
  }
  return out;
}

/** Daftar log untuk administrator, dengan pencarian & pagination. */
function listLog_(user, q) {
  var t = readTable_(SHEETS.LOG);
  var search = norm_(q.search);
  var aksi = String(q.aksi || '');
  var rows = [];
  for (var i = t.rows.length - 1; i >= 0; i--) {
    var r = t.rows[i];
    if (aksi && String(r.aksi) !== aksi) continue;
    if (search) {
      var hay = norm_([r.pengguna, r.aksi, r.entitas, r.entitasId, r.detail].join(' '));
      if (hay.indexOf(search) < 0) continue;
    }
    rows.push(r);
  }
  var pageSize = Math.min(Math.max(toInt_(q.pageSize, 25), 5), 200);
  var pages = Math.max(1, Math.ceil(rows.length / pageSize));
  var page = Math.min(Math.max(toInt_(q.page, 1), 1), pages);
  return {
    rows: rows.slice((page - 1) * pageSize, page * pageSize).map(logRowToClient_),
    total: rows.length, page: page, pages: pages, pageSize: pageSize,
    aksiList: Object.keys(AKSI_LABEL).map(function (k) { return { value: k, label: AKSI_LABEL[k] }; })
  };
}
