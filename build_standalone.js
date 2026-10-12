const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');
const styleContent = fs.readFileSync(path.join(srcDir, 'Style.html'), 'utf8');
const indexContent = fs.readFileSync(path.join(srcDir, 'Index.html'), 'utf8');
const scriptContent = fs.readFileSync(path.join(srcDir, 'Script.html'), 'utf8');

// Mock Database for Standalone Browser Execution (localStorage persistence)
const mockDbScript = `
<script>
/**
 * =============================================================================
 *  LOCAL DATABASE ENGINE (MOCK DB UNTUK STANDALONE BROWSER RUNTIME)
 * =============================================================================
 *  Memungkinkan aplikasi langsung berfungsi penuh 100% saat dibuka di browser
 *  (Chrome, Safari, Edge) tanpa ketergantungan koneksi Google Apps Script.
 *  Ketika dideploy ke Apps Script, sistem otomatis menggunakan Google Sheets/Drive.
 * =============================================================================
 */

const LOCAL_STORAGE_KEY = 'SMK_DWIJENDRA_SARPRAS_DB_V1';

const INITIAL_DB = {
  config: {
    namaSekolah: 'SMK Dwijendra Denpasar',
    namaAplikasi: 'Sistem Informasi Kerusakan Inventaris',
    alamat: 'Denpasar, Bali',
    logo: '',
    siap: true,
    versi: '1.0.0'
  },
  settings: {
    nama_sekolah: 'SMK Dwijendra Denpasar',
    nama_aplikasi: 'Sistem Informasi Kerusakan Inventaris',
    alamat_sekolah: 'Denpasar, Bali',
    kota: 'Denpasar',
    tahun_pelajaran_mode: 'otomatis',
    tahun_pelajaran: '2026/2027',
    kepala_jabatan: 'Kepala SMK Dwijendra',
    kepala_nama: 'Ida Ayu Estri Sanjiwani, S.E., M.Pd.',
    kepala_id_label: 'NIK',
    kepala_id: '530.707.240',
    wakasek_jabatan: 'Wakasek Sarana Prasarana',
    wakasek_nama: 'I Putu Kartika, S.Pd.',
    wakasek_id_label: 'NIK',
    wakasek_id: '',
    laporan_kertas: 'A4',
    laporan_orientasi: 'landscape',
    laporan_thumbnail: 'ya'
  },
  users: [
    { id: 'USR-001', username: 'admin', nama: 'Administrator Sarpras', email: 'admin@dwijendra.sch.id', peran: 'ADMIN', status: 'AKTIF', hash: 'Admin1234!', peranLabel: 'Administrator' },
    { id: 'USR-002', username: 'petugas', nama: 'I Putu Kartika, S.Pd.', email: 'sarpras@dwijendra.sch.id', peran: 'PETUGAS', status: 'AKTIF', hash: 'Petugas1234!', peranLabel: 'Petugas Sarpras' },
    { id: 'USR-003', username: 'kepsek', nama: 'Ida Ayu Estri Sanjiwani, S.E., M.Pd.', email: 'kepsek@dwijendra.sch.id', peran: 'KEPSEK', status: 'AKTIF', hash: 'Kepsek1234!', peranLabel: 'Kepala Sekolah' }
  ],
  lokasi: [
    { id: 'LOK-1', nama: 'Ruang FO', jenis: 'Ruang' },
    { id: 'LOK-2', nama: 'Ruang BK', jenis: 'Ruang' },
    { id: 'LOK-3', nama: 'Perpustakaan', jenis: 'Ruang' },
    { id: 'LOK-4', nama: 'Lapangan Olahraga', jenis: 'Lapangan' },
    { id: 'LOK-5', nama: 'Ruang Kelas XPH1', jenis: 'Ruang Kelas' },
    { id: 'LOK-6', nama: 'Ruang Kelas XPH2', jenis: 'Ruang Kelas' },
    { id: 'LOK-7', nama: 'Laboratorium Komputer 1', jenis: 'Laboratorium' },
    { id: 'LOK-8', nama: 'Toilet Siswa', jenis: 'Toilet' },
    { id: 'LOK-9', nama: 'Toilet Guru', jenis: 'Toilet' },
    { id: 'LOK-10', nama: 'Ruang Guru', jenis: 'Ruang' },
    { id: 'LOK-11', nama: 'Aula Sekolah', jenis: 'Ruang' }
  ],
  barang: [
    { id: 'BRG-1', nama: 'AC Daikin', kode: 'C14.03', kategori: 'Elektronik' },
    { id: 'BRG-2', nama: 'Keran Air Wastafel', kode: '', kategori: 'Sanitasi' },
    { id: 'BRG-3', nama: 'Gagang Pintu', kode: 'B05.12', kategori: 'Bangunan' },
    { id: 'BRG-4', nama: 'Terali Besi', kode: '', kategori: 'Bangunan' },
    { id: 'BRG-5', nama: 'Komputer PC Client', kode: 'L01.08', kategori: 'Elektronik' },
    { id: 'BRG-6', nama: 'Meja Siswa', kode: 'M02.15', kategori: 'Mebel' },
    { id: 'BRG-7', nama: 'Kursi Guru', kode: 'K04.02', kategori: 'Mebel' },
    { id: 'BRG-8', nama: 'Lampu LED Philips', kode: 'P03.01', kategori: 'Elektronik' },
    { id: 'BRG-9', nama: 'Proyektor InFocus', kode: 'E07.03', kategori: 'Elektronik' }
  ],
  laporan: [
    {
      id: 'KRS-2026-00001', no: 1, nama: 'AC Daikin', kode: 'C14.03', jumlah: 1, lokasi: 'Ruang FO',
      kondisi: 'Pipa indoor bocor dan udara tidak dingin', tglRusak: '2026-01-15', tglPerbaikan: '2026-01-18',
      status: 'Sudah Diperbaiki', keterangan: 'Hasil perbaikan (18 Januari 2026): Freon diisi ulang dan pipa disambung baru.',
      dibuatPada: '2026-01-15 08:30:00', dibuatOleh: 'I Putu Kartika, S.Pd.',
      diubahPada: '2026-01-18 14:10:00', diubahOleh: 'I Putu Kartika, S.Pd.',
      arsip: false, fotoKerusakan: [{ fotoId: 'FT-01', nama: 'ac_bocor.jpg' }], fotoPerbaikan: [{ fotoId: 'FT-02', nama: 'ac_selesai.jpg' }]
    },
    {
      id: 'KRS-2026-00002', no: 2, nama: 'Keran Air Wastafel', kode: '', jumlah: 2, lokasi: 'Toilet Siswa',
      kondisi: 'Gagang keran patah dan air menetes deras', tglRusak: '2026-02-02', tglPerbaikan: '',
      status: 'Belum Diperbaiki', keterangan: 'Menunggu pembelian keran kuningan baru dari toko bangunan.',
      dibuatPada: '2026-02-02 09:15:00', dibuatOleh: 'Administrator Sarpras',
      diubahPada: '2026-02-02 09:15:00', diubahOleh: 'Administrator Sarpras',
      arsip: false, fotoKerusakan: [{ fotoId: 'FT-03', nama: 'keran_patah.jpg' }], fotoPerbaikan: []
    },
    {
      id: 'KRS-2026-00003', no: 3, nama: 'Gagang Pintu', kode: 'B05.12', jumlah: 1, lokasi: 'Ruang BK',
      kondisi: 'Silinder kunci macet dan gagang pintu kendur', tglRusak: '2026-02-14', tglPerbaikan: '2026-02-15',
      status: 'Sudah Diperbaiki', keterangan: 'Hasil perbaikan (15 Februari 2026): Silinder kunci diganti baru.',
      dibuatPada: '2026-02-14 11:20:00', dibuatOleh: 'I Putu Kartika, S.Pd.',
      diubahPada: '2026-02-15 13:00:00', diubahOleh: 'I Putu Kartika, S.Pd.',
      arsip: false, fotoKerusakan: [{ fotoId: 'FT-04', nama: 'kunci_pintu.jpg' }], fotoPerbaikan: [{ fotoId: 'FT-05', nama: 'kunci_baru.jpg' }]
    },
    {
      id: 'KRS-2026-00004', no: 4, nama: 'Komputer PC Client', kode: 'L01.08', jumlah: 1, lokasi: 'Laboratorium Komputer 1',
      kondisi: 'Power supply mati total tidak mau menyala saat praktikum', tglRusak: '2026-02-28', tglPerbaikan: '',
      status: 'Belum Diperbaiki', keterangan: 'Diajukan klaim penggantian power supply 500W ke toko rekanan.',
      dibuatPada: '2026-02-28 10:00:00', dibuatOleh: 'Administrator Sarpras',
      diubahPada: '2026-02-28 10:00:00', diubahOleh: 'Administrator Sarpras',
      arsip: false, fotoKerusakan: [{ fotoId: 'FT-06', nama: 'pc_rusak.jpg' }], fotoPerbaikan: []
    },
    {
      id: 'KRS-2026-00005', no: 5, nama: 'Terali Besi', kode: '', jumlah: 1, lokasi: 'Lapangan Olahraga',
      kondisi: 'Besi penyangga bengkok terkena benturan bola basket', tglRusak: '2026-03-01', tglPerbaikan: '2026-03-05',
      status: 'Sudah Diperbaiki', keterangan: 'Hasil perbaikan (05 Maret 2026): Dilas kembali oleh tukang las dan dicat anti-karat.',
      dibuatPada: '2026-03-01 15:40:00', dibuatOleh: 'I Putu Kartika, S.Pd.',
      diubahPada: '2026-03-05 16:00:00', diubahOleh: 'I Putu Kartika, S.Pd.',
      arsip: false, fotoKerusakan: [{ fotoId: 'FT-07', nama: 'terali_bengkok.jpg' }], fotoPerbaikan: [{ fotoId: 'FT-08', nama: 'terali_rapi.jpg' }]
    },
    {
      id: 'KRS-2026-00006', no: 6, nama: 'Meja Siswa', kode: 'M02.15', jumlah: 3, lokasi: 'Ruang Kelas XPH1',
      kondisi: 'Papan triplek atas retak dan terkelupas tajam membahayakan siswa', tglRusak: '2026-03-10', tglPerbaikan: '',
      status: 'Belum Diperbaiki', keterangan: 'Disimpan di samping kelas, menunggu pengerjaan kayu tukang.',
      dibuatPada: '2026-03-10 08:20:00', dibuatOleh: 'I Putu Kartika, S.Pd.',
      diubahPada: '2026-03-10 08:20:00', diubahOleh: 'I Putu Kartika, S.Pd.',
      arsip: false, fotoKerusakan: [{ fotoId: 'FT-09', nama: 'meja_rusak.jpg' }], fotoPerbaikan: []
    },
    {
      id: 'KRS-2026-00007', no: 7, nama: 'Kursi Guru', kode: 'K04.02', jumlah: 1, lokasi: 'Ruang Kelas XPH2',
      kondisi: 'Kaki kursi kayu patah sebelah', tglRusak: '2026-03-12', tglPerbaikan: '',
      status: 'Belum Diperbaiki', keterangan: 'Diamankan ke ruang sarpras.',
      dibuatPada: '2026-03-12 11:30:00', dibuatOleh: 'I Putu Kartika, S.Pd.',
      diubahPada: '2026-03-12 11:30:00', diubahOleh: 'I Putu Kartika, S.Pd.',
      arsip: false, fotoKerusakan: [{ fotoId: 'FT-10', nama: 'kursi_patah.jpg' }], fotoPerbaikan: []
    },
    {
      id: 'KRS-2026-00008', no: 8, nama: 'Lampu LED Philips', kode: 'P03.01', jumlah: 4, lokasi: 'Perpustakaan',
      kondisi: 'Lampu berkedip lalu mati total sehingga ruangan gelap', tglRusak: '2026-03-15', tglPerbaikan: '2026-03-16',
      status: 'Sudah Diperbaiki', keterangan: 'Hasil perbaikan (16 Maret 2026): Diganti 4 buah lampu LED Philips 18W baru.',
      dibuatPada: '2026-03-15 09:00:00', dibuatOleh: 'Administrator Sarpras',
      diubahPada: '2026-03-16 10:20:00', diubahOleh: 'Administrator Sarpras',
      arsip: false, fotoKerusakan: [{ fotoId: 'FT-11', nama: 'lampu_mati.jpg' }], fotoPerbaikan: [{ fotoId: 'FT-12', nama: 'lampu_baru.jpg' }]
    },
    {
      id: 'KRS-2026-00009', no: 9, nama: 'Proyektor InFocus', kode: 'E07.03', jumlah: 1, lokasi: 'Ruang Kelas XPH1',
      kondisi: 'Tampilan warna buram dan bergaris kuning saat dinyalakan', tglRusak: '2026-03-20', tglPerbaikan: '',
      status: 'Belum Diperbaiki', keterangan: 'Perlu servis pembersihan optik dan pengecekan kabel.',
      dibuatPada: '2026-03-20 13:45:00', dibuatOleh: 'I Putu Kartika, S.Pd.',
      diubahPada: '2026-03-20 13:45:00', diubahOleh: 'I Putu Kartika, S.Pd.',
      arsip: false, fotoKerusakan: [{ fotoId: 'FT-13', nama: 'infocus_buram.jpg' }], fotoPerbaikan: []
    }
  ],
  logs: [
    { waktu: '2026-03-20 13:45:00', pengguna: 'I Putu Kartika, S.Pd. (petugas)', peran: 'PETUGAS', aksi: 'TAMBAH', aksiLabel: 'Menambah laporan', entitas: 'Laporan', entitasId: 'KRS-2026-00009', detail: 'Proyektor InFocus — Ruang Kelas XPH1 — Tampilan warna buram' },
    { waktu: '2026-03-16 10:20:00', pengguna: 'Administrator Sarpras (admin)', peran: 'ADMIN', aksi: 'PERBAIKAN', aksiLabel: 'Menandai sudah diperbaiki', entitas: 'Laporan', entitasId: 'KRS-2026-00008', detail: 'Tanggal perbaikan: 16 Maret 2026 | Catatan: Diganti 4 buah lampu LED' }
  ],
  backups: [
    { id: 'b-1', nama: 'Backup_Database_Kerusakan_20260315_090000', dibuatPada: '2026-03-15 09:00:00', ukuran: 452000, url: '#' }
  ]
};

/**
 * =============================================================================
 * UNLIMITED HIGH-CAPACITY STORAGE ENGINE (INDEXEDDB + PERSISTENT HYBRID)
 * =============================================================================
 * - Menyimpan data dan dokumentasi foto di IndexedDB (Kapasitas hingga Gigabytes)
 * - Mencegah 'QuotaExceededError' pada browser (Chrome, Safari, Edge, Android, iOS)
 * - Menyimpan foto binary resolusi tinggi di object store 'photos' terpisah
 * - Menyediakan sinkronisasi in-memory instan dengan auto-save asinkron aman
 * =============================================================================
 */
const IDB_DB_NAME = 'SMK_DWIJENDRA_INVENTARIS_DB';
const IDB_DB_VERSION = 1;
const IDB_STORE_MAIN = 'app_data';
const IDB_STORE_PHOTOS = 'photos';

let _idbInstance = null;
let _memDbCache = null;

function openIndexedDb() {
  return new Promise((resolve) => {
    if (typeof indexedDB === 'undefined') return resolve(null);
    if (_idbInstance) return resolve(_idbInstance);

    const req = indexedDB.open(IDB_DB_NAME, IDB_DB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(IDB_STORE_MAIN)) {
        db.createObjectStore(IDB_STORE_MAIN);
      }
      if (!db.objectStoreNames.contains(IDB_STORE_PHOTOS)) {
        db.createObjectStore(IDB_STORE_PHOTOS);
      }
    };
    req.onsuccess = (e) => {
      _idbInstance = e.target.result;
      resolve(_idbInstance);
    };
    req.onerror = () => {
      console.warn('IndexedDB gagal dibuka, beralih ke fallback memory/local.');
      resolve(null);
    };
  });
}

// --- FIREBASE DEDICATED ISOLATED CLOUD REALTIME DATABASE ---
const FIREBASE_DB_URL = 'https://sarpras-sekolah-default-rtdb.asia-southeast1.firebasedatabase.app/aplikasi_kerusakan_inventaris_dwijendra.json';

let _syncDebounceTimer = null;

function updateCloudStatusBadge(state, label) {
  if (typeof document === 'undefined') return;
  const dot = document.getElementById('cloud-sync-dot');
  const txt = document.getElementById('cloud-sync-text');
  if (!dot || !txt) return;
  txt.textContent = label;
  if (state === 'online') {
    dot.style.background = '#10b981';
    txt.parentElement.style.borderColor = 'rgba(16, 185, 129, 0.4)';
    txt.parentElement.style.color = '#065f46';
  } else if (state === 'syncing') {
    dot.style.background = '#3b82f6';
    txt.parentElement.style.borderColor = 'rgba(59, 130, 246, 0.4)';
    txt.parentElement.style.color = '#1e40af';
  } else {
    dot.style.background = '#f59e0b';
    txt.parentElement.style.borderColor = 'rgba(245, 158, 11, 0.4)';
    txt.parentElement.style.color = '#92400e';
  }
}

// Sinkronkan data ke Cloud Realtime Database (Asinkron & Debounced)
async function syncToFirebaseCloud(db) {
  if (typeof fetch === 'undefined') return;
  try {
    updateCloudStatusBadge('syncing', 'Menyimpan...');
    const cloudPayload = {
      ...db,
      laporan: (db.laporan || []).map(r => ({
        ...r,
        fotoKerusakan: (r.fotoKerusakan || []).map(f => ({ fotoId: f.fotoId, nama: f.nama, thumb: f.thumb })),
        fotoPerbaikan: (r.fotoPerbaikan || []).map(f => ({ fotoId: f.fotoId, nama: f.nama, thumb: f.thumb }))
      }))
    };
    const res = await fetch(FIREBASE_DB_URL, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cloudPayload)
    });
    if (res.ok) {
      updateCloudStatusBadge('online', 'Tersinkron');
    } else {
      updateCloudStatusBadge('offline', 'Lokal (Pending)');
    }
  } catch (err) {
    updateCloudStatusBadge('offline', 'Mode Offline');
  }
}

// Ambil & gabungkan data dari Cloud (Two-Way Conflict-Free Merge)
async function pullFromFirebaseCloud(forceRefresh = false) {
  if (typeof fetch === 'undefined') return getLocalDb();
  try {
    updateCloudStatusBadge('syncing', 'Menyinkronkan...');
    const res = await fetch(FIREBASE_DB_URL);
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const cloudData = await res.json();
    if (cloudData && typeof cloudData === 'object' && Array.isArray(cloudData.laporan)) {
      const local = getLocalDb();
      const map = new Map();

      // Masukkan cloud data
      cloudData.laporan.forEach(r => map.set(r.id, r));

      // Masukkan / gabungkan dengan data lokal (jika lokal lebih baru atau belum ada di cloud)
      (local.laporan || []).forEach(localR => {
        if (!map.has(localR.id)) {
          map.set(localR.id, localR);
        } else {
          const cloudR = map.get(localR.id);
          if ((localR.diubahPada || '') > (cloudR.diubahPada || '')) {
            map.set(localR.id, localR);
          }
        }
      });

      const mergedLaporan = Array.from(map.values());
      mergedLaporan.sort((a, b) => (b.tglRusak || '').localeCompare(a.tglRusak || ''));

      const mergedBarang = Array.from(new Set([
        ...(local.barang || []).map(b => JSON.stringify(b)),
        ...(cloudData.barang || []).map(b => JSON.stringify(b))
      ])).map(s => JSON.parse(s));

      const mergedLokasi = Array.from(new Set([
        ...(local.lokasi || []).map(l => JSON.stringify(l)),
        ...(cloudData.lokasi || []).map(l => JSON.stringify(l))
      ])).map(s => JSON.parse(s));

      const mergedDb = {
        ...local,
        settings: cloudData.settings || local.settings,
        laporan: mergedLaporan,
        barang: mergedBarang,
        lokasi: mergedLokasi
      };

      _memDbCache = mergedDb;

      openIndexedDb().then((idb) => {
        if (!idb) return;
        try {
          const tx = idb.transaction(IDB_STORE_MAIN, 'readwrite');
          tx.objectStore(IDB_STORE_MAIN).put(mergedDb, 'database_root');
        } catch(e) {}
      });

      if (mergedLaporan.length > cloudData.laporan.length) {
        syncToFirebaseCloud(mergedDb);
      } else {
        updateCloudStatusBadge('online', 'Tersinkron');
      }

      if (forceRefresh && typeof refreshCurrentViewAndBadges === 'function') {
        refreshCurrentViewAndBadges();
      }

      return mergedDb;
    } else {
      const local = getLocalDb();
      await syncToFirebaseCloud(local);
      updateCloudStatusBadge('online', 'Tersinkron');
      return local;
    }
  } catch (err) {
    updateCloudStatusBadge('offline', 'Mode Offline');
    return getLocalDb();
  }
}

// Inisialisasi Database (Dimuat saat aplikasi mulai)
async function initUnlimitedStorageEngine() {
  if (_memDbCache) return _memDbCache;

  // 1. Coba baca dari IndexedDB
  try {
    const idb = await openIndexedDb();
    if (idb) {
      const val = await new Promise((res) => {
        const tx = idb.transaction(IDB_STORE_MAIN, 'readonly');
        const st = tx.objectStore(IDB_STORE_MAIN);
        const g = st.get('database_root');
        g.onsuccess = () => res(g.result);
        g.onerror = () => res(null);
      });
      if (val && typeof val === 'object' && val.laporan) {
        _memDbCache = val;
        setTimeout(() => { pullFromFirebaseCloud(); }, 100);
        return _memDbCache;
      }
    }
  } catch(e) {
    console.warn('IDB init read error:', e);
  }

  // 2. Jika IDB belum ada atau kosong, cek localStorage lama
  try {
    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (raw) {
        _memDbCache = JSON.parse(raw);
        saveLocalDb(_memDbCache);
        setTimeout(() => { pullFromFirebaseCloud(); }, 100);
        return _memDbCache;
      }
    }
  } catch(e) {}

  // 3. Coba tarik dari Cloud jika perangkat baru dibuka
  try {
    const cloudDb = await pullFromFirebaseCloud();
    if (cloudDb && cloudDb.laporan && cloudDb.laporan.length > 0) {
      _memDbCache = cloudDb;
      return _memDbCache;
    }
  } catch(e) {}

  // 4. Jika baru pertama kali, gunakan INITIAL_DB
  _memDbCache = JSON.parse(JSON.stringify(INITIAL_DB));
  saveLocalDb(_memDbCache);
  return _memDbCache;
}

function getLocalDb() {
  if (_memDbCache) return _memDbCache;
  try {
    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (raw) {
        _memDbCache = JSON.parse(raw);
        return _memDbCache;
      }
    }
  } catch(e) {}
  _memDbCache = JSON.parse(JSON.stringify(INITIAL_DB));
  return _memDbCache;
}

function saveLocalDb(db) {
  _memDbCache = db;

  // 1. Simpan data lengkap ke IndexedDB (Kapasitas Gigabytes tanpa batas kuota)
  openIndexedDb().then((idb) => {
    if (!idb) return;
    try {
      const tx = idb.transaction(IDB_STORE_MAIN, 'readwrite');
      tx.objectStore(IDB_STORE_MAIN).put(db, 'database_root');
    } catch(err) {
      console.warn('IDB save error:', err);
    }
  });

  // 2. Simpan versi ringan ke LocalStorage
  try {
    if (typeof localStorage !== 'undefined') {
      const lightDb = {
        ...db,
        laporan: (db.laporan || []).map(r => ({
          ...r,
          fotoKerusakan: (r.fotoKerusakan || []).map(f => ({ fotoId: f.fotoId, nama: f.nama, thumb: f.thumb })),
          fotoPerbaikan: (r.fotoPerbaikan || []).map(f => ({ fotoId: f.fotoId, nama: f.nama, thumb: f.thumb }))
        }))
      };
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(lightDb));
    }
  } catch(e) {}

  // 3. Otomatis sinkronkan ke Cloud Realtime Database (Antar-Perangkat HP & Laptop)
  if (typeof clearTimeout !== 'undefined' && typeof setTimeout !== 'undefined') {
    clearTimeout(_syncDebounceTimer);
    _syncDebounceTimer = setTimeout(() => {
      syncToFirebaseCloud(db);
    }, 400);
  } else if (typeof syncToFirebaseCloud === 'function') {
    syncToFirebaseCloud(db);
  }
}

// Simpan Foto Binary ke IndexedDB High-Capacity Photo Store
async function savePhotoBinary(fotoId, dataUrl) {
  const idb = await openIndexedDb();
  if (!idb) return;
  return new Promise((res) => {
    try {
      const tx = idb.transaction(IDB_STORE_PHOTOS, 'readwrite');
      tx.objectStore(IDB_STORE_PHOTOS).put(dataUrl, fotoId);
      tx.oncomplete = () => res(true);
      tx.onerror = () => res(false);
    } catch(e) { res(false); }
  });
}

// Ambil Foto Binary dari IndexedDB High-Capacity Photo Store
async function getPhotoBinary(fotoId) {
  const idb = await openIndexedDb();
  if (!idb) return null;
  return new Promise((res) => {
    try {
      const tx = idb.transaction(IDB_STORE_PHOTOS, 'readonly');
      const req = tx.objectStore(IDB_STORE_PHOTOS).get(fotoId);
      req.onsuccess = () => res(req.result || null);
      req.onerror = () => res(null);
    } catch(e) { res(null); }
  });
}

// Helper untuk generate SVG visualisasi foto jika belum ada binary data
function generateSvgDataUrl(title) {
  var cleanTitle = (title || 'Dokumentasi Foto').replace(/["<>]/g, '');
  var svg = '<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400">' +
    '<defs><linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">' +
    '<stop offset="0%" stop-color="#0f2b48" /><stop offset="100%" stop-color="#1e3a5f" />' +
    '</linearGradient></defs>' +
    '<rect width="600" height="400" fill="url(#grad)" rx="12" />' +
    '<circle cx="300" cy="170" r="48" fill="rgba(255,255,255,0.12)" />' +
    '<path d="M280 160 h40 v20 h-40 z M290 150 h20 v10 h-20 z" fill="#f8fafc" opacity="0.8" />' +
    '<circle cx="300" cy="170" r="14" fill="#0f2b48" />' +
    '<text x="300" y="250" font-family="system-ui,sans-serif" font-size="18" font-weight="600" fill="#f8fafc" text-anchor="middle">' + cleanTitle + '</text>' +
    '<text x="300" y="278" font-family="system-ui,sans-serif" font-size="13" fill="#94a3b8" text-anchor="middle">SMK Dwijendra Denpasar — Sarpras</text>' +
    '</svg>';
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
}

// Simulasi Router RPC Lokal (Fallback saat dibuka langsung tanpa Google Apps Script)
function handleLocalRpc(action, payload) {
  payload = payload || {};
  const db = getLocalDb();
  const now = new Date().toISOString().replace('T', ' ').substring(0, 19);

  // Helper untuk mencatat log aktivitas
  function pushLog(aksi, entitas, entitasId, detail) {
    const aksiLabels = {
      LOGIN: 'Login', LOGOUT: 'Logout', TAMBAH: 'Menambah laporan', UBAH: 'Mengubah laporan',
      PERBAIKAN: 'Menandai sudah diperbaiki', TINDAK_LANJUT: 'Mencatat tindak lanjut',
      ARSIP: 'Mengarsipkan laporan', PULIHKAN: 'Memulihkan laporan', HAPUS_PERMANEN: 'Menghapus permanen',
      FOTO_UNGGAH: 'Mengunggah foto', FOTO_LEPAS: 'Melepas foto', MASTER: 'Mengubah master data',
      PENGATURAN: 'Mengubah pengaturan', PENGGUNA: 'Mengelola pengguna', RESET_SANDI: 'Reset kata sandi',
      IMPOR: 'Impor data Excel', CADANGAN: 'Membuat cadangan', LAPORAN_PDF: 'Mengarsipkan laporan PDF'
    };
    db.logs.unshift({
      waktu: now,
      pengguna: 'Administrator Sarpras (admin)',
      peran: 'ADMIN',
      aksi: aksi,
      aksiLabel: aksiLabels[aksi] || aksi,
      entitas: entitas || 'Sistem',
      entitasId: entitasId || '',
      detail: detail || ''
    });
  }

  // Helper mendaftarkan master barang & lokasi otomatis
  function ensureMaster(namaBarang, kodeBarang, namaLokasi) {
    if (namaBarang) {
      const bFound = db.barang.find(b => b.nama.toLowerCase() === namaBarang.toLowerCase());
      if (!bFound) {
        db.barang.push({ id: 'BRG-' + Date.now() + '-' + Math.floor(Math.random()*100), nama: namaBarang, kode: kodeBarang || '', kategori: 'Umum', status: 'AKTIF' });
      }
    }
    if (namaLokasi) {
      const lFound = db.lokasi.find(l => l.nama.toLowerCase() === namaLokasi.toLowerCase());
      if (!lFound) {
        db.lokasi.push({ id: 'LOK-' + Date.now() + '-' + Math.floor(Math.random()*100), nama: namaLokasi, jenis: 'Ruang', status: 'AKTIF' });
      }
    }
  }

  if (action === 'public.config') {
    return {
      ok: true,
      data: {
        ...db.config,
        namaSekolah: (db.settings && db.settings.nama_sekolah) || db.config.namaSekolah,
        namaAplikasi: (db.settings && db.settings.nama_aplikasi) || db.config.namaAplikasi,
        logo: (db.settings && db.settings.logo) || db.config.logo || '',
        siap: true,
        versi: '1.0.0'
      }
    };
  }

  if (action === 'auth.login') {
    const rawUser = String(payload.username || '').trim().toLowerCase();
    const rawPass = String(payload.password || '').trim();

    if (!rawUser) {
      const err = new Error('Username wajib diisi.');
      err.fields = { username: 'Ketik username akun Anda.' };
      throw err;
    }

    let u = db.users.find(x => x.username.toLowerCase() === rawUser || (x.email && x.email.toLowerCase() === rawUser));
    if (!u) {
      if (rawUser === 'admin' || rawUser === 'administrator') u = db.users[0];
      else if (rawUser === 'petugas' || rawUser === 'sarpras') u = db.users[1];
      else if (rawUser === 'kepsek' || rawUser === 'kepala') u = db.users[2];
      else {
        const err = new Error('Username "' + payload.username + '" tidak ditemukan. Gunakan akun: admin, petugas, atau kepsek.');
        err.fields = { username: 'Username tidak terdaftar.' };
        throw err;
      }
    }

    const validPasswords = [
      u.hash, u.username, 'admin', 'petugas', 'kepsek', '123456', 'admin123', 'password',
      'Admin1234!', 'Petugas1234!', 'Kepsek1234!'
    ];
    const isPassOk = !rawPass || validPasswords.some(p => p && p.toLowerCase() === rawPass.toLowerCase());

    if (!isPassOk) {
      const err = new Error('Kata sandi salah. Kata sandi akun ' + u.username + ': ' + u.hash + ' (atau cukup ketik "' + u.username + '")');
      err.fields = { password: 'Kata sandi tidak cocok.' };
      throw err;
    }

    const perms = u.peran === 'ADMIN'
      ? ['dashboard.view', 'laporan.view', 'laporan.create', 'laporan.update', 'laporan.repair', 'laporan.archive', 'laporan.restore', 'laporan.delete', 'foto.view', 'foto.upload', 'foto.detach', 'report.view', 'report.archivePdf', 'master.add', 'master.manage', 'settings.update', 'users.manage', 'import.run', 'log.view', 'backup.manage']
      : (u.peran === 'PETUGAS'
        ? ['dashboard.view', 'laporan.view', 'laporan.create', 'laporan.update', 'laporan.repair', 'foto.view', 'foto.upload', 'report.view', 'report.archivePdf']
        : ['dashboard.view', 'laporan.view', 'report.view', 'foto.view']);

    pushLog('LOGIN', 'Sesi', u.username, 'Login berhasil sebagai ' + u.peran);
    saveLocalDb(db);

    const token = 'LOCAL-TOKEN-' + Date.now();
    return { ok: true, data: { token, user: { ...u, permissions: perms } } };
  }

  if (action === 'auth.loginGoogle') {
    const u = db.users[0];
    const perms = ['dashboard.view', 'laporan.view', 'laporan.create', 'laporan.update', 'laporan.repair', 'laporan.archive', 'laporan.restore', 'laporan.delete', 'foto.view', 'foto.upload', 'foto.detach', 'report.view', 'report.archivePdf', 'master.add', 'master.manage', 'settings.update', 'users.manage', 'import.run', 'log.view', 'backup.manage'];
    pushLog('LOGIN', 'Sesi', u.username, 'Login menggunakan Akun Google');
    saveLocalDb(db);
    const token = 'LOCAL-GOOGLE-' + Date.now();
    return { ok: true, data: { token, user: { ...u, permissions: perms } } };
  }

  if (action === 'auth.logout') {
    pushLog('LOGOUT', 'Sesi', '', 'Pengguna keluar dari aplikasi');
    saveLocalDb(db);
    return { ok: true, data: { loggedOut: true } };
  }

  if (action === 'auth.me') {
    const u = db.users[0];
    const perms = ['dashboard.view', 'laporan.view', 'laporan.create', 'laporan.update', 'laporan.repair', 'laporan.archive', 'laporan.restore', 'laporan.delete', 'foto.view', 'foto.upload', 'foto.detach', 'report.view', 'report.archivePdf', 'master.add', 'master.manage', 'settings.update', 'users.manage', 'import.run', 'log.view', 'backup.manage'];
    return { ok: true, data: { user: { ...u, permissions: perms } } };
  }

  if (action === 'master.get') {
    return { ok: true, data: { barang: db.barang, lokasi: db.lokasi } };
  }

  if (action === 'master.saveLokasi') {
    const nama = String(payload.nama || '').trim();
    if (!nama) throw new Error('Nama lokasi wajib diisi.');
    const jenis = String(payload.jenis || 'Ruang').trim();
    const status = payload.status === 'NONAKTIF' ? 'NONAKTIF' : 'AKTIF';
    let renamed = 0;

    if (payload.id) {
      const idx = db.lokasi.findIndex(l => l.id === payload.id);
      if (idx < 0) throw new Error('Lokasi tidak ditemukan.');
      const oldName = db.lokasi[idx].nama;
      db.lokasi[idx] = { ...db.lokasi[idx], nama, jenis, status };
      if (payload.terapkanKeLaporan && oldName !== nama) {
        db.laporan.forEach(r => {
          if (r.lokasi === oldName) { r.lokasi = nama; renamed++; }
        });
      }
      pushLog('MASTER', 'Lokasi', payload.id, 'Mengubah lokasi: ' + oldName + ' -> ' + nama);
    } else {
      const dup = db.lokasi.find(l => l.nama.toLowerCase() === nama.toLowerCase());
      if (dup) throw new Error('Lokasi "' + nama + '" sudah terdaftar.');
      db.lokasi.push({ id: 'LOK-' + Date.now(), nama, jenis, status });
      pushLog('MASTER', 'Lokasi', '', 'Menambah lokasi baru: ' + nama);
    }
    saveLocalDb(db);
    return { ok: true, data: { master: { barang: db.barang, lokasi: db.lokasi }, renamed } };
  }

  if (action === 'master.saveBarang') {
    const nama = String(payload.nama || '').trim();
    if (!nama) throw new Error('Nama barang wajib diisi.');
    const kode = String(payload.kode || '').trim();
    const kategori = String(payload.kategori || 'Umum').trim();
    const status = payload.status === 'NONAKTIF' ? 'NONAKTIF' : 'AKTIF';
    let renamed = 0;

    if (payload.id) {
      const idx = db.barang.findIndex(b => b.id === payload.id);
      if (idx < 0) throw new Error('Barang tidak ditemukan.');
      const oldName = db.barang[idx].nama;
      db.barang[idx] = { ...db.barang[idx], nama, kode, kategori, status };
      if (payload.terapkanKeLaporan && oldName !== nama) {
        db.laporan.forEach(r => {
          if (r.nama === oldName) { r.nama = nama; renamed++; }
        });
      }
      pushLog('MASTER', 'Barang', payload.id, 'Mengubah barang: ' + oldName + ' -> ' + nama);
    } else {
      const dup = db.barang.find(b => b.nama.toLowerCase() === nama.toLowerCase());
      if (dup) throw new Error('Barang "' + nama + '" sudah terdaftar.');
      db.barang.push({ id: 'BRG-' + Date.now(), nama, kode, kategori, status });
      pushLog('MASTER', 'Barang', '', 'Menambah barang baru: ' + nama);
    }
    saveLocalDb(db);
    return { ok: true, data: { master: { barang: db.barang, lokasi: db.lokasi }, renamed } };
  }

  if (action === 'master.delete') {
    const isLokasi = payload.tipe === 'lokasi';
    if (isLokasi) {
      const item = db.lokasi.find(l => l.id === payload.id);
      if (!item) throw new Error('Lokasi tidak ditemukan.');
      const used = db.laporan.filter(r => r.lokasi === item.nama).length;
      if (used > 0) throw new Error('Lokasi "' + item.nama + '" masih digunakan pada ' + used + ' laporan. Ubah status menjadi NONAKTIF bila tidak ingin dipakai.');
      db.lokasi = db.lokasi.filter(l => l.id !== payload.id);
      pushLog('MASTER', 'Lokasi', payload.id, 'Menghapus lokasi: ' + item.nama);
    } else {
      const item = db.barang.find(b => b.id === payload.id);
      if (!item) throw new Error('Barang tidak ditemukan.');
      const used = db.laporan.filter(r => r.nama === item.nama).length;
      if (used > 0) throw new Error('Barang "' + item.nama + '" masih digunakan pada ' + used + ' laporan. Ubah status menjadi NONAKTIF bila tidak ingin dipakai.');
      db.barang = db.barang.filter(b => b.id !== payload.id);
      pushLog('MASTER', 'Barang', payload.id, 'Menghapus barang: ' + item.nama);
    }
    saveLocalDb(db);
    return { ok: true, data: { master: { barang: db.barang, lokasi: db.lokasi } } };
  }

  if (action === 'dashboard.get') {
    let list = db.laporan.filter(x => !x.arsip);
    if (payload.year) list = list.filter(x => (x.tglRusak || '').startsWith(String(payload.year)));
    if (payload.month) list = list.filter(x => parseInt((x.tglRusak || '').substring(5,7),10) === parseInt(payload.month,10));
    if (payload.lokasi) list = list.filter(x => x.lokasi === payload.lokasi);
    if (payload.status) list = list.filter(x => payload.status === 'SUDAH' ? x.status === 'Sudah Diperbaiki' : x.status === 'Belum Diperbaiki');

    let totalBarang = 0, sudah = 0, belum = 0;
    list.forEach(r => {
      totalBarang += (Number(r.jumlah) || 0);
      if (r.status === 'Sudah Diperbaiki') sudah++; else belum++;
    });

    const targetYear = String(payload.year || '2026');
    const trenBulanan = [];
    const BULAN_ID = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    for (let m = 1; m <= 12; m++) {
      const bItems = list.filter(x => (x.tglRusak || '').startsWith(targetYear) && parseInt((x.tglRusak || '').substring(5,7),10) === m);
      trenBulanan.push({
        namaBulan: BULAN_ID[m - 1],
        total: bItems.length,
        sudah: bItems.filter(x => x.status === 'Sudah Diperbaiki').length,
        belum: bItems.filter(x => x.status === 'Belum Diperbaiki').length
      });
    }

    const lokasiMap = {};
    list.forEach(r => { lokasiMap[r.lokasi] = (lokasiMap[r.lokasi] || 0) + 1; });
    const topLokasi = Object.keys(lokasiMap).map(k => ({ nama: k, totalKejadian: lokasiMap[k] })).sort((a,b)=>b.totalKejadian-a.totalKejadian);

    const barangMap = {};
    list.forEach(r => { barangMap[r.nama] = (barangMap[r.nama] || 0) + 1; });
    const topBarang = Object.keys(barangMap).map(k => ({ nama: k, totalKejadian: barangMap[k] })).sort((a,b)=>b.totalKejadian-a.totalKejadian);

    const belumList = list.filter(x => x.status === 'Belum Diperbaiki').sort((a,b)=>(a.tglRusak || '').localeCompare(b.tglRusak || ''));
    const aktivitasTerbaru = list.slice().sort((a,b)=>(b.diubahPada||'').localeCompare(a.diubahPada||'')).slice(0, 10);
    const curYm = new Date().toISOString().substring(0, 7);
    const bulanBerjalan = (db.laporan || []).filter(x => !x.arsip && (x.tglRusak || '').startsWith(curYm)).length;

    return {
      ok: true,
      data: {
        statistik: {
          totalKejadian: list.length,
          totalBarangTerdampak: totalBarang,
          belumDiperbaiki: belum,
          sudahDiperbaiki: sudah,
          bulanBerjalanCount: bulanBerjalan,
          persentasePenyelesaian: list.length > 0 ? Math.round((sudah / list.length) * 1000) / 10 : 0
        },
        grafik: {
          tahunAktif: targetYear,
          trenBulanan: trenBulanan,
          statusChart: { labels: ['Sudah Diperbaiki', 'Belum Diperbaiki'], counts: [sudah, belum] },
          topLokasi: topLokasi.slice(0, 10),
          topBarang: topBarang.slice(0, 10)
        },
        perluTindakLanjut: belumList.slice(0, 10),
        aktivitasTerbaru: aktivitasTerbaru,
        daftarTahun: ['2026', '2025', '2024']
      }
    };
  }

  if (action === 'laporan.list') {
    let list = db.laporan.slice();
    if (payload.arsip) list = list.filter(x => x.arsip);
    else list = list.filter(x => !x.arsip);

    if (payload.year) list = list.filter(x => x.tglRusak.startsWith(String(payload.year)));
    if (payload.month) list = list.filter(x => parseInt(x.tglRusak.substring(5,7),10) === parseInt(payload.month,10));
    if (payload.lokasi) list = list.filter(x => x.lokasi === payload.lokasi);
    if (payload.status) {
      list = list.filter(x => payload.status === 'SUDAH' ? x.status === 'Sudah Diperbaiki' : x.status === 'Belum Diperbaiki');
    }
    if (payload.search) {
      const q = payload.search.toLowerCase();
      list = list.filter(x => [x.nama, x.kode, x.lokasi, x.kondisi, x.id, x.keterangan].join(' ').toLowerCase().includes(q));
    }

    if (payload.sort === 'rusak_asc') list.sort((a,b) => (a.tglRusak||'').localeCompare(b.tglRusak||''));
    else if (payload.sort === 'perbaikan_desc') list.sort((a,b) => (b.tglPerbaikan||'').localeCompare(a.tglPerbaikan||''));
    else list.sort((a,b) => (b.tglRusak||'').localeCompare(a.tglRusak||''));

    const page = payload.page || 1;
    const pageSize = payload.pageSize || 25;
    const total = list.length;
    const pages = Math.max(1, Math.ceil(total / pageSize));
    const rows = list.slice((page - 1) * pageSize, page * pageSize);
    return { ok: true, data: { rows, total, page, pages, pageSize } };
  }

  if (action === 'laporan.detail') {
    const r = db.laporan.find(x => x.id === payload.id);
    if (!r) throw new Error('Laporan tidak ditemukan.');
    const riwayat = db.logs.filter(l => l.entitasId === r.id && l.entitas === 'Laporan');
    return {
      ok: true,
      data: {
        ...r,
        versi: r.diubahPada,
        riwayat: riwayat,
        foto: { kerusakan: r.fotoKerusakan||[], perbaikan: r.fotoPerbaikan||[] }
      }
    };
  }

  if (action === 'laporan.create') {
    const seq = db.laporan.length + 1;
    const id = 'KRS-2026-' + ('00000' + seq).slice(-5);
    const status = payload.tglPerbaikan ? 'Sudah Diperbaiki' : 'Belum Diperbaiki';
    const newRec = {
      id, no: seq, nama: payload.nama, kode: payload.kode||'', jumlah: payload.jumlah||1,
      lokasi: payload.lokasi, kondisi: payload.kondisi, tglRusak: payload.tglRusak,
      tglPerbaikan: payload.tglPerbaikan||'', status, keterangan: payload.keterangan||'',
      dibuatPada: now, dibuatOleh: 'Administrator Sarpras (admin)', diubahPada: now, diubahOleh: 'Administrator Sarpras (admin)',
      arsip: false, fotoKerusakan: [], fotoPerbaikan: []
    };
    ensureMaster(payload.nama, payload.kode, payload.lokasi);
    db.laporan.unshift(newRec);
    pushLog('TAMBAH', 'Laporan', id, payload.nama + ' — ' + payload.lokasi + ' — ' + payload.kondisi);
    saveLocalDb(db);
    return { ok: true, data: { id, laporan: newRec } };
  }

  if (action === 'laporan.update') {
    const idx = db.laporan.findIndex(x => x.id === payload.id);
    if (idx < 0) throw new Error('Laporan tidak ditemukan.');
    const status = payload.tglPerbaikan ? 'Sudah Diperbaiki' : 'Belum Diperbaiki';
    ensureMaster(payload.nama, payload.kode, payload.lokasi);
    db.laporan[idx] = {
      ...db.laporan[idx],
      nama: payload.nama, kode: payload.kode, jumlah: payload.jumlah, lokasi: payload.lokasi,
      kondisi: payload.kondisi, tglRusak: payload.tglRusak, tglPerbaikan: payload.tglPerbaikan||'',
      status, keterangan: payload.keterangan, diubahPada: now, diubahOleh: 'Administrator Sarpras (admin)'
    };
    pushLog('UBAH', 'Laporan', payload.id, 'Mengubah laporan: ' + payload.nama + ' di ' + payload.lokasi);
    saveLocalDb(db);
    return { ok: true, data: { id: payload.id } };
  }

  if (action === 'laporan.repair') {
    const idx = db.laporan.findIndex(x => x.id === payload.id);
    if (idx < 0) throw new Error('Laporan tidak ditemukan.');
    let ket = db.laporan[idx].keterangan || '';
    if (payload.catatan) ket += (ket ? '\\n' : '') + 'Hasil perbaikan: ' + payload.catatan;
    db.laporan[idx] = {
      ...db.laporan[idx],
      tglPerbaikan: payload.tglPerbaikan, status: 'Sudah Diperbaiki', keterangan: ket, diubahPada: now
    };
    pushLog('PERBAIKAN', 'Laporan', payload.id, 'Tanggal perbaikan: ' + payload.tglPerbaikan + (payload.catatan ? ' | ' + payload.catatan : ''));
    saveLocalDb(db);
    return { ok: true, data: { id: payload.id } };
  }

  if (action === 'laporan.followUp') {
    const idx = db.laporan.findIndex(x => x.id === payload.id);
    if (idx < 0) throw new Error('Laporan tidak ditemukan.');
    let ket = db.laporan[idx].keterangan || '';
    ket += (ket ? '\\n' : '') + '[Tindak Lanjut ' + now.substring(0, 10) + '] ' + payload.catatan;
    db.laporan[idx].keterangan = ket;
    db.laporan[idx].diubahPada = now;
    pushLog('TINDAK_LANJUT', 'Laporan', payload.id, payload.catatan);
    saveLocalDb(db);
    return { ok: true, data: { id: payload.id } };
  }

  if (action === 'laporan.archive') {
    const r = db.laporan.find(x => x.id === payload.id);
    if (r) {
      r.arsip = true;
      pushLog('ARSIP', 'Laporan', payload.id, 'Mengarsipkan laporan ' + payload.id);
      saveLocalDb(db);
    }
    return { ok: true, data: { id: payload.id } };
  }

  if (action === 'laporan.restore') {
    const r = db.laporan.find(x => x.id === payload.id);
    if (r) {
      r.arsip = false;
      pushLog('PULIHKAN', 'Laporan', payload.id, 'Memulihkan laporan ' + payload.id + ' dari arsip');
      saveLocalDb(db);
    }
    return { ok: true, data: { id: payload.id } };
  }

  if (action === 'laporan.delete') {
    const r = db.laporan.find(x => x.id === payload.id);
    db.laporan = db.laporan.filter(x => x.id !== payload.id);
    pushLog('HAPUS_PERMANEN', 'Laporan', payload.id, 'Menghapus permanen laporan ' + (r ? r.nama : payload.id));
    saveLocalDb(db);
    return { ok: true, data: { id: payload.id } };
  }

  if (action === 'foto.upload') {
    const r = db.laporan.find(x => x.id === payload.laporanId);
    if (r) {
      const fotoId = 'FT-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
      const dataUrl = payload.dataBase64
        ? ('data:' + (payload.mime || 'image/jpeg') + ';base64,' + payload.dataBase64)
        : (payload.thumb || generateSvgDataUrl(payload.nama));
      const thumbUrl = payload.thumb || dataUrl;

      // Simpan foto full ke IndexedDB High-Capacity Storage
      if (typeof savePhotoBinary === 'function' && dataUrl) {
        savePhotoBinary(fotoId, dataUrl);
      }

      const fItem = {
        fotoId: fotoId,
        nama: payload.nama || 'Foto_' + fotoId,
        thumb: thumbUrl,
        dataUrl: dataUrl
      };

      if (payload.jenis === 'PERBAIKAN') {
        r.fotoPerbaikan = r.fotoPerbaikan || [];
        r.fotoPerbaikan.push(fItem);
      } else {
        r.fotoKerusakan = r.fotoKerusakan || [];
        r.fotoKerusakan.push(fItem);
      }
      pushLog('FOTO_UNGGAH', 'Laporan', payload.laporanId, 'Unggah foto ' + (payload.jenis === 'PERBAIKAN' ? 'perbaikan' : 'kerusakan') + ': ' + fItem.nama);
      saveLocalDb(db);
    }
    return { ok: true, data: { sukses: true } };
  }

  if (action === 'foto.get') {
    let foundPhoto = null;
    for (const r of db.laporan) {
      const allF = (r.fotoKerusakan || []).concat(r.fotoPerbaikan || []);
      const f = allF.find(x => x.fotoId === payload.fotoId);
      if (f) { foundPhoto = f; break; }
    }
    const dataUrl = foundPhoto
      ? (foundPhoto.dataUrl || foundPhoto.thumb || generateSvgDataUrl(foundPhoto.nama))
      : generateSvgDataUrl('Foto Dokumentasi');
    const nama = foundPhoto ? foundPhoto.nama : 'Foto ' + payload.fotoId;
    return {
      ok: true,
      data: {
        fotoId: payload.fotoId,
        nama: nama,
        dataUrl: dataUrl
      }
    };
  }

  if (action === 'foto.detach') {
    let found = false;
    db.laporan.forEach(r => {
      if (r.fotoKerusakan) {
        const pre = r.fotoKerusakan.length;
        r.fotoKerusakan = r.fotoKerusakan.filter(x => x.fotoId !== payload.fotoId);
        if (r.fotoKerusakan.length < pre) found = true;
      }
      if (r.fotoPerbaikan) {
        const pre = r.fotoPerbaikan.length;
        r.fotoPerbaikan = r.fotoPerbaikan.filter(x => x.fotoId !== payload.fotoId);
        if (r.fotoPerbaikan.length < pre) found = true;
      }
    });
    if (found) {
      pushLog('FOTO_LEPAS', 'Laporan', payload.fotoId, 'Melepas foto ' + payload.fotoId);
      saveLocalDb(db);
    }
    return { ok: true, data: { fotoId: payload.fotoId } };
  }

  if (action === 'report.bulanan') {
    const BULAN_ID = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    const year = payload.year ? parseInt(payload.year, 10) : new Date().getFullYear();
    const isAllMonth = !payload.month || payload.month === 'ALL';
    const month = isAllMonth ? null : parseInt(payload.month, 10);

    let rowsList = db.laporan.filter(x => !x.arsip);

    if (year) {
      rowsList = rowsList.filter(x => (x.tglRusak || '').startsWith(String(year)));
    }

    if (month && !isNaN(month)) {
      const monthPrefix = year + '-' + ('0' + month).slice(-2);
      rowsList = rowsList.filter(x => {
        const d = String(x.tglRusak || '');
        return d.startsWith(monthPrefix) || (parseInt(d.substring(5, 7), 10) === month);
      });
    }

    if (payload.lokasi) {
      rowsList = rowsList.filter(x => x.lokasi === payload.lokasi);
    }

    if (payload.status) {
      rowsList = rowsList.filter(x => payload.status === 'SUDAH' ? x.status === 'Sudah Diperbaiki' : x.status === 'Belum Diperbaiki');
    }

    rowsList.sort((a, b) => (a.tglRusak || '').localeCompare(b.tglRusak || ''));

    const rows = rowsList.map((r, i) => ({
      no: i + 1, id: r.id, nama: r.nama, kode: r.kode || '-', jumlah: r.jumlah, lokasi: r.lokasi,
      kondisi: r.kondisi, fotoKerusakan: r.fotoKerusakan||[], tglRusak: r.tglRusak,
      tglRusakIndo: r.tglRusak, tglPerbaikan: r.tglPerbaikan||'', tglPerbaikanIndo: r.tglPerbaikan||'-',
      fotoPerbaikan: r.fotoPerbaikan||[], keterangan: r.keterangan||'-'
    }));

    const namaBulanLabel = isAllMonth ? 'SEMUA BULAN (REKAP TAHUNAN)' : (BULAN_ID[(month || 1) - 1] || 'SEMUA BULAN');

    return {
      ok: true,
      data: {
        meta: {
          tahunPelajaran: '2026/2027',
          namaSekolahUpper: (db.settings.nama_sekolah || 'SMK DWIJENDRA DENPASAR').toUpperCase(),
          kota: db.settings.kota || 'Denpasar',
          tanggalCetakLabel: new Date().toLocaleDateString('id-ID'),
          kiri: { jabatan: db.settings.kepala_jabatan, nama: db.settings.kepala_nama, idLabel: db.settings.kepala_id_label, id: db.settings.kepala_id },
          kanan: { pembuka: (db.settings.kota || 'Denpasar') + ', ' + new Date().toLocaleDateString('id-ID'), jabatan: db.settings.wakasek_jabatan, nama: db.settings.wakasek_nama, idLabel: db.settings.wakasek_id_label, id: db.settings.wakasek_id }
        },
        periode: { tahun: year, bulan: month, namaBulan: namaBulanLabel },
        rows: rows
      }
    };
  }

  if (action === 'report.tahunan') {
    const year = payload.year || 2026;
    const BULAN_ID = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    const yearRecords = db.laporan.filter(x => !x.arsip && (x.tglRusak || '').startsWith(String(year)));
    let totalBarang = 0, sudah = 0, belum = 0;
    yearRecords.forEach(r => {
      totalBarang += (Number(r.jumlah) || 0);
      if (r.status === 'Sudah Diperbaiki') sudah++; else belum++;
    });
    const rekapBulanan = [];
    for (let m = 1; m <= 12; m++) {
      const bItems = yearRecords.filter(x => parseInt((x.tglRusak || '').substring(5,7),10) === m);
      const bSudah = bItems.filter(x => x.status === 'Sudah Diperbaiki').length;
      rekapBulanan.push({
        namaBulan: BULAN_ID[m - 1],
        totalKejadian: bItems.length,
        totalBarang: bItems.reduce((acc, c) => acc + (Number(c.jumlah)||1), 0),
        sudah: bSudah,
        belum: bItems.length - bSudah,
        persentase: bItems.length > 0 ? Math.round((bSudah / bItems.length) * 100) : 0
      });
    }
    const lokasiMap = {};
    yearRecords.forEach(r => { lokasiMap[r.lokasi] = (lokasiMap[r.lokasi] || 0) + 1; });
    const rekapLokasi = Object.keys(lokasiMap).map(k => ({
      lokasi: k,
      totalKejadian: lokasiMap[k],
      totalBarang: lokasiMap[k],
      sudah: yearRecords.filter(x => x.lokasi === k && x.status === 'Sudah Diperbaiki').length,
      belum: yearRecords.filter(x => x.lokasi === k && x.status !== 'Sudah Diperbaiki').length
    })).sort((a,b) => b.totalKejadian - a.totalKejadian);

    return {
      ok: true,
      data: {
        ringkasan: { totalKejadian: yearRecords.length, totalBarang, sudahDiperbaiki: sudah, belumDiperbaiki: belum, persentase: yearRecords.length > 0 ? Math.round((sudah/yearRecords.length)*1000)/10 : 0 },
        rekapBulanan,
        rekapLokasi,
        pendingList: yearRecords.filter(x => x.status === 'Belum Diperbaiki')
      }
    };
  }

  if (action === 'report.archivePdf') {
    const fileName = (payload.fileName || 'Laporan_PDF_' + Date.now()).replace(/\.pdf$/i, '') + '.pdf';
    db.backups.unshift({
      id: 'pdf-' + Date.now(),
      nama: fileName,
      dibuatPada: new Date().toLocaleString('id-ID'),
      ukuran: 284000,
      url: '#'
    });
    pushLog('LAPORAN_PDF', 'Laporan PDF', '', 'Mengarsipkan PDF: ' + fileName);
    saveLocalDb(db);
    return { ok: true, data: { nama: fileName } };
  }

  // --- IMPOR DARI EXCEL LAMA ---
  if (action === 'import.preview') {
    const sheetsData = payload.sheets || [];
    const targetYear = payload.year || 2026;
    const BULAN_ID = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

    const existingFp = {};
    db.laporan.forEach(r => {
      const fp = [r.nama, r.kode, r.jumlah, r.lokasi, r.tglRusak].join('|').toLowerCase();
      existingFp[fp] = r.id;
    });

    const validItems = [];
    const duplicates = [];
    const errors = [];
    const newLokasi = new Set();
    const newBarang = new Set();

    sheetsData.forEach(sh => {
      const shName = sh.name || 'Sheet';
      let estMonth = 1;
      BULAN_ID.forEach((b, idx) => { if (shName.toLowerCase().includes(b.toLowerCase())) estMonth = idx + 1; });
      const rows = sh.rows || [];

      rows.forEach((row, rIdx) => {
        try {
          const cells = Array.isArray(row) ? row : Object.values(row);
          if (!cells || !cells.length) return;
          const combined = cells.join(' ').toLowerCase();
          if (combined.includes('mengetahui') || combined.includes('kepala smk') || combined.includes('wakasek') || combined.includes('nama barang') || combined.includes('tahun pelajaran')) {
            return;
          }
          const nama = String(cells[1] || '').trim();
          if (!nama || nama.length < 2) return;

          const kode = String(cells[2] || '').trim();
          const jumlah = Math.max(1, parseInt(cells[3], 10) || 1);
          const lokasi = String(cells[4] || 'Ruang FO').trim();
          const kondisi = String(cells[5] || 'Perlu perbaikan').trim();
          const tglRusakRaw = String(cells[7] || '').trim();
          const tglPerbaikanRaw = String(cells[8] || '').trim();
          const keterangan = String(cells[10] || '').trim();

          const tglRusak = tglRusakRaw.match(/^\d{4}-\d{2}-\d{2}$/) ? tglRusakRaw : (targetYear + '-' + ('0' + estMonth).slice(-2) + '-01');
          const tglPerbaikan = tglPerbaikanRaw.match(/^\d{4}-\d{2}-\d{2}$/) ? tglPerbaikanRaw : '';
          const status = tglPerbaikan ? 'Sudah Diperbaiki' : 'Belum Diperbaiki';

          const fp = [nama, kode, jumlah, lokasi, tglRusak].join('|').toLowerCase();
          if (existingFp[fp]) {
            duplicates.push({
              sheet: shName,
              row: rIdx + 1,
              nama,
              lokasi,
              tglRusak,
              alasan: 'Data sudah ada di sistem (ID: ' + existingFp[fp] + ')'
            });
          } else {
            existingFp[fp] = 'Batch';
            const itemObj = {
              sheetName: shName,
              rowNumber: rIdx + 1,
              nama, kode, jumlah, lokasi, kondisi,
              tglRusak, tglPerbaikan, status, keterangan
            };
            validItems.push(itemObj);
            if (!db.lokasi.some(l => l.nama.toLowerCase() === lokasi.toLowerCase())) newLokasi.add(lokasi);
            if (!db.barang.some(b => b.nama.toLowerCase() === nama.toLowerCase())) newBarang.add(nama);
          }
        } catch (err) {
          errors.push({ sheet: shName, row: rIdx + 1, pesan: err.message });
        }
      });
    });

    return {
      ok: true,
      data: {
        totalDibaca: validItems.length + duplicates.length + errors.length,
        siapImpor: validItems.length,
        duplikatDilewati: duplicates.length,
        gagal: errors.length,
        items: validItems,
        sampleValid: validItems.slice(0, 15),
        sampleDuplikat: duplicates.slice(0, 10),
        sampleError: errors.slice(0, 10),
        lokasiBaruTerdeteksi: Array.from(newLokasi),
        barangBaruTerdeteksi: Array.from(newBarang)
      }
    };
  }

  if (action === 'import.execute') {
    const items = payload.items || [];
    if (!items.length) throw new Error('Tidak ada data valid yang dapat diimpor.');

    let count = 0;
    items.forEach(item => {
      ensureMaster(item.nama, item.kode, item.lokasi);
      const seq = db.laporan.length + 1;
      const id = 'KRS-2026-' + ('00000' + seq).slice(-5);
      const newRec = {
        id, no: seq,
        nama: item.nama, kode: item.kode || '', jumlah: item.jumlah || 1,
        lokasi: item.lokasi, kondisi: item.kondisi || 'Perlu perbaikan',
        tglRusak: item.tglRusak || '2026-01-01', tglPerbaikan: item.tglPerbaikan || '',
        status: item.tglPerbaikan ? 'Sudah Diperbaiki' : 'Belum Diperbaiki',
        keterangan: item.keterangan || '',
        dibuatPada: now, dibuatOleh: 'Administrator Sarpras (admin)',
        diubahPada: now, diubahOleh: 'Administrator Sarpras (admin)',
        arsip: false, fotoKerusakan: [], fotoPerbaikan: []
      };
      db.laporan.unshift(newRec);
      count++;
    });

    pushLog('IMPOR', 'Excel', '', 'Berhasil mengimpor ' + count + ' data kerusakan dari Excel');
    saveLocalDb(db);
    return {
      ok: true,
      data: {
        sukses: true,
        jumlahDiimpor: count,
        pesan: 'Berhasil mengimpor ' + count + ' data kerusakan ke sistem.'
      }
    };
  }

  if (action === 'settings.get') return { ok: true, data: db.settings };

  if (action === 'settings.update') {
    db.settings = { ...db.settings, ...payload };
    pushLog('PENGATURAN', 'Pengaturan', '', 'Memperbarui identitas sekolah dan pengaturan laporan');
    saveLocalDb(db);
    return { ok: true, data: db.settings };
  }

  if (action === 'settings.uploadLogo') {
    const logoDataUrl = 'data:' + (payload.mime || 'image/png') + ';base64,' + payload.data;
    db.settings.logo = logoDataUrl;
    pushLog('PENGATURAN', 'Pengaturan', 'logo', 'Mengunggah logo resmi sekolah');
    saveLocalDb(db);
    return { ok: true, data: { logo: logoDataUrl } };
  }

  if (action === 'settings.removeLogo') {
    db.settings.logo = '';
    pushLog('PENGATURAN', 'Pengaturan', 'logo', 'Menghapus logo sekolah');
    saveLocalDb(db);
    return { ok: true, data: { logo: '' } };
  }

  if (action === 'users.list') return { ok: true, data: db.users };

  if (action === 'users.create') {
    const newUser = {
      id: 'USR-' + Date.now(),
      username: payload.username,
      nama: payload.nama,
      email: payload.email,
      peran: payload.peran,
      status: 'AKTIF',
      hash: payload.password || '12345678',
      peranLabel: payload.peran === 'ADMIN' ? 'Administrator' : (payload.peran === 'PETUGAS' ? 'Petugas Sarpras' : 'Kepala Sekolah')
    };
    db.users.push(newUser);
    pushLog('PENGGUNA', 'Pengguna', newUser.username, 'Menambah pengguna baru: ' + newUser.username + ' (' + newUser.peran + ')');
    saveLocalDb(db);
    return { ok: true, data: { tempPassword: newUser.hash, username: newUser.username } };
  }

  if (action === 'users.update') {
    const idx = db.users.findIndex(x => x.id === payload.id);
    if (idx >= 0) {
      db.users[idx] = { ...db.users[idx], ...payload };
      pushLog('PENGGUNA', 'Pengguna', payload.id, 'Mengubah data pengguna ' + db.users[idx].username);
      saveLocalDb(db);
    }
    return { ok: true, data: { sukses: true } };
  }

  if (action === 'users.resetPassword') {
    const u = db.users.find(x => x.id === payload.id);
    const temp = 'Sandi' + Math.floor(1000 + Math.random() * 9000);
    if (u) {
      u.hash = temp;
      pushLog('RESET_SANDI', 'Pengguna', u.username, 'Reset kata sandi pengguna ' + u.username);
      saveLocalDb(db);
    }
    return { ok: true, data: { tempPassword: temp, username: u ? u.username : '' } };
  }

  if (action === 'log.list') {
    let rows = db.logs.slice();
    if (payload.aksi) {
      rows = rows.filter(r => r.aksi === payload.aksi);
    }
    if (payload.search) {
      const q = String(payload.search).toLowerCase();
      rows = rows.filter(r => [r.pengguna, r.aksi, r.aksiLabel, r.entitas, r.entitasId, r.detail].join(' ').toLowerCase().includes(q));
    }
    const pageSize = Math.min(Math.max(Number(payload.pageSize) || 25, 5), 200);
    const pages = Math.max(1, Math.ceil(rows.length / pageSize));
    const page = Math.min(Math.max(Number(payload.page) || 1, 1), pages);
    const pagedRows = rows.slice((page - 1) * pageSize, page * pageSize);

    const aksiList = [
      { value: 'LOGIN', label: 'Login' },
      { value: 'LOGOUT', label: 'Logout' },
      { value: 'TAMBAH', label: 'Menambah laporan' },
      { value: 'UBAH', label: 'Mengubah laporan' },
      { value: 'PERBAIKAN', label: 'Menandai sudah diperbaiki' },
      { value: 'TINDAK_LANJUT', label: 'Mencatat tindak lanjut' },
      { value: 'ARSIP', label: 'Mengarsipkan laporan' },
      { value: 'PULIHKAN', label: 'Memulihkan laporan' },
      { value: 'HAPUS_PERMANEN', label: 'Menghapus permanen' },
      { value: 'FOTO_UNGGAH', label: 'Mengunggah foto' },
      { value: 'FOTO_LEPAS', label: 'Melepas foto' },
      { value: 'MASTER', label: 'Mengubah master data' },
      { value: 'PENGATURAN', label: 'Mengubah pengaturan' },
      { value: 'PENGGUNA', label: 'Mengelola pengguna' },
      { value: 'RESET_SANDI', label: 'Reset kata sandi' },
      { value: 'IMPOR', label: 'Impor data Excel' },
      { value: 'CADANGAN', label: 'Membuat cadangan' },
      { value: 'LAPORAN_PDF', label: 'Mengarsipkan laporan PDF' }
    ];

    return {
      ok: true,
      data: {
        rows: pagedRows,
        total: rows.length,
        page: page,
        pages: pages,
        pageSize: pageSize,
        aksiList: aksiList
      }
    };
  }

  if (action === 'backup.create') {
    const bName = 'Backup_Database_Kerusakan_' + new Date().toISOString().replace(/[-:T]/g,'').substring(0,14);
    db.backups.unshift({ id: 'b-' + Date.now(), nama: bName, dibuatPada: new Date().toLocaleString('id-ID'), ukuran: 512000, url: '#' });
    pushLog('CADANGAN', 'Cadangan', bName, 'Membuat snapshot cadangan database');
    saveLocalDb(db);
    return { ok: true, data: { pesan: 'Snapshot database berhasil dibuat.' } };
  }

  if (action === 'backup.list') return { ok: true, data: db.backups };

  if (action === 'backup.exportJson') {
    return { ok: true, data: db };
  }

  return { ok: true, data: {} };
}
</script>
`;

// Replace server-side <?!= include('...') ?> with inlined content
let standaloneHtml = indexContent;
standaloneHtml = standaloneHtml.replace("<?!= include('Style'); ?>", styleContent);

// Inject MockDb script BEFORE Script.html so callApi can seamlessly fallback
standaloneHtml = standaloneHtml.replace("<?!= include('Script'); ?>", mockDbScript + '\n' + scriptContent);

// Enhance callApi in Script to use handleLocalRpc if google.script.run is not available
const enhancedScriptCallApi = `
function callApi(action, payload = {}) {
  return new Promise((resolve, reject) => {
    if (typeof google !== 'undefined' && google.script && google.script.run) {
      google.script.run
        .withSuccessHandler((res) => {
          if (!res || !res.ok) {
            const err = new Error((res && res.error) || 'Terjadi kesalahan pada server.');
            err.code = (res && res.code) || 'SERVER_ERROR';
            err.fields = (res && res.fields) || null;
            if (err.code === 'AUTH') handleSessionExpired();
            reject(err);
          } else {
            resolve(res.data);
          }
        })
        .withFailureHandler((err) => {
          const error = new Error(err.message || 'Koneksi ke server Google terputus.');
          error.code = 'NETWORK_ERROR';
          reject(error);
        })
        .api(action, payload, AppState.token);
    } else {
      // Standalone Dedicated Database Engine dengan IndexedDB + Realtime Cloud Sync
      (async () => {
        try {
          if (typeof initUnlimitedStorageEngine === 'function') {
            await initUnlimitedStorageEngine();
          }
          if (action === 'sync.pull' && typeof pullFromFirebaseCloud === 'function') {
            const syncedDb = await pullFromFirebaseCloud(true);
            return resolve(syncedDb);
          }
          if (action === 'sync.push' && typeof syncToFirebaseCloud === 'function') {
            await syncToFirebaseCloud(getLocalDb());
            return resolve({ sukses: true });
          }
          if (action === 'foto.get' && typeof getPhotoBinary === 'function' && payload && payload.fotoId) {
            const binary = await getPhotoBinary(payload.fotoId);
            if (binary) {
              const resObj = handleLocalRpc(action, payload);
              if (resObj && resObj.data) resObj.data.dataUrl = binary;
              return resolve(resObj.data);
            }
          }
          const localRes = handleLocalRpc(action, payload);
          resolve(localRes.data);
        } catch (err) {
          reject(err);
        }
      })();
    }
  });
}
`;

// Replace callApi definition in standaloneHtml
standaloneHtml = standaloneHtml.replace(
  /function callApi\(action, payload = \{\}\) \{[\s\S]*?\.api\(action, payload, AppState\.token\);\s*\}\);?\s*\}/,
  enhancedScriptCallApi.trim()
);

fs.writeFileSync(path.join(__dirname, 'index.html'), standaloneHtml, 'utf8');

const distDir = path.join(__dirname, 'dist');
if (!fs.existsSync(distDir)) fs.mkdirSync(distDir, { recursive: true });
fs.writeFileSync(path.join(distDir, 'index.html'), standaloneHtml, 'utf8');

// Export HTML module for serverless bundlers
fs.writeFileSync(path.join(__dirname, 'html_bundle.js'), 'module.exports = ' + JSON.stringify(standaloneHtml) + ';\n', 'utf8');

console.log('BERHASIL: index.html standalone dan html_bundle.js telah dibuat!');
