import { useEffect, useMemo, useState } from "react";
import { syncTransactions } from "../services/orderService";
import { Link, Navigate } from "react-router-dom";

const ORDERS_KEY = "jastip_transactions";
const REVIEWS_KEY = "jastip_reviews";
const COUPONS_KEY = "jastip_review_coupons";
const TOKEN_KEY = "jastip_customer_token";
const PROFILE_KEY = "jastip_customer_profile";
function couponStorageKey() { try { const user = JSON.parse(localStorage.getItem(PROFILE_KEY) || "null"); return `${COUPONS_KEY}:${String(user?.email || "guest").toLowerCase()}`; } catch { return `${COUPONS_KEY}:guest`; } }
const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:4000").replace(/\/$/, "");
function read(key, fallback) { try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)); } catch { return fallback; } }
function Reviews() {
  const loggedIn = Boolean(localStorage.getItem(TOKEN_KEY));
  const userEmail = (() => { try { return String(JSON.parse(localStorage.getItem(PROFILE_KEY) || "null")?.email || "").toLowerCase(); } catch { return ""; } })();
  const [orders, setOrders] = useState(() => read(ORDERS_KEY, []));
  const [reviews, setReviews] = useState(() => read(`${REVIEWS_KEY}:${userEmail}`, []));
  const [coupons, setCoupons] = useState(() => read(couponStorageKey(), []));
  const [ratings, setRatings] = useState({}); const [comments, setComments] = useState({}); const [message, setMessage] = useState("");
  useEffect(() => {
    if (!loggedIn) return;
    syncTransactions().then(setOrders).catch(() => {});
    fetch(`${API_URL}/api/reviews`, { headers: { "ngrok-skip-browser-warning": "true" } })
      .then((response) => response.ok ? response.json() : [])
      .then((data) => { setReviews(data.map((review) => ({ ...review, key: `${review.orderId || review.order_id}:${review.productId || review.product_id}` }))); })
      .catch(() => {});
  }, []);
  const delivered = useMemo(() => orders.filter((order) => String(order.status).toUpperCase() === "DELIVERED"), [orders]);
  const submit = async (order, item) => {
    const key = `${order.id}:${item.id}`;
    if (reviews.some((review) => review.key === key)) { setMessage("Ulasan untuk produk ini sudah pernah dikirim."); return; }
    const rating = Number(ratings[key] || 5);
    try {
      const response = await fetch(`${API_URL}/api/reviews`, { method: "POST", headers: { "Content-Type": "application/json", "ngrok-skip-browser-warning": "true" }, body: JSON.stringify({ orderId: order.id, productId: item.id, rating, comment: comments[key] || "" }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Ulasan gagal disimpan.");
      const review = { ...data, key };
      const nextReviews = [review, ...reviews];
      const coupon = { code: `JASTIP-${Math.random().toString(36).slice(2, 8).toUpperCase()}`, orderId: order.id, ownerEmail: userEmail, discountPercent: 2.5, used: false };
      const nextCoupons = [...coupons, coupon];
      setReviews(nextReviews); setCoupons(nextCoupons); localStorage.setItem(`${REVIEWS_KEY}:${userEmail}`, JSON.stringify(nextReviews)); localStorage.setItem(couponStorageKey(), JSON.stringify(nextCoupons));
      setMessage(`Terima kasih! Ulasan tersimpan. Kupon apresiasi diskon 2,5% kamu: ${coupon.code}`);
    } catch (err) { setMessage(err.message || "Ulasan gagal disimpan."); }
  };
  if (!loggedIn) return <Navigate to="/account" replace state={{ loginRequired: true, from: "/reviews" }} />;
  return <main className="min-h-screen bg-gradient-to-b from-[#f5f3ef] to-[#e9e3d9] px-4 pb-24 pt-28 text-[#0c0c0c] md:px-6 md:pt-36"><div className="mx-auto max-w-5xl rounded-[2rem]"><p className="text-xs font-black uppercase tracking-[.25em] text-black/45">Review & rating</p><h1 className="mt-4 text-5xl font-black uppercase">Ulasan Saya</h1><p className="mt-4 max-w-2xl text-black/60">Beri rating untuk produk dari pesanan yang sudah diterima. Setelah mengirim ulasan, kamu akan mendapatkan kupon apresiasi 2,5% untuk pesanan berikutnya.</p>{message && <div className="mt-5 border border-emerald-700/20 bg-emerald-50 p-4 text-sm text-emerald-800">{message}</div>}{delivered.length === 0 ? <div className="mt-8 rounded-3xl border border-black/10 bg-white p-8 shadow-sm"><p>Belum ada pesanan berstatus Delivered yang bisa diulas.</p><Link to="/history" className="mt-4 inline-block underline">Lihat riwayat pesanan</Link></div> : <div className="mt-8 grid gap-5">{delivered.map((order) => <section key={order.id} className="rounded-3xl border border-black/10 bg-white p-6 shadow-[0_15px_40px_rgba(0,0,0,.04)]"><p className="text-xs font-bold uppercase tracking-wider text-black/45">Pesanan {order.id}</p>{(order.items || []).map((item) => { const key = `${order.id}:${item.id}`; const existing = reviews.find((review) => review.key === key); return <div key={key} className="mt-4 border-t border-black/10 pt-4"><h2 className="font-black">{item.title}</h2>{existing ? <p className="mt-2 text-sm">Ulasan kamu: {"★".repeat(existing.rating)} · {existing.comment || "Tanpa komentar"}</p> : <div className="mt-3 space-y-3"><label className="block text-sm">Rating <select value={ratings[key] || 5} onChange={(event) => setRatings((prev) => ({ ...prev, [key]: event.target.value }))} className="ml-3 border border-black/20 p-2">{[5,4,3,2,1].map((num) => <option key={num} value={num}>{num} bintang</option>)}</select></label><textarea value={comments[key] || ""} onChange={(event) => setComments((prev) => ({ ...prev, [key]: event.target.value }))} className="w-full border border-black/15 p-3" rows={3} placeholder="Ceritakan pengalaman kamu (opsional)"/><button onClick={() => submit(order, item)} className="rounded-xl bg-black px-5 py-3 text-xs font-black uppercase tracking-wider text-white transition hover:bg-[#333]">Kirim Ulasan & Dapatkan Kupon</button></div>}</div>; })}</section>)}</div>}{coupons.length > 0 && <section className="mt-8 rounded-3xl border border-black/10 bg-white p-6 shadow-sm"><h2 className="text-xl font-black">Kupon Apresiasi</h2><p className="mt-1 text-sm text-black/60">Simpan kode berikut untuk digunakan saat checkout. Kupon dapat dimasukkan saat checkout untuk mendapat diskon 2,5%. Kupon hanya tersimpan untuk akunmu di browser ini.</p>{coupons.map((coupon) => <div key={coupon.code} className="mt-3 flex items-center justify-between border border-dashed border-black/25 p-4"><div><strong>{coupon.code}</strong><p className="text-xs text-black/50">Diskon {coupon.discountPercent}%</p></div><button className="text-sm underline" onClick={() => navigator.clipboard?.writeText(coupon.code)}>Salin</button></div>)}</section>}</div></main>;
}
export default Reviews;
