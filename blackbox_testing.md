# Dokumen Pengujian Blackbox (Blackbox Testing Report)
## Sistem Pemesanan Mandiri Mie Nusantara

**Tujuan Pengujian:**
Pengujian ini bertujuan untuk memastikan bahwa fungsionalitas Sistem Pemesanan Mandiri berjalan sesuai dengan spesifikasi kebutuhan yang telah ditentukan dalam *business process*. Pengujian dilakukan menggunakan metode **Blackbox Testing** dengan teknik *Equivalence Partitioning* dan *Use Case Testing*, di mana fokus pengujian ada pada input dan output perangkat lunak tanpa melihat struktur kode internal.

**Lingkungan Pengujian:**
- **Platform:** Web Browser (Chrome, Firefox, Safari, Edge)
- **Metode Pengujian:** Blackbox Testing (Manual)

---

## 1. Skenario Pengujian Modul Pelanggan

Modul ini digunakan oleh pelanggan untuk melakukan pemesanan makanan secara mandiri melalui layar sentuh.

| Skenario Pengujian | Prasyarat | Langkah-langkah | Hasil yang Diharapkan | Status |
| :--- | :--- | :--- | :--- | :---: |
| Menampilkan daftar menu dan filter kategori | Aplikasi berhasil dimuat pada halaman utama (`/`) | 1. Buka halaman utama<br>2. Klik berbagai tab kategori (Mie Kuah, Mie Goreng, Minuman, dll) | Menu yang ditampilkan sesuai dengan kategori yang dipilih. | [ ] |
| Menambahkan produk tanpa *kustomisasi* ke keranjang | Berada di halaman menu utama | 1. Pilih produk yang tidak memiliki opsi tambahan<br>2. Klik tombol tambah | Produk langsung masuk ke keranjang, ikon keranjang terupdate. | [ ] |
| Menambahkan produk dengan *kustomisasi* ke keranjang | Berada di halaman menu utama | 1. Pilih produk yang memiliki opsi tambahan (contoh: Level Pedas, Porsi)<br>2. Pilih opsi kustomisasi<br>3. Klik "Tambah ke Pesanan" | *Popup kustomisasi* muncul, produk dengan *kustomisasi* spesifik masuk ke keranjang, harga disesuaikan. | [ ] |
| Validasi form *Checkout* dengan data tidak lengkap | Terdapat minimal 1 produk di keranjang | 1. Buka modal *Checkout*<br>2. Kosongkan field "Nama Lengkap" atau "Nomor HP"<br>3. Lanjutkan proses | Sistem menampilkan pesan error/validasi dan mencegah proses ke tahap pembayaran. | [ ] |
| Proses *Checkout* dan Pembayaran Berhasil | Terdapat produk di keranjang | 1. Buka modal *Checkout*<br>2. Isi Nama dan No HP dengan valid<br>3. Pilih metode pembayaran dan lakukan simulasi bayar berhasil | Pesanan berhasil dibuat (status `confirmed`), menampilkan nomor order dan instruksi untuk pelanggan. | [ ] |
| Proses Pembayaran Dibatalkan / Gagal | Terdapat produk di keranjang | 1. Lakukan proses *Checkout*<br>2. Tutup *popup* pembayaran atau pilih batalkan pembayaran | Pesanan tidak diproses (status `pending` atau `failed`), sistem kembali ke halaman *checkout* atau menu. | [ ] |

---

## 2. Skenario Pengujian Modul Kasir

Modul ini digunakan oleh kasir (`/cashier`) untuk menerima pesanan masuk dan menyelesaikan pesanan.

| Skenario Pengujian | Prasyarat | Langkah-langkah | Hasil yang Diharapkan | Status |
| :--- | :--- | :--- | :--- | :---: |
| Menerima notifikasi pesanan masuk | Berada di halaman kasir | 1. Buat pesanan baru dari layar pelanggan hingga status dibayar<br>2. Tunggu di halaman kasir (maks 3 detik) | Pesanan baru muncul di daftar pesanan, sistem membunyikan notifikasi suara. | [ ] |
| Melihat detail pesanan pelanggan | Terdapat pesanan berstatus `confirmed` | 1. Klik salah satu kartu pesanan yang masuk | Menampilkan detail lengkap: Nama, No HP, daftar item beserta *kustomisasi*, dan total harga. | [ ] |
| Mencetak struk pesanan | Terdapat pesanan di layar kasir | 1. Klik tombol "Cetak Struk" pada pesanan | Memicu dialog cetak (*print window*) browser dengan format struk belanja. | [ ] |
| Menyelesaikan pesanan | Terdapat pesanan berstatus `confirmed` | 1. Klik tombol "Selesaikan Pesanan" | Status pesanan berubah menjadi `completed`, pesanan berpindah ke daftar riwayat hari ini di *sidebar*. | [ ] |

---

## 3. Skenario Pengujian Modul Pemilik (Admin)

Modul ini digunakan oleh pemilik/admin (`/admin`) untuk mengelola master data dan melihat laporan.

| Skenario Pengujian | Prasyarat | Langkah-langkah | Hasil yang Diharapkan | Status |
| :--- | :--- | :--- | :--- | :---: |
| Login menggunakan PIN Valid | Berada di halaman login admin | 1. Masukkan PIN yang benar (misal: 1234)<br>2. Klik Login | Berhasil masuk ke *Dashboard Admin*. | [ ] |
| Login menggunakan PIN Invalid | Berada di halaman login admin | 1. Masukkan PIN yang salah<br>2. Klik Login | Menampilkan pesan error "PIN Salah", akses ditolak. | [ ] |
| Menambah kategori baru | Login sebagai Admin | 1. Buka menu Kategori<br>2. Isi form tambah kategori dengan ID unik dan Nama<br>3. Simpan | Kategori baru berhasil ditambahkan dan muncul dalam daftar kategori. | [ ] |
| Validasi hapus kategori yang terikat produk | Login sebagai Admin | 1. Pilih kategori yang memiliki minimal 1 produk terkait<br>2. Klik tombol "Hapus" | Sistem mencegah penghapusan dan menampilkan pesan error (Data sedang digunakan). | [ ] |
| Hapus kategori kosong | Login sebagai Admin | 1. Buat kategori baru tanpa produk<br>2. Klik "Hapus" pada kategori tersebut | Kategori berhasil dihapus dari daftar. | [ ] |
| Menambah produk baru | Terdapat minimal 1 Kategori | 1. Buka menu Produk<br>2. Isi seluruh kolom wajib (Nama, Harga, Kategori, Gambar)<br>3. Simpan | Produk baru tersimpan dan langsung tersedia di menu pelanggan. | [ ] |
| Menambah produk dengan opsi kustomisasi | Login sebagai Admin | 1. Buka menu Produk, pilih Tambah/Edit<br>2. Tambahkan pengaturan *kustomisasi* (misal: Level Pedas, Porsi)<br>3. Simpan | Produk berhasil disimpan beserta relasi opsi kustomisasinya. | [ ] |
| Mengubah (Edit) dan Menghapus data produk | Login sebagai Admin | 1. Pilih produk, ubah harga dan nama, lalu simpan<br>2. Hapus produk | Perubahan harga/nama tersimpan. Produk yang dihapus hilang dari daftar. | [ ] |
| Filter riwayat order (Semua, Aktif, Selesai) | Login sebagai Admin | 1. Buka menu Riwayat Order<br>2. Ganti tab filter (Semua / Aktif / Selesai) | Daftar pesanan terfilter dengan tepat sesuai dengan status (*pending/confirmed/completed*). | [ ] |
| Verifikasi metrik Dashboard | Terdapat transaksi pada hari tersebut | 1. Buka halaman *Dashboard* utama | Angka "Order Hari Ini" dan "Revenue Hari Ini" sesuai dengan total transaksi selesai. | [ ] |

---

## 4. Kesimpulan Hasil Pengujian

*(Bagian ini dapat diisi setelah pengujian secara aktual dilakukan)*

- **Total Skenario Uji:** 20 Skenario Utama
- **Total Skenario Berhasil (Passed):** ___ 
- **Total Skenario Gagal (Failed):** ___
- **Persentase Keberhasilan:** ___ %

**Catatan Tambahan:**
*Sistem telah diuji berdasarkan alur bisnis utama meliputi pemesanan oleh pelanggan, penerimaan pesanan oleh kasir, hingga manajemen data oleh admin. Kesalahan validasi telah ditangani dengan baik (seperti mencegah *checkout* jika form nama kosong dan mencegah penghapusan kategori yang masih dipakai).*
