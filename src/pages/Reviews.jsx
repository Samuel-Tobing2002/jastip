
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import {
  ArrowRight,
  Check,
  CheckCircle2,
  Clipboard,
  Clock3,
  MessageSquareText,
  PackageCheck,
  RefreshCw,
  Send,
  ShieldCheck,
  Star,
  TicketPercent,
} from "lucide-react";
import { syncTransactions } from "../services/orderService";

const TOKEN_KEY = "jastip_customer_token";
const API_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:4000"
).replace(/\/$/, "");

const authHeaders = (token) => ({
  Authorization: `Bearer ${token}`,
  "ngrok-skip-browser-warning": "true",
});

const formatDate = (value) => {
  if (!value) return "Tanggal tidak tersedia";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Tanggal tidak tersedia";

  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
};

const getOrderItems = (order) => order.items || [];

const getReviewKey = (review) =>
  `${review.orderId || review.order_id}:${review.productId || review.product_id}`;

const getCouponCode = (coupon) => coupon.code || coupon.id;

function Reviews() {
  const token =
    typeof window !== "undefined"
      ? localStorage.getItem(TOKEN_KEY) || ""
      : "";

  const [orders, setOrders] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [coupons, setCoupons] = useState([]);
  const [ratings, setRatings] = useState({});
  const [comments, setComments] = useState({});
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("info");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState("");
  const [copiedCoupon, setCopiedCoupon] = useState("");

  const refresh = useCallback(async () => {
    const headers = authHeaders(token);

    const [orderRows, reviewResponse, couponResponse] =
      await Promise.all([
        syncTransactions(),
        fetch(`${API_URL}/api/reviews`, { headers }),
        fetch(`${API_URL}/api/review-coupons`, { headers }),
      ]);

    if (!reviewResponse.ok) {
      throw new Error("Ulasan belum dapat dimuat. Silakan coba lagi.");
    }

    if (!couponResponse.ok) {
      throw new Error("Kupon belum dapat dimuat. Silakan coba lagi.");
    }

    const reviewRows = await reviewResponse.json();
    const couponRows = await couponResponse.json();

    setOrders(Array.isArray(orderRows) ? orderRows : []);
    setReviews(
      (Array.isArray(reviewRows) ? reviewRows : []).map((review) => ({
        ...review,
        key: getReviewKey(review),
      }))
    );
    setCoupons(Array.isArray(couponRows) ? couponRows : []);
  }, [token]);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }

    let active = true;

    refresh()
      .catch((error) => {
        if (active) {
          setMessage(error.message || "Data belum dapat dimuat.");
          setMessageType("error");
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [refresh, token]);

  const delivered = useMemo(
    () =>
      orders.filter(
        (order) =>
          String(order.status || "").toUpperCase() === "DELIVERED"
      ),
    [orders]
  );

  const reviewableItems = useMemo(
    () =>
      delivered.flatMap((order) =>
        getOrderItems(order).map((item) => ({
          order,
          item,
          key: `${order.id}:${item.id}`,
        }))
      ),
    [delivered]
  );

  const reviewedCount = reviewableItems.filter(({ key }) =>
    reviews.some((review) => review.key === key)
  ).length;

  const pendingCount = reviewableItems.length - reviewedCount;

  const submit = async (order, item) => {
    const key = `${order.id}:${item.id}`;

    if (reviews.some((review) => review.key === key)) {
      setMessage("Produk ini sudah pernah kamu ulas.");
      setMessageType("info");
      return;
    }

    setSubmitting(key);
    setMessage("");

    try {
      const response = await fetch(`${API_URL}/api/reviews`, {
        method: "POST",
        headers: {
          ...authHeaders(token),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          orderId: order.id,
          productId: item.id,
          rating: Number(ratings[key] || 5),
          comment: comments[key] || "",
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.message || "Ulasan gagal disimpan. Silakan coba lagi."
        );
      }

      await refresh();

      setMessage(
        data.coupon?.code
          ? `Ulasan berhasil disimpan. Kupon apresiasimu: ${data.coupon.code}`
          : "Ulasan berhasil dikirim dan disimpan."
      );
      setMessageType("success");

      setRatings((previous) => {
        const next = { ...previous };
        delete next[key];
        return next;
      });

      setComments((previous) => {
        const next = { ...previous };
        delete next[key];
        return next;
      });
    } catch (error) {
      setMessage(error.message || "Ulasan gagal disimpan.");
      setMessageType("error");
    } finally {
      setSubmitting("");
    }
  };

  const copyCoupon = async (code) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCoupon(code);
      setMessage("Kode kupon berhasil disalin.");
      setMessageType("success");
    } catch {
      setMessage("Kupon tidak dapat disalin otomatis. Silakan salin kodenya.");
      setMessageType("error");
    }
  };

  if (!token) {
    return (
      <Navigate
        to="/account"
        replace
        state={{ loginRequired: true, from: "/reviews" }}
      />
    );
  }

  const panelClass =
    "rounded-2xl border border-black/[0.08] bg-white shadow-[0_12px_40px_rgba(0,0,0,0.035)]";

  return (
    <main className="min-h-screen bg-[#f5f4f1] pb-20 pt-28 text-[#111] md:pt-36">
      <div className="mx-auto max-w-6xl px-4 md:px-7">
        {/* Header */}
        <header className="relative overflow-hidden rounded-3xl bg-[#111] px-6 py-9 text-white md:px-10 md:py-12">
          <div className="absolute -right-12 -top-16 h-64 w-64 rounded-full border border-white/[0.08]" />
          <div className="absolute -right-2 -top-6 h-44 w-44 rounded-full border border-white/[0.08]" />

          <div className="relative z-10 max-w-2xl">
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.28em] text-white/55">
              <Star size={13} />
              Review & Rating
            </div>

            <h1 className="mt-5 text-4xl font-black uppercase leading-[0.98] tracking-tight md:text-6xl">
              Ceritakan
              <br />
              Pengalamanmu.
            </h1>

            <p className="mt-5 max-w-lg text-sm leading-7 text-white/65 md:text-base">
              Ulas produk yang sudah kamu terima dan bantu pelanggan lain
              menemukan pilihan terbaik mereka bersama JASTIP.
            </p>

            <div className="mt-7 flex flex-wrap items-center gap-3 text-xs">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/15 px-3 py-2 text-white/80">
                <ShieldCheck size={15} />
                Ulasan tersimpan di akunmu
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/15 px-3 py-2 text-white/80">
                <TicketPercent size={15} />
                Kupon apresiasi
              </span>
            </div>
          </div>
        </header>

        {/* Statistics */}
        <section className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className={`${panelClass} flex items-center gap-4 p-5`}>
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#f0efec]">
              <PackageCheck size={21} />
            </div>
            <div>
              <p className="text-xs text-black/50">Produk bisa diulas</p>
              <p className="mt-1 text-2xl font-black tabular-nums">
                {loading ? "—" : reviewableItems.length}
              </p>
            </div>
          </div>

          <div className={`${panelClass} flex items-center gap-4 p-5`}>
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#f0efec]">
              <CheckCircle2 size={21} />
            </div>
            <div>
              <p className="text-xs text-black/50">Sudah diulas</p>
              <p className="mt-1 text-2xl font-black tabular-nums">
                {loading ? "—" : reviewedCount}
              </p>
            </div>
          </div>

          <div className={`${panelClass} flex items-center gap-4 p-5`}>
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#f0efec]">
              <MessageSquareText size={21} />
            </div>
            <div>
              <p className="text-xs text-black/50">Menunggu ulasan</p>
              <p className="mt-1 text-2xl font-black tabular-nums">
                {loading ? "—" : pendingCount}
              </p>
            </div>
          </div>
        </section>

        {/* Status message */}
        {message && (
          <div
            role="status"
            aria-live="polite"
            className={`mt-5 flex items-start gap-3 rounded-xl border p-4 text-sm ${
              messageType === "error"
                ? "border-red-200 bg-red-50 text-red-800"
                : messageType === "success"
                  ? "border-black/10 bg-white text-black"
                  : "border-black/10 bg-[#eeede9] text-black/75"
            }`}
          >
            {messageType === "success" ? (
              <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
            ) : messageType === "error" ? (
              <ShieldCheck size={18} className="mt-0.5 shrink-0" />
            ) : (
              <MessageSquareText size={18} className="mt-0.5 shrink-0" />
            )}
            <p>{message}</p>
          </div>
        )}

        {/* Main section */}
        <section className="mt-10">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-black/45">
                Your experience
              </p>
              <h2 className="mt-2 text-2xl font-black tracking-tight md:text-3xl">
                Produk untuk diulas
              </h2>
            </div>

            {!loading && (
              <button
                type="button"
                onClick={() => {
                  setLoading(true);
                  refresh()
                    .catch((error) => {
                      setMessage(error.message || "Gagal memuat ulang data.");
                      setMessageType("error");
                    })
                    .finally(() => setLoading(false));
                }}
                className="inline-flex items-center gap-2 rounded-full border border-black/15 bg-white px-4 py-2.5 text-xs font-bold transition hover:border-black hover:bg-black hover:text-white"
              >
                <RefreshCw size={14} />
                Muat ulang
              </button>
            )}
          </div>

          {loading ? (
            <div className={`${panelClass} p-8`}>
              <div className="flex items-center gap-3 text-sm text-black/55">
                <RefreshCw size={18} className="animate-spin" />
                Memuat pesanan dan ulasanmu...
              </div>
              <div className="mt-6 space-y-3">
                <div className="h-5 w-1/3 animate-pulse rounded bg-black/[0.06]" />
                <div className="h-20 animate-pulse rounded-xl bg-black/[0.04]" />
                <div className="h-20 animate-pulse rounded-xl bg-black/[0.04]" />
              </div>
            </div>
          ) : reviewableItems.length === 0 ? (
            <div className={`${panelClass} px-6 py-12 text-center md:px-10`}>
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#f0efec]">
                <PackageCheck size={28} strokeWidth={1.5} />
              </div>
              <h3 className="mt-5 text-xl font-black">
                Belum ada produk untuk diulas
              </h3>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-black/55">
                Produk akan muncul di sini setelah pesananmu berstatus
                Delivered.
              </p>
              <Link
                to="/history"
                className="mt-6 inline-flex items-center gap-2 rounded-full bg-black px-5 py-3 text-xs font-bold uppercase tracking-wider text-white transition hover:bg-[#333]"
              >
                Lihat riwayat pesanan
                <ArrowRight size={15} />
              </Link>
            </div>
          ) : (
            <div className="space-y-5">
              {delivered.map((order) => (
                <section key={order.id} className={`${panelClass} overflow-hidden`}>
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-black/[0.07] bg-[#fafaf9] px-5 py-4 md:px-7">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-black/45">
                        Nomor pesanan
                      </p>
                      <p className="mt-1 text-sm font-black">{order.id}</p>
                    </div>

                    <div className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-3 py-2 text-[11px] font-semibold text-black/60">
                      <CheckCircle2 size={14} />
                      Pesanan diterima
                    </div>
                  </div>

                  <div className="divide-y divide-black/[0.07] px-5 md:px-7">
                    {getOrderItems(order).map((item) => {
                      const key = `${order.id}:${item.id}`;
                      const existing = reviews.find(
                        (review) => review.key === key
                      );
                      const isSubmitting = submitting === key;
                      const rating = Number(ratings[key] || 5);

                      return (
                        <article key={key} className="py-6 md:py-7">
                          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                            <div className="min-w-0 flex-1">
                              <div className="flex items-start gap-3">
                                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-black/[0.07] bg-[#f6f5f2]">
                                  <PackageCheck size={21} strokeWidth={1.5} />
                                </div>
                                <div className="min-w-0">
                                  <h3 className="font-black leading-6">
                                    {item.title || item.name || "Produk JASTIP"}
                                  </h3>
                                  <p className="mt-1 text-xs text-black/45">
                                    Pesanan {order.id}
                                  </p>
                                </div>
                              </div>

                              {existing ? (
                                <div className="mt-5 rounded-xl border border-black/[0.08] bg-[#fafaf9] p-4">
                                  <div className="flex flex-wrap items-center justify-between gap-3">
                                    <span className="inline-flex items-center gap-2 text-xs font-bold">
                                      <CheckCircle2 size={16} />
                                      Ulasan terkirim
                                    </span>
                                    <span className="text-xs text-black/45">
                                      {formatDate(
                                        existing.createdAt ||
                                          existing.created_at
                                      )}
                                    </span>
                                  </div>

                                  <div
                                    className="mt-3 flex gap-1 text-black"
                                    aria-label={`${existing.rating} dari 5 bintang`}
                                  >
                                    {Array.from({ length: 5 }, (_, index) => (
                                      <Star
                                        key={index}
                                        size={16}
                                        fill={
                                          index < Number(existing.rating)
                                            ? "currentColor"
                                            : "none"
                                        }
                                        strokeWidth={1.5}
                                        className={
                                          index < Number(existing.rating)
                                            ? ""
                                            : "text-black/20"
                                        }
                                      />
                                    ))}
                                  </div>

                                  <p className="mt-3 text-sm leading-6 text-black/65">
                                    {existing.comment || "Tidak ada komentar."}
                                  </p>
                                </div>
                              ) : (
                                <div className="mt-5 space-y-5 lg:ml-[60px]">
                                  <div>
                                    <label
                                      htmlFor={`rating-${key}`}
                                      className="mb-2 block text-xs font-bold uppercase tracking-wider text-black/55"
                                    >
                                      Berikan penilaian
                                    </label>

                                    <div className="flex flex-wrap items-center gap-3">
                                      <div
                                        className="flex items-center gap-1"
                                        role="group"
                                        aria-label="Pilih rating bintang"
                                      >
                                        {[1, 2, 3, 4, 5].map((num) => (
                                          <button
                                            key={num}
                                            type="button"
                                            onClick={() =>
                                              setRatings((previous) => ({
                                                ...previous,
                                                [key]: num,
                                              }))
                                            }
                                            aria-label={`${num} bintang`}
                                            aria-pressed={rating === num}
                                            className="rounded-md p-1 transition hover:scale-110 focus:outline-none focus:ring-2 focus:ring-black"
                                          >
                                            <Star
                                              size={23}
                                              fill={
                                                num <= rating
                                                  ? "currentColor"
                                                  : "none"
                                              }
                                              strokeWidth={1.7}
                                              className={
                                                num <= rating
                                                  ? "text-black"
                                                  : "text-black/20"
                                              }
                                            />
                                          </button>
                                        ))}
                                      </div>
                                      <span className="text-xs font-semibold text-black/60">
                                        {rating}/5 bintang
                                      </span>
                                    </div>

                                    <select
                                      id={`rating-${key}`}
                                      value={rating}
                                      onChange={(event) =>
                                        setRatings((previous) => ({
                                          ...previous,
                                          [key]: Number(event.target.value),
                                        }))
                                      }
                                      className="sr-only"
                                      tabIndex={-1}
                                      aria-hidden="true"
                                    >
                                      {[5, 4, 3, 2, 1].map((num) => (
                                        <option key={num} value={num}>
                                          {num} bintang
                                        </option>
                                      ))}
                                    </select>
                                  </div>

                                  <div>
                                    <label
                                      htmlFor={`comment-${key}`}
                                      className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-black/55"
                                    >
                                      <MessageSquareText size={14} />
                                      Ceritakan pengalamanmu
                                    </label>
                                    <textarea
                                      id={`comment-${key}`}
                                      value={comments[key] || ""}
                                      onChange={(event) =>
                                        setComments((previous) => ({
                                          ...previous,
                                          [key]: event.target.value,
                                        }))
                                      }
                                      maxLength={1000}
                                      rows={3}
                                      placeholder="Bagaimana kualitas produk yang kamu terima?"
                                      className="w-full resize-y rounded-xl border border-black/10 bg-[#fafaf9] px-4 py-3 text-sm leading-6 outline-none transition placeholder:text-black/30 focus:border-black focus:bg-white focus:ring-2 focus:ring-black/[0.05]"
                                    />
                                    <p className="mt-1 text-right text-[10px] text-black/35">
                                      {(comments[key] || "").length}/1000
                                    </p>
                                  </div>

                                  <button
                                    type="button"
                                    disabled={Boolean(submitting)}
                                    onClick={() => submit(order, item)}
                                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-black px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-white transition hover:bg-[#333] disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                                  >
                                    {isSubmitting ? (
                                      <>
                                        <RefreshCw
                                          size={15}
                                          className="animate-spin"
                                        />
                                        Menyimpan...
                                      </>
                                    ) : (
                                      <>
                                        <Send size={15} />
                                        Kirim ulasan
                                      </>
                                    )}
                                  </button>
                                </div>
                              )}
                            </div>

                            {existing && (
                              <div className="hidden shrink-0 items-center gap-2 rounded-full bg-[#f0efec] px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-black/60 lg:inline-flex">
                                <Check size={13} />
                                Selesai
                              </div>
                            )}
                          </div>
                        </article>
                      );
                    })}
                  </div>
                </section>
              ))}
            </div>
          )}
        </section>

        {/* Coupons */}
        <section className="mt-12">
          <div className="mb-5">
            <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-black/45">
              Special rewards
            </p>
            <h2 className="mt-2 text-2xl font-black tracking-tight md:text-3xl">
              Kupon apresiasi
            </h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-black/55">
              Hadiah untuk ulasanmu. Kupon yang tersedia ditampilkan dari
              akunmu.
            </p>
          </div>

          {coupons.length === 0 ? (
            <div className={`${panelClass} flex items-start gap-4 p-5 md:p-6`}>
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#f0efec]">
                <TicketPercent size={21} />
              </div>
              <div>
                <h3 className="font-bold">Belum ada kupon apresiasi</h3>
                <p className="mt-1 text-sm leading-6 text-black/50">
                  Kupon akan ditampilkan di sini ketika tersedia di akunmu.
                </p>
              </div>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {coupons.map((coupon) => {
                const code = getCouponCode(coupon);
                const discount =
                  coupon.discountPercent ?? coupon.discount_percent ?? 2;

                const used = Boolean(coupon.used);

                return (
                  <article
                    key={code}
                    className="relative overflow-hidden rounded-2xl border border-black/10 bg-white p-5 shadow-[0_10px_30px_rgba(0,0,0,0.025)] md:p-6"
                  >
                    <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full border border-dashed border-black/10" />

                    <div className="relative flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-black text-white">
                          <TicketPercent size={21} />
                        </div>
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-black/45">
                            Kupon JASTIP
                          </p>
                          <p className="mt-1 text-2xl font-black">
                            {discount}%{" "}
                            <span className="text-sm font-semibold text-black/50">
                              OFF
                            </span>
                          </p>
                        </div>
                      </div>

                      <span
                        className={`rounded-full px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider ${
                          used
                            ? "bg-[#f0efec] text-black/45"
                            : "bg-black text-white"
                        }`}
                      >
                        {used ? "Terpakai" : "Tersedia"}
                      </span>
                    </div>

                    <div className="relative mt-5 flex items-center justify-between gap-3 rounded-xl border border-dashed border-black/20 bg-[#fafaf9] p-3">
                      <div className="min-w-0">
                        <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-black/40">
                          Kode kupon
                        </p>
                        <p className="mt-1 break-all font-mono text-sm font-black tracking-wider">
                          {code}
                        </p>
                      </div>

                      <button
                        type="button"
                        disabled={used}
                        onClick={() => copyCoupon(code)}
                        className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-black/10 bg-white px-3 py-2.5 text-xs font-bold transition hover:border-black hover:bg-black hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        {copiedCoupon === code ? (
                          <Check size={14} />
                        ) : (
                          <Clipboard size={14} />
                        )}
                        <span>
                          {copiedCoupon === code ? "Tersalin" : "Salin"}
                        </span>
                      </button>
                    </div>

                    <p className="mt-3 flex items-center gap-2 text-[11px] text-black/45">
                      {used ? (
                        <CheckCircle2 size={13} />
                      ) : (
                        <Clock3 size={13} />
                      )}
                      {used
                        ? "Kupon sudah digunakan."
                        : "Gunakan kode ini saat kupon tersedia di checkout."}
                    </p>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <footer className="mt-12 border-t border-black/10 pt-5 text-center text-[10px] font-semibold uppercase tracking-[0.2em] text-black/35">
          JASTIP · Personal Shopper
        </footer>
      </div>
    </main>
  );
}

export default Reviews;
