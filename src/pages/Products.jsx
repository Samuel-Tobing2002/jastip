import { useEffect, useMemo, useState } from "react";

import ProductCard from "../components/ProductCard";
import { getCategories, getProducts } from "../services/productService";

function Products() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeFilter, setActiveFilter] = useState("all");
  const [colorFilter, setColorFilter] = useState("all");
  const [maxPrice, setMaxPrice] = useState(10000000);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const [productData, categoryData] = await Promise.all([
          getProducts(),
          getCategories(),
        ]);
        setProducts(productData);
        setCategories(categoryData);
      } catch (error) {
        console.error("Failed to load JASTIP products:", error);
        setLoadError(
          error?.response?.data?.message ||
            "Katalog belum dapat dimuat. Periksa koneksi backend dan database, lalu coba lagi."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const categoryMatch = activeFilter === "all" || product.category === activeFilter;
      const colors = product.colors?.length ? product.colors : [];
      const colorMatch = colorFilter === "all" || colors.some((color) => color.toLowerCase() === colorFilter.toLowerCase());
      const priceMatch = Number(product.price || 0) <= maxPrice;
      return categoryMatch && colorMatch && priceMatch;
    });
  }, [activeFilter, colorFilter, maxPrice, products]);

  const availableColors = [...new Set(products.flatMap((product) => product.colors || []))];

  const formatFilter = (filter) =>
    filter === "all"
      ? "All"
      : filter.replaceAll("-", " ");

  return (
    <main className="min-h-screen bg-[#f5f3ef] px-6 pb-24 pt-36 text-[#0c0c0c] md:pt-40">
      <div className="mx-auto max-w-7xl">
        <div className="mb-12 grid gap-8 border-b border-black/10 pb-10 lg:grid-cols-[1fr_0.8fr]">
          <div>
            <p className="mb-4 text-xs font-black uppercase tracking-[0.3em] text-black/45">
              Explore collection
            </p>
            <h1 className="text-6xl font-black uppercase leading-[0.9] md:text-8xl">
              Shop
              <br />
              Fashion
            </h1>
          </div>

          <div className="self-end">
            <p className="max-w-xl leading-7 text-black/60">
              Katalog JASTIP sekarang dikelola dari backoffice. Produk,
              kategori, stok, dan harga jual otomatis mengikuti profit margin
              yang kamu atur sebagai owner.
            </p>

            <div className="mt-7 flex flex-wrap gap-2">
              {["all", ...categories].map((filter) => (
                <button
                  key={filter}
                  type="button"
                  onClick={() => setActiveFilter(filter)}
                  className={`border px-4 py-2 text-xs font-black uppercase tracking-[0.14em] transition ${
                    activeFilter === filter
                      ? "border-black bg-black text-white"
                      : "border-black/20 bg-transparent text-black hover:border-black"
                  }`}
                >
                  {formatFilter(filter)}
                </button>
              ))}
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <label className="text-xs font-bold uppercase tracking-wider">Warna
                <select value={colorFilter} onChange={(event) => setColorFilter(event.target.value)} className="mt-2 w-full border border-black/20 bg-white p-3 text-sm normal-case tracking-normal">
                  <option value="all">Semua warna</option>
                  {availableColors.map((color) => <option key={color} value={color}>{color}</option>)}
                </select>
              </label>
              <div className="rounded-2xl border border-black/10 bg-white p-4 shadow-[0_8px_24px_rgba(0,0,0,.035)]">
                <div className="flex items-center justify-between gap-3">
                  <label htmlFor="price-range" className="text-xs font-black uppercase tracking-[.14em] text-black/55">Batas harga</label>
                  <span className="text-sm font-black tabular-nums">{new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(maxPrice)}</span>
                </div>
                <input id="price-range" type="range" min="0" max="10000000" step="50000" value={maxPrice} onChange={(event) => setMaxPrice(Number(event.target.value))} className="mt-4 block w-full cursor-pointer accent-black" />
                <div className="mt-2 flex justify-between text-[10px] font-bold uppercase tracking-wider text-black/40"><span>Rp0</span><span>Rp10 jt</span></div>
                <div className="mt-3 flex items-center justify-between border-t border-black/10 pt-3 text-xs text-black/55"><span>{filteredProducts.length} produk ditemukan</span><button type="button" onClick={() => setMaxPrice(10000000)} className="font-black uppercase tracking-wider text-black underline underline-offset-4">Reset</button></div>
              </div>
            </div>
          </div>
        </div>

        {loading && (
          <div className="flex min-h-[300px] items-center justify-center">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-black/10 border-t-black" />
          </div>
        )}

        {!loading && loadError && (
          <section className="mx-auto flex min-h-[260px] max-w-2xl flex-col items-center justify-center border border-red-900/15 bg-white/60 px-6 py-12 text-center">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-red-700">
              Catalog unavailable
            </p>
            <h2 className="mt-4 text-2xl font-black uppercase">Produk belum bisa ditampilkan</h2>
            <p className="mt-3 max-w-lg text-sm leading-6 text-black/60">{loadError}</p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-6 bg-black px-5 py-3 text-xs font-black uppercase tracking-[0.15em] text-white"
            >
              Coba lagi
            </button>
          </section>
        )}

        {!loading && !loadError && filteredProducts.length === 0 && (
          <section className="flex min-h-[260px] flex-col items-center justify-center border border-black/10 px-6 py-12 text-center">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-black/45">
              {products.length === 0 ? "Coming soon" : "No results"}
            </p>
            <h2 className="mt-4 text-2xl font-black uppercase">
              {products.length === 0 ? "Belum ada produk" : "Produk tidak ditemukan"}
            </h2>
            <p className="mt-3 max-w-lg text-sm leading-6 text-black/60">
              {products.length === 0
                ? "Katalog masih kosong. Tambahkan produk melalui backoffice setelah backend dan database terhubung."
                : "Belum ada produk dalam kategori ini. Pilih kategori lain untuk melihat koleksi."}
            </p>
            {activeFilter !== "all" && (
              <button
                type="button"
                onClick={() => setActiveFilter("all")}
                className="mt-6 bg-black px-5 py-3 text-xs font-black uppercase tracking-[0.15em] text-white"
              >
                Lihat semua produk
              </button>
            )}
          </section>
        )}

        {!loading && !loadError && filteredProducts.length > 0 && (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

export default Products;
