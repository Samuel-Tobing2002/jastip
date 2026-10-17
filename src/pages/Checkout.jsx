import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Link, useNavigate } from "react-router-dom";

import { useCart } from "../context/CartContext";

const TRANSACTION_STORAGE_KEY = "jastip_transactions";
const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:4000").replace(/\/$/, "");

const fileToDataUrl = (file) => new Promise((resolve, reject) => {
  if (!file) return resolve("");
  const reader = new FileReader();
  reader.onload = () => resolve(reader.result);
  reader.onerror = reject;
  reader.readAsDataURL(file);
});

function Checkout() {
  const navigate = useNavigate();

  const {
    cart,
    baseSubtotal,
    productSubtotal,
    jastipFee,
    shippingFee,
    total,
    clearCart,
  } = useCart();

  const [customer, setCustomer] = useState({
    name: "",
    phone: "",
    address: "",
  });

  const [orderCreated, setOrderCreated] =
    useState(false);

  const [paymentSuccess, setPaymentSuccess] =
    useState(false);

  const [error, setError] = useState("");
  const [paymentProof, setPaymentProof] = useState(null);
  const [submittingPayment, setSubmittingPayment] = useState(false);

  const [transaction, setTransaction] =
    useState(null);

  useEffect(() => {
    if (!paymentSuccess || !transaction?.id) return undefined;
    let active = true;
    const refreshOrder = async () => {
      try {
        const response = await fetch(`${API_URL}/api/orders/${encodeURIComponent(transaction.id)}`);
        if (!response.ok) return;
        const updated = await response.json();
        if (!active) return;
        setTransaction((current) => ({ ...current, ...updated }));
        const saved = JSON.parse(localStorage.getItem(TRANSACTION_STORAGE_KEY) || "[]");
        localStorage.setItem(TRANSACTION_STORAGE_KEY, JSON.stringify(saved.map((item) => item.id === updated.id ? { ...item, ...updated } : item)));
      } catch (refreshError) {
        console.warn("Gagal memperbarui status pesanan:", refreshError.message);
      }
    };
    const timer = window.setInterval(refreshOrder, 5000);
    return () => { active = false; window.clearInterval(timer); };
  }, [paymentSuccess, transaction?.id]);

  const handleChange = (event) => {
    setCustomer((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));

    setError("");
  };

  /**
   * Generate payment QR
   */
  const handleGenerateQR = (event) => {
    event.preventDefault();

    if (!customer.name.trim()) {
      setError("Please enter your full name.");
      return;
    }

    if (!customer.phone.trim()) {
      setError("Please enter your phone number.");
      return;
    }

    if (!customer.address.trim()) {
      setError("Please enter your delivery address.");
      return;
    }

    if (cart.length === 0) {
      setError("Your Jastip cart is empty.");
      return;
    }

    setError("");
    setOrderCreated(true);
  };

  /**
   * Prototype payment confirmation
   *
   * IMPORTANT:
   * This only simulates payment for development.
   */
  const handlePaymentSimulation = async () => {
    if (cart.length === 0 || submittingPayment) return;
    if (!paymentProof) {
      setError("Unggah bukti pembayaran terlebih dahulu.");
      return;
    }
    if (paymentProof.size > 5 * 1024 * 1024) {
      setError("Ukuran bukti pembayaran maksimal 5 MB.");
      return;
    }

    setSubmittingPayment(true);
    setError("");
    try {
      const transactionId = `JSTP-${Date.now().toString().slice(-8)}`;
      const now = new Date().toISOString();
      const newTransaction = {
        id: transactionId,
        customer: { name: customer.name, phone: customer.phone, address: customer.address },
        items: cart.map((item) => ({ id: item.id, title: item.title, thumbnail: item.thumbnail, price: item.price, quantity: item.quantity, category: item.category })),
        summary: { baseSubtotal, productSubtotal, jastipFee, shippingFee, total },
        payment: { status: "PAID", method: "QR", paidAt: now },
        status: "PROCESSING",
        approvalStatus: "PENDING",
        createdAt: now,
        updatedAt: now,
      };
      const proofDataUrl = await fileToDataUrl(paymentProof);
      const response = await fetch(`${API_URL}/api/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order: newTransaction, paymentProof: { fileName: paymentProof.name, dataUrl: proofDataUrl } }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || "Pesanan gagal dikirim ke server.");
      const savedTransaction = { ...newTransaction, ...data };
      let previousTransactions = [];
      try { previousTransactions = JSON.parse(localStorage.getItem(TRANSACTION_STORAGE_KEY) || "[]"); } catch { previousTransactions = []; }
      localStorage.setItem(TRANSACTION_STORAGE_KEY, JSON.stringify([savedTransaction, ...previousTransactions.filter((item) => item.id !== savedTransaction.id)]));
      setTransaction(savedTransaction);
      clearCart();
      setPaymentSuccess(true);
    } catch (submitError) {
      setError(submitError.message || "Gagal mengirim pesanan.");
    } finally {
      setSubmittingPayment(false);
    }
  };

  /**
   * Empty cart before checkout
   */
  if (
    cart.length === 0 &&
    !orderCreated &&
    !paymentSuccess
  ) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#050505] px-6 text-white">

        <div className="text-center">

          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-white/10 bg-white/5 text-3xl">
            🛒
          </div>

          <h1 className="mt-8 text-3xl font-semibold">
            Your Jastip is empty
          </h1>

          <p className="mt-4 text-white/40">
            Add something to your Jastip before
            checking out.
          </p>

          <Link
            to="/products"
            className="mt-8 inline-flex rounded-full bg-white px-7 py-4 font-medium text-black transition hover:scale-105"
          >
            Explore Products →
          </Link>

        </div>

      </main>
    );
  }

  /**
   * PAYMENT SUCCESS
   */
  if (paymentSuccess) {
    return (
      <main className="relative min-h-screen overflow-hidden bg-[#050505] px-6 pb-24 pt-32 text-white">

        {/* Ambient glow */}

        <div className="pointer-events-none absolute left-1/2 top-20 h-[400px] w-[400px] -translate-x-1/2 rounded-full bg-violet-600/10 blur-[140px]" />

        <div className="pointer-events-none absolute left-0 top-1/2 h-[300px] w-[300px] rounded-full bg-violet-600/10 blur-[120px]" />

        <div className="pointer-events-none absolute right-0 top-1/2 h-[300px] w-[300px] rounded-full bg-cyan-500/10 blur-[120px]" />

        <div className="relative z-10 mx-auto max-w-5xl">

          {/* Success header */}

          <div className="text-center">

            {/* Animated hourglass */}

            <div className="mx-auto flex h-28 w-28 items-center justify-center rounded-full border border-emerald-400/30 bg-emerald-400/5 shadow-[0_0_60px_rgba(52,211,153,0.08)]">

              <div className="flex h-20 w-20 animate-[spin_2.5s_linear_infinite] items-center justify-center rounded-full border border-white/10 bg-black/40">

                <span className="text-4xl">
                  ⏳
                </span>

              </div>

            </div>

            <p className="mt-8 text-xs font-medium uppercase tracking-[0.35em] text-emerald-400">
              Payment Confirmed
            </p>

            <h1 className="mt-4 text-4xl font-semibold md:text-5xl">
              Jastip received.
            </h1>

            <p className="mx-auto mt-5 max-w-xl leading-relaxed text-white/40">
              {transaction?.status === "REJECTED" ? "Your order was rejected by the admin." : transaction?.status === "DELIVERED" ? "Your order has been delivered." : `Payment recorded. Current order status: ${transaction?.status || "PROCESSING"}. This page refreshes automatically.`}
            </p>

          </div>

          {/* Transaction status */}
          <div className="mt-12 rounded-[2rem] border border-white/10 bg-white/[0.03] p-8 backdrop-blur-xl">
            <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
              {[
                { label: "Payment", done: true, detail: "Completed" },
                { label: "Processing", done: ["APPROVED", "PURCHASED", "DELIVERED"].includes(transaction?.status), current: transaction?.status === "PROCESSING", rejected: transaction?.status === "REJECTED", detail: transaction?.status === "PROCESSING" ? "Waiting approval" : transaction?.status === "REJECTED" ? "Rejected" : "Approved" },
                { label: "Purchased", done: ["PURCHASED", "DELIVERED"].includes(transaction?.status), current: transaction?.status === "APPROVED", detail: transaction?.purchasedAt ? new Date(transaction.purchasedAt).toLocaleString() : "Pending" },
                { label: "Delivered", done: transaction?.status === "DELIVERED", current: transaction?.status === "PURCHASED", detail: transaction?.deliveredAt ? new Date(transaction.deliveredAt).toLocaleString() : "Pending" },
              ].map((step, index) => (
                <div key={step.label}>
                  <div className="flex items-center gap-3">
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border ${step.rejected ? "border-red-400/30 bg-red-400/10 text-red-300" : step.done || step.label === "Payment" ? "border-emerald-400/30 bg-emerald-400 text-black" : step.current ? "border-violet-400/30 bg-violet-400/10 text-violet-200" : "border-white/10 bg-white/5 text-white/30"}`}>
                      {step.rejected ? "×" : step.done || step.label === "Payment" ? "✓" : index + 1}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{step.label}</p>
                      <p className={`mt-1 text-xs ${step.rejected ? "text-red-300" : step.done || step.label === "Payment" ? "text-emerald-400" : step.current ? "text-violet-300" : "text-white/30"}`}>{step.detail}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {transaction?.status === "REJECTED" && <p className="mt-6 rounded-xl border border-red-400/20 bg-red-400/5 p-4 text-sm text-red-200">Pesanan ditolak oleh admin. Alasan: {transaction.rejectionReason || "Silakan hubungi admin untuk informasi lebih lanjut."}</p>}
          </div>

          {/* Transaction info */}

          {transaction && (
            <div className="mt-6 grid gap-6 md:grid-cols-2">

              <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">

                <p className="text-xs uppercase tracking-widest text-white/30">
                  Transaction
                </p>

                <p className="mt-3 font-mono text-sm">
                  {transaction.id}
                </p>

                <p className="mt-2 text-sm text-white/40">
                  {new Date(
                    transaction.createdAt
                  ).toLocaleString()}
                </p>

              </div>

              <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">

                <p className="text-xs uppercase tracking-widest text-white/30">
                  Total Paid
                </p>

                <p className="mt-3 text-2xl font-semibold">
                  ${transaction.summary.total.toFixed(2)}
                </p>

                <p className="mt-2 text-sm text-emerald-400">
                  Payment completed
                </p>

              </div>

            </div>
          )}

          {/* Items */}

          {transaction && (
            <div className="mt-6 rounded-3xl border border-white/10 bg-white/[0.03] p-6">

              <div className="mb-6 flex items-center justify-between">

                <div>

                  <p className="text-xs uppercase tracking-widest text-white/30">
                    Jastip Items
                  </p>

                  <h2 className="mt-2 text-xl font-medium">
                    Items being processed
                  </h2>

                </div>

                <span className="rounded-full border border-violet-400/20 bg-violet-400/10 px-4 py-2 text-xs text-violet-300">
                  Processing
                </span>

              </div>

              <div className="space-y-3">

                {transaction.items.map((item) => (

                  <div
                    key={item.id}
                    className="flex items-center gap-4 rounded-2xl border border-white/5 bg-black/20 p-4"
                  >

                    <img
                      src={item.thumbnail}
                      alt={item.title}
                      className="h-16 w-16 rounded-xl object-cover"
                    />

                    <div className="min-w-0 flex-1">

                      <h3 className="truncate text-sm font-medium">
                        {item.title}
                      </h3>

                      <p className="mt-1 text-xs text-white/30">
                        Quantity: {item.quantity}
                      </p>

                    </div>

                    <span className="text-sm font-medium">
                      $
                      {(
                        item.price *
                        item.quantity
                      ).toFixed(2)}
                    </span>

                  </div>

                ))}

              </div>

            </div>
          )}

          {/* Actions */}

          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">

            <button
              onClick={() => navigate("/jastip")}
              className="rounded-full bg-white px-8 py-4 text-sm font-semibold text-black transition hover:scale-105"
            >
              View My Jastip →
            </button>

            <button
              onClick={() => navigate("/history")}
              className="rounded-full border border-white/10 bg-white/5 px-8 py-4 text-sm text-white/70 transition hover:bg-white/10 hover:text-white"
            >
              Transaction History
            </button>

            <button
              onClick={() => navigate("/")}
              className="rounded-full border border-white/10 bg-white/5 px-8 py-4 text-sm text-white/70 transition hover:bg-white/10 hover:text-white"
            >
              Back to Home
            </button>

          </div>

        </div>

      </main>
    );
  }

  /**
   * CHECKOUT / CUSTOMER INFORMATION
   */

  return (
    <main className="min-h-screen bg-[#050505] px-6 pb-24 pt-32 text-white">

      <div className="mx-auto max-w-6xl">

        <div className="mb-12">

          <p className="text-xs uppercase tracking-[0.3em] text-white/40">
            Checkout
          </p>

          <h1 className="mt-4 text-5xl font-semibold">
            Complete your Jastip
          </h1>

          <p className="mt-4 max-w-xl text-white/40">
            Enter your delivery information before
            continuing to payment.
          </p>

        </div>

        {!orderCreated ? (

          <form
            onSubmit={handleGenerateQR}
            className="grid gap-10 lg:grid-cols-[1fr_380px]"
          >

            {/* CUSTOMER DETAILS */}

            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-8">

              <h2 className="text-xl font-medium">
                Delivery details
              </h2>

              <p className="mt-2 text-sm text-white/40">
                Tell us where your Jastip should be
                delivered.
              </p>

              <div className="mt-8 space-y-5">

                {/* Name */}

                <div>

                  <label className="mb-2 block text-sm text-white/50">
                    Full name
                  </label>

                  <input
                    name="name"
                    value={customer.name}
                    onChange={handleChange}
                    placeholder="Enter your full name"
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-white outline-none transition placeholder:text-white/20 focus:border-white/30"
                  />

                </div>

                {/* Phone */}

                <div>

                  <label className="mb-2 block text-sm text-white/50">
                    Phone number
                  </label>

                  <input
                    name="phone"
                    value={customer.phone}
                    onChange={handleChange}
                    placeholder="+62 812..."
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-white outline-none transition placeholder:text-white/20 focus:border-white/30"
                  />

                </div>

                {/* Address */}

                <div>

                  <label className="mb-2 block text-sm text-white/50">
                    Delivery address
                  </label>

                  <textarea
                    name="address"
                    value={customer.address}
                    onChange={handleChange}
                    placeholder="Enter your complete delivery address"
                    rows={6}
                    className="w-full resize-none rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-white outline-none transition placeholder:text-white/20 focus:border-white/30"
                  />

                </div>

                {/* Error */}

                {error && (
                  <div className="rounded-2xl border border-red-400/20 bg-red-400/5 px-4 py-3 text-sm text-red-300">
                    {error}
                  </div>
                )}

              </div>

            </div>

            {/* SUMMARY */}

            <div className="h-fit rounded-3xl border border-white/10 bg-white/[0.03] p-7">

              <p className="text-xs uppercase tracking-[0.2em] text-white/30">
                Order Summary
              </p>

              <div className="mt-6 space-y-3">

                {cart.map((item) => (

                  <div
                    key={item.id}
                    className="flex items-center gap-3"
                  >

                    <img
                      src={item.thumbnail}
                      alt={item.title}
                      className="h-12 w-12 rounded-xl object-cover"
                    />

                    <div className="min-w-0 flex-1">

                      <p className="truncate text-sm">
                        {item.title}
                      </p>

                      <p className="text-xs text-white/30">
                        × {item.quantity}
                      </p>

                    </div>

                    <span className="text-sm">
                      $
                      {(
                        item.price *
                        item.quantity
                      ).toFixed(2)}
                    </span>

                  </div>

                ))}

              </div>

              <div className="my-6 h-px bg-white/10" />

              <div className="space-y-4 text-sm">

                <div className="flex justify-between text-white/50">
                  <span>Modal Produk</span>
                  <span>
                    ${baseSubtotal.toFixed(2)}
                  </span>
                </div>

                <div className="flex justify-between text-white/50">
                  <span>Profit Owner</span>
                  <span>
                    ${jastipFee.toFixed(2)}
                  </span>
                </div>

                <div className="flex justify-between text-white/50">
                  <span>Harga Jual Produk</span>
                  <span>
                    ${productSubtotal.toFixed(2)}
                  </span>
                </div>

                <div className="flex justify-between text-white/50">
                  <span>Estimated Shipping</span>
                  <span>
                    ${shippingFee.toFixed(2)}
                  </span>
                </div>

              </div>

              <div className="my-6 h-px bg-white/10" />

              <div className="flex justify-between">

                <span>
                  Estimated Total
                </span>

                <span className="text-xl font-semibold">
                  ${total.toFixed(2)}
                </span>

              </div>

              <button
                type="submit"
                className="mt-8 w-full rounded-full bg-white py-4 font-semibold text-black transition hover:scale-[1.02]"
              >
                Generate Payment QR →
              </button>

            </div>

          </form>

        ) : (

          /* QR PAYMENT */

          <div className="mx-auto max-w-xl">

            <div className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-8 text-center">

              <p className="text-xs uppercase tracking-[0.3em] text-white/40">
                Payment
              </p>

              <h2 className="mt-5 text-3xl font-semibold">
                Scan to pay
              </h2>

              <p className="mt-4 text-sm leading-relaxed text-white/40">
                Scan this QR code to view the payment
                information.
              </p>

              {/* QR */}

              <div className="mx-auto mt-10 flex w-fit rounded-3xl bg-white p-6">

                <QRCodeSVG
                  value={JSON.stringify({
                    merchant: "JASTIP",
                    transaction:
                      `JSTP-${Date.now().toString().slice(-8)}`,
                    amount: Number(total.toFixed(2)),
                    currency: "USD",
                    customer: customer.name,
                  })}
                  size={240}
                  level="H"
                />

              </div>

              {/* Amount */}

              <div className="mt-8 rounded-2xl border border-white/10 bg-black/30 p-6">

                <p className="text-xs uppercase tracking-widest text-white/30">
                  Amount to pay
                </p>

                <p className="mt-2 text-4xl font-semibold">
                  ${total.toFixed(2)}
                </p>

              </div>

              {/* Customer */}

              <div className="mt-6 space-y-2 text-left text-sm text-white/40">

                <p>
                  <span className="text-white/20">
                    Name:
                  </span>{" "}
                  {customer.name}
                </p>

                <p>
                  <span className="text-white/20">
                    Phone:
                  </span>{" "}
                  {customer.phone}
                </p>

              </div>

              {/* PAYMENT PROOF */}
              <div className="mt-6 text-left">
                <label className="block text-sm font-medium text-white/80" htmlFor="payment-proof">
                  Bukti pembayaran (JPG, PNG, atau WebP; maks. 5 MB)
                </label>
                <input
                  id="payment-proof"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(event) => { setPaymentProof(event.target.files?.[0] || null); setError(""); }}
                  className="mt-3 block w-full rounded-xl border border-white/10 bg-black/30 p-3 text-sm text-white/70 file:mr-4 file:rounded-full file:border-0 file:bg-white file:px-4 file:py-2 file:font-medium file:text-black"
                />
                {paymentProof && <p className="mt-2 text-xs text-emerald-300">Dipilih: {paymentProof.name}</p>}
                {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
              </div>

              {/* DEMO PAYMENT */}

              <button
                type="button"
                onClick={handlePaymentSimulation}
                disabled={submittingPayment}
                className="mt-8 w-full rounded-full bg-emerald-400 py-4 font-semibold text-black transition hover:bg-emerald-300 hover:shadow-[0_0_30px_rgba(52,211,153,0.15)]"
              >
                {submittingPayment ? "Mengirim pesanan..." : "✓ Sudah Bayar & Kirim Pesanan"}
              </button>

              <p className="mt-4 text-xs leading-relaxed text-white/20">
                Pembayaran masih berupa simulasi. Bukti yang diunggah akan diperiksa manual oleh admin sebelum pesanan disetujui.
              </p>

            </div>

          </div>

        )}

      </div>

    </main>
  );
}

export default Checkout;
