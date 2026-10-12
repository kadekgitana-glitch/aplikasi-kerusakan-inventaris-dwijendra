/**
 * =============================================================================
 *  Users.gs — Manajemen Pengguna oleh Administrator
 * =============================================================================
 *  Menyediakan fungsi:
 *  - Daftar pengguna dengan detail peran & status
 *  - Tambah pengguna baru dengan hash PBKDF2 & flag wajib ganti sandi
 *  - Edit profil, email, peran, dan status pengguna
 *  - Reset kata sandi dengan kata sandi acak sementara
 *  - Perlindungan anti-lockout (Admin tidak bisa menonaktifkan dirinya sendiri)
 * =============================================================================
 */

function listUsers_(user) {
  requirePerm_(user, 'users.manage');
  var users = loadUsers_(true);
  return users.map(function (u) {
    return {
      id: u.id,
      username: u.username,
      nama: u.nama,
      email: u.email,
      peran: u.peran,
      peranLabel: ROLE_LABELS[u.peran] || u.peran,
      status: u.status,
      harusGanti: u.harusGanti,
      loginTerakhir: u.loginTerakhir,
      dibuatPada: u.dibuatPada,
      isSelf: (u.id === user.id)
    };
  });
}

function createUser_(user, p) {
  requirePerm_(user, 'users.manage');
  var username = norm_(p.username).replace(/[^a-z0-9_.]/g, '');
  if (!username || username.length < 3) fail_('Username minimal 3 karakter huruf kecil/angka.');
  if (username.length > 30) fail_('Username maksimal 30 karakter.');

  var nama = cleanText_(p.nama, 100);
  if (!nama) fail_('Nama lengkap wajib diisi.');

  var email = cleanText_(p.email, 120);
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    fail_('Format email Google tidak valid.');
  }

  var peran = String(p.peran || '').toUpperCase();
  if (!ROLES[peran]) fail_('Peran pengguna tidak valid. Pilih: Administrator, Petugas Sarpras, atau Kepala Sekolah.');

  var password = p.password ? String(p.password) : generateTempPassword_();
  validatePasswordStrength_(password);

  return withLock_(function () {
    var t = readTable_(SHEETS.USERS);
    var existing = t.rows.filter(function (r) {
      return norm_(r.username) === username;
    });
    if (existing.length) fail_('Username "' + username + '" sudah digunakan.');

    var id = shortId_('USR');
    var now = new Date();
    var obj = {
      id: id,
      username: username,
      nama: nama,
      email: email,
      peran: peran,
      status: 'AKTIF',
      hash: hashPassword_(password),
      harusGanti: true, // Wajib ganti saat login pertama
      dibuatPada: now,
      loginTerakhir: '',
      diubahPada: now
    };

    appendObjects_(t, [obj]);
    invalidateUsers_();
    logActivity_(user, 'PENGGUNA', 'Pengguna', id, 'Menambah pengguna baru: ' + username + ' (' + ROLE_LABELS[peran] + ')');

    return {
      id: id,
      username: username,
      tempPassword: password,
      pesan: 'Pengguna ' + username + ' berhasil dibuat dengan kata sandi sementara: ' + password
    };
  });
}

function updateUser_(user, p) {
  requirePerm_(user, 'users.manage');
  var targetId = String(p.id || '');
  if (!targetId) fail_('ID pengguna wajib diisi.');

  var nama = cleanText_(p.nama, 100);
  if (!nama) fail_('Nama lengkap wajib diisi.');

  var email = cleanText_(p.email, 120);
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    fail_('Format email tidak valid.');
  }

  var peran = String(p.peran || '').toUpperCase();
  if (!ROLES[peran]) fail_('Peran tidak valid.');

  var status = p.status === 'NONAKTIF' ? 'NONAKTIF' : 'AKTIF';

  // Anti-lockout: Admin tidak boleh menonaktifkan atau mencabut peran admin dari dirinya sendiri
  if (targetId === user.id) {
    if (status !== 'AKTIF') fail_('Anda tidak dapat menonaktifkan akun Anda sendiri.');
    if (peran !== ROLES.ADMIN) fail_('Anda tidak dapat mengubah peran akun Anda sendiri.');
  }

  return withLock_(function () {
    var t = readTable_(SHEETS.USERS);
    var row = findBy_(t, 'id', targetId);
    if (!row) fail_('Pengguna tidak ditemukan.', 'NOT_FOUND');

    var patch = {
      nama: nama,
      email: email,
      peran: peran,
      status: status,
      diubahPada: new Date()
    };

    updateObject_(t, row._row, patch);
    invalidateUsers_();
    logActivity_(user, 'PENGGUNA', 'Pengguna', targetId, 'Memperbarui profil pengguna: ' + row.username + ' (' + status + ', ' + ROLE_LABELS[peran] + ')');

    return { sukses: true };
  });
}

function resetUserPassword_(user, p) {
  requirePerm_(user, 'users.manage');
  var targetId = String(p.id || '');
  if (!targetId) fail_('ID pengguna wajib diisi.');

  var newPassword = p.newPassword ? String(p.newPassword) : generateTempPassword_();
  validatePasswordStrength_(newPassword);

  return withLock_(function () {
    var t = readTable_(SHEETS.USERS);
    var row = findBy_(t, 'id', targetId);
    if (!row) fail_('Pengguna tidak ditemukan.', 'NOT_FOUND');

    var patch = {
      hash: hashPassword_(newPassword),
      harusGanti: true,
      diubahPada: new Date()
    };

    updateObject_(t, row._row, patch);
    invalidateUsers_();

    // Invalidate active sessions for this user by removing cache or verifying pwVer
    logActivity_(user, 'RESET_SANDI', 'Pengguna', targetId, 'Mereset kata sandi pengguna: ' + row.username);

    return {
      username: String(row.username),
      tempPassword: newPassword,
      pesan: 'Kata sandi pengguna ' + row.username + ' berhasil direset menjadi: ' + newPassword
    };
  });
}
