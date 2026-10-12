/**
 * =============================================================================
 *  Setup.gs — Inisialisasi Otomatis Database & Folder Google Drive
 * =============================================================================
 *  Fungsi setupAplikasi() dapat dijalankan dari editor Apps Script
 *  saat pertama kali memasang aplikasi.
 *
 *  Yang dikonfigurasi:
 *  1. Folder Google Drive:
 *     - Sistem Kerusakan Inventaris SMK Dwijendra/
 *       - Dokumentasi Kerusakan/
 *       - Dokumentasi Setelah Perbaikan/
 *       - Laporan PDF/
 *       - Cadangan Data/
 *       - Sistem/
 *  2. Google Spreadsheet Database dengan 7 Sheet:
 *     - Data Kerusakan
 *     - Foto Dokumentasi
 *     - Master Barang
 *     - Master Lokasi
 *     - Pengguna
 *     - Pengaturan
 *     - Log Aktivitas
 *  3. Format visual header sheet (Navy Blue #1e3a8a, Teks Putih Tebal, Freeze Baris 1)
 *  4. Data awal:
 *     - Master Lokasi bawaan SMK Dwijendra
 *     - Master Barang inventaris bawaan
 *     - Pengaturan bawaan (Kepala Sekolah, Wakasek, format laporan)
 *     - 3 Pengguna awal:
 *         * admin   / Admin1234!    (Administrator)
 *         * petugas / Petugas1234!  (Petugas Sarpras)
 *         * kepsek  / Kepsek1234!   (Kepala Sekolah)
 * =============================================================================
 */

function setupAplikasi() {
  var props = PropertiesService.getScriptProperties();

  // 1. Inisialisasi Folder Root Google Drive
  var rootFolder = null;
  var rootId = props.getProperty('FOLDER_ROOT_ID');
  if (rootId) {
    try { rootFolder = DriveApp.getFolderById(rootId); } catch (e) { rootFolder = null; }
  }
  if (!rootFolder) {
    var it = DriveApp.getFoldersByName(APP.FOLDER_ROOT);
    rootFolder = it.hasNext() ? it.next() : DriveApp.createFolder(APP.FOLDER_ROOT);
    props.setProperty('FOLDER_ROOT_ID', rootFolder.getId());
  }

  // Subfolder
  var subfolders = [
    APP.FOLDERS.KERUSAKAN,
    APP.FOLDERS.PERBAIKAN,
    APP.FOLDERS.LAPORAN,
    APP.FOLDERS.CADANGAN,
    APP.FOLDERS.SISTEM
  ];
  subfolders.forEach(function (name) {
    var key = 'FOLDER:' + name;
    var subIt = rootFolder.getFoldersByName(name);
    var subF = subIt.hasNext() ? subIt.next() : rootFolder.createFolder(name);
    props.setProperty(key, subF.getId());
  });

  // 2. Inisialisasi Google Spreadsheet Database
  var ss = null;
  var ssId = props.getProperty('SPREADSHEET_ID');
  if (ssId) {
    try { ss = SpreadsheetApp.openById(ssId); } catch (e) { ss = null; }
  }
  if (!ss) {
    var active = SpreadsheetApp.getActiveSpreadsheet();
    if (active) {
      ss = active;
    } else {
      // Cari di root folder
      var ssIt = rootFolder.getFilesByName(APP.SPREADSHEET_NAME);
      if (ssIt.hasNext()) {
        ss = SpreadsheetApp.open(ssIt.next());
      } else {
        ss = SpreadsheetApp.create(APP.SPREADSHEET_NAME);
        // Pindahkan file ss ke rootFolder
        var f = DriveApp.getFileById(ss.getId());
        rootFolder.addFile(f);
        DriveApp.getRootFolder().removeFile(f);
      }
    }
    props.setProperty('SPREADSHEET_ID', ss.getId());
  }

  // 3. Setup Struktur dan Header Tiap Sheet
  var sheetNames = [
    SHEETS.LAPORAN,
    SHEETS.FOTO,
    SHEETS.BARANG,
    SHEETS.LOKASI,
    SHEETS.USERS,
    SHEETS.SETTINGS,
    SHEETS.LOG
  ];

  sheetNames.forEach(function (sName) {
    var sh = ss.getSheetByName(sName);
    if (!sh) {
      sh = ss.insertSheet(sName);
    }

    var colDefs = SCHEMA[sName];
    var headers = colDefs.map(function (c) { return c[1]; });

    // Pastikan baris 1 berisi header
    var range = sh.getRange(1, 1, 1, headers.length);
    range.setValues([headers]);

    // Styling Header: Navy Blue (#1e3a8a), Bold White, Freeze row 1
    range.setBackground('#1e3a8a')
         .setFontColor('#ffffff')
         .setFontWeight('bold')
         .setFontSize(10)
         .setWrap(false)
         .setHorizontalAlignment('center')
         .setVerticalAlignment('middle');

    sh.setRowHeight(1, 35);
    sh.setFrozenRows(1);
  });

  // Hapus "Sheet1" default jika ada dan kosong
  var defaultSh = ss.getSheetByName('Sheet1') || ss.getSheetByName('Sheet 1');
  if (defaultSh && ss.getSheets().length > 1 && defaultSh.getLastRow() === 0) {
    try { ss.deleteSheet(defaultSh); } catch (e) { /* abaikan */ }
  }

  // 4. Isi Data Awal Master Lokasi
  var lokTable = readTable_(SHEETS.LOKASI);
  if (lokTable.rows.length === 0) {
    var lokRows = DEFAULT_LOKASI.map(function (l) {
      return {
        id: shortId_('LOK'),
        nama: l[0],
        jenis: l[1],
        status: 'AKTIF',
        dibuatPada: new Date()
      };
    });
    appendObjects_(lokTable, lokRows);
  }

  // 5. Isi Data Awal Master Barang
  var brgTable = readTable_(SHEETS.BARANG);
  if (brgTable.rows.length === 0) {
    var brgRows = DEFAULT_BARANG.map(function (b) {
      return {
        id: shortId_('BRG'),
        nama: b[0],
        kode: '',
        kategori: b[1],
        status: 'AKTIF',
        dibuatPada: new Date()
      };
    });
    appendObjects_(brgTable, brgRows);
  }

  // 6. Isi Pengaturan Awal
  var setTable = readTable_(SHEETS.SETTINGS);
  if (setTable.rows.length === 0) {
    var setRows = DEFAULT_SETTINGS.map(function (s) {
      return {
        kunci: s[0],
        nilai: s[1],
        keterangan: s[2]
      };
    });
    appendObjects_(setTable, setRows);
  }

  // 7. Buat Pengguna Awal
  var usrTable = readTable_(SHEETS.USERS);
  if (usrTable.rows.length === 0) {
    var now = new Date();
    var defaultUsers = [
      {
        id: shortId_('USR'),
        username: 'admin',
        nama: 'Administrator Sarpras',
        email: '',
        peran: ROLES.ADMIN,
        status: 'AKTIF',
        hash: hashPassword_('Admin1234!'),
        harusGanti: true,
        dibuatPada: now,
        loginTerakhir: '',
        diubahPada: now
      },
      {
        id: shortId_('USR'),
        username: 'petugas',
        nama: 'I Putu Kartika, S.Pd. (Wakasek Sarpras)',
        email: '',
        peran: ROLES.PETUGAS,
        status: 'AKTIF',
        hash: hashPassword_('Petugas1234!'),
        harusGanti: true,
        dibuatPada: now,
        loginTerakhir: '',
        diubahPada: now
      },
      {
        id: shortId_('USR'),
        username: 'kepsek',
        nama: 'Ida Ayu Estri Sanjiwani, S.E., M.Pd. (Kepala Sekolah)',
        email: '',
        peran: ROLES.KEPSEK,
        status: 'AKTIF',
        hash: hashPassword_('Kepsek1234!'),
        harusGanti: true,
        dibuatPada: now,
        loginTerakhir: '',
        diubahPada: now
      }
    ];
    appendObjects_(usrTable, defaultUsers);
  }

  // Catat log setup
  logActivity_(null, 'SETUP', 'Sistem', '', 'Inisialisasi sistem database dan struktur Google Drive selesai.');

  var hasil = {
    status: 'SUKSES',
    pesan: 'Inisialisasi Sistem Informasi Kerusakan Inventaris berhasil disiapkan!',
    spreadsheetUrl: ss.getUrl(),
    spreadsheetId: ss.getId(),
    folderDriveUrl: rootFolder.getUrl(),
    akunAwal: [
      { peran: 'Administrator', username: 'admin', sandi: 'Admin1234!' },
      { peran: 'Petugas Sarpras', username: 'petugas', sandi: 'Petugas1234!' },
      { peran: 'Kepala Sekolah', username: 'kepsek', sandi: 'Kepsek1234!' }
    ]
  };

  Logger.log(JSON.stringify(hasil, null, 2));
  return hasil;
}
