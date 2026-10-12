/**
 * =============================================================================
 *  Db.gs — Lapisan akses database Google Sheets
 * =============================================================================
 *  - Semua pembacaan dipetakan berdasarkan judul kolom (lihat SCHEMA di Config.gs)
 *  - Penulisan dilakukan per baris/blok dengan setValues (cepat & atomik per blok)
 *  - Semua operasi tulis yang kritis dibungkus withLock_() oleh pemanggilnya
 * =============================================================================
 */

var _ssCache = null;

function getSs_() {
  if (_ssCache) return _ssCache;
  var id = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');
  try {
    if (id) {
      _ssCache = SpreadsheetApp.openById(id);
    } else {
      var active = SpreadsheetApp.getActiveSpreadsheet();
      if (active) _ssCache = active;
    }
  } catch (e) {
    fail_('Database Google Sheets tidak dapat dibuka. Layanan mungkin sedang terganggu atau file telah dipindahkan/dihapus. Detail: ' + e.message, 'SHEETS_UNAVAILABLE');
  }
  if (!_ssCache) {
    fail_('Database belum disiapkan. Administrator perlu menjalankan fungsi setupAplikasi() dari editor Apps Script.', 'NOT_SETUP');
  }
  return _ssCache;
}

function getSheet_(name) {
  var sh = getSs_().getSheetByName(name);
  if (!sh) fail_('Sheet "' + name + '" tidak ditemukan. Jalankan setupAplikasi() untuk memperbaiki struktur database.', 'NOT_SETUP');
  return sh;
}

/** Memetakan kunci skema -> indeks kolom (0-based) berdasarkan baris judul. */
function headerMap_(sheetName, header) {
  var idx = {};
  for (var i = 0; i < header.length; i++) idx[norm_(header[i])] = i;
  var map = {};
  SCHEMA[sheetName].forEach(function (c) {
    var i = idx[norm_(c[1])];
    if (i === undefined) {
      fail_('Kolom "' + c[1] + '" tidak ditemukan pada sheet "' + sheetName + '". Jalankan setupAplikasi() untuk memperbaiki struktur.', 'SCHEMA');
    }
    map[c[0]] = i;
  });
  return map;
}

/**
 * Membaca seluruh tabel menjadi array objek. Setiap objek memiliki _row
 * (nomor baris di Sheets, 1-based) untuk keperluan pembaruan.
 */
function readTable_(sheetName) {
  var sh = getSheet_(sheetName);
  var lastRow = sh.getLastRow();
  var lastCol = Math.max(sh.getLastColumn(), SCHEMA[sheetName].length);
  var values = lastRow >= 1 ? sh.getRange(1, 1, lastRow, lastCol).getValues() : [[]];
  var header = values[0];
  var map = headerMap_(sheetName, header);
  var keys = Object.keys(map);
  var rows = [];
  for (var r = 1; r < values.length; r++) {
    var row = values[r];
    var obj = { _row: r + 1 };
    var empty = true;
    for (var k = 0; k < keys.length; k++) {
      var v = row[map[keys[k]]];
      if (v === null || v === undefined) v = '';
      obj[keys[k]] = v;
      if (v !== '') empty = false;
    }
    if (!empty) rows.push(obj);
  }
  return { name: sheetName, sheet: sh, map: map, rows: rows, lastCol: lastCol };
}

/** Mengubah objek menjadi array nilai baris sesuai peta kolom. */
function objToRow_(table, obj, baseRow) {
  var arr = baseRow ? baseRow.map(safeCell_) : [];
  while (arr.length < table.lastCol) arr.push('');
  Object.keys(table.map).forEach(function (k) {
    if (Object.prototype.hasOwnProperty.call(obj, k)) {
      var v = obj[k];
      arr[table.map[k]] = (v === null || v === undefined) ? '' : safeCell_(v);
    }
  });
  return arr;
}

/** Memastikan jumlah baris fisik sheet cukup sebelum setValues. */
function ensureRows_(sh, lastNeededRow) {
  var max = sh.getMaxRows();
  if (max < lastNeededRow) sh.insertRowsAfter(max, lastNeededRow - max + 50);
}

/** Menambahkan banyak objek sekaligus di akhir tabel. Mengembalikan nomor baris awal. */
function appendObjects_(table, objs) {
  if (!objs.length) return 0;
  var sh = table.sheet;
  var start = sh.getLastRow() + 1;
  var data = objs.map(function (o) { return objToRow_(table, o, null); });
  ensureRows_(sh, start + data.length - 1);
  sh.getRange(start, 1, data.length, table.lastCol).setValues(data);
  return start;
}

/** Memperbarui sebagian kolom dari baris tertentu tanpa menyentuh kolom lain. */
function updateObject_(table, rowNum, patch) {
  var sh = table.sheet;
  var current = sh.getRange(rowNum, 1, 1, table.lastCol).getValues()[0];
  var next = objToRow_(table, patch, current);
  sh.getRange(rowNum, 1, 1, table.lastCol).setValues([next]);
}

function findBy_(table, key, value) {
  var v = String(value);
  for (var i = 0; i < table.rows.length; i++) {
    if (String(table.rows[i][key]) === v) return table.rows[i];
  }
  return null;
}

function deleteRow_(table, rowNum) {
  table.sheet.deleteRow(rowNum);
}
