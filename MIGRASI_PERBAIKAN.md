# Catatan Perbaikan JASTIP

## Yang berubah
- Swatch warna produk memakai pemetaan nama warna Indonesia/Inggris agar `Hitam/Black`, `Putih/White`, dan `Abu-abu/Gray/Grey` menampilkan warna yang sesuai.
- Filter harga katalog memakai harga rupiah sebenarnya (tidak dikalikan 1.000) dan memakai aksen hitam dengan panel ringkas.
- Halaman Review mengambil ulasan dan kupon melalui backend; kupon dibuat dan disimpan oleh backend.
- Riwayat transaksi mengambil pesanan akun melalui endpoint terautentikasi `/api/my/orders`, bukan dari daftar transaksi lokal browser.
- Checkout mengirim token login ke backend dan mengaitkan pesanan dengan email akun.
- Login/registrasi langsung berpindah ke Home tanpa menunggu modal sukses di halaman akun.
- Riwayat pesanan individual dan ulasan dibatasi ke akun pemilik.

## Langkah wajib sebelum deploy
1. Buka Supabase SQL Editor untuk project yang digunakan JASTIP.
2. Jalankan `supabase/schema.sql` versi ini. Script menggunakan `IF NOT EXISTS`/`ADD COLUMN IF NOT EXISTS` untuk tabel dan kolom terkait.
3. Pastikan backend mempunyai `SUPABASE_URL` dan `SUPABASE_SERVICE_ROLE_KEY` di environment server (jangan taruh service-role key di frontend).
4. Deploy/restart backend supaya endpoint baru aktif.
5. Deploy ulang frontend agar perubahan UI dan pemanggilan API aktif.
6. Tes login, buat pesanan, tandai pesanan `DELIVERED` dari backoffice, kirim review, lalu cek tabel `reviews` dan `review_coupons` di Supabase.
7. Tes login dengan akun yang sama di browser lain; riwayat pesanan dan kupon seharusnya dimuat dari backend/Supabase.

## Catatan data lama
Pesanan lama yang dibuat sebelum perubahan dan tidak memiliki `customer.email` di kolom JSON `orders.customer` tidak otomatis dapat dipetakan dengan aman ke akun. Jika perlu mempertahankan riwayat lama, cocokkan dan migrasikan secara manual di Supabase setelah memastikan pemilik setiap pesanan.

## Catatan keamanan
File `.env`, folder `.git`, build `dist`, dan file lokal yang berpotensi berisi data pelanggan sengaja tidak disertakan dalam ZIP hasil perbaikan. Gunakan `.env` lokal milik sendiri dan jangan commit file rahasia.
