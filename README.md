# NextByte Tools - Multi Tools Platform

Platform utilitas online modern, minimalis, dan profesional yang dirancang menggunakan **Next.js 15 (App Router)**, **TypeScript**, **Tailwind CSS**, dan **Supabase**.

## 🚀 Fitur Unggulan

### 1. Advanced QR Code Generator (Aktif Penuh)
- **Multi-Format Input:** URL, Teks Bebas, Email (mailto template), Telepon, WhatsApp (direct chat), Wi-Fi (SSID, password, enkripsi WPA/WEP/None), dan SMS.
- **Custom Shapes & Dots:** Square, Rounded, Dots, Classy, Classy Rounded, Extra Rounded.
- **Custom Corner Shapes:** Outer Corner (Square, Rounded, Dot) dan Inner Corner Dot (Square, Dot).
- **Custom Colors:** Foreground, Background, Transparent Background toggle, Custom Corner Colors, serta 8 palet warna preset modern.
- **Custom Logo:** Upload kustom (PNG, JPG, SVG, WebP) dengan drag & drop, pengaturan ukuran (size), padding, background shape (lingkaran putih/kotak putih), serta 6 ikon preset siap pakai (WhatsApp, Wi-Fi, GitHub, Link, Email, NextByte).
- **Custom Scan Frames:** Template Scan Me, Scan Here, Point Camera Here, Bubble (top/bottom), Card Banner, Minimal Border, Camera Viewfinder dengan kustomisasi teks, warna, padding, dan posisi banner.
- **Custom Sub-Text:** Teks keterangan di bawah QR Code dengan pilihan ukuran font, jenis font (sans, mono, serif, display), ketebalan (regular, semibold, bold), perataan (left, center, right), dan jarak margin.
- **Live Preview:** Visualisasi instan dengan pemilih backdrop (Checkerboard transparan, Light, Dark).
- **High-Res Export:** Ekspor hasil utuh (QR + Logo + Frame + Text) ke dalam format **PNG**, **SVG**, dan **JPG** dengan resolusi **1x (300px)**, **2x (600px HD)**, dan **4x (1200px Print Ready)**.
- **Direct Copy to Clipboard:** Salin gambar QR Code langsung ke clipboard sistem operasi.
- **Riwayat Konfigurasi:** Riwayat tersimpan otomatis di browser (LocalStorage) dan siap sinkron ke Supabase.

### 2. Multi-Tools Architecture (Katalog & Coming Soon)
- Sistem registrasi tools terpusat di `src/config/tools.ts`.
- Katalog lengkap di `/tools` dengan filter kategori dan pencarian instan (Ctrl/Cmd + K).
- Halaman dinamis `/tools/[slug]` untuk roadmap tools masa depan (Password Generator, JSON Formatter, Image Compressor, PDF Tools, dll).
- Halaman About di `/about`.

### 3. Light Mode & Dark Mode
- Beralih tema secara mulus dengan penyimpanan preferensi di LocalStorage.

---

## 🛠️ Menjalankan Proyek Secara Lokal

```bash
# 1. Pindah ke direktori proyek
cd nextbyte-tools

# 2. Jalankan development server
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000) di browser Anda.

---

## 🗄️ Menghubungkan ke Supabase (Opsional)

1. Buat proyek baru di [Supabase Dashboard](https://supabase.com).
2. Di SQL Editor Supabase, buat tabel untuk riwayat QR code:
   ```sql
   create table qr_history (
     id text primary key,
     name text not null,
     type text not null,
     content text not null,
     config jsonb not null,
     created_at timestamp with time zone default timezone('utc'::text, now()) not null
   );

   -- Buka hak akses baca/tulis untuk anonim (opsional)
   alter table qr_history enable row level security;
   create policy "Allow anonymous all" on qr_history for all using (true) with check (true);
   ```
3. Salin kredensial dari **Project Settings > API**:
   - `Project URL`
   - `anon public key`
4. Buat file `.env.local` di root proyek:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
   ```
5. Restart dev server. Riwayat sekarang otomatis tersimpan di cloud Supabase! *(Jika tanpa `.env.local`, aplikasi otomatis menggunakan LocalStorage sehingga tetap berfungsi 100%)*.

---

## 🌐 Deploy ke Vercel dengan Custom Domain (`nextbyte.biz.id`)

1. Upload kode ini ke repository **GitHub** pribadi Anda.
2. Buka dashboard [Vercel](https://vercel.com) dan klik **Add New > Project**.
3. Hubungkan repository GitHub tersebut lalu klik **Deploy** (tanpa kartu kredit).
4. Setelah web selesai di-deploy, buka **Settings > Domains** di Vercel:
   - Tambahkan domain `nextbyte.biz.id` (dan/atau `aldiabdullah.biz.id`).
5. Di panel DNS IDwebhost/Cloudflare Anda:
   - A Record: arahkan `@` ke IP `76.76.21.21`
   - CNAME Record: arahkan `www` ke `cname.vercel-dns.com`
6. Vercel akan otomatis menerbitkan sertifikat SSL HTTPS gratis!
