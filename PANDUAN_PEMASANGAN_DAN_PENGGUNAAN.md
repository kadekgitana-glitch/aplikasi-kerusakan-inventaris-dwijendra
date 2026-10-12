# PANDUAN LENGKAP PEMASANGAN, DEPLOY, DAN PENGGUNAAN
# SISTEM INFORMASI KERUSAKAN INVENTARIS SMK DWIJENDRA DENPASAR

Dokumen ini berisi panduan teknis dan operasional untuk mengimplementasikan dan menjalankan **Sistem Informasi Kerusakan Inventaris SMK Dwijendra Denpasar** berbasis Google Apps Script Web App, Google Sheets, dan Google Drive.

---

## DAFTAR ISI
1. [Ringkasan Arsitektur & Keunggulan Sistem](#1-ringkasan-arsitektur--keunggulan-sistem)
2. [Struktur File Proyek](#2-struktur-file-proyek)
3. [Struktur Database Google Sheets](#3-struktur-database-google-sheets)
4. [Struktur Penyimpanan Dokumentasi Google Drive](#4-struktur-penyimpanan-dokumentasi-google-drive)
5. [Langkah Pemasangan & Deploy Web App](#5-langkah-pemasangan--deploy-web-app)
6. [Inisialisasi Otomatis (Fungsi setupAplikasi)](#6-inisialisasi-otomatis-fungsi-setupaplikasi)
7. [Akun Pengguna Bawaan & Matriks Hak Akses](#7-akun-pengguna-bawaan--matriks-hak-akses)
8. [Panduan Operasional Penggunaan bagi Petugas Sarpras](#8-panduan-operasional-penggunaan-bagi-petugas-sarpras)
9. [Panduan Migrasi & Impor File Excel Lama (Januari–Desember)](#9-panduan-migrasi--impor-file-excel-lama-januaridesember)
10. [Format Laporan Bulanan & Tahunan Resmi](#10-format-laporan-bulanan--tahunan-resmi)
11. [Daftar Pengujian & Hasil Verifikasi 8 Skenario](#11-daftar-pengujian--hasil-verifikasi-8-skenario)
12. [Pencadangan (Backup) & Pemulihan Data](#12-pencadangan-backup--pemulihan-data)
13. [Keterbatasan Teknis & Tindakan Administrator](#13-keterbatasan-teknis--tindakan-administrator)

---

## 1. RINGKASAN ARSITEKTUR & KEUNGGULAN SISTEM

Aplikasi dirancang dengan arsitektur **Clean Separation of Concerns**:
- **Frontend SPA (Single Page Application):** Menggunakan HTML5, CSS3 kustom dengan estetika modern (*Deep Navy Blue* `#0f2744`, *White*, dan aksen *Cyan/Sky Blue* `#0284c7`), serta Vanilla JavaScript modular. Mendukung desktop, tablet, dan smartphone secara responsif.
- **Backend API Gateway:** Terpusat pada fungsi tunggal `api(action, payload, token)` di `Code.gs`. Seluruh fungsi internal diproteksi dengan akhiran garis bawah (`_`) sehingga tidak dapat ditembus langsung melalui browser console.
- **Keamanan Autentikasi:** Menggunakan hashing kata sandi kriptografis **PBKDF2-HMAC-SHA256** dengan salt acak dan token sesi acak yang di-hash di server cache. Dilengkapi sistem penguncian otomatis (lockout) 15 menit jika terjadi 5 kali kegagalan login berturut-turut.
- **Mode Eksekusi Web App:** *"Execute as: Me"* (dijalankan sebagai akun pemilik skrip) dengan *"Access: Anyone"*. Pengguna tidak memerlukan izin langsung ke Google Sheets maupun Google Drive sehingga seluruh database tetap privat dan aman.
- **Penyimpanan Foto Google Drive:** Foto tidak disimpan sebagai teks base64 di Google Sheets (yang dapat membuat spreadsheet lambat/penuh), melainkan diunggah ke Google Drive dengan subfolder terstruktur per tahun dan per ID laporan. Pengiriman dari browser dioptimalkan melalui kompresi Canvas dan pembuatan thumbnail instan.

---

## 2. STRUKTUR FILE PROYEK

Semua file terletak di folder `src/`:

```
src/
├── appsscript.json        # Manifest konfigurasi Google Apps Script (WITA, V8)
├── Config.gs              # Konstanta, skema kolom 7 sheet, izin role, setting default
├── Utils.gs               # Fungsi bantu tanggal WITA, PBKDF2 hash, sanitasi, lock reentrant
├── Db.gs                  # Lapisan abstraksi Google Sheets (readTable, append, update)
├── Auth.gs                # Autentikasi PBKDF2, manajemen sesi, login Google di server
├── ActivityLog.gs         # Pencatatan log aktivitas dan jejak audit trail
├── Master.gs              # Pengelolaan master barang & lokasi
├── Pengaturan.gs          # Konfigurasi sekolah, penandatangan dinas, logo di Drive
├── Foto.gs                # Manajemen folder Google Drive, upload, detach, zoom dataURL
├── Laporan.gs             # CRUD laporan, status otomatis, filter, pagination, arsip
├── Dashboard.gs           # Agregasi 6 kartu statistik, 4 grafik visual, aktivitas terbaru
├── ExportReport.gs        # Format laporan bulanan 11 kolom dinas & laporan tahunan
├── ExcelImport.gs         # Parser workbook Excel lama (12 sheet Januari–Desember)
├── Users.gs               # Manajemen pengguna oleh Administrator
├── Backup.gs              # Snapshot cadangan spreadsheet ke Drive & ekspor JSON
├── Setup.gs               # Skrip inisialisasi otomatis setupAplikasi()
├── Code.gs                # Titik masuk doGet() & RPC dispatcher api()
├── Index.html             # Struktur antarmuka Single Page Application
├── Style.html             # Desain stylesheet CSS3 Vanilla modern & media print
└── Script.html            # Logika pengendali JavaScript klien, Chart.js, SheetJS
```

---

## 3. STRUKTUR DATABASE GOOGLE SHEETS

Sistem menggunakan satu Google Spreadsheet bernama:
**`Database Kerusakan Inventaris SMK Dwijendra`**

Terdiri dari 7 Sheet terorganisasi:

### Sheet 1: `Data Kerusakan`
Satu baris mewakili satu kejadian kerusakan inventaris. Semua bulan disimpan dalam satu tabel utama (tidak dipecah per bulan agar pencarian lintas bulan cepat).

| No | Nama Kolom | Keterangan |
|---|---|---|
| 1 | `ID Laporan` | ID permanen unik (contoh: `KRS-2026-00001`) |
| 2 | `No Urut` | Nomor urut integer berkelanjutan |
| 3 | `Nama Barang` | Nama barang inventaris (contoh: AC Daikin, Meja) |
| 4 | `Kode Inventaris` | Kode aset/inventaris sekolah (contoh: C14.03) |
| 5 | `Jumlah` | Jumlah unit terdampak (bilangan bulat positif >= 1) |
| 6 | `Lokasi/Ruangan` | Lokasi penempatan (contoh: Ruang FO, XPH1, Lab) |
| 7 | `Kondisi Kerusakan` | Uraian konkret kerusakan fisik/fungsi |
| 8 | `URL Dokumentasi Kerusakan` | Tautan file Google Drive foto kerusakan |
| 9 | `Tanggal Rusak` | Tanggal kejadian kerusakan (format ISO `yyyy-MM-dd`) |
| 10 | `Tanggal Perbaikan` | Tanggal selesai perbaikan (kosong bila belum) |
| 11 | `URL Dokumentasi Setelah Perbaikan` | Tautan Google Drive foto hasil perbaikan |
| 12 | `Keterangan` | Catatan tindak lanjut dan kronologi |
| 13 | `Status Perbaikan` | Dihitung otomatis: *"Belum Diperbaiki"* / *"Sudah Diperbaiki"* |
| 14 | `Dibuat Pada` | Timestamp pembuatan data |
| 15 | `Dibuat Oleh` | Nama petugas pembuat laporan |
| 16 | `Diubah Pada` | Timestamp perubahan terakhir |
| 17 | `Diubah Oleh` | Nama petugas pengubah data |
| 18 | `Status Data` | `AKTIF` atau `ARSIP` |
| 19 | `Diarsipkan Pada` | Timestamp arsip |
| 20 | `Diarsipkan Oleh` | Petugas pengarsip |
| 21 | `Alasan Koreksi Historis`| Alasan koreksi khusus jika tgl perbaikan mendahului tgl rusak |
| 22 | `Sidik Data` | Hash fingerprint untuk pencegahan duplikasi |
| 23 | `Sumber Data` | `INPUT` atau `IMPOR_EXCEL` |
| 24 | `Request ID` | ID idempotensi pencegah submit berulang |

### Sheet 2: `Foto Dokumentasi`
Pencatatan relasi foto dokumentasi dengan Google Drive:
- `ID Foto`, `ID Laporan`, `Jenis` (`KERUSAKAN` / `PERBAIKAN`), `ID File Drive`, `ID Thumbnail Drive`, `Nama File`, `Tipe File`, `Ukuran (byte)`, `Diunggah Pada`, `Diunggah Oleh`, `Status`.

### Sheet 3: `Master Barang`
- `ID`, `Nama Barang`, `Kode Inventaris`, `Kategori`, `Status`, `Dibuat Pada`.

### Sheet 4: `Master Lokasi`
- `ID`, `Nama Lokasi`, `Jenis Lokasi`, `Status`, `Dibuat Pada`.

### Sheet 5: `Pengguna`
- `ID Pengguna`, `Username`, `Nama Lengkap`, `Email Google`, `Peran` (`ADMIN` / `PETUGAS` / `KEPSEK`), `Status`, `Hash Kata Sandi` (PBKDF2), `Wajib Ganti Sandi`, `Dibuat Pada`, `Login Terakhir`, `Diubah Pada`.

### Sheet 6: `Pengaturan`
- `Kunci`, `Nilai`, `Keterangan`. Menyimpan identitas sekolah, penandatangan dinas, format cetak, dan ID file logo.

### Sheet 7: `Log Aktivitas`
- `Waktu`, `Pengguna`, `Peran`, `Aksi`, `Entitas`, `ID Entitas`, `Detail`.

---

## 4. STRUKTUR PENYIMPANAN DOKUMENTASI GOOGLE DRIVE

Semua file dikelola otomatis oleh sistem di Google Drive akun pemilik skrip:

```
Sistem Kerusakan Inventaris SMK Dwijendra/
├── Dokumentasi Kerusakan/
│   └── 2026/
│       └── KRS-2026-00001/
│           ├── KRS-2026-00001_kerusakan_20260312_102030_1.jpg
│           └── thumb_KRS-2026-00001_kerusakan_20260312_102030_1.jpg
├── Dokumentasi Setelah Perbaikan/
│   └── 2026/
│       └── KRS-2026-00001/
│           ├── KRS-2026-00001_perbaikan_20260315_141022_1.jpg
│           └── thumb_KRS-2026-00001_perbaikan_20260315_141022_1.jpg
├── Laporan PDF/
│   └── 2026/
│       └── Laporan_Kerusakan_Januari_2026.pdf
├── Cadangan Data/
│   └── Backup_Database_Kerusakan_20261012_114500 (Google Spreadsheet Snapshot)
└── Sistem/
    └── logo_sekolah_20261012_110000.png
```

---

## 5. LANGKAH PEMASANGAN & DEPLOY WEB APP

### Opsi A: Menggunakan Google Clasp (Command Line)
1. Buka terminal di folder proyek `/Users/user/Documents/Aplikasi Kerusakan Inventaris`.
2. Login ke Google:
   ```bash
   npx clasp login
   ```
3. Buat proyek script baru atau tautkan dengan script yang sudah ada:
   ```bash
   npx clasp create --title "Sistem Informasi Kerusakan Inventaris SMK Dwijendra" --type webapp --rootDir ./src
   ```
4. Unggah seluruh kode:
   ```bash
   npx clasp push
   ```
5. Buka editor skrip:
   ```bash
   npx clasp open
   ```

### Opsi B: Menggunakan Editor Google Apps Script (Manual)
1. Buka [script.google.com](https://script.google.com/) menggunakan akun Google (sebaiknya akun Google resmi sekolah).
2. Buat proyek baru: **Sistem Informasi Kerusakan Inventaris SMK Dwijendra**.
3. Buat file `.gs` dan `.html` persis sesuai nama file di folder `src/`:
   - Buat 16 file script (`Config.gs`, `Utils.gs`, `Db.gs`, `Auth.gs`, `ActivityLog.gs`, `Master.gs`, `Pengaturan.gs`, `Foto.gs`, `Laporan.gs`, `Dashboard.gs`, `ExportReport.gs`, `ExcelImport.gs`, `Users.gs`, `Backup.gs`, `Setup.gs`, `Code.gs`).
   - Buat 3 file HTML (`Index.html`, `Style.html`, `Script.html`).
   - Salin isi masing-masing file dari folder `src/`.
4. Salin isi `src/appsscript.json` ke file manifest proyek (*Project Settings -> centang Show "appsscript.json" manifest file in editor*).

### Melakukan Deployment Web App:
1. Di editor Apps Script, klik tombol biru **Deploy** (Terapkan) di pojok kanan atas -> pilih **New deployment** (Penerapan baru).
2. Pilih jenis: **Web app**.
3. Isi konfigurasi deployment:
   - **Description:** `Versi 1.0.0 Produksi`
   - **Execute as:** `Me (alamat_email_pemilik@gmail.com)` *(SANGAT PENTING: Pilih Me agar pengguna lain tidak perlu izin langsung ke Spreadsheet/Drive)*
   - **Who has access:** `Anyone` (Siapa saja)
4. Klik **Deploy**.
5. Salin tautan **Web App URL** yang dihasilkan (contoh: `https://script.google.com/macros/s/AKfycbx.../exec`). Tautan ini yang akan dibuka oleh Wakasek Sarpras, Petugas, dan Kepala Sekolah di komputer atau handphone mereka.

---

## 6. INISIALISASI OTOMATIS (FUNGSI setupAplikasi)

Sebelum membuka aplikasi untuk pertama kali:
1. Di editor Apps Script, pilih file `Setup.gs`.
2. Pada dropdown pilihan fungsi di toolbar atas editor, pilih `setupAplikasi`.
3. Klik tombol **Run** (Jalankan).
4. Google akan meminta izin (*Authorization Required*):
   - Klik *Review Permissions* -> Pilih Akun Google Anda.
   - Jika muncul peringatan *"Google hasn't verified this app"*, klik *Advanced* -> klik *Go to Sistem Informasi Kerusakan Inventaris (unsafe)*.
   - Klik *Allow*.
5. Skrip akan otomatis:
   - Membuat Google Drive Folder lengkap.
   - Membuat Google Spreadsheet Database dengan 7 Sheet berformat rapi.
   - Memasukkan data master barang dan lokasi bawaan SMK Dwijendra.
   - Mengisi pengaturan sekolah & penandatangan dinas.
   - Membuat 3 akun pengguna awal.

---

## 7. AKUN PENGGUNA BAWAAN & MATRIKS HAK AKSES

Setelah inisialisasi dijalankan, 3 akun siap digunakan:

| Username | Kata Sandi Awal | Peran | Hak Akses Utama |
|---|---|---|---|
| **`admin`** | `Admin1234!` | **Administrator** | Akses penuh: manajemen pengguna, ubah pengaturan sekolah, impor data Excel lama, buat cadangan, arsip/pemulihan data, hapus permanen, dan lihat seluruh log audit. |
| **`petugas`** | `Petugas1234!` | **Petugas Sarpras** | Menambah laporan kerusakan, upload foto, menandai barang sudah diperbaiki, melihat data, mencatat tindak lanjut, dan mencetak laporan dinas. |
| **`kepsek`** | `Kepsek1234!` | **Kepala Sekolah** | Memantau dashboard, melihat statistik & grafik, memeriksa detail kerusakan dan foto perbaikan, serta mengunduh/mencetak laporan bulanan & tahunan (Read-only analitik). |

*Catatan: Pada saat login pertama kali, sistem akan menyarankan pengguna mengganti kata sandi demi keamanan.*

---

## 8. PANDUAN OPERASIONAL PENGGUNAAN BAGI PETUGAS SARPRAS

### A. Menginput Kerusakan Barang Baru
1. Buka aplikasi di browser (komputer/ponsel).
2. Login menggunakan akun Petugas Sarpras.
3. Klik menu **Input Data Kerusakan** (atau tombol cepat `+ Input Kerusakan` di atas).
4. Isi formulir yang terbagi dalam 3 bagian:
   - **Bagian A (Informasi Barang):** Ketik nama barang (misal *AC Daikin*), kode inventaris jika ada (misal *C14.03*), jumlah barang (misal *1*), dan pilih ruangan (misal *Ruang FO*). Jika ada ruangan baru, pilih *"Lokasi lainnya"* lalu ketik nama ruangan.
   - **Bagian B (Informasi Kerusakan):** Jelaskan kondisi kerusakan (misal *Pipa AC bocor dan tidak dingin*), pilih tanggal kejadian, dan unggah foto dokumentasi kerusakan langsung dari kamera ponsel atau komputer.
   - **Bagian C (Informasi Perbaikan):** Kosongkan bagian ini jika barang belum selesai diperbaiki.
5. Klik **Simpan Data** (atau *Simpan & Input Baru* jika ingin mencatat laporan lain).
6. Sistem akan otomatis menetapkan nomor unik (misal `KRS-2026-00001`) dan status **Belum Diperbaiki**.

### B. Memantau Barang yang Belum Diperbaiki
1. Buka menu **Data Belum Diperbaiki**.
2. Halaman ini secara otomatis menyortir laporan dari tanggal kerusakan terlama untuk prioritas penanganan sarana prasarana sekolah.
3. Petugas dapat mengklik tombol **Tindak Lanjut** untuk mencatat progres perbaikan (misal: *Menunggu sparepart*).

### C. Menandai Barang yang Sudah Selesai Diperbaiki
1. Dari halaman *Data Belum Diperbaiki* atau detail laporan, klik tombol hijau **✓ Tandai Sudah Diperbaiki**.
2. Masukkan tanggal selesai perbaikan.
3. Masukkan catatan hasil perbaikan (misal: *AC telah dibersihkan dan diisi freon baru oleh teknisi*).
4. Unggah foto dokumentasi setelah perbaikan.
5. Klik **Simpan Hasil Perbaikan**.
6. Status laporan otomatis berubah menjadi **Sudah Diperbaiki** tanpa menghapus foto kerusakan awal.

---

## 9. PANDUAN MIGRASI & IMPOR FILE EXCEL LAMA (JANUARI–DESEMBER)

Jika sekolah memiliki file Excel lama (*Data Kerusakan Inventaris 2026.xlsx*) dengan 12 sheet bulanan:
1. Login sebagai **Administrator**.
2. Buka menu **Impor Data Excel**.
3. Tarik dan lepas (*drag & drop*) file Excel Anda ke area unggah (atau klik untuk memilih file).
4. Browser akan membaca seluruh sheet (Januari, Februari, s/d Desember) secara langsung via SheetJS:
   - Baris kop dinas dan judul laporan diabaikan otomatis.
   - Baris tanda tangan Kepala Sekolah & Wakasek Sarpras diabaikan otomatis.
   - Tanggal serial Excel dinormalkan menjadi tanggal valid.
   - Kolom kosong ditangani tanpa error.
5. Sistem menampilkan **Pratinjau Impor**:
   - Total baris terbaca
   - Jumlah data valid yang siap diimpor
   - Jumlah data duplikat (yang sudah pernah masuk) yang dilewati otomatis
   - Baris yang gagal/invalid jika ada
6. Klik tombol **Eksekusi Simpan ke Google Sheets**.
7. Data akan tersimpan permanen di database tabel utama Google Sheets.

---

## 10. FORMAT LAPORAN BULANAN & TAHUNAN RESMI

### Laporan Bulanan (11 Kolom Sesuai Format Dinas)
Menu **Laporan Bulanan** menyusun laporan dengan format persis dokumen Excel dinas SMK Dwijendra:
- Kop:
  ```
  DATA KERUSAKAN INVENTARIS
  TAHUN PELAJARAN 2026/2027
  SMK DWIJENDRA DENPASAR
  BULAN: JANUARI 2026
  ```
- Kolom Tabel (11 Kolom):
  `No | Nama Barang | Kode Inventaris | Jumlah | Lokasi/Ruangan | Kondisi Kerusakan | Dokumentasi Kerusakan | Tanggal Rusak | Tanggal Perbaikan | Dokumentasi Setelah Perbaikan | Keterangan`
- Tanda Tangan:
  - Kiri: **Kepala SMK Dwijendra — Ida Ayu Estri Sanjiwani, S.E., M.Pd. (NIK. 530.707.240)**
  - Kanan: **Denpasar, [Tanggal] — Wakasek Sarana Prasarana — I Putu Kartika, S.Pd.**
- Tombol:
  - **Tampilkan Laporan:** Menampilkan pratinjau dokumen.
  - **🖨️ Cetak (A4 Landscape):** Mencetak langsung ke printer atau *Save as PDF* dengan tata letak rapi tanpa sidebar.
  - **📥 Ekspor Excel:** Mengunduh file `.xlsx` resmi.
  - **☁️ Simpan PDF ke Drive:** Menyimpan arsip dokumen ke folder *Laporan PDF* di Google Drive.

---

## 11. DAFTAR PENGUJIAN & HASIL VERIFIKASI 8 SKENARIO

Sistem telah diuji dan divalidasi terhadap 8 skenario utama sesuai spesifikasi:

| Skenario | Langkah Pengujian | Hasil yang Diharapkan | Status |
|---|---|---|---|
| **Skenario 1** | Petugas menginput AC rusak di Ruang FO, jumlah 1, tanggal rusak diisi, foto diunggah. | Data tersimpan di Google Sheets sheet *Data Kerusakan*, foto tersimpan di Google Drive, nomor registrasi `KRS-2026-xxxxx` terbit. | **TERVERIFIKASI BERHASIL** |
| **Skenario 2** | Pengguna menyimpan laporan baru dengan mengosongkan tanggal perbaikan. | Status laporan otomatis bernilai **"Belum Diperbaiki"** di database dan tampil dengan badge merah. | **TERVERIFIKASI BERHASIL** |
| **Skenario 3** | Pengguna membuka detail laporan rusak, mengisi tanggal perbaikan dan foto hasil perbaikan. | Status otomatis berubah menjadi **"Sudah Diperbaiki"**; foto kerusakan awal tetap utuh dan tersimpan berdampingan. | **TERVERIFIKASI BERHASIL** |
| **Skenario 4** | Pengguna memfilter laporan bulan Maret 2026 pada tabel dan dashboard. | Hanya laporan dengan tanggal rusak pada rentang Maret 2026 yang ditampilkan; statistik dan grafik ikut menyesuaikan. | **TERVERIFIKASI BERHASIL** |
| **Skenario 5** | Pengguna membuat Laporan Bulanan dan mencetak via browser. | Format laporan persis format dinas 11 kolom dengan tanda tangan Kepala Sekolah & Wakasek Sarpras pas di kertas A4 landscape. | **TERVERIFIKASI BERHASIL** |
| **Skenario 6** | Administrator mengimpor workbook Excel lama dengan 12 sheet bulanan. | Seluruh sheet dipetakan ke tabel utama; baris judul, kop, dan blok tanda tangan diabaikan; sidik jari mencegah duplikasi. | **TERVERIFIKASI BERHASIL** |
| **Skenario 7** | Pengguna peran Petugas/Kepsek mencoba menghapus data atau mengakses menu admin. | Server menolak permintaan dengan kode `FORBIDDEN` dan mencatat upaya tidak sah ke Log Aktivitas. | **TERVERIFIKASI BERHASIL** |
| **Skenario 8** | Pengguna membuka aplikasi via handphone (layar vertikal). | Sidebar berubah menjadi drawer tersembunyi, tabel dapat digeser horizontal, tombol nyaman disentuh, upload foto langsung dari kamera. | **TERVERIFIKASI BERHASIL** |

---

## 12. PENCADANGAN (BACKUP) & PEMULIHAN DATA

### Cara Membuat Cadangan Manual:
1. Login sebagai **Administrator**.
2. Buka menu **Cadangan Data**.
3. Klik tombol **Buat Snapshot Cadangan Sekarang**.
4. Sistem menyalin Google Spreadsheet aktif ke folder `Sistem Kerusakan Inventaris SMK Dwijendra/Cadangan Data/` dengan nama timestamp (misal: `Backup_Database_Kerusakan_20261012_114500`).
5. Administrator juga dapat mengklik **Unduh Database format JSON** untuk menyimpan cadangan offline di flashdisk/harddisk lokal.

### Cara Pemulihan Data (Restore):
Jika terjadi kesalahan fatal data pada spreadsheet utama:
1. Buka Google Drive folder `Cadangan Data`.
2. Buka spreadsheet cadangan yang ingin dipulihkan.
3. Salin Spreadsheet ID file cadangan tersebut.
4. Buka editor Apps Script -> *Project Settings* -> ubah nilai properti `SPREADSHEET_ID` ke ID file cadangan tersebut.

---

## 13. KETERBATASAN TEKNIS & TINDAKAN ADMINISTRATOR

1. **Kuota Harian Google Workspace / Akun Gratis:**
   - Google membatasi waktu eksekusi skrip maksimal 6 menit per pemanggilan.
   - Batas unggah file via Apps Script adalah 50 MB per request (aplikasi sudah mengantisipasi ini dengan mengompres foto di browser hingga < 2 MB per foto sebelum dikirim).
2. **Izin Pop-up Browser untuk Cetak:**
   - Pada saat pertama kali mengklik tombol cetak atau ekspor, pastikan peramban tidak memblokir jendela unduh/cetak.
3. **Pembaruan Data Sekolah:**
   - Bila terjadi pergantian Kepala Sekolah atau Wakasek Sarpras di masa depan, Administrator cukup memperbarui nama dan NIK penandatangan melalui halaman **Pengaturan** di aplikasi tanpa perlu menyentuh kode pemrograman.
