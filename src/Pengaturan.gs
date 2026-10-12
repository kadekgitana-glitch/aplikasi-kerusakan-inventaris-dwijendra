/**
 * =============================================================================
 *  Pengaturan.gs — Pengaturan sekolah, penandatangan, format laporan, logo
 * =============================================================================
 */

function loadSettings_(fresh) {
  if (!fresh) {
    var c = cacheGetJson_('SETTINGS_V1');
    if (c) return c;
  }
  var out = {};
  DEFAULT_SETTINGS.forEach(function (d) { out[d[0]] = d[1]; });
  readTable_(SHEETS.SETTINGS).rows.forEach(function (r) {
    var k = String(r.kunci).trim();
    if (k) out[k] = (r.nilai === null || r.nilai === undefined) ? '' : String(r.nilai);
  });
  cachePutJson_('SETTINGS_V1', out, 300);
  return out;
}

function invalidateSettings_() {
  cacheRemove_('SETTINGS_V1');
  cacheRemove_('PUBLIC_CFG_V1');
}

/** Pengaturan yang aman dikirim ke semua pengguna yang sudah login. */
function clientSettings_(s) {
  var out = {};
  EDITABLE_SETTINGS.forEach(function (k) { out[k] = s[k] || ''; });
  out.cadangan_otomatis = s.cadangan_otomatis || 'tidak';
  out.ada_logo = !!s.logo_file_id;
  return out;
}

function setSettingValues_(values) {
  var t = readTable_(SHEETS.SETTINGS);
  var newRows = [];
  Object.keys(values).forEach(function (k) {
    var row = findBy_(t, 'kunci', k);
    if (row) {
      updateObject_(t, row._row, { nilai: values[k] });
    } else {
      var desc = '';
      DEFAULT_SETTINGS.forEach(function (d) { if (d[0] === k) desc = d[2]; });
      newRows.push({ kunci: k, nilai: values[k], keterangan: desc });
    }
  });
  if (newRows.length) appendObjects_(t, newRows);
  invalidateSettings_();
}

function updateSettings_(user, p) {
  var values = {};
  var errors = {};
  EDITABLE_SETTINGS.forEach(function (k) {
    if (p[k] === undefined) return;
    values[k] = cleanText_(p[k], 200);
  });
  if (values.nama_sekolah !== undefined && !values.nama_sekolah) errors.nama_sekolah = 'Nama sekolah wajib diisi.';
  if (values.tahun_pelajaran_mode && ['otomatis', 'manual'].indexOf(values.tahun_pelajaran_mode) < 0) errors.tahun_pelajaran_mode = 'Mode tidak valid.';
  if (values.tahun_pelajaran && !/^\d{4}\/\d{4}$/.test(values.tahun_pelajaran)) errors.tahun_pelajaran = 'Format tahun pelajaran: 2026/2027.';
  if (values.laporan_kertas && ['A4', 'F4'].indexOf(values.laporan_kertas) < 0) errors.laporan_kertas = 'Pilih A4 atau F4.';
  if (values.laporan_orientasi && ['landscape', 'portrait'].indexOf(values.laporan_orientasi) < 0) errors.laporan_orientasi = 'Orientasi tidak valid.';
  if (values.laporan_thumbnail && ['ya', 'tidak'].indexOf(values.laporan_thumbnail) < 0) errors.laporan_thumbnail = 'Nilai tidak valid.';
  if (values.kepala_nama !== undefined && !values.kepala_nama) errors.kepala_nama = 'Nama Kepala Sekolah wajib diisi.';
  if (values.wakasek_nama !== undefined && !values.wakasek_nama) errors.wakasek_nama = 'Nama Wakasek Sarpras wajib diisi.';
  if (Object.keys(errors).length) {
    var e = appError_('Periksa kembali isian pengaturan.', 'VALIDATION');
    e.fields = errors;
    throw e;
  }
  return withLock_(function () {
    var before = loadSettings_(true);
    setSettingValues_(values);
    var changed = Object.keys(values).filter(function (k) { return String(before[k] || '') !== values[k]; });
    logActivity_(user, 'PENGATURAN', 'Pengaturan', '', 'Mengubah: ' + (changed.join(', ') || '(tidak ada perubahan)'));
    return { settings: clientSettings_(loadSettings_(true)) };
  });
}

/* ------------------------------- LOGO ------------------------------------ */

function uploadLogo_(user, p) {
  var data = String(p.data || '');
  var mime = String(p.mime || '');
  if (['image/png', 'image/jpeg', 'image/webp'].indexOf(mime) < 0) fail_('Logo harus berupa gambar PNG, JPG, atau WEBP.');
  var bytes;
  try { bytes = Utilities.base64Decode(data); } catch (e) { fail_('Data logo tidak valid.'); }
  if (bytes.length > 300 * 1024) fail_('Ukuran logo maksimal 300 KB setelah dikompresi.');
  if (!detectImageMime_(bytes)) fail_('File logo bukan gambar yang valid.');
  var folder = getAppFolder_([APP.FOLDERS.SISTEM]);
  var ext = mime === 'image/png' ? 'png' : (mime === 'image/webp' ? 'webp' : 'jpg');
  var file;
  try {
    file = folder.createFile(Utilities.newBlob(bytes, mime, 'logo_sekolah_' + Utilities.formatDate(new Date(), APP.TZ, 'yyyyMMdd_HHmmss') + '.' + ext));
  } catch (e) {
    fail_('Gagal menyimpan logo ke Google Drive: ' + e.message, 'DRIVE_UNAVAILABLE');
  }
  withLock_(function () { setSettingValues_({ logo_file_id: file.getId() }); });
  logActivity_(user, 'PENGATURAN', 'Pengaturan', '', 'Mengganti logo sekolah');
  return { logo: 'data:' + mime + ';base64,' + data };
}

function removeLogo_(user) {
  withLock_(function () { setSettingValues_({ logo_file_id: '' }); });
  logActivity_(user, 'PENGATURAN', 'Pengaturan', '', 'Menghapus logo sekolah (file tetap tersimpan di Drive)');
  return { logo: '' };
}

function logoDataUrl_(s) {
  if (!s.logo_file_id) return '';
  try {
    var blob = DriveApp.getFileById(s.logo_file_id).getBlob();
    return 'data:' + blob.getContentType() + ';base64,' + Utilities.base64Encode(blob.getBytes());
  } catch (e) {
    return '';
  }
}

/** Konfigurasi publik untuk halaman login (tanpa data sensitif). */
function getPublicConfig_() {
  var c = cacheGetJson_('PUBLIC_CFG_V1');
  if (c) return c;
  var s;
  try { s = loadSettings_(); } catch (e) {
    return { namaSekolah: APP.SCHOOL, namaAplikasi: APP.NAME, logo: '', siap: false, pesan: e.message, versi: APP.VERSION };
  }
  var out = {
    namaSekolah: s.nama_sekolah || APP.SCHOOL,
    namaAplikasi: s.nama_aplikasi || APP.NAME,
    alamat: s.alamat_sekolah || '',
    logo: logoDataUrl_(s),
    siap: true,
    versi: APP.VERSION
  };
  cachePutJson_('PUBLIC_CFG_V1', out, 600);
  return out;
}

/** Judul & penandatangan laporan berdasarkan pengaturan. */
function reportMeta_(year, month) {
  var s = loadSettings_();
  var tp = s.tahun_pelajaran_mode === 'manual' ? s.tahun_pelajaran : tahunPelajaranFor_(year, month || 0);
  var today = todayIso_();
  return {
    namaSekolah: s.nama_sekolah,
    namaSekolahUpper: String(s.nama_sekolah || '').toUpperCase(),
    tahunPelajaran: tp,
    bulanLabel: month ? (BULAN_ID[month - 1].toUpperCase() + ' ' + year) : '',
    tahun: year,
    kota: s.kota,
    tanggalCetak: today,
    tanggalCetakLabel: fmtTanggalIndo_(today),
    kertas: s.laporan_kertas || 'A4',
    orientasi: s.laporan_orientasi || 'landscape',
    thumbnail: s.laporan_thumbnail !== 'tidak',
    kiri: { pembuka: 'Mengetahui,', jabatan: s.kepala_jabatan, nama: s.kepala_nama, idLabel: s.kepala_id_label, id: s.kepala_id },
    kanan: { pembuka: s.kota + ', ' + fmtTanggalIndo_(today), jabatan: s.wakasek_jabatan, nama: s.wakasek_nama, idLabel: s.wakasek_id_label, id: s.wakasek_id }
  };
}
