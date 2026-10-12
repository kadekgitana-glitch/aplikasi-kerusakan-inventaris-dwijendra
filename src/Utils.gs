/**
 * =============================================================================
 *  Utils.gs — Fungsi bantu umum (error, tanggal, teks, kriptografi)
 * =============================================================================
 */

/** Membuat error aplikasi yang aman ditampilkan ke pengguna. */
function appError_(message, code) {
  var e = new Error(message);
  e.isAppError = true;
  e.appCode = code || 'BAD_REQUEST';
  return e;
}

function fail_(message, code) {
  throw appError_(message, code);
}

/* ----------------------------- TANGGAL ----------------------------------- */

function fmtDateTime_(d) {
  return Utilities.formatDate(d || new Date(), APP.TZ, 'yyyy-MM-dd HH:mm:ss');
}

function todayIso_() {
  return Utilities.formatDate(new Date(), APP.TZ, 'yyyy-MM-dd');
}

/** Mengubah string 'yyyy-MM-dd' menjadi objek Date (tengah malam zona sekolah). */
function parseIsoDate_(s) {
  if (s === null || s === undefined || s === '') return null;
  var m = String(s).trim().match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (!m) return null;
  var y = +m[1], mo = +m[2], d = +m[3];
  if (y < 1990 || y > 2100 || mo < 1 || mo > 12 || d < 1 || d > 31) return null;
  var dt = new Date(y, mo - 1, d, 0, 0, 0, 0);
  if (dt.getFullYear() !== y || dt.getMonth() !== mo - 1 || dt.getDate() !== d) return null;
  return dt;
}

/**
 * Menormalkan nilai sel tanggal (Date, 'yyyy-MM-dd', 'dd/MM/yyyy') menjadi
 * 'yyyy-MM-dd'. Mengembalikan '' bila kosong / tidak valid.
 */
function toIsoDate_(v) {
  if (v === null || v === undefined || v === '') return '';
  if (Object.prototype.toString.call(v) === '[object Date]') {
    if (isNaN(v.getTime())) return '';
    return Utilities.formatDate(v, APP.TZ, 'yyyy-MM-dd');
  }
  var s = String(v).trim();
  if (!s) return '';
  if (parseIsoDate_(s)) {
    var p = s.split('-');
    return p[0] + '-' + ('0' + p[1]).slice(-2) + '-' + ('0' + p[2]).slice(-2);
  }
  var m = s.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})$/);
  if (m) {
    var iso = m[3] + '-' + ('0' + m[2]).slice(-2) + '-' + ('0' + m[1]).slice(-2);
    return parseIsoDate_(iso) ? iso : '';
  }
  return '';
}

function toDateTimeStr_(v) {
  if (v === null || v === undefined || v === '') return '';
  if (Object.prototype.toString.call(v) === '[object Date]') {
    return isNaN(v.getTime()) ? '' : fmtDateTime_(v);
  }
  return String(v);
}

/** '2026-03-12' -> '12 Maret 2026' */
function fmtTanggalIndo_(iso) {
  if (!iso) return '';
  var p = String(iso).split('-');
  if (p.length < 3) return String(iso);
  return (+p[2]) + ' ' + BULAN_ID[(+p[1]) - 1] + ' ' + p[0];
}

/** Tahun pelajaran Juli–Juni untuk tahun & bulan (1-12) tertentu. */
function tahunPelajaranFor_(year, month) {
  year = +year; month = +month;
  if (!year) return '';
  if (!month) month = 7;
  return month >= 7 ? (year + '/' + (year + 1)) : ((year - 1) + '/' + year);
}

/* ------------------------------- TEKS ------------------------------------ */

/** Membersihkan input teks: trim, hapus karakter kontrol, batasi panjang. */
function cleanText_(v, max) {
  if (v === null || v === undefined) return '';
  var s = String(v).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').trim();
  if (max && s.length > max) s = s.substring(0, max);
  return s;
}

/** Normalisasi untuk perbandingan (huruf kecil, spasi tunggal). */
function norm_(v) {
  return String(v === null || v === undefined ? '' : v).toLowerCase().replace(/\s+/g, ' ').trim();
}

/**
 * Mencegah "formula injection" saat menulis teks ke Google Sheets.
 * Teks yang diawali = + - @ diberi apostrof agar disimpan sebagai teks biasa.
 */
function safeCell_(v) {
  if (typeof v !== 'string') return v;
  if (/^[=+\-@]/.test(v)) return "'" + v;
  return v;
}

function toInt_(v, def) {
  var n = parseInt(v, 10);
  return isNaN(n) ? def : n;
}

function pad_(n, len) {
  var s = String(n);
  while (s.length < len) s = '0' + s;
  return s;
}

/* --------------------------- KRIPTOGRAFI --------------------------------- */

function bytesToHex_(bytes) {
  var out = [];
  for (var i = 0; i < bytes.length; i++) {
    var b = bytes[i] < 0 ? bytes[i] + 256 : bytes[i];
    out.push(('0' + b.toString(16)).slice(-2));
  }
  return out.join('');
}

function sha256Hex_(str) {
  var bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, String(str), Utilities.Charset.UTF_8);
  return bytesToHex_(bytes);
}

/** Token acak kriptografis (hex 64 karakter). */
function randomToken_() {
  var seed = Utilities.getUuid() + ':' + Utilities.getUuid() + ':' + new Date().getTime() + ':' + Math.random();
  return sha256Hex_(seed) + sha256Hex_(Utilities.getUuid()).substring(0, 16);
}

function shortId_(prefix) {
  return prefix + '-' + Utilities.getUuid().replace(/-/g, '').substring(0, 12).toUpperCase();
}

/**
 * PBKDF2-HMAC-SHA256 (1 blok, 32 byte). Kata sandi TIDAK pernah disimpan
 * dalam bentuk teks biasa; yang disimpan adalah: pbkdf2$iter$salt$hash
 */
function pbkdf2_(password, saltBytes, iterations) {
  var pwBytes = Utilities.newBlob(String(password)).getBytes();
  var block = saltBytes.concat([0, 0, 0, 1]);
  var u = Utilities.computeHmacSignature(Utilities.MacAlgorithm.HMAC_SHA_256, block, pwBytes);
  var t = u.slice();
  for (var i = 1; i < iterations; i++) {
    u = Utilities.computeHmacSignature(Utilities.MacAlgorithm.HMAC_SHA_256, u, pwBytes);
    for (var j = 0; j < t.length; j++) t[j] = t[j] ^ u[j];
  }
  return t;
}

function hashPassword_(password) {
  var salt = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, randomToken_()).slice(0, 16);
  var hash = pbkdf2_(password, salt, APP.PBKDF2_ITER);
  return 'pbkdf2$' + APP.PBKDF2_ITER + '$' + Utilities.base64Encode(salt) + '$' + Utilities.base64Encode(hash);
}

function verifyPassword_(password, stored) {
  if (!stored || String(stored).indexOf('pbkdf2$') !== 0) return false;
  var parts = String(stored).split('$');
  if (parts.length !== 4) return false;
  var iter = toInt_(parts[1], 0);
  var salt = Utilities.base64Decode(parts[2]);
  var expected = Utilities.base64Decode(parts[3]);
  var actual = pbkdf2_(password, salt, iter);
  if (actual.length !== expected.length) return false;
  var diff = 0;
  for (var i = 0; i < actual.length; i++) diff |= (actual[i] ^ expected[i]);
  return diff === 0;
}

/** Kata sandi sementara yang mudah dibaca (tanpa karakter ambigu). */
function generateTempPassword_() {
  var chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
  var hex = randomToken_();
  var out = '';
  for (var i = 0; i < 10; i++) {
    out += chars.charAt(parseInt(hex.substr(i * 2, 2), 16) % chars.length);
  }
  return out.substring(0, 5) + '-' + out.substring(5) + '7';
}

function validatePasswordStrength_(pw) {
  pw = String(pw || '');
  if (pw.length < APP.PASSWORD_MIN) fail_('Kata sandi minimal ' + APP.PASSWORD_MIN + ' karakter.');
  if (!/[A-Za-z]/.test(pw) || !/[0-9]/.test(pw)) fail_('Kata sandi harus mengandung huruf dan angka.');
  if (pw.length > 128) fail_('Kata sandi terlalu panjang.');
}

/* ----------------------------- PENGUNCIAN -------------------------------- */

/** Menjalankan fn di dalam LockService agar penulisan Sheets tidak bentrok (reentrant). */
var _lockDepth = 0;
function withLock_(fn) {
  if (_lockDepth > 0) {
    _lockDepth++;
    try { return fn(); } finally { _lockDepth--; }
  }
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(25000);
  } catch (e) {
    fail_('Server sedang sibuk memproses permintaan lain. Silakan coba lagi beberapa saat.', 'BUSY');
  }
  _lockDepth = 1;
  try {
    var result = fn();
    SpreadsheetApp.flush();
    return result;
  } finally {
    _lockDepth = 0;
    lock.releaseLock();
  }
}

/* ------------------------------- CACHE ----------------------------------- */

function cacheGetJson_(key) {
  try {
    var v = CacheService.getScriptCache().get(key);
    return v ? JSON.parse(v) : null;
  } catch (e) { return null; }
}

function cachePutJson_(key, obj, seconds) {
  try {
    var s = JSON.stringify(obj);
    if (s.length < 95000) CacheService.getScriptCache().put(key, s, seconds || 300);
  } catch (e) { /* cache bersifat opsional */ }
}

function cacheRemove_(key) {
  try { CacheService.getScriptCache().remove(key); } catch (e) { /* abaikan */ }
}
