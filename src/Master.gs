/**
 * =============================================================================
 *  Master.gs — Master Barang & Master Lokasi
 * =============================================================================
 */

function loadMaster_(fresh) {
  if (!fresh) {
    var c = cacheGetJson_('MASTER_V1');
    if (c) return c;
  }
  var b = readTable_(SHEETS.BARANG).rows.map(function (r) {
    return { id: String(r.id), nama: String(r.nama), kode: String(r.kode || ''), kategori: String(r.kategori || ''), status: String(r.status || 'AKTIF') };
  });
  var l = readTable_(SHEETS.LOKASI).rows.map(function (r) {
    return { id: String(r.id), nama: String(r.nama), jenis: String(r.jenis || ''), status: String(r.status || 'AKTIF') };
  });
  b.sort(function (x, y) { return x.nama.localeCompare(y.nama); });
  l.sort(function (x, y) { return x.nama.localeCompare(y.nama); });
  var out = { barang: b, lokasi: l };
  cachePutJson_('MASTER_V1', out, 300);
  return out;
}

function invalidateMaster_() {
  cacheRemove_('MASTER_V1');
}

function findMaster_(list, nama) {
  var n = norm_(nama);
  for (var i = 0; i < list.length; i++) if (norm_(list[i].nama) === n) return list[i];
  return null;
}

/**
 * Memastikan lokasi ada di master. Bila belum ada dan pengguna berhak,
 * lokasi baru ditambahkan otomatis (opsi "Lokasi lainnya" di formulir).
 */
function ensureLokasi_(user, nama) {
  var m = loadMaster_(true);
  var found = findMaster_(m.lokasi, nama);
  if (found) return { nama: found.nama, created: false };
  requirePerm_(user, 'master.add');
  return withLock_(function () {
    var t = readTable_(SHEETS.LOKASI);
    for (var i = 0; i < t.rows.length; i++) {
      if (norm_(t.rows[i].nama) === norm_(nama)) return { nama: String(t.rows[i].nama), created: false };
    }
    appendObjects_(t, [{ id: shortId_('LOK'), nama: nama, jenis: 'Lainnya', status: 'AKTIF', dibuatPada: new Date() }]);
    invalidateMaster_();
    logActivity_(user, 'MASTER', 'Lokasi', '', 'Menambah lokasi baru: ' + nama);
    return { nama: nama, created: true };
  });
}

/** Memastikan barang ada di master (nama barang baru dapat ditambahkan petugas). */
function ensureBarang_(user, nama, kode) {
  var m = loadMaster_(true);
  var found = findMaster_(m.barang, nama);
  if (found) return { nama: found.nama, created: false };
  if (!hasPerm_(user, 'master.add')) return { nama: nama, created: false };
  return withLock_(function () {
    var t = readTable_(SHEETS.BARANG);
    for (var i = 0; i < t.rows.length; i++) {
      if (norm_(t.rows[i].nama) === norm_(nama)) return { nama: String(t.rows[i].nama), created: false };
    }
    appendObjects_(t, [{ id: shortId_('BRG'), nama: nama, kode: kode || '', kategori: '', status: 'AKTIF', dibuatPada: new Date() }]);
    invalidateMaster_();
    logActivity_(user, 'MASTER', 'Barang', '', 'Menambah barang baru: ' + nama);
    return { nama: nama, created: true };
  });
}

/** Tambah / ubah lokasi (administrator). */
function saveLokasi_(user, p) {
  var nama = cleanText_(p.nama, 100);
  var jenis = cleanText_(p.jenis, 50) || 'Lainnya';
  var status = p.status === 'NONAKTIF' ? 'NONAKTIF' : 'AKTIF';
  if (!nama) fail_('Nama lokasi wajib diisi.');
  return withLock_(function () {
    var t = readTable_(SHEETS.LOKASI);
    var dup = t.rows.filter(function (r) { return norm_(r.nama) === norm_(nama) && String(r.id) !== String(p.id || ''); });
    if (dup.length) fail_('Lokasi "' + nama + '" sudah ada.');
    var renamed = 0;
    if (p.id) {
      var row = findBy_(t, 'id', p.id);
      if (!row) fail_('Lokasi tidak ditemukan.', 'NOT_FOUND');
      var oldName = String(row.nama);
      updateObject_(t, row._row, { nama: nama, jenis: jenis, status: status });
      if (oldName !== nama && p.terapkanKeLaporan) renamed = renameInLaporan_('lokasi', oldName, nama);
      logActivity_(user, 'MASTER', 'Lokasi', p.id, 'Mengubah lokasi "' + oldName + '" menjadi "' + nama + '" (' + status + ')' + (renamed ? ', diterapkan ke ' + renamed + ' laporan' : ''));
    } else {
      appendObjects_(t, [{ id: shortId_('LOK'), nama: nama, jenis: jenis, status: 'AKTIF', dibuatPada: new Date() }]);
      logActivity_(user, 'MASTER', 'Lokasi', '', 'Menambah lokasi: ' + nama);
    }
    invalidateMaster_();
    return { master: loadMaster_(true), renamed: renamed };
  });
}

/** Tambah / ubah barang (administrator). */
function saveBarang_(user, p) {
  var nama = cleanText_(p.nama, 150);
  var kode = cleanText_(p.kode, 50);
  var kategori = cleanText_(p.kategori, 60);
  var status = p.status === 'NONAKTIF' ? 'NONAKTIF' : 'AKTIF';
  if (!nama) fail_('Nama barang wajib diisi.');
  if (kode && !/^[A-Za-z0-9.\-\/_ ]+$/.test(kode)) fail_('Kode inventaris hanya boleh berisi huruf, angka, titik, tanda hubung, garis miring, atau garis bawah.');
  return withLock_(function () {
    var t = readTable_(SHEETS.BARANG);
    var dup = t.rows.filter(function (r) { return norm_(r.nama) === norm_(nama) && String(r.id) !== String(p.id || ''); });
    if (dup.length) fail_('Barang "' + nama + '" sudah ada.');
    var renamed = 0;
    if (p.id) {
      var row = findBy_(t, 'id', p.id);
      if (!row) fail_('Barang tidak ditemukan.', 'NOT_FOUND');
      var oldName = String(row.nama);
      updateObject_(t, row._row, { nama: nama, kode: kode, kategori: kategori, status: status });
      if (oldName !== nama && p.terapkanKeLaporan) renamed = renameInLaporan_('nama', oldName, nama);
      logActivity_(user, 'MASTER', 'Barang', p.id, 'Mengubah barang "' + oldName + '" menjadi "' + nama + '"' + (renamed ? ', diterapkan ke ' + renamed + ' laporan' : ''));
    } else {
      appendObjects_(t, [{ id: shortId_('BRG'), nama: nama, kode: kode, kategori: kategori, status: 'AKTIF', dibuatPada: new Date() }]);
      logActivity_(user, 'MASTER', 'Barang', '', 'Menambah barang: ' + nama);
    }
    invalidateMaster_();
    return { master: loadMaster_(true), renamed: renamed };
  });
}

/** Menghapus master hanya bila belum dipakai laporan mana pun. */
function deleteMaster_(user, p) {
  var isLokasi = p.tipe === 'lokasi';
  var sheetName = isLokasi ? SHEETS.LOKASI : SHEETS.BARANG;
  return withLock_(function () {
    var t = readTable_(sheetName);
    var row = findBy_(t, 'id', p.id);
    if (!row) fail_('Data master tidak ditemukan.', 'NOT_FOUND');
    var lap = readTable_(SHEETS.LAPORAN);
    var key = isLokasi ? 'lokasi' : 'nama';
    var used = lap.rows.filter(function (r) { return norm_(r[key]) === norm_(row.nama); }).length;
    if (used > 0) fail_('"' + row.nama + '" masih dipakai oleh ' + used + ' laporan. Ubah status menjadi Nonaktif bila tidak ingin ditampilkan lagi.');
    deleteRow_(t, row._row);
    invalidateMaster_();
    logActivity_(user, 'MASTER', isLokasi ? 'Lokasi' : 'Barang', p.id, 'Menghapus ' + (isLokasi ? 'lokasi' : 'barang') + ': ' + row.nama);
    return { master: loadMaster_(true) };
  });
}

function renameInLaporan_(key, oldName, newName) {
  var t = readTable_(SHEETS.LAPORAN);
  var col = t.map[key] + 1;
  var count = 0;
  t.rows.forEach(function (r) {
    if (String(r[key]) === oldName) {
      t.sheet.getRange(r._row, col).setValue(safeCell_(newName));
      count++;
    }
  });
  return count;
}
