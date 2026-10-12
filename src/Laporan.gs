/**
 * =============================================================================
 *  Laporan.gs — Data kerusakan inventaris (CRUD, status, arsip, pencarian)
 * =============================================================================
 *  Aturan status (dihitung di backend, tidak bergantung pada isi keterangan):
 *    - Tanggal perbaikan kosong  -> "Belum Diperbaiki"
 *    - Tanggal perbaikan valid   -> "Sudah Diperbaiki"
 * =============================================================================
 */

var FIELD_LABELS = {
  nama: 'Nama Barang', kode: 'Kode Inventaris', jumlah: 'Jumlah', lokasi: 'Lokasi/Ruangan',
  kondisi: 'Kondisi Kerusakan', tglRusak: 'Tanggal Rusak', tglPerbaikan: 'Tanggal Perbaikan',
  keterangan: 'Keterangan'
};

function statusFromDate_(tglPerbaikanIso) {
  return tglPerbaikanIso ? STATUS.SUDAH : STATUS.BELUM;
}

/** Baris sheet -> objek aman untuk browser (tanpa ID file Drive). */
function laporanToClient_(r, fotoMap) {
  var id = String(r.id);
  var tglPerbaikan = toIsoDate_(r.tglPerbaikan);
  var f = (fotoMap && fotoMap[id]) || { K: [], P: [] };
  return {
    id: id,
    no: toInt_(r.no, 0),
    nama: String(r.nama),
    kode: String(r.kode),
    jumlah: toInt_(r.jumlah, 0),
    lokasi: String(r.lokasi),
    kondisi: String(r.kondisi),
    tglRusak: toIsoDate_(r.tglRusak),
    tglPerbaikan: tglPerbaikan,
    status: statusFromDate_(tglPerbaikan),
    keterangan: String(r.keterangan),
    dibuatPada: toDateTimeStr_(r.dibuatPada),
    dibuatOleh: String(r.dibuatOleh),
    diubahPada: toDateTimeStr_(r.diubahPada),
    diubahOleh: String(r.diubahOleh),
    arsip: String(r.arsip) === DATA_STATE.ARSIP,
    arsipPada: toDateTimeStr_(r.arsipPada),
    arsipOleh: String(r.arsipOleh),
    alasanKoreksi: String(r.alasanKoreksi),
    sumber: String(r.sumber),
    fotoKerusakan: f.K,
    fotoPerbaikan: f.P
  };
}

/** Memuat semua laporan. opts: { includeArchived, onlyArchived } */
function loadRecords_(opts) {
  opts = opts || {};
  var t = readTable_(SHEETS.LAPORAN);
  var fm = loadFotoMap_();
  var out = [];
  t.rows.forEach(function (r) {
    if (!r.id) return;
    var isArch = String(r.arsip) === DATA_STATE.ARSIP;
    if (opts.onlyArchived) { if (!isArch) return; }
    else if (isArch && !opts.includeArchived) return;
    out.push(laporanToClient_(r, fm));
  });
  return out;
}

/** Filter bersama untuk tabel, dashboard, dan laporan. */
function filterRecords_(list, q) {
  q = q || {};
  var year = toInt_(q.year, 0);
  var month = toInt_(q.month, 0);
  var lokasi = norm_(q.lokasi);
  var status = String(q.status || '');
  var barang = norm_(q.barang);
  var tokens = norm_(q.search).split(' ').filter(function (s) { return !!s; });
  var pFrom = toIsoDate_(q.perbaikanDari), pTo = toIsoDate_(q.perbaikanSampai);
  var rFrom = toIsoDate_(q.rusakDari), rTo = toIsoDate_(q.rusakSampai);
  return list.filter(function (x) {
    if (year && x.tglRusak.substring(0, 4) !== String(year)) return false;
    if (month && toInt_(x.tglRusak.substring(5, 7), 0) !== month) return false;
    if (lokasi && norm_(x.lokasi) !== lokasi) return false;
    if (status === 'BELUM' && x.status !== STATUS.BELUM) return false;
    if (status === 'SUDAH' && x.status !== STATUS.SUDAH) return false;
    if (barang && norm_(x.nama).indexOf(barang) < 0) return false;
    if (pFrom && (!x.tglPerbaikan || x.tglPerbaikan < pFrom)) return false;
    if (pTo && (!x.tglPerbaikan || x.tglPerbaikan > pTo)) return false;
    if (rFrom && x.tglRusak < rFrom) return false;
    if (rTo && x.tglRusak > rTo) return false;
    if (tokens.length) {
      var hay = norm_([x.id, x.nama, x.kode, x.lokasi, x.kondisi, x.keterangan].join(' '));
      for (var i = 0; i < tokens.length; i++) if (hay.indexOf(tokens[i]) < 0) return false;
    }
    return true;
  });
}

function sortRecords_(list, sort) {
  var s = sort || 'rusak_desc';
  var cmp = {
    rusak_desc: function (a, b) { return a.tglRusak < b.tglRusak ? 1 : a.tglRusak > b.tglRusak ? -1 : b.no - a.no; },
    rusak_asc: function (a, b) { return a.tglRusak < b.tglRusak ? -1 : a.tglRusak > b.tglRusak ? 1 : a.no - b.no; },
    perbaikan_desc: function (a, b) { return a.tglPerbaikan < b.tglPerbaikan ? 1 : a.tglPerbaikan > b.tglPerbaikan ? -1 : b.no - a.no; },
    diubah_desc: function (a, b) { return a.diubahPada < b.diubahPada ? 1 : a.diubahPada > b.diubahPada ? -1 : b.no - a.no; },
    no_asc: function (a, b) { return a.no - b.no; }
  }[s] || null;
  return cmp ? list.sort(cmp) : list;
}

/* ---------------------------- VALIDASI ----------------------------------- */

function validateLaporanInput_(p, user) {
  var errors = {};
  var d = {};
  d.nama = cleanText_(p.nama, 150);
  if (!d.nama) errors.nama = 'Nama barang wajib diisi.';
  d.kode = cleanText_(p.kode, 50);
  if (d.kode && !/^[A-Za-z0-9.\-\/_ ]+$/.test(d.kode)) errors.kode = 'Kode inventaris hanya boleh berisi huruf, angka, titik, dan tanda hubung.';
  var j = Number(p.jumlah);
  if (p.jumlah === '' || p.jumlah === null || p.jumlah === undefined || !isFinite(j)) errors.jumlah = 'Jumlah wajib diisi.';
  else if (j < 1 || Math.floor(j) !== j) errors.jumlah = 'Jumlah minimal 1 dan berupa bilangan bulat.';
  else if (j > 100000) errors.jumlah = 'Jumlah terlalu besar.';
  d.jumlah = j;
  d.lokasi = cleanText_(p.lokasi, 100);
  if (!d.lokasi) errors.lokasi = 'Lokasi/ruangan wajib dipilih.';
  d.kondisi = cleanText_(p.kondisi, 2000);
  if (!d.kondisi) errors.kondisi = 'Kondisi kerusakan wajib diisi.';
  d.keterangan = cleanText_(p.keterangan, 5000);
  var today = todayIso_();
  d.tglRusakIso = toIsoDate_(p.tglRusak);
  if (!p.tglRusak) errors.tglRusak = 'Tanggal rusak wajib diisi.';
  else if (!d.tglRusakIso) errors.tglRusak = 'Tanggal rusak tidak valid.';
  else if (d.tglRusakIso > today) errors.tglRusak = 'Tanggal rusak tidak boleh melebihi hari ini.';
  d.tglPerbaikanIso = '';
  if (p.tglPerbaikan) {
    d.tglPerbaikanIso = toIsoDate_(p.tglPerbaikan);
    if (!d.tglPerbaikanIso) errors.tglPerbaikan = 'Tanggal perbaikan tidak valid.';
    else if (d.tglPerbaikanIso > today) errors.tglPerbaikan = 'Tanggal perbaikan tidak boleh melebihi hari ini.';
  }
  d.alasanKoreksi = '';
  checkRepairDate_(d.tglRusakIso, d.tglPerbaikanIso, p, user, errors, d);
  if (Object.keys(errors).length) {
    var e = appError_('Periksa kembali isian yang ditandai.', 'VALIDATION');
    e.fields = errors;
    throw e;
  }
  return d;
}

/** Tanggal perbaikan tidak boleh sebelum tanggal rusak, kecuali koreksi historis oleh admin. */
function checkRepairDate_(rusakIso, perbaikanIso, p, user, errors, d) {
  if (!rusakIso || !perbaikanIso || perbaikanIso >= rusakIso) return;
  if (p.koreksiHistoris && hasPerm_(user, 'laporan.historical')) {
    d.alasanKoreksi = cleanText_(p.alasanKoreksi, 500);
    if (!d.alasanKoreksi) errors.alasanKoreksi = 'Alasan koreksi data historis wajib diisi.';
  } else {
    errors.tglPerbaikan = 'Tanggal perbaikan tidak boleh lebih awal daripada tanggal rusak.' +
      (hasPerm_(user, 'laporan.historical') ? ' Centang "Koreksi data historis" bila memang diperlukan.' : '');
  }
}

function fingerprint_(nama, kode, jumlah, lokasi, kondisi, tglRusakIso) {
  return sha256Hex_([norm_(nama), norm_(kode), String(jumlah), norm_(lokasi), norm_(kondisi), tglRusakIso].join('|')).substring(0, 32);
}

/** Nomor urut global (tidak pernah dipakai ulang). Wajib dipanggil di dalam lock. */
function nextSeq_(table) {
  var props = PropertiesService.getScriptProperties();
  var seq = toInt_(props.getProperty('SEQ_LAPORAN'), 0);
  table.rows.forEach(function (r) { var n = toInt_(r.no, 0); if (n > seq) seq = n; });
  seq++;
  props.setProperty('SEQ_LAPORAN', String(seq));
  return seq;
}

function makeLaporanId_(seq) {
  return APP.ID_PREFIX + '-' + Utilities.formatDate(new Date(), APP.TZ, 'yyyy') + '-' + pad_(seq, 5);
}

/* ------------------------------ CRUD ------------------------------------- */

function createLaporan_(user, p) {
  var d = validateLaporanInput_(p, user);
  var reqId = cleanText_(p.requestId, 64);
  if (reqId) {
    var cached = cacheGetJson_('REQ:' + reqId);
    if (cached) return { id: cached.id, duplicate: true, laporan: null };
  }
  var lok = ensureLokasi_(user, d.lokasi);
  var brg = ensureBarang_(user, d.nama, d.kode);
  return withLock_(function () {
    var t = readTable_(SHEETS.LAPORAN);
    if (reqId) {
      var prev = findBy_(t, 'requestId', reqId);
      if (prev) return { id: String(prev.id), duplicate: true, laporan: null };
    }
    var seq = nextSeq_(t);
    var id = makeLaporanId_(seq);
    while (findBy_(t, 'id', id)) { seq = nextSeq_(t); id = makeLaporanId_(seq); }
    var now = new Date();
    var obj = {
      id: id, no: seq, nama: brg.nama, kode: d.kode, jumlah: d.jumlah, lokasi: lok.nama,
      kondisi: d.kondisi, urlKerusakan: '', tglRusak: parseIsoDate_(d.tglRusakIso),
      tglPerbaikan: d.tglPerbaikanIso ? parseIsoDate_(d.tglPerbaikanIso) : '',
      urlPerbaikan: '', keterangan: d.keterangan, status: statusFromDate_(d.tglPerbaikanIso),
      dibuatPada: now, dibuatOleh: user.label, diubahPada: now, diubahOleh: user.label,
      arsip: DATA_STATE.AKTIF, arsipPada: '', arsipOleh: '', alasanKoreksi: d.alasanKoreksi,
      sidik: fingerprint_(brg.nama, d.kode, d.jumlah, lok.nama, d.kondisi, d.tglRusakIso),
      sumber: 'INPUT', requestId: reqId
    };
    appendObjects_(t, [obj]);
    if (reqId) cachePutJson_('REQ:' + reqId, { id: id }, 21600);
    logActivity_(user, 'TAMBAH', 'Laporan', id, brg.nama + ' — ' + lok.nama + ' — ' + d.kondisi.substring(0, 120) +
      ' (status: ' + obj.status + ')' + (d.alasanKoreksi ? ' | Koreksi historis: ' + d.alasanKoreksi : ''));
    var row = readTable_(SHEETS.LAPORAN);
    var saved = findBy_(row, 'id', id);
    return {
      id: id, duplicate: false,
      laporan: laporanToClient_(saved, {}),
      lokasiBaru: lok.created, barangBaru: brg.created
    };
  });
}

function getRowOrFail_(t, id, user, allowArchived) {
  var row = findBy_(t, 'id', String(id || ''));
  if (!row) fail_('Laporan tidak ditemukan atau sudah dihapus.', 'NOT_FOUND');
  if (String(row.arsip) === DATA_STATE.ARSIP && !allowArchived) {
    fail_('Laporan ini sedang diarsipkan. Pulihkan terlebih dahulu untuk mengubahnya.', 'ARCHIVED');
  }
  return row;
}

function checkVersion_(row, versi) {
  if (!versi) return;
  if (toDateTimeStr_(row.diubahPada) !== String(versi)) {
    fail_('Data ini baru saja diubah oleh ' + row.diubahOleh + ' pada ' + toDateTimeStr_(row.diubahPada) +
      '. Muat ulang data untuk melihat perubahan terbaru sebelum menyimpan.', 'CONFLICT');
  }
}

function diffText_(oldC, d) {
  var changes = [];
  var next = {
    nama: d.nama, kode: d.kode, jumlah: d.jumlah, lokasi: d.lokasi, kondisi: d.kondisi,
    tglRusak: d.tglRusakIso, tglPerbaikan: d.tglPerbaikanIso, keterangan: d.keterangan
  };
  Object.keys(FIELD_LABELS).forEach(function (k) {
    var a = String(oldC[k] === undefined ? '' : oldC[k]);
    var b = String(next[k] === undefined ? '' : next[k]);
    if (a !== b) {
      var sa = a.length > 60 ? a.substring(0, 57) + '…' : a;
      var sb = b.length > 60 ? b.substring(0, 57) + '…' : b;
      changes.push(FIELD_LABELS[k] + ': "' + (sa || '-') + '" → "' + (sb || '-') + '"');
    }
  });
  return changes;
}

function updateLaporan_(user, p) {
  var d = validateLaporanInput_(p, user);
  var lok = ensureLokasi_(user, d.lokasi);
  var brg = ensureBarang_(user, d.nama, d.kode);
  d.lokasi = lok.nama;
  d.nama = brg.nama;
  return withLock_(function () {
    var t = readTable_(SHEETS.LAPORAN);
    var row = getRowOrFail_(t, p.id, user, false);
    checkVersion_(row, p.versi);
    var oldC = laporanToClient_(row, {});
    var changes = diffText_(oldC, d);
    var newStatus = statusFromDate_(d.tglPerbaikanIso);
    var patch = {
      nama: d.nama, kode: d.kode, jumlah: d.jumlah, lokasi: d.lokasi, kondisi: d.kondisi,
      tglRusak: parseIsoDate_(d.tglRusakIso),
      tglPerbaikan: d.tglPerbaikanIso ? parseIsoDate_(d.tglPerbaikanIso) : '',
      keterangan: d.keterangan, status: newStatus,
      diubahPada: new Date(), diubahOleh: user.label,
      sidik: fingerprint_(d.nama, d.kode, d.jumlah, d.lokasi, d.kondisi, d.tglRusakIso)
    };
    if (d.alasanKoreksi) patch.alasanKoreksi = d.alasanKoreksi;
    else if (!d.tglPerbaikanIso || d.tglPerbaikanIso >= d.tglRusakIso) patch.alasanKoreksi = '';
    updateObject_(t, row._row, patch);
    if (changes.length) {
      logActivity_(user, 'UBAH', 'Laporan', oldC.id, changes.join('; ') + (d.alasanKoreksi ? ' | Koreksi historis: ' + d.alasanKoreksi : ''));
    }
    if (oldC.status !== newStatus) {
      logActivity_(user, 'STATUS', 'Laporan', oldC.id, 'Status: ' + oldC.status + ' → ' + newStatus);
    }
    var fresh = findBy_(readTable_(SHEETS.LAPORAN), 'id', oldC.id);
    return { id: oldC.id, laporan: laporanToClient_(fresh, {}), perubahan: changes.length };
  });
}

/** "Tandai Sudah Diperbaiki" — tidak menghapus foto kerusakan maupun data awal. */
function markRepaired_(user, p) {
  return withLock_(function () {
    var t = readTable_(SHEETS.LAPORAN);
    var row = getRowOrFail_(t, p.id, user, false);
    checkVersion_(row, p.versi);
    var rusak = toIsoDate_(row.tglRusak);
    var errors = {};
    var d = { alasanKoreksi: '' };
    var tgl = toIsoDate_(p.tglPerbaikan);
    if (!p.tglPerbaikan) errors.tglPerbaikan = 'Tanggal perbaikan wajib diisi.';
    else if (!tgl) errors.tglPerbaikan = 'Tanggal perbaikan tidak valid.';
    else if (tgl > todayIso_()) errors.tglPerbaikan = 'Tanggal perbaikan tidak boleh melebihi hari ini.';
    if (tgl) checkRepairDate_(rusak, tgl, p, user, errors, d);
    if (Object.keys(errors).length) {
      var e = appError_('Periksa kembali isian perbaikan.', 'VALIDATION');
      e.fields = errors;
      throw e;
    }
    var catatan = cleanText_(p.catatan, 1500);
    var ket = String(row.keterangan || '');
    if (catatan) {
      ket = (ket ? ket + '\n' : '') + 'Hasil perbaikan (' + fmtTanggalIndo_(tgl) + '): ' + catatan;
    }
    var oldStatus = statusFromDate_(toIsoDate_(row.tglPerbaikan));
    var patch = {
      tglPerbaikan: parseIsoDate_(tgl), status: STATUS.SUDAH, keterangan: ket,
      diubahPada: new Date(), diubahOleh: user.label
    };
    if (d.alasanKoreksi) patch.alasanKoreksi = d.alasanKoreksi;
    updateObject_(t, row._row, patch);
    logActivity_(user, 'PERBAIKAN', 'Laporan', String(row.id), 'Tanggal perbaikan: ' + fmtTanggalIndo_(tgl) +
      (catatan ? ' | Catatan: ' + catatan : '') + (d.alasanKoreksi ? ' | Koreksi historis: ' + d.alasanKoreksi : ''));
    if (oldStatus !== STATUS.SUDAH) logActivity_(user, 'STATUS', 'Laporan', String(row.id), 'Status: ' + oldStatus + ' → ' + STATUS.SUDAH);
    var fresh = findBy_(readTable_(SHEETS.LAPORAN), 'id', String(row.id));
    return { id: String(row.id), laporan: laporanToClient_(fresh, {}) };
  });
}

/** Mencatat tindak lanjut (ditambahkan ke keterangan dengan tanggal & nama petugas). */
function addFollowUp_(user, p) {
  var catatan = cleanText_(p.catatan, 1500);
  if (!catatan) fail_('Catatan tindak lanjut wajib diisi.');
  return withLock_(function () {
    var t = readTable_(SHEETS.LAPORAN);
    var row = getRowOrFail_(t, p.id, user, false);
    var ket = String(row.keterangan || '');
    ket = (ket ? ket + '\n' : '') + '[' + fmtTanggalIndo_(todayIso_()) + ' · ' + user.nama + '] ' + catatan;
    updateObject_(t, row._row, { keterangan: ket, diubahPada: new Date(), diubahOleh: user.label });
    logActivity_(user, 'TINDAK_LANJUT', 'Laporan', String(row.id), catatan);
    var fresh = findBy_(readTable_(SHEETS.LAPORAN), 'id', String(row.id));
    return { id: String(row.id), laporan: laporanToClient_(fresh, {}) };
  });
}

function archiveLaporan_(user, p) {
  return withLock_(function () {
    var t = readTable_(SHEETS.LAPORAN);
    var row = getRowOrFail_(t, p.id, user, false);
    updateObject_(t, row._row, { arsip: DATA_STATE.ARSIP, arsipPada: new Date(), arsipOleh: user.label });
    logActivity_(user, 'ARSIP', 'Laporan', String(row.id), 'Diarsipkan' + (p.alasan ? ': ' + cleanText_(p.alasan, 300) : ''));
    return { id: String(row.id) };
  });
}

function restoreLaporan_(user, p) {
  return withLock_(function () {
    var t = readTable_(SHEETS.LAPORAN);
    var row = getRowOrFail_(t, p.id, user, true);
    if (String(row.arsip) !== DATA_STATE.ARSIP) fail_('Laporan ini tidak sedang diarsipkan.');
    updateObject_(t, row._row, { arsip: DATA_STATE.AKTIF, arsipPada: '', arsipOleh: '', diubahPada: new Date(), diubahOleh: user.label });
    logActivity_(user, 'PULIHKAN', 'Laporan', String(row.id), 'Dipulihkan dari arsip');
    return { id: String(row.id) };
  });
}

/** Hapus permanen: hanya untuk laporan yang SUDAH diarsipkan, dengan konfirmasi ID. */
function deleteLaporan_(user, p) {
  return withLock_(function () {
    var t = readTable_(SHEETS.LAPORAN);
    var row = getRowOrFail_(t, p.id, user, true);
    if (String(row.arsip) !== DATA_STATE.ARSIP) fail_('Arsipkan laporan terlebih dahulu sebelum menghapus permanen.');
    if (String(p.konfirmasi || '').trim() !== String(row.id)) fail_('Ketik ID laporan dengan benar untuk konfirmasi penghapusan.');
    var id = String(row.id);
    var summary = row.nama + ' — ' + row.lokasi + ' — ' + toIsoDate_(row.tglRusak);
    var ft = loadFotoTable_();
    var trashed = 0;
    ft.rows.forEach(function (r) {
      if (String(r.laporanId) !== id || String(r.status) === 'DIHAPUS') return;
      try {
        DriveApp.getFileById(r.fileId).setTrashed(true);
        if (r.thumbId) DriveApp.getFileById(r.thumbId).setTrashed(true);
        trashed++;
      } catch (e) { /* file mungkin sudah tidak ada */ }
      updateObject_(ft, r._row, { status: 'DIHAPUS' });
    });
    deleteRow_(t, row._row);
    logActivity_(user, 'HAPUS_PERMANEN', 'Laporan', id, summary + ' | ' + trashed + ' foto dipindahkan ke Sampah Drive (dapat dipulihkan 30 hari)');
    return { id: id };
  });
}

function getLaporanDetail_(user, p) {
  var t = readTable_(SHEETS.LAPORAN);
  var row = findBy_(t, 'id', String(p.id || ''));
  if (!row) fail_('Laporan tidak ditemukan.', 'NOT_FOUND');
  if (String(row.arsip) === DATA_STATE.ARSIP && !hasPerm_(user, 'laporan.viewArchive')) fail_('Laporan tidak ditemukan.', 'NOT_FOUND');
  var rec = laporanToClient_(row, loadFotoMap_());
  rec.foto = fotoListFor_(user, rec.id);
  rec.riwayat = historyFor_(rec.id);
  rec.versi = rec.diubahPada;
  return rec;
}

/** Pencarian + filter + pengurutan + pagination di server. */
function queryLaporan_(user, q) {
  q = q || {};
  var opts = {};
  if (q.arsip) {
    requirePerm_(user, 'laporan.viewArchive');
    opts.onlyArchived = true;
  }
  var list = sortRecords_(filterRecords_(loadRecords_(opts), q), q.sort);
  var total = list.length;
  var totalJumlah = 0, belum = 0;
  list.forEach(function (x) { totalJumlah += x.jumlah; if (x.status === STATUS.BELUM) belum++; });
  var pageSize = toInt_(q.pageSize, 10);
  if (pageSize <= 0) pageSize = Math.max(total, 1); // 0 = semua (untuk ekspor)
  pageSize = Math.min(pageSize, 10000);
  var pages = Math.max(1, Math.ceil(total / pageSize));
  var page = Math.min(Math.max(toInt_(q.page, 1), 1), pages);
  return {
    rows: list.slice((page - 1) * pageSize, page * pageSize),
    total: total, page: page, pages: pages, pageSize: pageSize,
    ringkasan: { totalJumlah: totalJumlah, belum: belum, sudah: total - belum }
  };
}
