import { useEffect, useMemo, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { syncTransactions } from "../services/orderService";

const TOKEN_KEY = "jastip_customer_token";
const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:4000").replace(/\/$/, "");

function Reviews() {
  const token = localStorage.getItem(TOKEN_KEY) || "";
  const [orders, setOrders] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [coupons, setCoupons] = useState([]);
  const [ratings, setRatings] = useState({});
  const [comments, setComments] = useState({});
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState("");

  const authHeaders = { Authorization: `Bearer ${token}`, "ngrok-skip-browser-warning": "true" };

  const refresh = async () => {
    const [orderRows, reviewResponse, couponResponse] = await Promise.all([
      syncTransactions(),
      fetch(`${API_URL}/api/reviews`, { headers: authHeaders }),
      fetch(`${API_URL}/api/review-coupons`, { headers: authHeaders }),
    ]);
    if (!reviewResponse.ok) throw new Error("Ulasan belum dapat dimuat dari server.");
    if (!couponResponse.ok) throw new Error("Kupon belum dapat dimuat dari server.");
    setOrders(orderRows);
    const reviewRows = await reviewResponse.json();
    setReviews(reviewRows.map((review) => ({ ...review, key: `${review.orderId || review.order_id}:${review.productId || review.product_id}` })));
    setCoupons(await couponResponse.json());
  };

  useEffect(() => {
    if (!token) { setLoading(false); return; }
    refresh().catch((error) => setMessage(error.message || "Data belum dapat dimuat.")).finally(() => setLoading(false));
  }, []);

  const delivered = useMemo(() => orders.filter((order) => String(order.status).toUpperCase() === "DELIVERED"), [orders]);

  const submit = async (order, item) => {
    const key = `${order.id}:${item.id}`;
    if (reviews.some((review) => review.key === key)) { setMessage("Ulasan untuk produk ini sudah pernah dikirim."); return; }
    setSubmitting(key); setMessage("");
    try {
      const response = await fetch(`${API_URL}/api/reviews`, {
        method: "POST",
        headers: { ...authHeaders, "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: order.id, productId: item.id, rating: Number(ratings[key] || 5), comment: comments[key] || "" }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Ulasan gagal disimpan.");
      await refresh();
      setMessage(`Terima kasih! Ulasan dan kupon apresiasi ${data.coupon?.code || ""} sudah disimpan ke akunmu.`);
    } catch (error) { setMessage(error.message || "Ulasan gagal disimpan."); }
    finally { setSubmitting(""); }
  };

  if (!token) return <Navigate to="/account" replace state={{ loginRequired: true, from: "/reviews" }} />;

  return <main className="min-h-screen bg-gradient-to-b from-[#f5f3ef] to-[#e9e3d9] px-4 pb-24 pt-28 text-[#0c0c0c] md:px-6 md:pt-36">
    <div className="mx-auto max-w-5xl">
      <p className="text-xs font-black uppercase tracking-[.25em] text-black/45">Review & rating</p>
      <h1 className="mt-4 text-5xl font-black uppercase">Ulasan Saya</h1>
      <p className="mt-4 max-w-2xl text-black/60">Beri rating untuk produk dari pesanan yang sudah diterima. Kupon apresiasi disimpan ke akunmu di database.</p>
      {message && <div className="mt-5 border border-black/10 bg-white p-4 text-sm">{message}</div>}
      {loading ? <div className="mt-8 rounded-3xl border border-black/10 bg-white p-8">Memuat ulasan, pesanan, dan kupon...</div> : delivered.length === 0 ? <div className="mt-8 rounded-3xl border border-black/10 bg-white p-8 shadow-sm"><p>Belum ada pesanan berstatus Delivered yang bisa diulas.</p><Link to="/history" className="mt-4 inline-block underline">Lihat riwayat pesanan</Link></div> : <div className="mt-8 grid gap-5">
        {delivered.map((order) => <section key={order.id} className="rounded-3xl border border-black/10 bg-white p-6 shadow-[0_15px_40px_rgba(0,0,0,.04)]">
          <p className="text-xs font-bold uppercase tracking-wider text-black/45">Pesanan {order.id}</p>
          {(order.items || []).map((item) => { const key = `${order.id}:${item.id}`; const existing = reviews.find((review) => review.key === key); return <div key={key} className="mt-4 border-t border-black/10 pt-4">
            <h2 className="font-black">{item.title}</h2>
            {existing ? <p className="mt-2 text-sm">Ulasan kamu: <span className="text-black">{"★".repeat(Number(existing.rating))}</span> · {existing.comment || "Tanpa komentar"}</p> : <div className="mt-3 space-y-3">
              <label className="block text-sm">Rating <select value={ratings[key] || 5} onChange={(event) => setRatings((prev) => ({ ...prev, [key]: event.target.value }))} className="ml-3 border border-black/20 bg-white p-2">{[5,4,3,2,1].map((num) => <option key={num} value={num}>{num} bintang</option>)}</select></label>
              <textarea value={comments[key] || ""} onChange={(event) => setComments((prev) => ({ ...prev, [key]: event.target.value }))} className="w-full border border-black/15 bg-white p-3 outline-none focus:border-black" rows={3} placeholder="Ceritakan pengalaman kamu (opsional)"/>
              <button disabled={submitting === key} onClick={() => submit(order, item)} className="rounded-xl bg-black px-5 py-3 text-xs font-black uppercase tracking-wider text-white transition hover:bg-[#333] disabled:opacity-50">{submitting === key ? "Menyimpan..." : "Kirim Ulasan & Dapatkan Kupon"}</button>
            </div>}
          </div>; })}
        </section>)}
      </div>}
      {coupons.length > 0 && <section className="mt-8 rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-black">Kupon Apresiasi</h2><p className="mt-1 text-sm text-black/60">Kupon disimpan di database dan akan tersedia setelah login dari perangkat lain.</p>
        {coupons.map((coupon) => <div key={coupon.code} className="mt-3 flex items-center justify-between gap-3 border border-dashed border-black/25 p-4"><div><strong>{coupon.code}</strong><p className="text-xs text-black/50">Diskon {coupon.discountPercent}%{coupon.used ? " · Sudah digunakan" : ""}</p></div><button className="text-sm underline" onClick={() => navigator.clipboard?.writeText(coupon.code)}>Salin</button></div>)}
      </section>}
    </div>
  </main>;
}
export default Reviews;
