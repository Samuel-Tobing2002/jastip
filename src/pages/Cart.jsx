import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { formatRupiah } from "../utils/money";

function Cart() {
  const navigate = useNavigate();

  const {
    cart,
    removeFromCart,
    updateQuantity,
    baseSubtotal,
    productSubtotal,
    jastipFee,
    shippingFee,
    total,
  } = useCart();

  if (cart.length === 0) {
    return (
      <main className="min-h-screen bg-[#f5f3ef] px-6 pb-24 pt-36 text-[#0c0c0c] md:pt-40">
        <div className="mx-auto max-w-5xl border border-black/10 bg-white p-10 md:p-14">
          <p className="text-xs font-black uppercase tracking-[0.3em] text-black/45">
            Keranjang JASTIP
          </p>
          <h1 className="mt-5 text-5xl font-black uppercase leading-none md:text-7xl">
            Keranjang kamu kosong
          </h1>
          <p className="mt-5 max-w-xl leading-7 text-black/60">
            Pilih produk fashion dulu, lalu request jastip dari keranjang kamu.
          </p>
          <Link
            to="/products"
            className="mt-8 inline-flex bg-black px-7 py-4 text-xs font-black uppercase tracking-[0.18em] text-white"
          >
            Explore Products
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f5f3ef] px-6 pb-24 pt-36 text-[#0c0c0c] md:pt-40">
      <div className="mx-auto max-w-7xl">
        <div className="mb-10 border-b border-black/10 pb-8">
          <p className="text-xs font-black uppercase tracking-[0.3em] text-black/45">
            Keranjang JASTIP
          </p>
          <h1 className="mt-4 text-5xl font-black uppercase md:text-7xl">
            Keranjang Belanja
          </h1>
        </div>

        <div className="grid gap-10 lg:grid-cols-[1fr_380px]">
          <div className="space-y-4">
            {cart.map((item) => (
              <div
                key={`${item.id}-${item.selectedColor || ""}-${item.selectedSize || ""}`}
                className="grid gap-5 border border-black/10 bg-white p-5 sm:grid-cols-[140px_1fr]"
              >
                <img
                  src={item.thumbnail}
                  alt={item.title}
                  className="aspect-square w-full bg-[#ece8e0] object-cover sm:w-[140px]"
                />

                <div className="flex min-w-0 flex-col">
                  <div className="flex gap-4 sm:justify-between">
                    <div className="min-w-0">
                      <p className="text-xs font-black uppercase tracking-[0.18em] text-black/40">
                        {item.tag || item.category}
                      </p>
                      <h2 className="mt-2 text-xl font-black uppercase">
                        {item.title}
                      </h2>
                      {(item.selectedSize || item.selectedColor) && (
                        <p className="mt-2 text-sm text-black/50">
                          {item.selectedSize ? `Ukuran: ${item.selectedSize}` : ""} {item.selectedColor ? `· Warna: ${item.selectedColor}` : ""}
                        </p>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => removeFromCart(item)}
                      className="h-fit text-xs font-black uppercase tracking-[0.14em] text-black/40 transition hover:text-black"
                    >
                      Remove
                    </button>
                  </div>

                  <div className="mt-8 flex items-center justify-between gap-5">
                    <div className="flex items-center border border-black/15">
                      <button
                        type="button"
                        onClick={() =>
                          updateQuantity(item, item.quantity - 1)
                        }
                        className="h-10 w-10 text-xl"
                      >
                        -
                      </button>
                      <span className="w-12 text-center text-sm font-black">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          updateQuantity(item, item.quantity + 1)
                        }
                        className="h-10 w-10 text-xl"
                      >
                        +
                      </button>
                    </div>

                    <span className="text-xl font-black">
                      {formatRupiah(item.price * item.quantity)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <aside className="h-fit border border-black bg-white p-7">
            <h2 className="text-2xl font-black uppercase">
              Jastip Summary
            </h2>

            <div className="mt-8 space-y-4 text-sm">
              <div className="flex justify-between text-black/60">
                <span>Modal Produk</span>
                <span>{formatRupiah(baseSubtotal)}</span>
              </div>
              <div className="flex justify-between text-black/60">
                <span>Profit Owner</span>
                <span>{formatRupiah(jastipFee)}</span>
              </div>
              <div className="flex justify-between text-black/60">
                <span>Harga Jual Produk</span>
                <span>{formatRupiah(productSubtotal)}</span>
              </div>
              <div className="flex justify-between text-black/60">
                <span>Estimasi Pengiriman</span>
                <span>{formatRupiah(shippingFee)}</span>
              </div>
              <div className="my-5 h-px bg-black/10" />
              <div className="flex justify-between text-lg">
                <span className="font-black">Total Estimasi</span>
                <span className="font-black">{formatRupiah(total)}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => navigate("/checkout")}
              className="mt-8 w-full bg-black py-4 text-xs font-black uppercase tracking-[0.18em] text-white transition hover:bg-[#333]"
            >
              Lanjut ke Pembayaran
            </button>
          </aside>
        </div>
      </div>
    </main>
  );
}

export default Cart;
