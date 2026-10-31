# Cloudflare Signaling Worker untuk Nextbyte Send

Worker ini adalah server pensinyalan (*signaling server*) berbasis **Cloudflare Workers + Durable Objects** untuk memfasilitasi jabat tangan WebRTC (SDP Offer/Answer & ICE Candidates) pada fitur **Nextbyte Send**.

> [!NOTE]
> Worker ini **hanya** meneruskan teks kode koneksi (SDP & ICE) antarperangkat. Tidak ada data isi file yang lewat atau disimpan di Cloudflare.

---

## Cara Deployment ke Cloudflare Workers

### 1. Prasyarat
Pastikan Anda telah menginstal Node.js dan memiliki akun [Cloudflare](https://dash.cloudflare.com/).

### 2. Login ke Cloudflare via Terminal
Buka terminal di folder ini (`cloudflare-signaling-worker`):
```bash
npx wrangler login
```

### 3. Deploy Worker
Jalankan perintah berikut:
```bash
npx wrangler deploy
```

Setelah berhasil, Anda akan mendapatkan URL publik Worker, misalnya:
`https://nextbyte-send-signaling.<subdomain>.workers.dev`

### 4. Konfigurasi di Next.js (Opsional jika ingin mengganti Supabase ke Cloudflare)
Buka file `.env.local` atau Vercel Environment Variables project NextByte, lalu masukkan:
```env
NEXT_PUBLIC_SEND_SIGNALING_URL=wss://nextbyte-send-signaling.<subdomain>.workers.dev
```
