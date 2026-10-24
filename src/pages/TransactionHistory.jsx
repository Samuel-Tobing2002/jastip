import { useEffect, useState } from "react";
import { formatRupiah as formatRupiahValue } from "../utils/money";
import { Link } from "react-router-dom";
import { readLocalTransactions, syncTransactions, orderStatusLabel } from "../services/orderService";

function TransactionHistory() {
  const [transactions, setTransactions] = useState([]);

  // Transaction yang sedang dipilih
  const [selectedTransaction, setSelectedTransaction] =
    useState(null);

  useEffect(() => {
    let active = true;
    const refresh = async () => {
      const updated = await syncTransactions(readLocalTransactions());
      if (active) {
        setTransactions(updated);
        setSelectedTransaction((current) => current ? updated.find((item) => item.id === current.id) || current : current);
      }
    };
    refresh();
    const timer = window.setInterval(refresh, 10000);
    return () => { active = false; window.clearInterval(timer); };
  }, []);

  const formatDate = (date) => {
    return new Date(date).toLocaleString(
      "id-ID",
      {
        dateStyle: "medium",
        timeStyle: "short",
      }
    );
  };

  const formatPrice = (price) => formatRupiahValue(price);

  /*
   * Close modal
   */
  const closeModal = () => {
    setSelectedTransaction(null);
  };

  /*
   * Close modal ketika klik area background
   */
  const handleBackdropClick = (event) => {
    if (event.target === event.currentTarget) {
      closeModal();
    }
  };

  /*
   * Close modal dengan tombol ESC
   */
  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === "Escape") {
        closeModal();
      }
    };

    if (selectedTransaction) {
      document.addEventListener(
        "keydown",
        handleEscape
      );
    }

    return () => {
      document.removeEventListener(
        "keydown",
        handleEscape
      );
    };
  }, [selectedTransaction]);

  return (
    <>
      {/* ================================================= */}
      {/* HISTORY PAGE */}
      {/* ================================================= */}

      <main className="min-h-screen bg-[#f7f5f0] px-6 pb-24 pt-32 text-slate-900">

        <div className="mx-auto max-w-6xl">

          {/* Header */}

          <div className="mb-12">

            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
              Activity
            </p>

            <h1 className="mt-4 text-5xl font-semibold tracking-tight">
              Transaction History
            </h1>

            <p className="mt-5 max-w-xl text-slate-500">
              A complete history of your JASTIP
              transactions.
            </p>

          </div>

          {/* ================================================= */}
          {/* EMPTY STATE */}
          {/* ================================================= */}

          {transactions.length === 0 ? (

            <div className="rounded-[2rem] border border-slate-200 bg-white p-12 text-center">

              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-2xl">
                ◷
              </div>

              <h2 className="mt-6 text-2xl font-medium">
                No transactions yet
              </h2>

              <p className="mt-3 text-slate-500">
                Your transaction history will
                appear here.
              </p>

              <Link
                to="/products"
                className="mt-7 inline-flex rounded-full bg-slate-900 px-7 py-4 font-medium text-white transition hover:scale-105 hover:bg-slate-700"
              >
                Start Jastip →
              </Link>

            </div>

          ) : (

            /* ================================================= */
            /* TRANSACTION TABLE */
            /* ================================================= */

            <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white">

              {/* Table Header */}

              <div className="hidden grid-cols-[1.5fr_1fr_1fr_1fr] border-b border-slate-200 px-6 py-4 text-xs uppercase tracking-widest text-slate-400 md:grid">

                <span>
                  Transaction
                </span>

                <span>
                  Date
                </span>

                <span>
                  Status
                </span>

                <span className="text-right">
                  Total
                </span>

              </div>

              {/* Transaction Rows */}

              <div>

                {transactions.map(
                  (transaction) => (

                    <button
                      key={transaction.id}
                      type="button"
                      onClick={() =>
                        setSelectedTransaction(
                          transaction
                        )
                      }
                      className="group grid w-full cursor-pointer gap-4 border-b border-slate-100 px-6 py-6 text-left transition last:border-none hover:bg-slate-50 md:grid-cols-[1.5fr_1fr_1fr_1fr] md:items-center"
                    >

                      {/* Transaction */}

                      <div>

                        <p className="font-mono text-sm text-slate-900 transition group-hover:text-violet-700">
                          {transaction.id}
                        </p>

                        <p className="mt-2 text-xs text-slate-400">
                          {transaction.items.length}{" "}
                          item
                          {transaction.items.length >
                          1
                            ? "s"
                            : ""}
                        </p>

                      </div>

                      {/* Date */}

                      <div>

                        <p className="text-sm text-slate-600">
                          {formatDate(
                            transaction.createdAt
                          )}
                        </p>

                      </div>

                      {/* Status */}

                      <div>

                        <div className="flex flex-wrap gap-2">

                          <span className="w-fit rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs text-emerald-700">
                            Paid
                          </span>

                          <span className={`w-fit rounded-full border px-3 py-1.5 text-xs ${transaction.status === "REJECTED" ? "border-red-200 bg-red-50 text-red-700" : transaction.status === "DELIVERED" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-violet-200 bg-violet-50 text-violet-700"}`}>
                            {orderStatusLabel(transaction.status)}
                          </span>

                        </div>

                      </div>

                      {/* Total */}

                      <div className="flex items-center justify-between md:justify-end md:gap-5">

                        <p className="font-semibold">
                          {formatPrice(
                            transaction.summary
                              .total
                          )}
                        </p>

                        <span className="text-slate-400 transition group-hover:translate-x-1 group-hover:text-slate-600">
                          →
                        </span>

                      </div>

                    </button>

                  )
                )}

              </div>

            </div>

          )}

        </div>

      </main>


      {/* ================================================= */}
      {/* TRANSACTION DETAIL MODAL */}
      {/* ================================================= */}

      {selectedTransaction && (

        <div
          onClick={handleBackdropClick}
          className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-slate-900/45 px-4 py-8 backdrop-blur-sm"
        >

          <div
            className="relative max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-[2rem] border border-slate-200 bg-white text-slate-900 shadow-[0_24px_90px_rgba(15,23,42,0.18)]"
          >

            {/* Ambient glow */}

            <div className="pointer-events-none absolute left-1/2 top-0 h-64 w-96 -translate-x-1/2 rounded-full bg-amber-300/20 blur-[120px]" />

            {/* ================================================= */}
            {/* CLOSE BUTTON */}
            {/* ================================================= */}

            <button
              type="button"
              onClick={closeModal}
              className="absolute right-5 top-5 z-20 flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
              aria-label="Close"
            >
              ×
            </button>


            {/* ================================================= */}
            {/* MODAL CONTENT */}
            {/* ================================================= */}

            <div className="relative p-7 md:p-10">

              {/* Header */}

              <div className="text-center">

                <p className="text-xs font-medium uppercase tracking-[0.35em] text-emerald-700">
                  Payment Confirmed
                </p>

                <h2 className="mt-4 text-4xl font-semibold tracking-tight md:text-5xl">
                  Jastip received.
                </h2>

                <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-slate-500">
                  {orderStatusLabel(selectedTransaction.status)}. Status pesanan diperbarui oleh admin dan akan tersinkron otomatis.
                </p>

              </div>


              {/* ORDER LIFECYCLE */}
              <div className="mt-10 overflow-hidden rounded-3xl border border-slate-200 bg-slate-50 p-6">
                <div className="relative grid grid-cols-4 gap-2">
                  <div className="absolute left-[10%] right-[10%] top-5 -z-0 h-px bg-slate-200" />
                  {[
                    { label: "Payment", done: true, detail: "Completed" },
                    { label: "Processing", done: ["APPROVED", "PURCHASED", "DELIVERED"].includes(selectedTransaction.status), current: selectedTransaction.status === "PROCESSING", rejected: selectedTransaction.status === "REJECTED", detail: selectedTransaction.status === "PROCESSING" ? "Waiting approval" : selectedTransaction.status === "REJECTED" ? "Rejected" : "Approved" },
                    { label: "Purchased", done: ["PURCHASED", "DELIVERED"].includes(selectedTransaction.status), current: selectedTransaction.status === "APPROVED", detail: selectedTransaction.purchasedAt ? formatDate(selectedTransaction.purchasedAt) : "Pending" },
                    { label: "Delivered", done: selectedTransaction.status === "DELIVERED", current: selectedTransaction.status === "PURCHASED", detail: selectedTransaction.deliveredAt ? formatDate(selectedTransaction.deliveredAt) : "Pending" },
                  ].map((step, index) => (
                    <div key={step.label} className="relative z-10 text-center">
                      <div className={`mx-auto flex h-10 w-10 items-center justify-center rounded-full border ${step.rejected ? "border-red-300 bg-red-50 text-red-700" : step.done || step.label === "Payment" ? "border-emerald-300 bg-emerald-500 text-white" : step.current ? "border-violet-300 bg-violet-50 text-violet-700" : "border-slate-200 bg-white text-slate-400"}`}>
                        {step.rejected ? "×" : step.done || step.label === "Payment" ? "✓" : index + 1}
                      </div>
                      <p className="mt-3 text-xs font-medium">{step.label}</p>
                      <p className={`mt-1 text-[10px] ${step.rejected ? "text-red-700" : step.done || step.label === "Payment" ? "text-emerald-700" : step.current ? "text-violet-700" : "text-slate-400"}`}>{step.detail}</p>
                    </div>
                  ))}
                </div>
                {selectedTransaction.status === "REJECTED" && selectedTransaction.rejectionReason && <p className="mt-5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">Alasan penolakan: {selectedTransaction.rejectionReason}</p>}
              </div>

                            {/* ================================================= */}
              {/* TRANSACTION INFO */}
              {/* ================================================= */}

              <div className="mt-6 grid gap-4 md:grid-cols-2">

                {/* Transaction ID */}

                <div className="rounded-3xl border border-slate-200 bg-white p-5">

                  <div className="flex items-start gap-4">

                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-lg">
                      ▣
                    </div>

                    <div>

                      <p className="text-xs text-slate-500">
                        Transaction ID
                      </p>

                      <p className="mt-2 font-mono text-sm font-medium">
                        {selectedTransaction.id}
                      </p>

                      <p className="mt-2 text-xs text-slate-400">
                        {formatDate(
                          selectedTransaction.createdAt
                        )}
                      </p>

                    </div>

                  </div>

                </div>


                {/* Total */}

                <div className="rounded-3xl border border-slate-200 bg-white p-5">

                  <div className="flex items-start gap-4">

                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-xs font-black">
                      Rp
                    </div>

                    <div>

                      <p className="text-xs text-slate-500">
                        Total Paid
                      </p>

                      <p className="mt-2 text-xl font-semibold">
                        {formatPrice(
                          selectedTransaction
                            .summary.total
                        )}
                      </p>

                      <span className="mt-2 inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] text-emerald-700">
                        {selectedTransaction.payment?.status === "PAID" ? "Payment completed" : "Payment pending"}
                      </span>

                    </div>

                  </div>

                </div>

              </div>


              {selectedTransaction.payment?.proofUrl && (
                <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-5">
                  <p className="mb-3 text-xs uppercase tracking-widest text-slate-500">Bukti pembayaran</p>
                  <a href={selectedTransaction.payment.proofUrl.startsWith("/uploads/") ? `${(import.meta.env.VITE_API_URL || "http://localhost:4000").replace(/\/$/, "")}${selectedTransaction.payment.proofUrl}` : selectedTransaction.payment.proofUrl} target="_blank" rel="noreferrer" className="text-sm text-emerald-700 underline">Lihat bukti pembayaran</a>
                </div>
              )}

              {/* ================================================= */}
              {/* ITEMS */}
              {/* ================================================= */}

              <div className="mt-8">

                <div className="mb-4 flex items-center justify-between">

                  <h3 className="text-xl font-medium">
                    Items (
                    {selectedTransaction.items.length}
                    )
                  </h3>

                </div>

                <div className="space-y-3">

                  {selectedTransaction.items.map(
                    (item) => (

                      <div
                        key={item.id}
                        className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4"
                      >

                        {/* Image */}

                        <img
                          src={item.thumbnail}
                          alt={item.title}
                          className="h-20 w-20 rounded-2xl bg-white object-cover"
                        />

                        {/* Info */}

                        <div className="min-w-0 flex-1">

                          <h4 className="truncate text-sm font-medium">
                            {item.title}
                          </h4>

                          <div className="mt-2 flex flex-wrap items-center gap-2">

                            <span className="text-xs text-slate-500">
                              Quantity:{" "}
                              {item.quantity}
                            </span>

                            {item.category && (
                              <>
                                <span className="text-slate-400">
                                  •
                                </span>

                                <span className="rounded-full border border-slate-200 bg-slate-100 px-2.5 py-1 text-[10px] text-slate-500">
                                  {item.category}
                                </span>
                              </>
                            )}

                          </div>

                        </div>

                        {/* Price */}

                        <div className="text-right">

                          <p className="text-sm font-semibold">
                            {formatPrice(
                              item.price *
                                item.quantity
                            )}
                          </p>

                        </div>

                      </div>

                    )
                  )}

                </div>

              </div>


              {/* ================================================= */}
              {/* CUSTOMER */}
              {/* ================================================= */}

              <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-5">

                <p className="text-xs uppercase tracking-widest text-slate-400">
                  Delivery Information
                </p>

                <div className="mt-4 grid gap-4 md:grid-cols-2">

                  <div>

                    <p className="text-xs text-slate-400">
                      Name
                    </p>

                    <p className="mt-1 text-sm text-slate-700">
                      {selectedTransaction.customer.name}
                    </p>

                  </div>

                  <div>

                    <p className="text-xs text-slate-400">
                      Phone
                    </p>

                    <p className="mt-1 text-sm text-slate-700">
                      {selectedTransaction.customer.phone}
                    </p>

                  </div>

                  <div className="md:col-span-2">

                    <p className="text-xs text-slate-400">
                      Address
                    </p>

                    <p className="mt-1 text-sm leading-relaxed text-slate-700">
                      {selectedTransaction.customer.address}
                    </p>

                  </div>

                </div>

              </div>


              {/* ================================================= */}
              {/* CLOSE */}
              {/* ================================================= */}

              <div className="mt-8 flex justify-end">

                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-full border border-slate-200 bg-white px-7 py-3 text-sm text-slate-700 transition hover:bg-slate-100 hover:text-slate-900"
                >
                  Close
                </button>

              </div>

            </div>

          </div>

        </div>

      )}

    </>
  );
}

export default TransactionHistory;