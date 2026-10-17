import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { getSettings } from "../services/productService";

const initialForm = {
  name: "",
  phone: "",
  productName: "",
  productLink: "",
  notes: "",
};

function OrderWhatsApp() {
  const [settings, setSettings] = useState({
    ownerWhatsapp: "",
  });
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const data = await getSettings();
        setSettings(data);
      } catch (err) {
        console.error(err);
      }
    };

    fetchSettings();
  }, []);

  const handleChange = (event) => {
    setForm((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
    setError("");
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!form.name.trim() || !form.productName.trim()) {
      setError("Nama dan produk yang ingin diorder wajib diisi.");
      return;
    }

    if (!settings.ownerWhatsapp) {
      setError("Nomor WhatsApp owner belum diatur di backoffice.");
      return;
    }

    const message = [
      "Halo admin JASTIP, saya mau order produk yang belum ada di website.",
      "",
      `Nama: ${form.name}`,
      `No. HP: ${form.phone || "-"}`,
      `Produk: ${form.productName}`,
      `Link referensi: ${form.productLink || "-"}`,
      `Catatan: ${form.notes || "-"}`,
    ].join("\n");

    window.open(
      `https://wa.me/${settings.ownerWhatsapp}?text=${encodeURIComponent(message)}`,
      "_blank",
      "noopener,noreferrer"
    );
  };

  return (
    <main className="min-h-screen bg-[#f5f3ef] px-6 pb-24 pt-36 text-[#0c0c0c] md:pt-40">
      <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[0.9fr_1.1fr]">
        <section>
          <p className="text-xs font-black uppercase tracking-[0.3em] text-black/45">
            Custom order
          </p>
          <h1 className="mt-5 text-5xl font-black uppercase leading-none md:text-7xl">
            Order via WhatsApp
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-8 text-black/60">
            Kalau produk yang kamu mau belum ada di katalog, kirim detailnya
            langsung ke WhatsApp admin. Kami cek harga, stok, dan estimasi
            jastipnya dari sana.
          </p>
          <Link
            to="/products"
            className="mt-8 inline-flex border-b-2 border-black pb-2 text-xs font-black uppercase tracking-[0.18em]"
          >
            Lihat katalog dulu
          </Link>
        </section>

        <form
          onSubmit={handleSubmit}
          className="border border-black/10 bg-white p-7 md:p-9"
        >
          <div className="grid gap-5">
            <label className="block">
              <span className="text-sm font-black">Nama</span>
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                className="mt-2 w-full border border-black/15 px-4 py-3 outline-none focus:border-black"
                placeholder="Nama kamu"
              />
            </label>

            <label className="block">
              <span className="text-sm font-black">Nomor HP</span>
              <input
                name="phone"
                value={form.phone}
                onChange={handleChange}
                className="mt-2 w-full border border-black/15 px-4 py-3 outline-none focus:border-black"
                placeholder="+62 812..."
              />
            </label>

            <label className="block">
              <span className="text-sm font-black">Nama produk</span>
              <input
                name="productName"
                value={form.productName}
                onChange={handleChange}
                className="mt-2 w-full border border-black/15 px-4 py-3 outline-none focus:border-black"
                placeholder="Contoh: Nike hoodie black size L"
              />
            </label>

            <label className="block">
              <span className="text-sm font-black">Link referensi</span>
              <input
                name="productLink"
                value={form.productLink}
                onChange={handleChange}
                className="mt-2 w-full border border-black/15 px-4 py-3 outline-none focus:border-black"
                placeholder="Link toko / Instagram / marketplace"
              />
            </label>

            <label className="block">
              <span className="text-sm font-black">Catatan</span>
              <textarea
                name="notes"
                value={form.notes}
                onChange={handleChange}
                rows={5}
                className="mt-2 w-full resize-none border border-black/15 px-4 py-3 outline-none focus:border-black"
                placeholder="Warna, ukuran, budget, atau request lain"
              />
            </label>

            {error && (
              <div className="border border-red-500 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="bg-black px-7 py-4 text-xs font-black uppercase tracking-[0.18em] text-white transition hover:bg-[#333]"
            >
              Kirim ke WhatsApp
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}

export default OrderWhatsApp;
