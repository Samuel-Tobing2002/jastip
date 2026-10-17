# Deployment Guide

Target deploy yang dipakai:

- Database: Supabase
- Image upload: Cloudinary
- Backend: Koyeb
- Frontend customer: Vercel
- Backoffice admin: Vercel project terpisah

## 1. Setup Supabase

1. Buat project baru di Supabase.
2. Buka SQL Editor.
3. Jalankan file [supabase/schema.sql](./supabase/schema.sql).
4. Ambil value berikut dari Project Settings > API:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`

Gunakan `service_role` hanya di backend Koyeb. Jangan taruh key ini di frontend atau backoffice.

## 2. Setup Cloudinary

1. Buat akun Cloudinary.
2. Ambil `Cloud name` untuk `CLOUDINARY_CLOUD_NAME`.
3. Buka Settings > Upload > Upload presets.
4. Buat unsigned upload preset.
5. Isi nama preset ke `CLOUDINARY_UPLOAD_PRESET`.

## 3. Deploy Backend ke Koyeb

Build command:

```bash
npm install
```

Run command:

```bash
npm run start
```

Environment variables di Koyeb:

```bash
PORT=8000
ADMIN_USERNAME=admin
ADMIN_PASSWORD=ganti-password-production
ADMIN_TOKEN=ganti-token-random-panjang
CORS_ORIGIN=*
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_UPLOAD_PRESET=your-unsigned-upload-preset
```

Health check path:

```bash
/api/health
```

Setelah deploy, buka:

```bash
https://backend-kamu.koyeb.app/api/health
```

Respons production yang benar harus menunjukkan:

```json
{
  "ok": true,
  "database": "supabase",
  "databaseStatus": "connected",
  "imageStorage": "cloudinary",
  "warnings": []
}
```

## 4. Deploy Frontend ke Vercel

Environment variable:

```bash
VITE_API_URL=https://backend-kamu.koyeb.app
```

Build command:

```bash
npm run build
```

Output directory:

```bash
dist
```

## 5. Deploy Backoffice ke Vercel

Backoffice sebaiknya dibuat sebagai project Vercel terpisah.

Environment variable:

```bash
VITE_API_URL=https://backend-kamu.koyeb.app
```

Build command:

```bash
npm run build:backoffice
```

Output directory:

```bash
dist-backoffice
```

Login backoffice memakai env backend:

- Username: `ADMIN_USERNAME`
- Password: `ADMIN_PASSWORD`

## Verifikasi setelah deploy

1. Buka `/api/health` pada URL Koyeb.
2. Pastikan `ok` bernilai `true`, `database` bernilai `supabase`, `databaseStatus` bernilai `connected`, dan `imageStorage` bernilai `cloudinary`.
3. Pastikan `warnings` kosong. Jika tidak kosong, ikuti isi warning sebelum menganggap konfigurasi production selesai.
4. Buka `/api/products`. Respons harus berupa array JSON. Array kosong berarti koneksi API berjalan tetapi belum ada produk di tabel Supabase.
5. Setelah mengatur `VITE_API_URL` di Vercel, lakukan redeploy frontend dan backoffice karena variabel Vite dimasukkan saat build.

Catatan: transaksi checkout dan riwayat transaksi pada versi ini masih disimpan di `localStorage` browser, bukan di Supabase. Data transaksi tidak otomatis tersinkron antar perangkat/browser.

## Local Development

Kalau env Supabase/Cloudinary belum diisi, backend otomatis fallback ke JSON lokal dan upload folder lokal. Penyimpanan lokal pada hosting seperti Koyeb bisa bersifat sementara dan bukan pengganti Supabase/Cloudinary untuk production.

```bash
npm install
npm run backend
npm run dev
npm run backoffice
```
