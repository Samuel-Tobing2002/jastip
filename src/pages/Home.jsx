import { Link } from "react-router-dom";
import { useEffect, useState } from "react";

import ProductCard from "../components/ProductCard";
import { getProducts } from "../services/productService";

const heroImage =
  "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1200&q=85";

const editorialImage =
  "https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=1200&q=85";

function Home() {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const data = await getProducts();
        setProducts(data.slice(0, 8));
      } catch (error) {
        console.error(error);
      }
    };

    fetchProducts();
  }, []);

  return (
    <main className="bg-[#f5f3ef] text-[#0c0c0c]">
      <section className="relative min-h-[92vh] overflow-hidden px-6 pt-32 md:pt-28">
        <div className="mx-auto grid min-h-[78vh] max-w-7xl items-center gap-8 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="relative z-10">
            <p className="mb-8 max-w-44 text-xs font-bold uppercase leading-6 tracking-[0.38em]">
              Fashion jastip curated for your next wardrobe
            </p>

            <h1 className="max-w-5xl text-[18vw] font-black uppercase leading-[0.76] tracking-[-0.02em] md:text-[11rem] lg:text-[12rem]">
              JASTIP
            </h1>

            <div className="mt-8 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
              <p className="max-w-md text-base leading-7 text-black/60">
                Titip beli pakaian, sepatu, tas, dan aksesori pilihan dari
                katalog fashion yang dikelola langsung dari backoffice. Pilih
                item, masukin ke bag, lalu kami bantu proses jastip sampai ke
                alamat kamu.
              </p>

              <div className="flex flex-wrap gap-3">
                <Link
                  to="/products"
                  className="bg-black px-7 py-4 text-xs font-black uppercase tracking-[0.18em] text-white transition hover:bg-[#333]"
                >
                  Shop Now
                </Link>

                <a
                  href="#how-it-works"
                  className="border-b-2 border-black px-1 py-4 text-xs font-black uppercase tracking-[0.18em]"
                >
                  Cara Jastip
                </a>
              </div>
            </div>
          </div>

          <div className="relative min-h-[520px] overflow-hidden bg-[#dedad2]">
            <img
              src={heroImage}
              alt="Fashion editorial outfit"
              className="absolute inset-0 h-full w-full object-cover grayscale"
            />
            <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between bg-black px-6 py-5 text-white">
              <span className="text-xs font-bold uppercase tracking-[0.28em]">
                New Collection
              </span>
              <span className="text-xs font-bold uppercase tracking-[0.28em]">
                2026
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-black px-6 py-9 text-white">
        <div className="mx-auto grid max-w-7xl gap-6 md:grid-cols-3">
          {[
            ["Men", "Kemeja, sepatu, dan daily essentials."],
            ["Women", "Dress, tops, bags, dan statement pieces."],
            ["Accessories", "Detail kecil yang bikin outfit hidup."],
          ].map(([title, copy]) => (
            <Link
              key={title}
              to="/products"
              className="group grid grid-cols-[88px_1fr] items-center gap-5"
            >
              <div className="aspect-square overflow-hidden bg-white/10">
                <img
                  src={title === "Women" ? editorialImage : heroImage}
                  alt={`${title} collection`}
                  className="h-full w-full object-cover grayscale transition duration-500 group-hover:scale-105"
                />
              </div>

              <div>
                <h2 className="text-lg font-black uppercase tracking-[0.12em]">
                  {title}
                </h2>
                <p className="mt-2 text-sm leading-6 text-white/60">
                  {copy}
                </p>
                <p className="mt-4 text-xs font-bold uppercase tracking-[0.18em]">
                  Shop {title} →
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="grid min-h-[520px] bg-[#dedad2] md:grid-cols-2">
        <div className="flex items-center px-6 py-20 md:px-[8vw]">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.34em]">
              New season
            </p>
            <h2 className="mt-6 text-6xl font-black uppercase leading-[0.9] md:text-8xl">
              New
              <br />
              Vibes
            </h2>
            <p className="mt-6 max-w-sm leading-7 text-black/60">
              Koleksi fashion dari katalog internal, siap diatur lewat
              backoffice untuk stok, gambar, kategori, dan harga jual.
            </p>
            <Link
              to="/products"
              className="mt-8 inline-flex bg-black px-7 py-4 text-xs font-black uppercase tracking-[0.18em] text-white"
            >
              Explore Collection
            </Link>
          </div>
        </div>

        <div className="min-h-[420px] overflow-hidden">
          <img
            src={editorialImage}
            alt="New season fashion"
            className="h-full w-full object-cover grayscale"
          />
        </div>
      </section>

      <section className="border-b border-black/10 bg-[#f5f3ef] px-6 py-10">
        <div className="mx-auto grid max-w-7xl gap-6 md:grid-cols-4">
          {[
            ["Fast Request", "Kirim pesanan jastip lebih cepat."],
            ["Curated Fashion", "Produk dikelola langsung dari backoffice."],
            ["Clear Margin", "Harga jual otomatis mengikuti profit owner."],
            ["Secure Checkout", "Demo checkout dengan QR prototype."],
          ].map(([title, copy]) => (
            <div
              key={title}
              className="border-l border-black/20 pl-5"
            >
              <h3 className="text-xs font-black uppercase tracking-[0.16em]">
                {title}
              </h3>
              <p className="mt-2 text-sm text-black/55">
                {copy}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="px-6 py-20">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10 flex items-end justify-between gap-6">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.3em] text-black/50">
                Best of JASTIP
              </p>
              <h2 className="mt-3 text-4xl font-black uppercase md:text-5xl">
                Popular Picks
              </h2>
            </div>

            <Link
              to="/products"
              className="hidden border-b-2 border-black pb-2 text-xs font-black uppercase tracking-[0.18em] md:block"
            >
              View All
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
              />
            ))}
          </div>
        </div>
      </section>

      <section
        id="how-it-works"
        className="bg-black px-6 py-20 text-white"
      >
        <div className="mx-auto max-w-7xl">
          <p className="text-xs font-black uppercase tracking-[0.3em] text-white/50">
            Simple process
          </p>
          <h2 className="mt-3 text-4xl font-black uppercase md:text-6xl">
            Cara JASTIP bekerja
          </h2>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {[
              ["01", "Pilih Produk", "Cari item fashion dari katalog website."],
              ["02", "Masukkan Bag", "Atur jumlah, cek estimasi, lalu request jastip."],
              ["03", "Kami Proses", "Checkout dan pantau pesanan dari halaman Orders."],
            ].map(([number, title, copy]) => (
              <div
                key={number}
                className="border border-white/15 p-8"
              >
                <span className="text-sm font-black text-white/40">
                  {number}
                </span>
                <h3 className="mt-12 text-2xl font-black uppercase">
                  {title}
                </h3>
                <p className="mt-4 leading-7 text-white/55">
                  {copy}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

export default Home;
