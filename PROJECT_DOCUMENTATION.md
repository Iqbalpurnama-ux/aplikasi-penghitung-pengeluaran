# 📒 Kash - Dokumentasi Proyek Lengkap

Kash adalah aplikasi manajemen keuangan pribadi (Personal Finance Manager) yang dirancang dengan estetika **Comic-Style** yang unik, modern, dan interaktif. Aplikasi ini dibangun untuk membantu pengguna mencatat transaksi, memantau statistik, mengelola hutang, dan mencapai target tabungan dengan pengalaman pengguna yang menyenangkan.

---

## 🚀 1. Gambaran Umum Proyek
- **Nama Aplikasi**: Kash (Rebranded dari Hematly)
- **Tujuan**: Membantu pengguna mengelola dompet digital/fisik dengan pencatatan yang rapi dan visualisasi data yang menarik.
- **Platform**: Web (PWA) & Mobile (Android/iOS via Capacitor).
- **Desain**: *Signature Comic-Style* (Garis tepi tebal, warna kontras, dan bayangan blok).

---

## ✨ 2. Fitur Utama
Aplikasi ini dibagi menjadi beberapa tab fungsional utama:

### A. Dashboard (Beranda)
- **Ringkasan Saldo**: Menampilkan total saldo, pemasukan, dan pengeluaran bulan ini.
- **Visualisasi Statistik**: Grafik interaktif (menggunakan Recharts) untuk melihat tren keuangan.
- **Catatan Cepat**: Akses mudah untuk menambah transaksi baru.

### B. Transaksi (History)
- **Log Riwayat**: Daftar lengkap transaksi yang dikelompokkan berdasarkan tanggal.
- **Kategori**: Pencatatan berdasarkan kategori (makanan, transportasi, belanja, dll).
- **Filter & Search**: Memudahkan pencarian transaksi lama.

### C. Goals (Target Tabungan)
- **Manajemen Target**: Menetapkan tujuan finansial (misal: Beli Laptop, Liburan).
- **Progress Tracking**: Bar progres visual untuk melihat seberapa dekat pengguna dengan targetnya.

### D. Debts (Hutang & Piutang)
- **Pencatatan Hutang**: Melacak uang yang dipinjam atau dipinjamkan.
- **Status Pelunasan**: Menandai hutang yang sudah lunas atau masih berjalan.

### E. Settings (Pengaturan)
- **Kustomisasi Tema**: Pengaturan Dark Mode / Light Mode.
- **Manajemen Data**: Opsi untuk ekspor/impor atau reset data.
- **Profil**: Pengaturan identitas pengguna.

---

## 🛠️ 3. Teknologi yang Digunakan
Aplikasi ini menggunakan teknologi modern terbaik untuk performa dan estetika:

| Teknologi | Kegunaan |
| :--- | :--- |
| **React 19** | Library utama untuk antarmuka pengguna (UI). |
| **Vite** | Build tool super cepat untuk pengembangan frontend. |
| **Tailwind CSS** | Styling utility-first untuk desain *Comic-Style*. |
| **Framer Motion** | Animasi halus dan mikro-interaksi. |
| **Capacitor** | Mengubah web app menjadi aplikasi Android & iOS asli. |
| **Lucide React** | Set ikon yang modern dan konsisten. |
| **Recharts** | Library grafik untuk visualisasi data keuangan. |

---

## 🪜 4. Tahapan Pembuatan (Roadmap Pengembangan)

### Tahap 1: Inisialisasi & Arsitektur
- Setup project menggunakan Vite + React + TypeScript.
- Konfigurasi Tailwind CSS dan struktur folder (`components`, `lib`, `tabs`).
- Setup PWA (Progressive Web App) agar bisa di-install di HP tanpa store.

### Tahap 2: Implementasi Design System
- Membuat token warna dan variabel CSS untuk gaya "Comic-Style".
- Pembuatan komponen global (Button, Card, Input) dengan desain garis tepi tebal (border-2 atau border-4).

### Tahap 3: Logika Inti Keuangan
- Pembuatan state management untuk menyimpan transaksi.
- Implementasi kalkulasi otomatis (Saldo = Total Pemasukan - Total Pengeluaran).
- Penanganan format mata uang (IDR).

### Tahap 4: Visualisasi & Animasi
- Integrasi Recharts untuk grafik Dashboard.
- Penambahan animasi transisi antar tab menggunakan Framer Motion agar terasa "hidup".
- Pembuatan *Splash Screen* yang menarik saat aplikasi dibuka.

### Tahap 5: Integrasi Mobile (Capacitor)
- Inisialisasi Capacitor di dalam proyek.
- Penambahan platform Android dan iOS.
- Sinkronisasi aset web ke folder native.

---

## 📦 5. Cara Menjalankan Proyek

### Pengembangan (Development)
```bash
npm run dev
```

### Produksi (Build)
```bash
npm run build
```

### Menjalankan di Android
1. Build file web: `npm run build`
2. Sync ke Android: `npx cap sync`
3. Buka Android Studio: `npx cap open android`

---

## 🎨 6. Filosofi Desain
Kash tidak ingin terlihat seperti aplikasi bank yang kaku. Dengan gaya **Comic/Neo-Brutalism**, aplikasi ini memberikan kesan berani, ceria, namun tetap profesional dan sangat mudah dibaca (*legible*).
