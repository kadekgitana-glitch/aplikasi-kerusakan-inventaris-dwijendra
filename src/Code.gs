/**
 * =============================================================================
 *  Code.gs — Titik Masuk Utama Google Apps Script Web App & API Dispatcher
 * =============================================================================
 *  Sistem Informasi Kerusakan Inventaris — SMK Dwijendra Denpasar
 * =============================================================================
 */

/**
 * Titik masuk rendering halaman Web App
 */
function doGet(e) {
  var template = HtmlService.createTemplateFromFile('Index');
  return template.evaluate()
    .setTitle('Sistem Informasi Kerusakan Inventaris — SMK Dwijendra Denpasar')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/**
 * Helper untuk menyertakan partial HTML/CSS/JS di template
 */
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

/**
 * Satu-satunya gerbang fungsi yang diekspos ke frontend (google.script.run).
 * Semua fungsi backend lainnya berakhiran "_" agar TIDAK dapat dipanggil langsung dari browser.
 */
function api(action, payload, token) {
  try {
    payload = payload || {};

    // 1. Aksi Publik (tanpa autentikasi)
    if (action === 'public.config') {
      return { ok: true, data: getPublicConfig_() };
    }
    if (action === 'auth.login') {
      return { ok: true, data: login_(payload) };
    }
    if (action === 'auth.loginGoogle') {
      return { ok: true, data: loginGoogle_() };
    }

    // 2. Aksi Terlindungi: Wajib Token Sesi Valid di Server
    var user = requireSession_(token);

    // 3. Routing Aksi
    var data = null;
    switch (action) {
      // --- AUTENTIKASI ---
      case 'auth.logout':
        data = logout_(user);
        break;
      case 'auth.changePassword':
        data = changeOwnPassword_(user, payload);
        break;
      case 'auth.me':
        data = { user: publicUser_(user) };
        break;

      // --- MASTER DATA ---
      case 'master.get':
        data = loadMaster_();
        break;
      case 'master.saveLokasi':
        requirePerm_(user, 'master.manage');
        data = saveLokasi_(user, payload);
        break;
      case 'master.saveBarang':
        requirePerm_(user, 'master.manage');
        data = saveBarang_(user, payload);
        break;
      case 'master.delete':
        requirePerm_(user, 'master.manage');
        data = deleteMaster_(user, payload);
        break;

      // --- DASHBOARD ---
      case 'dashboard.get':
        requirePerm_(user, 'dashboard.view');
        data = getDashboardData_(user, payload);
        break;

      // --- LAPORAN KERUSAKAN ---
      case 'laporan.list':
        requirePerm_(user, 'laporan.view');
        data = queryLaporan_(user, payload);
        break;
      case 'laporan.detail':
        requirePerm_(user, 'laporan.view');
        data = getLaporanDetail_(user, payload);
        break;
      case 'laporan.create':
        requirePerm_(user, 'laporan.create');
        data = createLaporan_(user, payload);
        break;
      case 'laporan.update':
        requirePerm_(user, 'laporan.update');
        data = updateLaporan_(user, payload);
        break;
      case 'laporan.repair':
        requirePerm_(user, 'laporan.repair');
        data = markRepaired_(user, payload);
        break;
      case 'laporan.followUp':
        requirePerm_(user, 'laporan.repair');
        data = addFollowUp_(user, payload);
        break;
      case 'laporan.archive':
        requirePerm_(user, 'laporan.archive');
        data = archiveLaporan_(user, payload);
        break;
      case 'laporan.restore':
        requirePerm_(user, 'laporan.restore');
        data = restoreLaporan_(user, payload);
        break;
      case 'laporan.delete':
        requirePerm_(user, 'laporan.delete');
        data = deleteLaporan_(user, payload);
        break;

      // --- FOTO DOKUMENTASI ---
      case 'foto.upload':
        requirePerm_(user, 'foto.upload');
        data = uploadFoto_(user, payload);
        break;
      case 'foto.detach':
        requirePerm_(user, 'foto.detach');
        data = detachFoto_(user, payload);
        break;
      case 'foto.get':
        requirePerm_(user, 'foto.view');
        data = getFoto_(user, payload);
        break;
      case 'foto.getBatch':
        requirePerm_(user, 'foto.view');
        data = getFotoBatch_(user, payload);
        break;

      // --- LAPORAN RESMI & EKSPOR ---
      case 'report.bulanan':
        requirePerm_(user, 'report.view');
        data = getLaporanBulananData_(user, payload);
        break;
      case 'report.tahunan':
        requirePerm_(user, 'report.view');
        data = getLaporanTahunanData_(user, payload);
        break;
      case 'report.archivePdf':
        requirePerm_(user, 'report.archivePdf');
        data = archiveReportPdf_(user, payload);
        break;

      // --- IMPOR EXCEL LAMA ---
      case 'import.preview':
        requirePerm_(user, 'import.run');
        data = previewExcelImport_(user, payload);
        break;
      case 'import.execute':
        requirePerm_(user, 'import.run');
        data = executeExcelImport_(user, payload);
        break;

      // --- PENGATURAN ---
      case 'settings.get':
        requirePerm_(user, 'settings.update');
        data = clientSettings_(loadSettings_());
        break;
      case 'settings.update':
        requirePerm_(user, 'settings.update');
        data = updateSettings_(user, payload);
        break;
      case 'settings.uploadLogo':
        requirePerm_(user, 'settings.update');
        data = uploadLogo_(user, payload);
        break;
      case 'settings.removeLogo':
        requirePerm_(user, 'settings.update');
        data = removeLogo_(user);
        break;

      // --- KELOLA PENGGUNA ---
      case 'users.list':
        requirePerm_(user, 'users.manage');
        data = listUsers_(user);
        break;
      case 'users.create':
        requirePerm_(user, 'users.manage');
        data = createUser_(user, payload);
        break;
      case 'users.update':
        requirePerm_(user, 'users.manage');
        data = updateUser_(user, payload);
        break;
      case 'users.resetPassword':
        requirePerm_(user, 'users.manage');
        data = resetUserPassword_(user, payload);
        break;

      // --- LOG AKTIVITAS ---
      case 'log.list':
        requirePerm_(user, 'log.view');
        data = listLog_(user, payload);
        break;

      // --- PENCADANGAN DATABASE ---
      case 'backup.create':
        requirePerm_(user, 'backup.manage');
        data = createBackupSnapshot_(user);
        break;
      case 'backup.list':
        requirePerm_(user, 'backup.manage');
        data = listBackups_(user);
        break;
      case 'backup.exportJson':
        requirePerm_(user, 'backup.manage');
        data = exportDatabaseJson_(user);
        break;

      default:
        fail_('Aksi API tidak dikenali: ' + action, 'NOT_FOUND');
    }

    return { ok: true, data: data };
  } catch (err) {
    console.error('API Error [' + action + ']: ' + (err.stack || err.message));
    return {
      ok: false,
      error: err.message || 'Terjadi kesalahan pada sistem.',
      code: err.appCode || 'SERVER_ERROR',
      fields: err.fields || null
    };
  }
}
