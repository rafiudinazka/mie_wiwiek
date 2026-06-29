# Business Process — Sistem Pemesanan Mandiri Mie Nusantara

> Dokumen ini berisi analisis business process berdasarkan codebase project **kiosk-app-svelte**. Semua diagram menggunakan format **Mermaid** agar bisa langsung di-copy-paste.

---

## 1. Gambaran Umum Sistem

Aplikasi ini adalah **Sistem Pemesanan Mandiri** untuk restoran mie (Karsa Nusantara). Terdapat **3 aktor utama**:

| Aktor | Akses | Deskripsi |
|-------|-------|-----------|
| **Pelanggan** | Halaman utama (`/`) | Memesan makanan secara mandiri melalui layar pemesanan mandiri |
| **Kasir** | `/#/cashier` | Menerima pesanan masuk, cetak struk, dan menyelesaikan pesanan |
| **Pemilik (Admin)** | `/#/admin` (PIN: 1234) | Mengelola produk, kategori, melihat riwayat order, dan dashboard |

### Status Pesanan (Order Lifecycle)

| Status | Deskripsi |
|--------|-----------|
| `pending` | Pesanan dibuat, menunggu pembayaran |
| `confirmed` | Pembayaran berhasil, pesanan masuk ke kasir |
| `completed` | Pesanan sudah diserahkan ke pelanggan |

---

## 2. Use Case Diagram

```mermaid
graph TB
    subgraph Sistem Pemesanan Mandiri Mie Nusantara
        UC1["Lihat Menu & Kategori"]
        UC2["Kustomisasi Produk"]
        UC3["Kelola Keranjang"]
        UC4["Input Data Diri"]
        UC5["Bayar Pesanan"]
        UC6["Lihat Pesanan Masuk"]
        UC7["Cetak Struk"]
        UC8["Selesaikan Pesanan"]
        UC9["Login Admin via PIN"]
        UC10["Kelola Produk (CRUD)"]
        UC11["Kelola Kategori (CRUD)"]
        UC12["Lihat Dashboard & Statistik"]
        UC13["Lihat Riwayat Order"]
        UC14["Terima Notifikasi Pesanan Baru"]
    end

    Pelanggan((Pelanggan))
    Kasir((Kasir))
    Pemilik((Pemilik/Admin))

    Pelanggan --> UC1
    Pelanggan --> UC2
    Pelanggan --> UC3
    Pelanggan --> UC4
    Pelanggan --> UC5

    Kasir --> UC6
    Kasir --> UC7
    Kasir --> UC8
    Kasir --> UC14

    Pemilik --> UC9
    Pemilik --> UC10
    Pemilik --> UC11
    Pemilik --> UC12
    Pemilik --> UC13
```

---

## 3. Business Process — Pelanggan

### 3.1 Deskripsi Proses

1. Pelanggan melihat daftar menu yang ditampilkan di layar pemesanan mandiri
2. Pelanggan dapat memfilter menu berdasarkan kategori (Mie Kuah, Mie Goreng, Topping, Minuman, Cemilan)
3. Pelanggan memilih produk — jika produk memiliki **modifier** (pilihan porsi, level pedas, tambahan, dll.), maka muncul popup kustomisasi
4. Produk ditambahkan ke keranjang belanja
5. Pelanggan membuka **Checkout Modal** dan melakukan:
   - **Step 1**: Review ringkasan pesanan
   - **Step 2**: Input data diri (Nama Lengkap + Nomor HP) — wajib diisi
   - **Step 3**: Proses pembayaran (Midtrans / Simulasi)
   - **Step 4**: Konfirmasi sukses — pelanggan mendapat nomor order dan instruksi menunggu panggilan nama

### 3.2 Activity Diagram — Proses Pemesanan Pelanggan

```mermaid
flowchart TD
    subgraph Pelanggan
        A1([Mulai])
        A2[/Buka Layar Pemesanan/]
        A4[/Pilih Kategori Menu/]
        A6[/Pilih Produk/]
        A8[/Kustomisasi Produk:\nPorsi, Level Pedas,\nJenis Mie, Tambahan/]
        A9[/Atur Jumlah Quantity/]
        A11{Lanjut Belanja?}
        A12[/Buka Keranjang & Checkout/]
        A13[/Review Ringkasan Pesanan/]
        A14[/Input Data Diri:\nNama & No HP/]
        A16[/Klik Bayar Sekarang/]
        A19[/Tunggu Panggilan Nama/]
        A20([Selesai])
    end

    subgraph Sistem
        S1[Tampilkan Halaman Menu]
        S2[Tampilkan Menu\nSesuai Kategori]
        S3{Produk Punya\nModifier?}
        S4[Tampilkan Product\nCustomizer]
        S5[Update Keranjang Belanja]
        S6[Tampilkan Checkout Modal]
        S7{Validasi Data\nDiri}
        S8[Tampilkan Halaman\nPembayaran]
        S9[Proses Pembayaran:\nMidtrans / Simulasi]
        S10{Pembayaran\nBerhasil?}
        S11[Buat Order & Konfirmasi\nStatus → confirmed]
        S12[Tampilkan Pesan Sukses\n& Nomor Order]
        S13[Tampilkan Pesan Gagal]
    end

    A1 --> A2
    A2 --> S1
    S1 --> A4
    A4 --> S2
    S2 --> A6
    A6 --> S3
    S3 -->|Ya| S4
    S4 --> A8
    A8 --> A9
    A9 --> S5
    S3 -->|Tidak| S5
    S5 --> A11
    A11 -->|Ya| S2
    A11 -->|Tidak| A12
    A12 --> S6
    S6 --> A13
    A13 --> A14
    A14 --> S7
    S7 -->|Tidak Valid| A14
    S7 -->|Valid| S8
    S8 --> A16
    A16 --> S9
    S9 --> S10
    S10 -->|Ya| S11
    S11 --> S12
    S12 --> A19
    A19 --> A20
    S10 -->|Tidak| S13
    S13 --> S8
```

---

## 4. Business Process — Kasir

### 4.1 Deskripsi Proses

1. Kasir mengakses halaman kasir (`/#/cashier`)
2. Sistem melakukan **polling** setiap 3 detik untuk mengambil pesanan dengan status `confirmed`
3. Ketika ada pesanan baru masuk, sistem membunyikan **notifikasi suara**
4. Kasir melihat daftar pesanan masuk beserta detail (nama pelanggan, nomor HP, daftar item, modifier, total harga)
5. Kasir dapat:
   - **Cetak Struk**: Mencetak receipt pesanan via printer
   - **Selesaikan Pesanan**: Mengubah status order menjadi `completed` setelah pesanan diserahkan ke pelanggan
6. Riwayat pesanan yang sudah selesai hari ini ditampilkan di sidebar

### 4.2 Activity Diagram — Proses Kerja Kasir

```mermaid
flowchart TD
    subgraph Kasir
        A1([Mulai])
        A2[/Akses Halaman Kasir/]
        A4[/Lihat Detail Pesanan:\nNama, No HP, Item,\nModifier, Total/]
        A5{Pilih Aksi}
        A6[/Klik Cetak Struk/]
        A8[/Siapkan Pesanan Makanan/]
        A9[/Klik Selesaikan Pesanan/]
        A11[/Panggil Nama Pelanggan/]
        A12{Ada Pesanan Lain?}
        A13[/Logout/]
        A14([Selesai])
    end

    subgraph Sistem
        S1[Tampilkan Dashboard Kasir]
        S2[Polling Pesanan Masuk\nSetiap 3 Detik]
        S3{Ada Pesanan\nBaru?}
        S4[Bunyikan Notifikasi Suara]
        S5[Tampilkan Daftar\nPesanan Confirmed]
        S6[Cetak Receipt\nvia Printer]
        S7[Update Status Order\n→ completed]
        S8[Tampilkan di Daftar\nSelesai Hari Ini]
    end

    A1 --> A2
    A2 --> S1
    S1 --> S2
    S2 --> S3
    S3 -->|Tidak| S2
    S3 -->|Ya| S4
    S4 --> S5
    S5 --> A4
    A4 --> A5
    A5 -->|Cetak Struk| A6
    A6 --> S6
    S6 --> A8
    A8 --> A9
    A5 -->|Selesaikan| A9
    A9 --> S7
    S7 --> A11
    A11 --> S8
    S8 --> A12
    A12 -->|Ya| S2
    A12 -->|Tidak| A13
    A13 --> A14
```

---

## 5. Business Process — Pemilik (Admin)

### 5.1 Deskripsi Proses

1. Pemilik mengakses halaman admin (`/#/admin`)
2. Harus login menggunakan **PIN 4 digit** (default: `1234`)
3. Setelah login, pemilik masuk ke **Admin Dashboard** dengan navigasi sidebar:
   - **Dashboard**: Melihat statistik (total produk, total kategori, order hari ini, revenue hari ini, pesanan aktif)
   - **Produk**: Mengelola produk (tambah, edit, hapus, termasuk pengaturan modifier/opsi kustomisasi)
   - **Kategori**: Mengelola kategori menu (tambah, edit, hapus — tidak bisa hapus jika masih ada produk)
   - **Riwayat Order**: Melihat semua pesanan dengan filter status (Semua, Aktif, Selesai) dan detail per order

### 5.2 Activity Diagram — Kelola Dashboard & Statistik

```mermaid
flowchart TD
    subgraph Pemilik
        A1([Mulai])
        A2[/Akses Halaman Admin/]
        A3[/Input PIN 4 Digit/]
        A5[/Pilih Menu Dashboard/]
        A7{Aksi Selanjutnya?}
        A8[/Klik Buka Kasir/]
        A9[/Klik Refresh Data/]
        A10[/Logout/]
        A11([Selesai])
    end

    subgraph Sistem
        S1[Tampilkan Form Login PIN]
        S2{Validasi PIN}
        S3[Tampilkan Error:\nPIN Salah]
        S4[Tampilkan Admin Dashboard]
        S5["Tampilkan Statistik:\n• Total Produk\n• Total Kategori\n• Order Hari Ini\n• Revenue Hari Ini\n• Pesanan Aktif"]
        S6[Redirect ke Halaman Kasir]
        S7[Reload Data Dashboard]
    end

    A1 --> A2
    A2 --> S1
    S1 --> A3
    A3 --> S2
    S2 -->|Tidak Valid| S3
    S3 --> A3
    S2 -->|Valid| S4
    S4 --> A5
    A5 --> S5
    S5 --> A7
    A7 -->|Buka Kasir| A8
    A8 --> S6
    A7 -->|Refresh| A9
    A9 --> S7
    S7 --> S5
    A7 -->|Logout| A10
    A10 --> A11
```

### 5.3 Activity Diagram — Kelola Produk

```mermaid
flowchart TD
    subgraph Pemilik
        A1([Mulai])
        A2[/Pilih Menu Produk/]
        A4{Pilih Aksi}
        A5[/Isi Form Tambah Produk:\nKategori, Nama, Harga,\nDeskripsi, Gambar, Modifier/]
        A6[/Isi Form Edit Produk/]
        A7[/Klik Hapus Produk/]
        A9{Kelola Produk Lagi?}
        A10[/Kembali ke Dashboard/]
        A11([Selesai])
    end

    subgraph Sistem
        S1[Tampilkan Halaman\nKelola Produk]
        S2[Tampilkan Form\nTambah Produk]
        S3[Simpan Produk Baru\nke Database]
        S4[Tampilkan Form\nEdit Produk]
        S5[Update Data Produk\ndi Database]
        S6{Konfirmasi\nHapus?}
        S7[Hapus Produk\ndari Database]
        S8[Refresh Daftar Produk]
    end

    A1 --> A2
    A2 --> S1
    S1 --> A4
    A4 -->|Tambah| S2
    S2 --> A5
    A5 --> S3
    S3 --> S8
    A4 -->|Edit| S4
    S4 --> A6
    A6 --> S5
    S5 --> S8
    A4 -->|Hapus| A7
    A7 --> S6
    S6 -->|Ya| S7
    S7 --> S8
    S6 -->|Tidak| S1
    S8 --> A9
    A9 -->|Ya| S1
    A9 -->|Tidak| A10
    A10 --> A11
```

### 5.4 Activity Diagram — Kelola Kategori

```mermaid
flowchart TD
    subgraph Pemilik
        A1([Mulai])
        A2[/Pilih Menu Kategori/]
        A4{Pilih Aksi}
        A5[/Isi Form Tambah Kategori:\nID, Label, Urutan/]
        A6[/Isi Form Edit Kategori/]
        A7[/Klik Hapus Kategori/]
        A9{Kelola Kategori Lagi?}
        A10[/Kembali ke Dashboard/]
        A11([Selesai])
    end

    subgraph Sistem
        S1[Tampilkan Halaman\nKelola Kategori]
        S2[Tampilkan Form\nTambah Kategori]
        S3[Simpan Kategori Baru\nke Database]
        S4[Tampilkan Form\nEdit Kategori]
        S5[Update Data Kategori\ndi Database]
        S6{Kategori Masih\nPunya Produk?}
        S7[Hapus Kategori\ndari Database]
        S8[Tampilkan Error:\nTidak Bisa Hapus]
        S9[Refresh Daftar Kategori]
    end

    A1 --> A2
    A2 --> S1
    S1 --> A4
    A4 -->|Tambah| S2
    S2 --> A5
    A5 --> S3
    S3 --> S9
    A4 -->|Edit| S4
    S4 --> A6
    A6 --> S5
    S5 --> S9
    A4 -->|Hapus| A7
    A7 --> S6
    S6 -->|Ya| S8
    S8 --> S1
    S6 -->|Tidak| S7
    S7 --> S9
    S9 --> A9
    A9 -->|Ya| S1
    A9 -->|Tidak| A10
    A10 --> A11
```

### 5.5 Activity Diagram — Lihat Riwayat Order

```mermaid
flowchart TD
    subgraph Pemilik
        A1([Mulai])
        A2[/Pilih Menu Riwayat Order/]
        A4[/Pilih Filter Status/]
        A6[/Klik Lihat Detail Order/]
        A8{Lihat Order Lain?}
        A9[/Kembali ke Dashboard/]
        A10([Selesai])
    end

    subgraph Sistem
        S1[Tampilkan Halaman\nRiwayat Order]
        S2[Tampilkan Daftar Order\nSesuai Filter:\nSemua / Aktif / Selesai]
        S3[Tampilkan Detail Order:\nPelanggan, Item,\nModifier, Total, Status]
        S4[Tutup Modal Detail]
    end

    A1 --> A2
    A2 --> S1
    S1 --> A4
    A4 --> S2
    S2 --> A6
    A6 --> S3
    S3 --> A8
    A8 -->|Ya| S4
    S4 --> S2
    A8 -->|Tidak| A9
    A9 --> A10
```

---

## 6. Sequence Diagram — Alur Pemesanan Lengkap (Interaksi Antar Sistem)

```mermaid
sequenceDiagram
    actor P as Pelanggan
    participant K as Frontend Pemesanan
    participant B as Backend API
    participant DB as Database (SQLite)
    participant PG as Payment Gateway
    actor KS as Kasir

    Note over P,KS: === FASE 1: PEMESANAN ===

    P->>K: Buka halaman pemesanan
    K->>B: GET /api/products
    B->>DB: SELECT * FROM products
    DB-->>B: Daftar produk
    B-->>K: JSON produk + modifiers
    K-->>P: Tampilkan menu

    P->>K: Pilih produk + kustomisasi
    P->>K: Tambah ke keranjang
    P->>K: Buka checkout

    Note over P,KS: === FASE 2: INPUT DATA & BAYAR ===

    P->>K: Input nama & no HP
    K->>K: Validasi data diri
    P->>K: Klik "Bayar Sekarang"

    K->>B: POST /api/orders (items, total, nama, HP)
    B->>DB: INSERT INTO orders (status='pending')
    B->>DB: INSERT INTO order_items
    DB-->>B: orderId
    B-->>K: { orderId }

    K->>B: POST /api/orders/:id/pay
    B->>PG: createPayment(orderId, amount, customer)

    alt Midtrans Gateway
        PG-->>B: { snapToken }
        B-->>K: { snapToken }
        K->>P: Tampilkan Midtrans Snap Popup
        P->>PG: Pilih metode & bayar (QRIS/GoPay/Transfer)
        PG-->>K: onSuccess callback
        K->>B: POST /api/orders/:id/confirm-payment
        B->>DB: UPDATE orders SET status='confirmed'
    else Simulated Gateway
        PG-->>B: { success, transactionId }
        B->>DB: UPDATE orders SET status='confirmed'
        B-->>K: { success }
    end

    K-->>P: Tampilkan "Pesanan Dikonfirmasi! Order #X"

    Note over P,KS: === FASE 3: KASIR PROSES ===

    loop Polling setiap 3 detik
        KS->>B: GET /api/orders/confirmed
        B->>DB: SELECT * FROM orders WHERE status='confirmed'
        DB-->>B: Daftar pesanan
        B-->>KS: JSON orders + items
    end

    Note over KS: 🔔 Notifikasi suara jika ada pesanan baru

    KS->>KS: Lihat detail pesanan
    KS->>KS: Cetak struk (window.print)
    KS->>KS: Siapkan makanan

    KS->>B: PUT /api/orders/:id/complete
    B->>DB: UPDATE orders SET status='completed'
    DB-->>B: Success
    B-->>KS: { success }

    KS->>P: Panggil nama pelanggan
    P->>KS: Ambil pesanan
```

---

## 7. State Diagram — Siklus Hidup Pesanan (Order)

```mermaid
stateDiagram-v2
    [*] --> Pending: Pelanggan buat pesanan\n(POST /api/orders)

    Pending --> Confirmed: Pembayaran berhasil\n(Simulated / Midtrans)
    Pending --> Failed: Pembayaran gagal\n(Midtrans onError)
    Pending --> Pending: Pembayaran dibatalkan\n(User tutup popup)

    Confirmed --> Completed: Kasir selesaikan pesanan\n(PUT /api/orders/:id/complete)

    Failed --> [*]: Order gagal

    Completed --> [*]: Pesanan selesai

    note right of Pending
        payment_status = 'pending'
        Menunggu pembayaran
    end note

    note right of Confirmed
        payment_status = 'success'
        Muncul di layar kasir
    end note

    note right of Completed
        Pesanan diserahkan
        Masuk riwayat hari ini
    end note
```

---

## 8. Matriks RACI (Responsibility Assignment)

| Proses | Pelanggan | Kasir | Pemilik/Admin |
|--------|:---------:|:-----:|:-------------:|
| Lihat menu & kategori | **R** | — | — |
| Kustomisasi produk | **R** | — | — |
| Input data diri | **R** | — | — |
| Bayar pesanan | **R** | — | — |
| Terima pesanan masuk | — | **R** | **I** |
| Cetak struk | — | **R** | — |
| Selesaikan pesanan | **I** | **R** | — |
| Kelola produk (CRUD) | — | — | **R** |
| Kelola kategori (CRUD) | — | — | **R** |
| Lihat dashboard & statistik | — | — | **R** |
| Lihat riwayat order | — | **C** | **R** |
| Login admin | — | — | **R** |

> **R** = Responsible (Pelaksana), **A** = Accountable, **C** = Consulted, **I** = Informed

---

## 9. Ringkasan Teknologi yang Digunakan

| Komponen | Teknologi |
|----------|-----------|
| Frontend | Svelte + Vite |
| Backend | Express.js (Node.js) |
| Database | SQLite (better-sqlite3) |
| Payment Gateway | Midtrans Snap / Simulated |
| Styling | CSS Custom Properties (Dark Theme) |
| Icons | Lucide Svelte |
| Routing | Hash-based routing (`window.location.hash`) |

---

## 10. Catatan Penting

1. **Autentikasi Admin** menggunakan PIN hardcoded (`1234`) — belum ada sistem token/session yang persisten.
2. **Payment Gateway** mendukung dua mode: `simulated` (untuk development) dan `midtrans` (untuk production).
3. **Kasir** tidak memerlukan login — langsung akses via URL `/#/cashier`.
4. **Polling** digunakan kasir untuk refresh pesanan (interval 3 detik) — bukan WebSocket/real-time.
5. **Webhook Midtrans** tersedia di `POST /api/payment/webhook` tetapi tidak bisa digunakan di localhost (fallback ke frontend callback).
6. **Kategori** tidak bisa dihapus jika masih memiliki produk yang terkait.
