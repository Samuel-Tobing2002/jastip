import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import { getProductById, getProducts } from "../services/productService";
import ProductCard from "../components/ProductCard";
import { formatRupiah } from "../utils/money";
import { useCart } from "../context/CartContext";

const sizes = ["S", "M", "L", "XL", "XXL"];
const defaultColors = ["Hitam", "Putih", "Abu-abu", "Beige"];
const colorSwatches = { Hitam: "#111111", Putih: "#ffffff", "Abu-abu": "#d8d8d8", Beige: "#e8decf", Merah: "#b91c1c", Biru: "#2563eb", Hijau: "#15803d", Pink: "#f9a8d4", Cokelat: "#92400e" };

function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();

  const [product, setProduct] = useState(null);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState("");
  const [thumbnailStart, setThumbnailStart] = useState(0);
  const [selectedSize, setSelectedSize] = useState("M");
  const [selectedColor, setSelectedColor] = useState(defaultColors[0]);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        setError("");

        const [productData, allProducts] = await Promise.all([
          getProductById(id),
          getProducts(),
        ]);

        setProduct(productData);
        setSelectedColor((productData.colors || defaultColors)[0] || defaultColors[0]);
        const firstImage = productData.images?.[0] || productData.thumbnail || "";
        setSelectedImage(firstImage);
        setThumbnailStart(0);
        setRelated(
          allProducts
            .filter((item) => item.id !== productData.id)
            .slice(0, 4)
        );
      } catch (err) {
        console.error(err);
        setError("Produk ini belum bisa dimuat. Coba lagi sebentar.");
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  const handleIncrease = () => {
    if (!product || Number(product.stock) <= 0) return;
    setQuantity((current) => Math.min(current + 1, Number(product.stock)));
  };

  const handleDecrease = () => {
    setQuantity((current) => Math.max(current - 1, 1));
  };

  const buildCartProduct = () => ({
    ...product,
    selectedSize,
    selectedColor,
  });

  const handleAddToCart = () => {
    if (!product || Number(product.stock) <= 0 || quantity > Number(product.stock)) return;

    addToCart(buildCartProduct(), quantity);
    setAdded(true);

    setTimeout(() => {
      setAdded(false);
    }, 2500);
  };

  const handleRequestJastip = () => {
    if (!product || Number(product.stock) <= 0 || quantity > Number(product.stock)) return;

    addToCart(buildCartProduct(), quantity);
    navigate("/cart");
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f5f3ef] text-black">
        <div className="flex flex-col items-center">
          <div className="h-12 w-12 animate-spin rounded-full border-2 border-black/10 border-t-black" />
          <p className="mt-6 text-sm font-semibold uppercase tracking-[0.18em] text-black/45">
            Loading product
          </p>
        </div>
      </main>
    );
  }

  if (error || !product) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f5f3ef] px-6 text-black">
        <div className="max-w-md text-center">
          <h1 className="text-4xl font-black uppercase">
            Product unavailable
          </h1>
          <p className="mt-4 text-black/55">
            {error || "Produk yang kamu cari tidak ditemukan."}
          </p>
          <Link
            to="/products"
            className="mt-8 inline-flex bg-black px-7 py-4 text-xs font-black uppercase tracking-[0.18em] text-white"
          >
            Back to Shop
          </Link>
        </div>
      </main>
    );
  }

  const galleryImages = [
    ...(Array.isArray(product.images) ? product.images : []),
    product.thumbnail,
  ].filter(
    (image, index, all) =>
      typeof image === "string" && image.trim() && all.indexOf(image) === index
  );

  const activeImage = galleryImages.includes(selectedImage)
    ? selectedImage
    : galleryImages[0] || "";

  const visibleThumbnails = galleryImages.slice(
    thumbnailStart,
    thumbnailStart + 3
  );
  const hasMoreThanThreeImages = galleryImages.length > 3;

  const totalPrice = product.price * quantity;
  const originalPrice =
    product.discountPercentage > 0
      ? product.price / (1 - product.discountPercentage / 100)
      : product.price;

  return (
    <main className="min-h-screen bg-[#f5f3ef] px-6 pb-24 pt-36 text-[#0c0c0c] md:pt-40">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex items-center gap-3 text-xs font-bold uppercase tracking-[0.14em] text-black/45">
          <Link
            to="/"
            className="transition hover:text-black"
          >
            Home
          </Link>
          <span>/</span>
          <Link
            to="/products"
            className="transition hover:text-black"
          >
            Shop
          </Link>
          <span>/</span>
          <span className="max-w-[220px] truncate text-black">
            {product.title}
          </span>
        </div>

        <section className="grid gap-10 lg:grid-cols-[0.92fr_1.08fr]">
          <div className="min-w-0">
            <div className="relative aspect-[4/5] w-full overflow-hidden bg-[#ece8e0]">
              {activeImage ? (
                <img
                  src={activeImage}
                  alt={product.title}
                  className="absolute inset-0 h-full w-full object-cover"
                  onError={(event) => {
                    event.currentTarget.style.visibility = "hidden";
                  }}
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-sm text-black/45">
                  Image unavailable
                </div>
              )}
              <button
                type="button"
                onClick={() => {
                  if (activeImage) window.open(activeImage, "_blank", "noopener,noreferrer");
                }}
                className="absolute bottom-4 right-4 flex h-11 w-11 items-center justify-center rounded-full bg-white text-xl shadow-lg transition hover:bg-black hover:text-white"
                aria-label="Open product image"
                title="Open image"
              >
                +
              </button>
            </div>

            {galleryImages.length > 1 && (
              <div className="mt-3 flex items-center gap-2">
                {hasMoreThanThreeImages && (
                  <button
                    type="button"
                    onClick={() => setThumbnailStart((current) => Math.max(0, current - 1))}
                    disabled={thumbnailStart === 0}
                    className="flex h-9 w-9 shrink-0 items-center justify-center border border-black/15 bg-white text-lg transition hover:bg-black hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
                    aria-label="Previous product images"
                  >
                    ‹
                  </button>
                )}

                <div className="grid min-w-0 flex-1 grid-cols-3 gap-2">
                  {visibleThumbnails.map((image) => {
                    const index = galleryImages.indexOf(image);
                    const isSelected = activeImage === image;

                    return (
                      <button
                        key={`${image}-${index}`}
                        type="button"
                        onClick={() => setSelectedImage(image)}
                        aria-label={`Show product image ${index + 1}`}
                        aria-pressed={isSelected}
                        className={`relative aspect-square min-w-0 overflow-hidden border-2 bg-white transition ${
                          isSelected
                            ? "border-black"
                            : "border-transparent hover:border-black/40"
                        }`}
                      >
                        <img
                          src={image}
                          alt={`${product.title} thumbnail ${index + 1}`}
                          className="absolute inset-0 h-full w-full object-cover"
                          loading="lazy"
                        />
                      </button>
                    );
                  })}
                </div>

                {hasMoreThanThreeImages && (
                  <button
                    type="button"
                    onClick={() =>
                      setThumbnailStart((current) =>
                        Math.min(galleryImages.length - 3, current + 1)
                      )
                    }
                    disabled={thumbnailStart >= galleryImages.length - 3}
                    className="flex h-9 w-9 shrink-0 items-center justify-center border border-black/15 bg-white text-lg transition hover:bg-black hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
                    aria-label="Next product images"
                  >
                    ›
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="lg:pl-8">
            <span className="inline-flex bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.18em]">
              New Arrival
            </span>

            <h1 className="mt-6 max-w-2xl text-5xl font-black leading-[0.95] md:text-7xl">
              {product.title}
            </h1>

            <div className="mt-5 flex flex-wrap items-center gap-4">
              <span className="text-lg">★★★★★</span>
              <span className="font-semibold">
                {product.rating} ({product.stock} ready)
              </span>
              <span className="bg-black px-3 py-1.5 text-xs font-black uppercase tracking-[0.14em] text-white">
                {product.tag || product.category}
              </span>
            </div>

            <div className="mt-7 flex flex-wrap items-end gap-4">
              <span className="text-4xl font-black">
                {formatRupiah(product.price)}
              </span>
              {product.discountPercentage > 0 && (
                <>
                  <span className="mb-1 text-lg font-semibold text-black/35 line-through">
                    {formatRupiah(originalPrice)}
                  </span>
                  <span className="mb-1 bg-black px-3 py-1.5 text-xs font-black uppercase tracking-[0.14em] text-white">
                    {product.discountPercentage.toFixed(0)}% Off
                  </span>
                </>
              )}
            </div>

            <p className="mt-7 max-w-xl border-b border-black/10 pb-8 text-lg leading-8 text-black/65">
              {product.description}
            </p>

            <div className="mt-7 space-y-7">
              <div>
                <p className="text-sm font-black">
                  Color:{" "}
                  <span className="font-semibold text-black/60">
                    {selectedColor}
                  </span>
                </p>
                <div className="mt-4 flex gap-3">
                  {(product.colors?.length ? product.colors : defaultColors).map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setSelectedColor(color)}
                      className={`h-11 w-11 rounded-full border-2 p-1 ${
                        selectedColor === color
                          ? "border-black"
                          : "border-transparent"
                      }`}
                      aria-label={`Select color ${color}`}
                      title={color}
                    >
                      <span
                        className="block h-full w-full rounded-full border border-black/10"
                        style={{ backgroundColor: colorSwatches[color] || color }}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <p className="text-sm font-black">
                    Size:{" "}
                    <span className="font-semibold text-black/60">
                      {selectedSize}
                    </span>
                  </p>
                  <button
                    type="button"
                    className="border-b border-black text-sm font-semibold"
                  >
                    Size Guide
                  </button>
                </div>
                <div className="mt-4 grid grid-cols-5 gap-3">
                  {sizes.map((size) => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => setSelectedSize(size)}
                      className={`h-12 border text-sm font-black ${
                        selectedSize === size
                          ? "border-black bg-black text-white"
                          : "border-black/15 bg-white text-black"
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="mb-3 text-sm font-black">Quantity · Stok tersedia: {product.stock}</p>
                <div className="flex w-fit items-center border border-black/15 bg-white">
                  <button
                    type="button"
                    onClick={handleDecrease}
                    className="h-12 w-12 text-xl"
                  >
                    -
                  </button>
                  <span className="w-14 text-center text-sm font-black">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={handleIncrease}
                    className="h-12 w-12 text-xl disabled:cursor-not-allowed disabled:opacity-30"
                    disabled={quantity >= Number(product.stock)}
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-8 border border-black/10 bg-white p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-black/45">
                    Estimated subtotal
                  </p>
                  <p className="mt-1 text-sm text-black/55">
                    {quantity} x {formatRupiah(product.price)}
                  </p>
                </div>
                <span className="text-2xl font-black">
                  {formatRupiah(totalPrice)}
                </span>
              </div>
            </div>

            {Number(product.stock) <= 0 ? <div className="mt-5 border border-black/15 bg-[#e5e5e5] p-5 text-center text-sm font-black tracking-[0.2em] text-black/60">SOLD OUT · STOK HABIS</div> : <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_80px]">
              <button
                type="button"
                onClick={handleRequestJastip}
                className="bg-black px-7 py-5 text-sm font-black uppercase tracking-[0.16em] text-white transition hover:bg-[#333]"
              >
                Request Jastip
              </button>
              <button
                type="button"
                onClick={handleAddToCart}
                className="border border-black bg-white px-5 py-5 text-2xl transition hover:bg-black hover:text-white"
                aria-label="Tambah ke keranjang"
              >
                🛒
              </button>
            </div>}

            {added && (
              <div className="mt-4 border border-black bg-white p-4 text-sm font-semibold">
                Added to your JASTIP bag.
              </div>
            )}

            <div className="mt-7 grid gap-4 border-t border-black/10 pt-7 md:grid-cols-3">
              {[
                ["Free Shipping", "Untuk request tertentu"],
                ["Easy Returns", "Demo policy 30 hari"],
                ["Secure Payment", "QR prototype checkout"],
              ].map(([title, copy]) => (
                <div key={title}>
                  <h3 className="text-xs font-black uppercase tracking-[0.14em]">
                    {title}
                  </h3>
                  <p className="mt-1 text-xs text-black/50">
                    {copy}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-20 grid gap-10 border-t border-black/10 pt-14 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <div className="flex gap-8 border-b border-black/10 pb-4 text-sm font-semibold">
              <span className="border-b-2 border-black pb-4">
                Details
              </span>
              <span className="text-black/45">Materials</span>
              <span className="text-black/45">Shipping</span>
            </div>
            <p className="mt-7 max-w-xl text-lg leading-8 text-black/65">
              Produk ini cocok untuk request jastip fashion harian. Detail
              final seperti ukuran, warna, dan ketersediaan bisa berubah
              mengikuti stok toko sumber.
            </p>
            <ul className="mt-6 space-y-3 text-sm font-semibold text-black/70">
              <li>✓ Curated from fashion category</li>
              <li>✓ Request dengan pilihan size dan warna</li>
              <li>✓ Estimasi fee dipisah saat checkout</li>
              <li>✓ Tracking tersimpan di halaman Orders</li>
            </ul>
          </div>

          <div className="min-h-[320px] overflow-hidden bg-[#ddd7ce]">
            <img
              src={product.thumbnail}
              alt={`${product.title} material detail`}
              className="h-full w-full object-cover grayscale"
            />
          </div>
        </section>

        {related.length > 0 && (
          <section className="mt-20">
            <div className="mb-8 flex items-end justify-between">
              <h2 className="text-3xl font-black">
                You May Also Like
              </h2>
              <Link
                to="/products"
                className="border-b-2 border-black pb-2 text-xs font-black uppercase tracking-[0.18em]"
              >
                View All
              </Link>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {related.map((item) => (
                <ProductCard
                  key={item.id}
                  product={item}
                />
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}

export default ProductDetail;
