/**
 * =============================================================================
 *  Foto.gs — Pengelolaan dokumentasi foto di Google Drive
 * =============================================================================
 *  Struktur folder:
 *    Sistem Kerusakan Inventaris SMK Dwijendra/
 *      Dokumentasi Kerusakan/<Tahun>/<ID Laporan>/
 *      Dokumentasi Setelah Perbaikan/<Tahun>/<ID Laporan>/
 *      Laporan PDF/<Tahun>/
 *      Cadangan Data/
 *      Sistem/ (logo)
 *
 *  Prinsip keamanan:
 *  - File TIDAK dibagikan publik. File hanya dapat dibaca oleh pemilik skrip.
 *  - Browser hanya mengenal "ID Foto" internal (FT-xxxx), bukan ID file Drive.
 *  - Gambar dikirim ke browser sebagai data URL setelah hak akses dicek server.
 *  - Mengedit laporan tidak pernah menghapus file. Melepas foto hanya menandai
 *    status "DILEPAS" di sheet Foto Dokumentasi; file tetap tersimpan.
 * =============================================================================
 */

function getRootFolder_() {
  var props = PropertiesService.getScriptProperties();
  var id = props.getProperty('FOLDER_ROOT_ID');
  if (id) {
    try {
      var f = DriveApp.getFolderById(id);
      if (!f.isTrashed()) return f;
    } catch (e) { /* folder hilang: buat ulang */ }
  }
  try {
    var it = DriveApp.getFoldersByName(APP.FOLDER_ROOT);
    var folder = it.hasNext() ? it.next() : DriveApp.createFolder(APP.FOLDER_ROOT);
    props.setProperty('FOLDER_ROOT_ID', folder.getId());
    return folder;
  } catch (e) {
    fail_('Google Drive tidak dapat diakses saat ini. Coba beberapa saat lagi. Detail: ' + e.message, 'DRIVE_UNAVAILABLE');
  }
}

/** Mendapatkan (atau membuat) subfolder berdasarkan path relatif dari folder utama. */
function getAppFolder_(path) {
  var props = PropertiesService.getScriptProperties();
  var key = 'FOLDER:' + path.join('/');
  var id = props.getProperty(key);
  if (id) {
    try {
      var f = DriveApp.getFolderById(id);
      if (!f.isTrashed()) return f;
    } catch (e) { /* buat ulang */ }
  }
  try {
    var folder = getRootFolder_();
    path.forEach(function (name) {
      var it = folder.getFoldersByName(name);
      folder = it.hasNext() ? it.next() : folder.createFolder(name);
    });
    props.setProperty(key, folder.getId());
    return folder;
  } catch (e) {
    if (e.isAppError) throw e;
    fail_('Gagal menyiapkan folder Google Drive: ' + e.message, 'DRIVE_UNAVAILABLE');
  }
}

/** Mendeteksi tipe gambar dari "magic bytes" — bukan dari nama file. */
function detectImageMime_(bytes) {
  function b(i) { return bytes[i] < 0 ? bytes[i] + 256 : bytes[i]; }
  if (bytes.length < 12) return '';
  if (b(0) === 0xFF && b(1) === 0xD8 && b(2) === 0xFF) return 'image/jpeg';
  if (b(0) === 0x89 && b(1) === 0x50 && b(2) === 0x4E && b(3) === 0x47) return 'image/png';
  if (b(0) === 0x52 && b(1) === 0x49 && b(2) === 0x46 && b(3) === 0x46 &&
      b(8) === 0x57 && b(9) === 0x45 && b(10) === 0x42 && b(11) === 0x50) return 'image/webp';
  return '';
}

function loadFotoTable_() {
  return readTable_(SHEETS.FOTO);
}

/** Peta laporanId -> { K: [...], P: [...] } berisi foto AKTIF (tanpa ID Drive). */
function loadFotoMap_() {
  var map = {};
  loadFotoTable_().rows.forEach(function (r) {
    if (String(r.status) !== 'AKTIF') return;
    var id = String(r.laporanId);
    if (!map[id]) map[id] = { K: [], P: [] };
    map[id][r.jenis === FOTO_JENIS.PERBAIKAN ? 'P' : 'K'].push({ fotoId: String(r.fotoId), nama: String(r.namaFile) });
  });
  return map;
}

function driveUrl_(fileId) {
  return 'https://drive.google.com/file/d/' + fileId + '/view';
}

/** Menyelaraskan kolom URL dokumentasi pada sheet Data Kerusakan. */
function syncFotoUrls_(laporanId, user) {
  var ft = loadFotoTable_();
  var k = [], p = [];
  ft.rows.forEach(function (r) {
    if (String(r.laporanId) !== String(laporanId) || String(r.status) !== 'AKTIF') return;
    (r.jenis === FOTO_JENIS.PERBAIKAN ? p : k).push(driveUrl_(r.fileId));
  });
  var t = readTable_(SHEETS.LAPORAN);
  var row = findBy_(t, 'id', laporanId);
  if (!row) return;
  var patch = { urlKerusakan: k.join('\n'), urlPerbaikan: p.join('\n') };
  if (user) { patch.diubahPada = new Date(); patch.diubahOleh = user.label; }
  updateObject_(t, row._row, patch);
}

/**
 * Mengunggah satu foto (beserta thumbnail) untuk laporan tertentu.
 * Dipanggil per foto agar progres terlihat & kegagalan satu foto tidak
 * merusak data laporan yang sudah tersimpan.
 */
function uploadFoto_(user, p) {
  var laporanId = cleanText_(p.laporanId, 40);
  var jenis = p.jenis === FOTO_JENIS.PERBAIKAN ? FOTO_JENIS.PERBAIKAN : FOTO_JENIS.KERUSAKAN;
  var t = readTable_(SHEETS.LAPORAN);
  var lap = findBy_(t, 'id', laporanId);
  if (!lap) fail_('Laporan tidak ditemukan.', 'NOT_FOUND');
  if (String(lap.arsip) === DATA_STATE.ARSIP) fail_('Laporan sedang diarsipkan. Pulihkan terlebih dahulu sebelum menambah foto.');

  var count = loadFotoTable_().rows.filter(function (r) {
    return String(r.laporanId) === laporanId && r.jenis === jenis && String(r.status) === 'AKTIF';
  }).length;
  if (count >= APP.MAX_PHOTOS_PER_TYPE) fail_('Maksimal ' + APP.MAX_PHOTOS_PER_TYPE + ' foto untuk setiap jenis dokumentasi.');

  var bytes, thumbBytes = null;
  try { bytes = Utilities.base64Decode(String(p.data || '')); } catch (e) { fail_('Data foto rusak atau tidak lengkap.'); }
  if (!bytes || !bytes.length) fail_('Data foto kosong.');
  if (bytes.length > APP.MAX_PHOTO_BYTES) fail_('Ukuran foto terlalu besar (maksimal 6 MB setelah kompresi).');
  var mime = detectImageMime_(bytes);
  if (!mime || APP.ALLOWED_MIME.indexOf(mime) < 0) fail_('Format foto tidak didukung. Gunakan JPG, JPEG, PNG, atau WEBP.');
  if (p.thumb) {
    try { thumbBytes = Utilities.base64Decode(String(p.thumb)); } catch (e) { thumbBytes = null; }
    if (thumbBytes && (thumbBytes.length > APP.MAX_THUMB_BYTES || !detectImageMime_(thumbBytes))) thumbBytes = null;
  }

  var year = (toIsoDate_(lap.tglRusak) || todayIso_()).substring(0, 4);
  var folder = getAppFolder_([jenis === FOTO_JENIS.PERBAIKAN ? APP.FOLDERS.PERBAIKAN : APP.FOLDERS.KERUSAKAN, year, laporanId]);
  var ext = mime === 'image/png' ? 'png' : (mime === 'image/webp' ? 'webp' : 'jpg');
  var stamp = Utilities.formatDate(new Date(), APP.TZ, 'yyyyMMdd_HHmmss');
  var base = laporanId + '_' + (jenis === FOTO_JENIS.PERBAIKAN ? 'perbaikan' : 'kerusakan') + '_' + stamp + '_' + (count + 1);
  var file = null, thumb = null;
  try {
    file = folder.createFile(Utilities.newBlob(bytes, mime, base + '.' + ext));
    file.setDescription('Laporan ' + laporanId + ' — ' + (jenis === FOTO_JENIS.PERBAIKAN ? 'setelah perbaikan' : 'kerusakan') +
      ' — diunggah oleh ' + user.label + ' — nama asli: ' + cleanText_(p.nama, 120));
    if (thumbBytes) {
      thumb = folder.createFile(Utilities.newBlob(thumbBytes, detectImageMime_(thumbBytes), 'thumb_' + base + '.jpg'));
    }
  } catch (e) {
    try { if (file) file.setTrashed(true); } catch (x) { /* abaikan */ }
    fail_('Gagal menyimpan foto ke Google Drive. Laporan tetap tersimpan; silakan unggah ulang foto. Detail: ' + e.message, 'DRIVE_UNAVAILABLE');
  }

  var fotoId = shortId_('FT');
  try {
    withLock_(function () {
      var ft = loadFotoTable_();
      appendObjects_(ft, [{
        fotoId: fotoId, laporanId: laporanId, jenis: jenis, fileId: file.getId(),
        thumbId: thumb ? thumb.getId() : '', namaFile: cleanText_(p.nama, 120) || (base + '.' + ext),
        mime: mime, ukuran: bytes.length, diunggahPada: new Date(), diunggahOleh: user.label, status: 'AKTIF'
      }]);
      syncFotoUrls_(laporanId, user);
    });
  } catch (e) {
    // Rollback file agar tidak ada file yatim bila pencatatan gagal
    try { file.setTrashed(true); if (thumb) thumb.setTrashed(true); } catch (x) { /* abaikan */ }
    throw e;
  }
  logActivity_(user, 'FOTO_UNGGAH', 'Laporan', laporanId, 'Foto ' + (jenis === FOTO_JENIS.PERBAIKAN ? 'setelah perbaikan' : 'kerusakan') + ': ' + cleanText_(p.nama, 120));
  return { fotoId: fotoId, nama: cleanText_(p.nama, 120), jenis: jenis };
}

/** Melepas foto dari laporan TANPA menghapus file di Drive. */
function detachFoto_(user, p) {
  return withLock_(function () {
    var ft = loadFotoTable_();
    var row = findBy_(ft, 'fotoId', p.fotoId);
    if (!row || String(row.status) !== 'AKTIF') fail_('Foto tidak ditemukan.', 'NOT_FOUND');
    var lapT = readTable_(SHEETS.LAPORAN);
    var lap = findBy_(lapT, 'id', row.laporanId);
    if (lap && String(lap.arsip) === DATA_STATE.ARSIP) fail_('Laporan sedang diarsipkan.');
    updateObject_(ft, row._row, { status: 'DILEPAS' });
    syncFotoUrls_(String(row.laporanId), user);
    logActivity_(user, 'FOTO_LEPAS', 'Laporan', String(row.laporanId), 'Melepas foto "' + row.namaFile + '" (file tetap tersimpan di Drive)');
    return { fotoId: String(row.fotoId) };
  });
}

/** Memeriksa hak melihat foto & mengembalikan baris registri. */
function fotoAccessRow_(user, ft, lapIndex, fotoId) {
  var row = findBy_(ft, 'fotoId', fotoId);
  if (!row) fail_('Foto tidak ditemukan.', 'NOT_FOUND');
  var lap = lapIndex[String(row.laporanId)];
  if (!lap) fail_('Foto tidak terhubung dengan laporan yang valid.', 'FORBIDDEN');
  if (String(row.status) !== 'AKTIF' && user.peran !== ROLES.ADMIN) fail_('Foto tidak tersedia.', 'FORBIDDEN');
  if (String(lap.arsip) === DATA_STATE.ARSIP && !hasPerm_(user, 'laporan.viewArchive')) fail_('Anda tidak berhak melihat foto ini.', 'FORBIDDEN');
  return row;
}

function readFotoData_(row, size) {
  var useThumb = size === 'thumb' && row.thumbId;
  var cacheKey = 'FT:' + row.fotoId + ':' + (useThumb ? 't' : 'f');
  try {
    var cached = CacheService.getScriptCache().get(cacheKey);
    if (cached) return cached;
  } catch (e) { /* abaikan */ }
  var blob;
  try {
    blob = DriveApp.getFileById(useThumb ? row.thumbId : row.fileId).getBlob();
  } catch (e) {
    fail_('File foto tidak dapat dibaca dari Google Drive (mungkin terhapus atau Drive sedang terganggu).', 'DRIVE_UNAVAILABLE');
  }
  var dataUrl = 'data:' + (blob.getContentType() || 'image/jpeg') + ';base64,' + Utilities.base64Encode(blob.getBytes());
  if (dataUrl.length < 95000) {
    try { CacheService.getScriptCache().put(cacheKey, dataUrl, 21600); } catch (e) { /* abaikan */ }
  }
  return dataUrl;
}

function lapIndex_() {
  var idx = {};
  readTable_(SHEETS.LAPORAN).rows.forEach(function (r) { idx[String(r.id)] = r; });
  return idx;
}

function getFoto_(user, p) {
  var ft = loadFotoTable_();
  var row = fotoAccessRow_(user, ft, lapIndex_(), String(p.fotoId || ''));
  var out = { fotoId: String(row.fotoId), nama: String(row.namaFile), dataUrl: readFotoData_(row, p.size) };
  if (hasPerm_(user, 'foto.driveLink')) out.driveUrl = driveUrl_(row.fileId);
  return out;
}

/** Mengambil banyak thumbnail sekaligus (untuk laporan PDF/Excel). */
function getFotoBatch_(user, p) {
  var ids = (p.fotoIds || []).slice(0, 40);
  var ft = loadFotoTable_();
  var idx = lapIndex_();
  var out = {};
  ids.forEach(function (id) {
    try {
      var row = fotoAccessRow_(user, ft, idx, String(id));
      out[id] = readFotoData_(row, p.size || 'thumb');
    } catch (e) {
      out[id] = '';
    }
  });
  return out;
}

/** Metadata foto untuk halaman detail. */
function fotoListFor_(user, laporanId) {
  var isAdmin = hasPerm_(user, 'foto.driveLink');
  var out = { kerusakan: [], perbaikan: [] };
  loadFotoTable_().rows.forEach(function (r) {
    if (String(r.laporanId) !== String(laporanId) || String(r.status) !== 'AKTIF') return;
    var item = {
      fotoId: String(r.fotoId), nama: String(r.namaFile),
      diunggahPada: toDateTimeStr_(r.diunggahPada), diunggahOleh: String(r.diunggahOleh)
    };
    if (isAdmin) item.driveUrl = driveUrl_(r.fileId);
    (r.jenis === FOTO_JENIS.PERBAIKAN ? out.perbaikan : out.kerusakan).push(item);
  });
  return out;
}

/** Menyimpan arsip PDF laporan ke folder "Laporan PDF/<tahun>". */
function archiveReportPdf_(user, p) {
  var bytes;
  try { bytes = Utilities.base64Decode(String(p.data || '')); } catch (e) { fail_('Data PDF tidak valid.'); }
  if (!bytes || bytes.length < 5 || bytes[0] !== 0x25 || bytes[1] !== 0x50 || bytes[2] !== 0x44 || bytes[3] !== 0x46) {
    fail_('File bukan PDF yang valid.');
  }
  if (bytes.length > 25 * 1024 * 1024) fail_('Ukuran PDF terlalu besar.');
  var name = cleanText_(p.fileName, 150).replace(/[\\\/:*?"<>|]/g, '-') || 'Laporan.pdf';
  if (!/\.pdf$/i.test(name)) name += '.pdf';
  var year = String(toInt_(p.tahun, new Date().getFullYear()));
  var folder = getAppFolder_([APP.FOLDERS.LAPORAN, year]);
  var file;
  try {
    file = folder.createFile(Utilities.newBlob(bytes, 'application/pdf', name));
  } catch (e) {
    fail_('Gagal menyimpan PDF ke Google Drive: ' + e.message, 'DRIVE_UNAVAILABLE');
  }
  logActivity_(user, 'LAPORAN_PDF', 'Laporan PDF', '', name);
  var out = { nama: name };
  if (hasPerm_(user, 'foto.driveLink')) out.driveUrl = file.getUrl();
  return out;
}
