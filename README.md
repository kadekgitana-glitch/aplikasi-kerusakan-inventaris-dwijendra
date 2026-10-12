# SISTEM INFORMASI KERUSAKAN INVENTARIS SMK DWIJENDRA DENPASAR

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/kadekgitana-glitch/aplikasi-kerusakan-inventaris-dwijendra)

Aplikasi web administrasi inventaris sekolah modern berbasis **Google Apps Script Web App**, **Google Sheets**, dan **Google Drive** yang dirancang khusus untuk mempermudah tugas **Wakil Kepala Sekolah Bidang Sarana dan Prasarana (Wakasek Sarpras)** dalam melakukan pencatatan, dokumentasi foto kerusakan & hasil perbaikan, pemantauan penanganan, serta pelaporan resmi tanpa biaya server bulanan.

---

## 🌟 Fitur Utama

1. **Dashboard Eksekutif & Analitik:**
   - 6 Kartu statistik otomatis (Total kejadian, Akumulasi barang terdampak, Belum diperbaiki, Sudah diperbaiki, Kejadian bulan berjalan, dan Persentase penyelesaian).
   - 4 Visualisasi grafik interaktif (Tren kerusakan 12 bulan Jan–Des, Status perbaikan donut chart, Top lokasi/ruangan, dan Top jenis barang).
   - Daftar **Perlu Tindak Lanjut** (prioritas barang rusak yang belum ditangani, urut tanggal terlama).
   - Filter dinamis tahun, bulan, ruangan, dan status yang menyelaraskan seluruh kartu dan grafik.

2. **Formulir Input Data Terstruktur (3 Bagian):**
   - **Bagian A (Informasi Barang):** Nomor unik otomatis (`KRS-2026-xxxxx`), autocomplete nama barang, kode inventaris, validasi jumlah minimal 1, pilihan ruangan + opsi penambahan ruangan baru instan.
   - **Bagian B (Informasi Kerusakan):** Uraian konkret kerusakan, tanggal kejadian, unggah multi-foto dengan pratinjau instan sebelum dikirim, dan catatan tambahan.
   - **Bagian C (Informasi Perbaikan):** Tanggal perbaikan dan foto hasil perbaikan (dapat diisi saat selesai diperbaiki).

3. **Aturan Status Perbaikan Otomatis:**
   - Tanggal perbaikan kosong → **"Belum Diperbaiki"** (label merah).
   - Tanggal perbaikan terisi valid → **"Sudah Diperbaiki"** (label hijau).
   - Fitur modal **"✓ Tandai Sudah Diperbaiki"** yang memungkinkan petugas melampirkan tanggal, foto hasil perbaikan, dan catatan teknis tanpa menghapus dokumentasi awal.

4. **Laporan Bulanan & Tahunan Resmi SMK Dwijendra:**
   - **Laporan Bulanan:** Format dokumen dinas 11 kolom persis sesuai standar Excel dinas sekolah, lengkap dengan kop surat dan tanda tangan resmi **Kepala SMK Dwijendra (Ida Ayu Estri Sanjiwani, S.E., M.Pd. / NIK. 530.707.240)** dan **Wakasek Sarpras (I Putu Kartika, S.Pd.)**.
   - Dilengkapi tombol cetak langsung siap kertas **A4 Landscape**, ekspor **Excel (.xlsx)**, dan arsip ke folder Google Drive.
   - **Laporan Tahunan:** Rekapitulasi evaluasi 12 bulan, rekapitulasi per ruangan, persentase penanganan tahunan, dan daftar barang belum selesai.

5. **Impor Workbook Excel Lama (Januari–Desember):**
   - Mendukung pembacaan langsung file Excel lama (*Data Kerusakan Inventaris 2026*) yang memiliki sheet bulanan Januari s/d Desember.
   - Secara cerdas mengabaikan kop dinas, baris kosong, dan blok tanda tangan.
   - Menormalkan tanggal serial Excel, menangani kolom kosong, mendeteksi duplikasi sidik jari (*fingerprint*), serta memberikan laporan hasil impor terperinci.
   - Dilengkapi tombol unduh template Excel resmi.

6. **Keamanan & Autentikasi Mandiri:**
   - Tiga level pengguna: **Administrator**, **Petugas Sarpras**, dan **Kepala Sekolah**.
   - Hashing kata sandi kriptografis **PBKDF2-HMAC-SHA256** (kata sandi tidak disimpan dalam bentuk teks biasa).
   - Sesi berbasis token acak terlindungi di server cache, proteksi penguncian otomatis (lockout) 15 menit jika gagal 5 kali berturut-turut.
   - Opsi login langsung dengan akun Google.

7. **Pencadangan & Pemulihan Data (Backup & Restore):**
   - Pembuatan snapshot Google Spreadsheet cadangan langsung ke folder Google Drive dengan sekali klik.
   - Ekspor database lengkap format JSON untuk arsip offline mandiri.

---

## 🚀 Panduan Memulai Cepat

Silakan baca dokumen lengkap:
👉 **[PANDUAN_PEMASANGAN_DAN_PENGGUNAAN.md](file:///Users/user/Documents/Aplikasi%20Kerusakan%20Inventaris/PANDUAN_PEMASANGAN_DAN_PENGGUNAAN.md)**

### Langkah Singkat:
1. Salin seluruh file dari folder `src/` ke proyek Google Apps Script baru di akun Google sekolah.
2. Jalankan fungsi `setupAplikasi()` di editor skrip untuk inisialisasi otomatis Google Sheets dan Google Drive.
3. Deploy sebagai **Web App** dengan opsi:
   - *Execute as: Me*
   - *Who has access: Anyone*
4. Akses Web App URL dan login dengan akun default:
   - **Admin:** `admin` / `Admin1234!`
   - **Petugas:** `petugas` / `Petugas1234!`
   - **Kepala Sekolah:** `kepsek` / `Kepsek1234!`
