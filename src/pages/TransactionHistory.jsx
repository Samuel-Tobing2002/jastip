import { useCallback, useEffect, useState } from "react";
import { ArrowDownRight, ArrowRight, Check, CheckCircle2, Clock3, CreditCard, MapPin, Package, PackageCheck, ReceiptText, RefreshCw, ShieldCheck, ShoppingBag, Truck, X } from "lucide-react";
import { Link } from "react-router-dom";
import { readLocalTransactions, syncTransactions, orderStatusLabel } from "../services/orderService";
import { formatRupiah as formatRupiahValue } from "../utils/money";

const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:4000").replace(/\/$/, "");
const STATUS_STYLES = {
  REJECTED: "border-red-200 bg-red-50 text-red-700",
  DELIVERED: "border-emerald-200 bg-emerald-50 text-emerald-700",
  PURCHASED: "border-sky-200 bg-sky-50 text-sky-700",
  APPROVED: "border-violet-200 bg-violet-50 text-violet-700",
  PROCESSING: "border-amber-200 bg-amber-50 text-amber-800",
};

function TransactionHistory() {
  const [transactions, setTransactions] = useState([]);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);

  const refresh = useCallback(async () => {
    try {
      const updated = await syncTransactions(readLocalTransactions());
      const rows = Array.isArray(updated) ? updated : [];
      setTransactions(rows);
      setSelectedTransaction((current) => current ? rows.find((item) => item.id === current.id) || current : current);
      setLoadError("");
      setLastUpdated(new Date());
    } catch (error) {
      setLoadError(error?.message || "Riwayat transaksi belum dapat dimuat.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    const timer = window.setInterval(refresh, 10000);
    return () => window.clearInterval(timer);
  }, [refresh]);

  useEffect(() => {
    if (!selectedTransaction) return undefined;
    const handleEscape = (event) => event.key === "Escape" && setSelectedTransaction(null);
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [selectedTransaction]);

  const formatDate = (value) => {
    if (!value) return "Tanggal belum tersedia";
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? "Tanggal belum tersedia" : date.toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" });
  };
  const formatPrice = (price) => formatRupiahValue(Number(price) || 0);
  const itemsOf = (transaction) => transaction?.items || [];
  const totalOf = (transaction) => transaction?.summary?.total ?? 0;
  const statusClass = (status) => STATUS_STYLES[String(status || "").toUpperCase()] || "border-slate-200 bg-slate-50 text-slate-600";
  const totalSpent = transactions.reduce((sum, item) => String(item.status).toUpperCase() === "REJECTED" ? sum : sum + Number(totalOf(item) || 0), 0);
  const deliveredCount = transactions.filter((item) => String(item.status).toUpperCase() === "DELIVERED").length;
  const closeModal = () => setSelectedTransaction(null);
  const backdropClick = (event) => event.target === event.currentTarget && closeModal();

  const lifecycle = (transaction) => {
    const status = String(transaction.status || "").toUpperCase();
    return [
      { label: "Pembayaran", detail: transaction.payment?.status === "PAID" ? "Terkonfirmasi" : "Diterima", done: true, icon: CreditCard },
      { label: "Diproses", detail: status === "PROCESSING" ? "Menunggu persetujuan" : ["APPROVED", "PURCHASED", "DELIVERED"].includes(status) ? "Disetujui" : status === "REJECTED" ? "Ditolak" : "Menunggu", done: ["APPROVED", "PURCHASED", "DELIVERED"].includes(status), current: status === "PROCESSING", rejected: status === "REJECTED", icon: Package },
      { label: "Dibeli", detail: transaction.purchasedAt ? formatDate(transaction.purchasedAt) : ["PURCHASED", "DELIVERED"].includes(status) ? "Selesai" : "Menunggu", done: ["PURCHASED", "DELIVERED"].includes(status), current: status === "APPROVED", icon: ShoppingBag },
      { label: "Diterima", detail: transaction.deliveredAt ? formatDate(transaction.deliveredAt) : status === "DELIVERED" ? "Selesai" : "Menunggu", done: status === "DELIVERED", current: status === "PURCHASED", icon: Truck },
    ];
  };

  return (
    <>
      <main className="min-h-screen bg-[#f5f4f1] px-4 pb-24 pt-28 text-[#111] md:px-7 md:pt-36">
        <div className="mx-auto max-w-6xl">
          <header className="relative overflow-hidden rounded-3xl bg-[#111] px-6 py-9 text-white md:px-10 md:py-12">
            <div className="pointer-events-none absolute -right-16 -top-20 h-72 w-72 rounded-full border border-white/[0.08]" />
            <div className="pointer-events-none absolute -right-3 -top-7 h-48 w-48 rounded-full border border-white/[0.08]" />
            <div className="relative z-10 flex flex-col justify-between gap-8 md:flex-row md:items-end">
              <div className="max-w-2xl">
                <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.28em] text-white/55"><ReceiptText size={14} /> Aktivitas akun</p>
                <h1 className="mt-5 text-4xl font-black uppercase leading-[0.98] tracking-tight md:text-6xl">Riwayat<br />Transaksi.</h1>
                <p className="mt-5 max-w-lg text-sm leading-7 text-white/65 md:text-base">Semua pesanan JASTIP dalam satu tempat. Pantau pembayaran, proses belanja, dan status pengirimanmu.</p>
              </div>
              <button type="button" onClick={() => { setLoading(true); refresh(); }} className="inline-flex w-fit items-center gap-2 rounded-full border border-white/20 px-4 py-3 text-xs font-bold transition hover:bg-white hover:text-black">
                <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Perbarui riwayat
              </button>
            </div>
          </header>

          <section className="mt-5 grid gap-3 sm:grid-cols-3">
            {[
              { label: "Total transaksi", value: loading ? "—" : transactions.length, icon: ReceiptText },
              { label: "Pesanan diterima", value: loading ? "—" : deliveredCount, icon: PackageCheck },
              { label: "Total nilai transaksi", value: loading ? "—" : formatPrice(totalSpent), icon: CreditCard },
            ].map(({ label, value, icon: Icon }) => (
              <div key={label} className="flex items-center gap-4 rounded-2xl border border-black/[0.07] bg-white p-5 shadow-[0_10px_30px_rgba(0,0,0,0.025)]">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#f0efec]"><Icon size={21} /></div>
                <div><p className="text-xs text-black/50">{label}</p><p className="mt-1 text-xl font-black tabular-nums sm:text-2xl">{value}</p></div>
              </div>
            ))}
          </section>

          <section className="mt-10">
            <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
              <div><p className="text-[10px] font-bold uppercase tracking-[0.25em] text-black/45">Pesananmu</p><h2 className="mt-2 text-2xl font-black tracking-tight md:text-3xl">Semua transaksi</h2></div>
              {lastUpdated && <p className="text-xs text-black/40">Diperbarui {lastUpdated.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}</p>}
            </div>

            {loadError && <div role="alert" className="mb-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"><X size={18} className="mt-0.5 shrink-0" /><div><p>{loadError}</p><button type="button" onClick={refresh} className="mt-2 font-bold underline">Coba lagi</button></div></div>}

            {loading && transactions.length === 0 ? (
              <div className="rounded-2xl border border-black/[0.07] bg-white p-8"><div className="flex items-center gap-3 text-sm text-black/55"><RefreshCw size={18} className="animate-spin" /> Memuat riwayat transaksi...</div><div className="mt-6 space-y-3"><div className="h-16 animate-pulse rounded-xl bg-black/[0.04]" /><div className="h-16 animate-pulse rounded-xl bg-black/[0.04]" /></div></div>
            ) : transactions.length === 0 ? (
              <div className="rounded-2xl border border-black/[0.07] bg-white px-6 py-14 text-center shadow-[0_10px_30px_rgba(0,0,0,0.025)] md:px-10">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#f0efec]"><Clock3 size={28} strokeWidth={1.5} /></div>
                <h3 className="mt-5 text-xl font-black">Belum ada transaksi</h3>
                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-black/55">Setelah kamu membuat pesanan, riwayat dan perkembangan statusnya akan muncul di sini.</p>
                <Link to="/products" className="mt-6 inline-flex items-center gap-2 rounded-full bg-black px-5 py-3 text-xs font-bold uppercase tracking-wider text-white transition hover:bg-[#333]">Mulai belanja <ArrowRight size={15} /></Link>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="hidden grid-cols-[1.4fr_1fr_1.15fr_1fr] gap-4 px-6 text-[10px] font-bold uppercase tracking-[0.2em] text-black/40 md:grid"><span>Transaksi</span><span>Tanggal</span><span>Status</span><span className="text-right">Total</span></div>
                {transactions.map((transaction) => {
                  const status = String(transaction.status || "").toUpperCase();
                  const paid = transaction.payment?.status === "PAID";
                  const items = itemsOf(transaction);
                  return (
                    <button key={transaction.id} type="button" onClick={() => setSelectedTransaction(transaction)} className="group w-full rounded-2xl border border-black/[0.07] bg-white p-5 text-left shadow-[0_8px_25px_rgba(0,0,0,0.02)] transition hover:-translate-y-0.5 hover:border-black/20 hover:shadow-[0_16px_35px_rgba(0,0,0,0.06)] md:grid md:grid-cols-[1.4fr_1fr_1.15fr_1fr] md:items-center md:gap-4 md:px-6 md:py-5">
                      <div className="flex items-start justify-between gap-3 md:block"><div className="flex min-w-0 items-start gap-3"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#f0efec] transition group-hover:bg-black group-hover:text-white"><ShoppingBag size={18} /></div><div className="min-w-0"><p className="break-all font-mono text-sm font-bold">{transaction.id}</p><p className="mt-1.5 text-xs text-black/45">{items.length} produk · {formatDate(transaction.createdAt)}</p></div></div><ArrowRight size={17} className="mt-1 shrink-0 text-black/30 transition group-hover:translate-x-1 group-hover:text-black md:hidden" /></div>
                      <div className="mt-4 hidden md:block"><p className="text-sm text-black/65">{formatDate(transaction.createdAt)}</p></div>
                      <div className="mt-4 flex flex-wrap gap-2 md:mt-0"><span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[10px] font-bold ${paid ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-black/10 bg-[#f7f6f3] text-black/55"}`}>{paid && <Check size={12} />}{paid ? "Dibayar" : "Pembayaran"}</span><span className={`inline-flex items-center rounded-full border px-3 py-1.5 text-[10px] font-bold ${statusClass(status)}`}>{orderStatusLabel(transaction.status)}</span></div>
                      <div className="mt-4 flex items-center justify-between border-t border-black/[0.06] pt-4 md:mt-0 md:justify-end md:border-0 md:pt-0"><span className="text-xs text-black/45 md:hidden">Total transaksi</span><div className="flex items-center gap-4"><p className="text-base font-black tabular-nums">{formatPrice(totalOf(transaction))}</p><ArrowRight size={17} className="hidden text-black/30 transition group-hover:translate-x-1 group-hover:text-black md:block" /></div></div>
                    </button>
                  );
                })}
              </div>
            )}
          </section>
          <footer className="mt-12 flex flex-wrap items-center justify-center gap-2 border-t border-black/10 pt-5 text-center text-[10px] font-semibold uppercase tracking-[0.2em] text-black/35"><ShieldCheck size={13} /> JASTIP · Riwayat transaksi</footer>
        </div>
      </main>

      {selectedTransaction && (
        <div onClick={backdropClick} className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-black/55 px-3 py-5 backdrop-blur-sm sm:items-center sm:px-5 sm:py-8">
          <section role="dialog" aria-modal="true" aria-labelledby="transaction-modal-title" onClick={(event) => event.stopPropagation()} className="relative my-auto w-full max-w-3xl overflow-hidden rounded-3xl border border-white/20 bg-[#f8f7f4] text-[#111] shadow-[0_30px_100px_rgba(0,0,0,0.3)]">
            <div className="relative overflow-hidden bg-[#111] px-5 py-7 text-white md:px-8 md:py-9">
              <div className="pointer-events-none absolute -right-10 -top-20 h-52 w-52 rounded-full border border-white/[0.09]" />
              <button type="button" onClick={closeModal} aria-label="Tutup detail transaksi" className="absolute right-4 top-4 z-20 flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/10 transition hover:bg-white hover:text-black"><X size={18} /></button>
              <p className="relative flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.25em] text-white/55"><ReceiptText size={14} /> Detail transaksi</p>
              <h2 id="transaction-modal-title" className="relative mt-4 max-w-xl break-words pr-8 text-2xl font-black tracking-tight md:text-4xl">{selectedTransaction.id}</h2>
              <div className="relative mt-4 flex flex-wrap items-center gap-3 text-xs text-white/65"><span className="inline-flex items-center gap-1.5"><Clock3 size={13} /> {formatDate(selectedTransaction.createdAt)}</span><span className="h-1 w-1 rounded-full bg-white/30" /><span>{itemsOf(selectedTransaction).length} produk</span></div>
            </div>

            <div className="max-h-[calc(100vh-180px)] overflow-y-auto p-4 sm:p-6 md:p-8">
              <div className="rounded-2xl border border-black/[0.07] bg-white p-5 md:p-6">
                <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-black/45">Status pesanan</p><span className={`mt-3 inline-flex rounded-full border px-3 py-1.5 text-xs font-bold ${statusClass(selectedTransaction.status)}`}>{orderStatusLabel(selectedTransaction.status)}</span></div><div className="text-right"><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-black/45">Total transaksi</p><p className="mt-2 text-xl font-black tabular-nums md:text-2xl">{formatPrice(totalOf(selectedTransaction))}</p><p className="mt-1 text-[11px] text-black/45">{selectedTransaction.payment?.status === "PAID" ? "Pembayaran terkonfirmasi" : "Menunggu konfirmasi pembayaran"}</p></div></div>
                <div className="mt-7"><p className="mb-4 text-[10px] font-bold uppercase tracking-[0.2em] text-black/45">Perjalanan pesanan</p><div className="grid grid-cols-4 gap-2">{lifecycle(selectedTransaction).map((step) => { const Icon = step.icon; return <div key={step.label} className="min-w-0 text-center"><div className={`mx-auto flex h-10 w-10 items-center justify-center rounded-xl border ${step.rejected ? "border-red-200 bg-red-50 text-red-700" : step.done ? "border-black bg-black text-white" : step.current ? "border-amber-300 bg-amber-50 text-amber-800" : "border-black/10 bg-[#f8f7f4] text-black/35"}`}>{step.done ? <Check size={17} /> : step.rejected ? <X size={17} /> : <Icon size={17} />}</div><p className={`mt-2 text-[10px] font-bold sm:text-xs ${step.done || step.current ? "text-black" : "text-black/45"}`}>{step.label}</p><p className="mt-1 hidden break-words text-[10px] leading-4 text-black/45 sm:block">{step.detail}</p></div>; })}</div></div>
                {String(selectedTransaction.status).toUpperCase() === "REJECTED" && selectedTransaction.rejectionReason && <p className="mt-5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">Alasan penolakan: {selectedTransaction.rejectionReason}</p>}
              </div>

              {selectedTransaction.payment?.proofUrl && <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-black/[0.07] bg-white p-4"><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f0efec]"><CreditCard size={18} /></div><div><p className="text-sm font-bold">Bukti pembayaran</p><p className="mt-1 text-xs text-black/45">Lihat bukti transaksi</p></div></div><a href={selectedTransaction.payment.proofUrl.startsWith("/uploads/") ? `${API_URL}${selectedTransaction.payment.proofUrl}` : selectedTransaction.payment.proofUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full border border-black/15 px-4 py-2.5 text-xs font-bold transition hover:bg-black hover:text-white">Buka bukti <ArrowDownRight size={14} /></a></div>}

              <section className="mt-7"><div className="mb-4 flex items-center justify-between gap-3"><div><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-black/45">Rincian belanja</p><h3 className="mt-1 text-xl font-black">Produk pesanan</h3></div><span className="rounded-full bg-white px-3 py-1.5 text-xs font-bold text-black/55">{itemsOf(selectedTransaction).length} item</span></div>
                <div className="space-y-3">{itemsOf(selectedTransaction).map((item) => <article key={item.id} className="flex items-start gap-3 rounded-2xl border border-black/[0.07] bg-white p-3 sm:items-center sm:gap-4 sm:p-4">{item.thumbnail ? <img src={item.thumbnail} alt={item.title || "Produk"} className="h-16 w-16 shrink-0 rounded-xl border border-black/[0.06] bg-[#f7f6f3] object-cover sm:h-20 sm:w-20" /> : <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-[#f0efec] sm:h-20 sm:w-20"><Package size={23} /></div>}<div className="min-w-0 flex-1"><h4 className="break-words text-sm font-bold">{item.title || "Produk JASTIP"}</h4><div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-black/45"><span>Jumlah: {item.quantity || 1}</span>{item.category && <span className="rounded-full bg-[#f3f2ef] px-2.5 py-1">{item.category}</span>}</div><p className="mt-2 text-xs text-black/55">{formatPrice(item.price)} / item</p></div><p className="shrink-0 pt-1 text-right text-sm font-black tabular-nums sm:pt-0">{formatPrice((Number(item.price) || 0) * (Number(item.quantity) || 1))}</p></article>)}</div>
              </section>

              <section className="mt-7 rounded-2xl border border-black/[0.07] bg-white p-5 md:p-6"><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f0efec]"><MapPin size={19} /></div><div><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-black/45">Informasi pengiriman</p><h3 className="mt-1 text-base font-black">Penerima pesanan</h3></div></div><div className="mt-5 grid gap-4 sm:grid-cols-2"><div><p className="text-xs text-black/45">Nama penerima</p><p className="mt-1 break-words text-sm font-semibold">{selectedTransaction.customer?.name || "—"}</p></div><div><p className="text-xs text-black/45">Nomor telepon</p><p className="mt-1 break-words text-sm font-semibold">{selectedTransaction.customer?.phone || "—"}</p></div><div className="sm:col-span-2"><p className="text-xs text-black/45">Alamat pengiriman</p><p className="mt-1 whitespace-pre-line break-words text-sm leading-6 text-black/75">{selectedTransaction.customer?.address || "Alamat belum tersedia"}</p></div></div></section>

              <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
                {String(selectedTransaction.status).toUpperCase() === "DELIVERED" ? <Link to="/reviews" onClick={closeModal} className="inline-flex items-center justify-center gap-2 rounded-full border border-black/15 px-5 py-3 text-xs font-bold transition hover:bg-black hover:text-white">Beri ulasan <ArrowRight size={14} /></Link> : <span />}
                <button type="button" onClick={closeModal} className="rounded-full bg-black px-6 py-3 text-xs font-bold uppercase tracking-wider text-white transition hover:bg-[#333]">Tutup detail</button>
              </div>
            </div>
          </section>
        </div>
      )}
    </>
  );
}

export default TransactionHistory;
