# JASTIP — fitur dan setup terbaru

## Fitur yang ditambahkan
- Pilihan warna produk berasal dari data produk dan ikut tersimpan di item pesanan/backoffice.
- Stok divalidasi saat checkout dan dikurangi saat admin mengonfirmasi `Purchased`. Transisi status mencegah pengurangan ulang untuk pesanan yang sama.
- Produk dengan stok 0 ditandai `SOLD OUT`, gambar dibuat grayscale, dan tombol pembelian dinonaktifkan. Stok bisa diedit dari Backoffice.
- Backoffice bisa mengedit nama, deskripsi, kategori, stok, harga modal, rating, dan warna produk.
- Backoffice punya filter status pesanan dan pencarian berdasarkan ID, nama, nomor HP, alamat, dan produk.
- Mata uang ditampilkan sebagai Rupiah. Untuk menjaga angka data demo yang sebelumnya ditulis sebagai dolar, nilai lama ditampilkan dalam ribuan Rupiah (misalnya nilai 125 ditampilkan Rp125.000). Input harga modal di backoffice juga memakai satuan ribuan Rupiah.
- Keranjang menggunakan ikon keranjang, bukan label Bag.
- Filter harga maksimum dan warna tersedia di Shop.
- Halaman akun dengan daftar/login/logout dan edit profil. Data profil dapat mengisi nama, nomor HP, dan alamat di checkout; form checkout tetap bisa diedit.
- Halaman ulasan hanya menerima produk dari pesanan berstatus `DELIVERED`, menyimpan ulasan ke backend, dan mencegah ulasan kedua untuk pasangan pesanan/produk yang sama.
- Kupon apresiasi 5% dibuat setelah ulasan berhasil, bisa dimasukkan saat checkout, dan ditandai terpakai setelah pesanan terkirim.
- Checkout menampilkan instruksi untuk menulis alamat secara detail dan menghubungi owner jika alamat berubah.

## Langkah wajib sebelum deploy
1. **Backup database Supabase** terlebih dahulu.
2. Buka Supabase SQL Editor, lalu jalankan `supabase/schema.sql` versi terbaru. Ini menambahkan kolom `products.colors` dan tabel `customer_accounts` serta `reviews`. Jangan jalankan migrasi di database produksi tanpa backup.
3. Pastikan backend memiliki environment variables yang sudah ada: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_UPLOAD_PRESET`, `ADMIN_USERNAME`, `ADMIN_PASSWORD`, `ADMIN_TOKEN`, dan `CORS_ORIGIN`. Jangan pernah mengunggah `.env` atau service-role key ke GitHub.
4. Pastikan `VITE_API_URL` di Vercel menunjuk ke URL backend yang aktif. URL ngrok gratis dapat berubah ketika tunnel restart.
5. Jalankan `npm install` (atau `npm ci`) di folder project, lalu `npm run build` untuk memeriksa frontend. Untuk Backoffice: `npm run build:backoffice`.
6. Commit/push perubahan, lalu redeploy project frontend dan backoffice di Vercel.

## Catatan teknis
- Backend menyimpan sesi login pelanggan di memori proses; pengguna perlu login kembali setelah backend restart. Untuk produksi jangka panjang, gunakan session/token persisten atau penyedia auth khusus.
- Harga produk masih menggunakan satuan internal ribuan Rupiah demi kompatibilitas dengan data demo lama. Jika ingin menyimpan angka Rupiah penuh di database, perlu migrasi harga dan perhitungan seluruh total secara konsisten terlebih dahulu.
- Pembayaran QR pada project ini masih berupa alur prototipe yang menerima bukti transfer, bukan integrasi payment gateway yang memverifikasi transaksi otomatis.
- Backend ngrok gratis cocok untuk demo, bukan layanan produksi permanen.
