/**
 * =============================================================================
 *  Auth.gs — Autentikasi, sesi, dan pemeriksaan hak akses
 * =============================================================================
 *  Mekanisme:
 *  1. Web app dijalankan sebagai PEMILIK (Execute as: Me). Pengguna tidak perlu
 *     akses langsung ke Google Sheets / Drive sehingga data tetap privat.
 *  2. Pengguna login dengan username + kata sandi. Kata sandi disimpan sebagai
 *     hash PBKDF2-HMAC-SHA256 dengan salt acak (bukan teks biasa).
 *  3. Setelah login, server membuat token sesi acak. Token disimpan di
 *     CacheService dalam bentuk HASH (bukan token aslinya) dan berlaku 3 jam
 *     sejak aktivitas terakhir (maksimum 12 jam).
 *  4. Identitas pengguna SELALU diambil dari sesi di server — tidak pernah dari
 *     email/username yang dikirim browser.
 *  5. Opsional: login dengan akun Google bila Session.getActiveUser() di server
 *     mengembalikan email yang terdaftar (hanya pada deployment domain/akun Google).
 * =============================================================================
 */

function sessionKey_(token) {
  return 'S:' + sha256Hex_(token);
}

function pwVer_(hash) {
  return sha256Hex_('v:' + String(hash)).substring(0, 16);
}

/** Daftar pengguna (tanpa hash) dengan cache singkat. */
function loadUsers_(fresh) {
  if (!fresh) {
    var c = cacheGetJson_('USERS_V1');
    if (c) return c;
  }
  var t = readTable_(SHEETS.USERS);
  var list = t.rows.map(function (r) {
    return {
      id: String(r.id),
      username: String(r.username),
      nama: String(r.nama),
      email: String(r.email || ''),
      peran: String(r.peran),
      status: String(r.status || 'AKTIF'),
      ver: pwVer_(r.hash),
      harusGanti: r.harusGanti === true || String(r.harusGanti).toUpperCase() === 'TRUE' || String(r.harusGanti).toUpperCase() === 'YA',
      dibuatPada: toDateTimeStr_(r.dibuatPada),
      loginTerakhir: toDateTimeStr_(r.loginTerakhir),
      diubahPada: toDateTimeStr_(r.diubahPada)
    };
  });
  cachePutJson_('USERS_V1', list, 120);
  return list;
}

function invalidateUsers_() {
  cacheRemove_('USERS_V1');
}

function getUserById_(id) {
  var list = loadUsers_();
  for (var i = 0; i < list.length; i++) if (list[i].id === String(id)) return list[i];
  return null;
}

function publicUser_(u) {
  return {
    id: u.id,
    username: u.username,
    nama: u.nama,
    email: u.email,
    peran: u.peran,
    peranLabel: ROLE_LABELS[u.peran] || u.peran,
    harusGanti: !!u.harusGanti,
    permissions: permissionsFor_(u.peran)
  };
}

function permissionsFor_(role) {
  var out = [];
  Object.keys(PERMISSIONS).forEach(function (p) {
    if (PERMISSIONS[p].indexOf(role) >= 0) out.push(p);
  });
  return out;
}

function hasPerm_(user, perm) {
  return !!(user && PERMISSIONS[perm] && PERMISSIONS[perm].indexOf(user.peran) >= 0);
}

function requirePerm_(user, perm) {
  if (!hasPerm_(user, perm)) {
    logActivity_(user, 'AKSES_DITOLAK', 'Sistem', '', 'Mencoba aksi tanpa izin: ' + perm);
    fail_('Anda tidak memiliki izin untuk melakukan tindakan ini.', 'FORBIDDEN');
  }
}

function createSession_(user, method) {
  var token = randomToken_();
  var sess = { uid: user.id, ver: user.ver, created: new Date().getTime(), m: method || 'password' };
  CacheService.getScriptCache().put(sessionKey_(token), JSON.stringify(sess), APP.SESSION_IDLE_SECONDS);
  return token;
}

/** Memvalidasi token dan mengembalikan pengguna yang sedang login. */
function requireSession_(token) {
  if (!token || typeof token !== 'string' || token.length < 40 || token.length > 200) {
    fail_('Sesi tidak valid. Silakan login kembali.', 'AUTH');
  }
  var cache = CacheService.getScriptCache();
  var key = sessionKey_(token);
  var raw = cache.get(key);
  if (!raw) fail_('Sesi Anda telah berakhir. Silakan login kembali.', 'AUTH');
  var sess;
  try { sess = JSON.parse(raw); } catch (e) { fail_('Sesi tidak valid. Silakan login kembali.', 'AUTH'); }
  if (new Date().getTime() - sess.created > APP.SESSION_MAX_MS) {
    cache.remove(key);
    fail_('Sesi Anda telah melewati batas waktu maksimum. Silakan login kembali.', 'AUTH');
  }
  var user = getUserById_(sess.uid);
  if (!user || user.status !== 'AKTIF') {
    cache.remove(key);
    fail_('Akun Anda tidak aktif. Hubungi administrator.', 'AUTH');
  }
  if (user.ver !== sess.ver) {
    cache.remove(key);
    fail_('Kata sandi akun telah diubah. Silakan login kembali.', 'AUTH');
  }
  cache.put(key, raw, APP.SESSION_IDLE_SECONDS); // perpanjang sesi (sliding)
  var u = JSON.parse(JSON.stringify(user));
  u.label = user.nama + ' (' + user.username + ')';
  u._sessionKey = key;
  return u;
}

/* ------------------------------ LOGIN ------------------------------------ */

function login_(payload) {
  var username = norm_(payload.username).replace(/\s+/g, '');
  var password = String(payload.password || '');
  if (!username || !password) fail_('Username dan kata sandi wajib diisi.');
  if (username.length > 60 || password.length > 128) fail_('Username atau kata sandi salah.', 'AUTH_FAILED');

  var lockKey = 'LF:' + sha256Hex_(username);
  var fails = cacheGetJson_(lockKey) || { n: 0 };
  if (fails.n >= APP.LOGIN_MAX_FAIL) {
    fail_('Terlalu banyak percobaan login yang gagal. Akun dikunci sementara selama 15 menit.', 'LOCKED');
  }

  var t = readTable_(SHEETS.USERS);
  var row = null;
  for (var i = 0; i < t.rows.length; i++) {
    if (norm_(t.rows[i].username) === username) { row = t.rows[i]; break; }
  }
  var ok = false;
  if (row) {
    ok = verifyPassword_(password, row.hash);
  } else {
    // samakan waktu proses agar username tidak dapat ditebak dari lama respons
    pbkdf2_(password, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16], APP.PBKDF2_ITER);
  }
  if (!ok) {
    fails.n++;
    cachePutJson_(lockKey, fails, APP.LOGIN_LOCK_SECONDS);
    logActivity_({ label: username, peran: '-' }, 'LOGIN_GAGAL', 'Pengguna', row ? row.id : '', 'Percobaan ke-' + fails.n);
    fail_('Username atau kata sandi salah.', 'AUTH_FAILED');
  }
  if (String(row.status) !== 'AKTIF') {
    fail_('Akun Anda dinonaktifkan. Hubungi administrator.', 'AUTH_FAILED');
  }
  cacheRemove_(lockKey);
  try {
    t.sheet.getRange(row._row, t.map.loginTerakhir + 1).setValue(new Date());
  } catch (e) { /* tidak kritis */ }
  invalidateUsers_();
  var user = getUserById_(row.id);
  var token = createSession_(user, 'password');
  logActivity_({ label: user.nama + ' (' + user.username + ')', peran: user.peran }, 'LOGIN', 'Pengguna', user.id, 'Login dengan kata sandi');
  return { token: token, user: publicUser_(user) };
}

/** Login memakai akun Google — email dibaca di SERVER, bukan dari browser. */
function loginGoogle_() {
  var email = '';
  try { email = Session.getActiveUser().getEmail(); } catch (e) { email = ''; }
  if (!email) {
    fail_('Akun Google tidak terdeteksi. Fitur ini hanya tersedia bila web app dipasang untuk domain sekolah / akun Google. Silakan login dengan username dan kata sandi.', 'AUTH_FAILED');
  }
  var users = loadUsers_(true);
  var user = null;
  for (var i = 0; i < users.length; i++) {
    if (users[i].email && norm_(users[i].email) === norm_(email)) { user = users[i]; break; }
  }
  if (!user) fail_('Akun Google ' + email + ' belum terdaftar sebagai pengguna aplikasi.', 'AUTH_FAILED');
  if (user.status !== 'AKTIF') fail_('Akun Anda dinonaktifkan. Hubungi administrator.', 'AUTH_FAILED');
  var token = createSession_(user, 'google');
  logActivity_({ label: user.nama + ' (' + user.username + ')', peran: user.peran }, 'LOGIN', 'Pengguna', user.id, 'Login dengan akun Google');
  return { token: token, user: publicUser_(user) };
}

function logout_(user) {
  CacheService.getScriptCache().remove(user._sessionKey);
  logActivity_(user, 'LOGOUT', 'Pengguna', user.id, '');
  return { loggedOut: true };
}

/** Mengganti kata sandi sendiri. Sesi lain otomatis tidak berlaku. */
function changeOwnPassword_(user, p) {
  var oldPw = String(p.oldPassword || '');
  var newPw = String(p.newPassword || '');
  validatePasswordStrength_(newPw);
  if (oldPw === newPw) fail_('Kata sandi baru harus berbeda dari kata sandi lama.');
  return withLock_(function () {
    var t = readTable_(SHEETS.USERS);
    var row = findBy_(t, 'id', user.id);
    if (!row) fail_('Pengguna tidak ditemukan.', 'NOT_FOUND');
    if (!verifyPassword_(oldPw, row.hash)) fail_('Kata sandi lama tidak sesuai.');
    updateObject_(t, row._row, { hash: hashPassword_(newPw), harusGanti: false, diubahPada: new Date() });
    invalidateUsers_();
    CacheService.getScriptCache().remove(user._sessionKey);
    var fresh = getUserById_(user.id);
    var token = createSession_(fresh, 'password');
    logActivity_(user, 'GANTI_SANDI', 'Pengguna', user.id, 'Mengganti kata sandi sendiri');
    return { token: token, user: publicUser_(fresh) };
  });
}
