/**
 * =============================================================================
 *  Backup.gs — Pencadangan Database & Manajemen Backup di Google Drive
 * =============================================================================
 *  Menyediakan:
 *  - Pencadangan instan snapshot Google Spreadsheet ke folder Google Drive
 *    "Sistem Kerusakan Inventaris SMK Dwijendra/Cadangan Data/"
 *  - Daftar file cadangan yang tersedia di Google Drive
 *  - Ekspor format JSON lengkap untuk arsip mandiri di luar Google Workspace
 * =============================================================================
 */

function createBackupSnapshot_(user) {
  requirePerm_(user, 'backup.manage');

  var ss = getSs_();
  var backupFolder = getAppFolder_([APP.FOLDERS.CADANGAN]);
  var stamp = Utilities.formatDate(new Date(), APP.TZ, 'yyyyMMdd_HHmmss');
  var backupName = 'Backup_Database_Kerusakan_' + stamp;

  try {
    var ssFile = DriveApp.getFileById(ss.getId());
    var copiedFile = ssFile.makeCopy(backupName, backupFolder);

    logActivity_(user, 'CADANGAN', 'Sistem', copiedFile.getId(), 'Membuat cadangan database: ' + backupName);

    return {
      sukses: true,
      fileId: copiedFile.getId(),
      namaFile: backupName,
      waktu: fmtDateTime_(new Date()),
      pesan: 'Cadangan database berhasil disimpan di folder Cadangan Data di Google Drive.'
    };
  } catch (err) {
    fail_('Gagal membuat cadangan spreadsheet di Google Drive: ' + err.message, 'DRIVE_UNAVAILABLE');
  }
}

function listBackups_(user) {
  requirePerm_(user, 'backup.manage');
  var backupFolder = getAppFolder_([APP.FOLDERS.CADANGAN]);
  var files = backupFolder.getFiles();
  var list = [];

  while (files.hasNext()) {
    var f = files.next();
    if (!f.isTrashed()) {
      list.push({
        id: f.getId(),
        nama: f.getName(),
        ukuran: f.getSize(),
        dibuatPada: fmtDateTime_(f.getDateCreated()),
        url: f.getUrl()
      });
    }
  }

  list.sort(function (a, b) { return b.dibuatPada.localeCompare(a.dibuatPada); });
  return list.slice(0, 30);
}

/**
 * Ekspor cadangan JSON (seluruh tabel) untuk diunduh langsung oleh Administrator.
 */
function exportDatabaseJson_(user) {
  requirePerm_(user, 'backup.manage');

  var data = {
    waktuEkspor: fmtDateTime_(new Date()),
    dieksporOleh: user.label,
    aplikasi: APP.NAME,
    versi: APP.VERSION,
    tabel: {
      laporan: readTable_(SHEETS.LAPORAN).rows,
      foto: readTable_(SHEETS.FOTO).rows,
      barang: readTable_(SHEETS.BARANG).rows,
      lokasi: readTable_(SHEETS.LOKASI).rows,
      pengaturan: readTable_(SHEETS.SETTINGS).rows
    }
  };

  logActivity_(user, 'CADANGAN', 'Sistem', '', 'Mengekspor cadangan database format JSON');
  return data;
}
