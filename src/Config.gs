/**
 * =============================================================================
 *  Config.gs — Konstanta aplikasi, skema database (Google Sheets), dan hak akses
 * =============================================================================
 *  Sistem Informasi Kerusakan Inventaris — SMK Dwijendra Denpasar
 *
 *  CATATAN KEAMANAN:
 *  Di Google Apps Script, setiap fungsi tingkat atas yang namanya TIDAK diakhiri
 *  garis bawah (_) dapat dipanggil dari browser melalui google.script.run.
 *  Karena itu seluruh fungsi internal pada proyek ini diberi akhiran "_" dan
 *  satu-satunya pintu masuk dari frontend adalah fungsi api() di Code.gs.
 * =============================================================================
 */

var APP = {
  NAME: 'Sistem Informasi Kerusakan Inventaris',
  SCHOOL: 'SMK Dwijendra Denpasar',
  VERSION: '1.0.0',
  TZ: 'Asia/Makassar',
  ID_PREFIX: 'KRS',

  // Sesi login
  SESSION_IDLE_SECONDS: 3 * 60 * 60,        // sesi habis jika tidak aktif 3 jam
  SESSION_MAX_MS: 12 * 60 * 60 * 1000,      // batas maksimum umur sesi 12 jam
  LOGIN_MAX_FAIL: 5,                         // maksimal percobaan gagal
  LOGIN_LOCK_SECONDS: 15 * 60,               // akun dikunci sementara 15 menit
  PBKDF2_ITER: 2000,                         // iterasi hash kata sandi
  PASSWORD_MIN: 8,

  // Foto
  MAX_PHOTO_BYTES: 6 * 1024 * 1024,          // 6 MB setelah kompresi di browser
  MAX_THUMB_BYTES: 400 * 1024,
  MAX_PHOTOS_PER_TYPE: 10,
  ALLOWED_MIME: ['image/jpeg', 'image/png', 'image/webp'],

  // Folder Google Drive
  FOLDER_ROOT: 'Sistem Kerusakan Inventaris SMK Dwijendra',
  FOLDERS: {
    KERUSAKAN: 'Dokumentasi Kerusakan',
    PERBAIKAN: 'Dokumentasi Setelah Perbaikan',
    LAPORAN: 'Laporan PDF',
    CADANGAN: 'Cadangan Data',
    SISTEM: 'Sistem'
  },
  SPREADSHEET_NAME: 'Database Kerusakan Inventaris SMK Dwijendra'
};

var STATUS = { BELUM: 'Belum Diperbaiki', SUDAH: 'Sudah Diperbaiki' };
var DATA_STATE = { AKTIF: 'AKTIF', ARSIP: 'ARSIP' };
var FOTO_JENIS = { KERUSAKAN: 'KERUSAKAN', PERBAIKAN: 'PERBAIKAN' };

var ROLES = { ADMIN: 'ADMIN', PETUGAS: 'PETUGAS', KEPSEK: 'KEPSEK' };
var ROLE_LABELS = {
  ADMIN: 'Administrator',
  PETUGAS: 'Petugas Sarpras',
  KEPSEK: 'Kepala Sekolah'
};

var BULAN_ID = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli',
  'Agustus', 'September', 'Oktober', 'November', 'Desember'];

/** Nama sheet database. Satu tabel utama untuk semua bulan (tidak per bulan). */
var SHEETS = {
  LAPORAN: 'Data Kerusakan',
  FOTO: 'Foto Dokumentasi',
  BARANG: 'Master Barang',
  LOKASI: 'Master Lokasi',
  USERS: 'Pengguna',
  SETTINGS: 'Pengaturan',
  LOG: 'Log Aktivitas'
};

/**
 * Skema kolom tiap sheet: [kunci internal, judul kolom di Google Sheets].
 * Pembacaan data dipetakan berdasarkan JUDUL kolom, sehingga urutan kolom yang
 * digeser manual di Sheets tidak merusak aplikasi.
 */
var SCHEMA = {};
SCHEMA[SHEETS.LAPORAN] = [
  ['id', 'ID Laporan'],
  ['no', 'No Urut'],
  ['nama', 'Nama Barang'],
  ['kode', 'Kode Inventaris'],
  ['jumlah', 'Jumlah'],
  ['lokasi', 'Lokasi/Ruangan'],
  ['kondisi', 'Kondisi Kerusakan'],
  ['urlKerusakan', 'URL Dokumentasi Kerusakan'],
  ['tglRusak', 'Tanggal Rusak'],
  ['tglPerbaikan', 'Tanggal Perbaikan'],
  ['urlPerbaikan', 'URL Dokumentasi Setelah Perbaikan'],
  ['keterangan', 'Keterangan'],
  ['status', 'Status Perbaikan'],
  ['dibuatPada', 'Dibuat Pada'],
  ['dibuatOleh', 'Dibuat Oleh'],
  ['diubahPada', 'Diubah Pada'],
  ['diubahOleh', 'Diubah Oleh'],
  ['arsip', 'Status Data'],
  ['arsipPada', 'Diarsipkan Pada'],
  ['arsipOleh', 'Diarsipkan Oleh'],
  ['alasanKoreksi', 'Alasan Koreksi Historis'],
  ['sidik', 'Sidik Data'],
  ['sumber', 'Sumber Data'],
  ['requestId', 'Request ID']
];
SCHEMA[SHEETS.FOTO] = [
  ['fotoId', 'ID Foto'],
  ['laporanId', 'ID Laporan'],
  ['jenis', 'Jenis'],
  ['fileId', 'ID File Drive'],
  ['thumbId', 'ID Thumbnail Drive'],
  ['namaFile', 'Nama File'],
  ['mime', 'Tipe File'],
  ['ukuran', 'Ukuran (byte)'],
  ['diunggahPada', 'Diunggah Pada'],
  ['diunggahOleh', 'Diunggah Oleh'],
  ['status', 'Status']
];
SCHEMA[SHEETS.BARANG] = [
  ['id', 'ID'],
  ['nama', 'Nama Barang'],
  ['kode', 'Kode Inventaris'],
  ['kategori', 'Kategori'],
  ['status', 'Status'],
  ['dibuatPada', 'Dibuat Pada']
];
SCHEMA[SHEETS.LOKASI] = [
  ['id', 'ID'],
  ['nama', 'Nama Lokasi'],
  ['jenis', 'Jenis Lokasi'],
  ['status', 'Status'],
  ['dibuatPada', 'Dibuat Pada']
];
SCHEMA[SHEETS.USERS] = [
  ['id', 'ID Pengguna'],
  ['username', 'Username'],
  ['nama', 'Nama Lengkap'],
  ['email', 'Email Google (opsional)'],
  ['peran', 'Peran'],
  ['status', 'Status'],
  ['hash', 'Hash Kata Sandi'],
  ['harusGanti', 'Wajib Ganti Sandi'],
  ['dibuatPada', 'Dibuat Pada'],
  ['loginTerakhir', 'Login Terakhir'],
  ['diubahPada', 'Diubah Pada']
];
SCHEMA[SHEETS.SETTINGS] = [
  ['kunci', 'Kunci'],
  ['nilai', 'Nilai'],
  ['keterangan', 'Keterangan']
];
SCHEMA[SHEETS.LOG] = [
  ['waktu', 'Waktu'],
  ['pengguna', 'Pengguna'],
  ['peran', 'Peran'],
  ['aksi', 'Aksi'],
  ['entitas', 'Entitas'],
  ['entitasId', 'ID Entitas'],
  ['detail', 'Detail']
];

/** Matriks hak akses. Diperiksa di backend pada SETIAP permintaan. */
var PERMISSIONS = {
  'dashboard.view':     ['ADMIN', 'PETUGAS', 'KEPSEK'],
  'laporan.view':       ['ADMIN', 'PETUGAS', 'KEPSEK'],
  'laporan.create':     ['ADMIN', 'PETUGAS'],
  'laporan.update':     ['ADMIN', 'PETUGAS'],
  'laporan.repair':     ['ADMIN', 'PETUGAS'],
  'laporan.archive':    ['ADMIN'],
  'laporan.restore':    ['ADMIN'],
  'laporan.delete':     ['ADMIN'],
  'laporan.historical': ['ADMIN'],
  'laporan.viewArchive':['ADMIN'],
  'foto.view':          ['ADMIN', 'PETUGAS', 'KEPSEK'],
  'foto.upload':        ['ADMIN', 'PETUGAS'],
  'foto.detach':        ['ADMIN', 'PETUGAS'],
  'foto.driveLink':     ['ADMIN'],
  'report.view':        ['ADMIN', 'PETUGAS', 'KEPSEK'],
  'report.archivePdf':  ['ADMIN', 'PETUGAS'],
  'master.add':         ['ADMIN', 'PETUGAS'],
  'master.manage':      ['ADMIN'],
  'settings.update':    ['ADMIN'],
  'users.manage':       ['ADMIN'],
  'import.run':         ['ADMIN'],
  'log.view':           ['ADMIN'],
  'backup.manage':      ['ADMIN'],
  'account.self':       ['ADMIN', 'PETUGAS', 'KEPSEK']
};

/** Pengaturan bawaan (dapat diubah melalui halaman Pengaturan). */
var DEFAULT_SETTINGS = [
  ['nama_sekolah', 'SMK Dwijendra Denpasar', 'Nama sekolah pada aplikasi & laporan'],
  ['nama_aplikasi', 'Sistem Informasi Kerusakan Inventaris', 'Nama aplikasi'],
  ['alamat_sekolah', 'Denpasar, Bali', 'Alamat singkat sekolah'],
  ['kota', 'Denpasar', 'Kota pada baris tanggal tanda tangan'],
  ['tahun_pelajaran_mode', 'otomatis', 'otomatis = dihitung dari periode laporan (Juli–Juni); manual = memakai nilai tahun_pelajaran'],
  ['tahun_pelajaran', '2026/2027', 'Tahun pelajaran (dipakai bila mode manual)'],
  ['kepala_jabatan', 'Kepala SMK Dwijendra', 'Jabatan penandatangan kiri'],
  ['kepala_nama', 'Ida Ayu Estri Sanjiwani, S.E., M.Pd.', 'Nama Kepala Sekolah'],
  ['kepala_id_label', 'NIK', 'Label nomor identitas Kepala Sekolah'],
  ['kepala_id', '530.707.240', 'Nomor identitas Kepala Sekolah'],
  ['wakasek_jabatan', 'Wakasek Sarana Prasarana', 'Jabatan penandatangan kanan'],
  ['wakasek_nama', 'I Putu Kartika, S.Pd.', 'Nama Wakasek Sarpras'],
  ['wakasek_id_label', 'NIK', 'Label nomor identitas Wakasek (kosongkan nomor bila tidak dicetak)'],
  ['wakasek_id', '', 'Nomor identitas Wakasek (opsional)'],
  ['laporan_kertas', 'A4', 'Ukuran kertas laporan: A4 atau F4'],
  ['laporan_orientasi', 'landscape', 'Orientasi laporan: landscape atau portrait'],
  ['laporan_thumbnail', 'ya', 'Tampilkan thumbnail foto pada laporan (ya/tidak)'],
  ['logo_file_id', '', 'ID file logo sekolah di Google Drive (diatur dari halaman Pengaturan)'],
  ['cadangan_otomatis', 'tidak', 'Cadangan otomatis: tidak / harian / mingguan']
];

/** Kunci pengaturan yang boleh diubah dari halaman Pengaturan. */
var EDITABLE_SETTINGS = ['nama_sekolah', 'nama_aplikasi', 'alamat_sekolah', 'kota',
  'tahun_pelajaran_mode', 'tahun_pelajaran', 'kepala_jabatan', 'kepala_nama',
  'kepala_id_label', 'kepala_id', 'wakasek_jabatan', 'wakasek_nama',
  'wakasek_id_label', 'wakasek_id', 'laporan_kertas', 'laporan_orientasi',
  'laporan_thumbnail'];

var DEFAULT_LOKASI = [
  ['Ruang FO', 'Ruang'], ['Ruang BK', 'Ruang'], ['Perpustakaan', 'Ruang'],
  ['Lapangan', 'Lapangan'], ['XPH1', 'Ruang Kelas'], ['XPH2', 'Ruang Kelas'],
  ['Ruang Kelas', 'Ruang Kelas'], ['Ruang Guru', 'Ruang'], ['Ruang Kepala Sekolah', 'Ruang'],
  ['Ruang Tata Usaha', 'Ruang'], ['Laboratorium Komputer', 'Laboratorium'],
  ['Toilet Siswa', 'Toilet'], ['Toilet Guru', 'Toilet'], ['Aula', 'Ruang'],
  ['Kantin', 'Lainnya'], ['Area Parkir', 'Lainnya']
];

var DEFAULT_BARANG = [
  ['AC Daikin', 'Elektronik'], ['Keran Air', 'Sanitasi'], ['Gagang Pintu', 'Bangunan'],
  ['Terali Lapangan', 'Bangunan'], ['Komputer', 'Elektronik'], ['Meja', 'Mebel'],
  ['Kursi', 'Mebel'], ['Proyektor', 'Elektronik'], ['Lampu', 'Elektronik'],
  ['Kipas Angin', 'Elektronik'], ['Papan Tulis', 'Mebel'], ['Pintu', 'Bangunan'],
  ['Jendela', 'Bangunan'], ['Wastafel', 'Sanitasi'], ['Kloset', 'Sanitasi']
];
