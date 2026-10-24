import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { formatRupiah } from "../utils/money";
import { readLocalTransactions, syncTransactions, orderStatusLabel } from "../services/orderService";

const TRANSACTION_STORAGE_KEY =
  "jastip_transactions";

function MyJastip() {
  const [transactions, setTransactions] =
    useState([]);

  useEffect(() => {
    let active = true;
    const refresh = async () => {
      const updated = await syncTransactions(readLocalTransactions());
      if (active) setTransactions(updated);
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

  if (transactions.length === 0) {
    return (
      <main className="min-h-screen bg-[#050505] px-6 pb-24 pt-32 text-white">

        <div className="mx-auto max-w-5xl">

          <p className="text-xs uppercase tracking-[0.3em] text-white/40">
            My Jastip
          </p>

          <h1 className="mt-4 text-5xl font-semibold">
            No Jastip yet
          </h1>

          <p className="mt-5 text-white/40">
            Your completed Jastip requests will appear
            here.
          </p>

          <Link
            to="/products"
            className="mt-8 inline-flex rounded-full bg-white px-7 py-4 font-medium text-black"
          >
            Explore Products →
          </Link>

        </div>

      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#050505] px-6 pb-24 pt-32 text-white">

      <div className="mx-auto max-w-6xl">

        {/* Header */}

        <div className="mb-12">

          <p className="text-xs uppercase tracking-[0.3em] text-white/40">
            My Jastip
          </p>

          <h1 className="mt-4 text-5xl font-semibold">
            Your requests
          </h1>

          <p className="mt-5 max-w-xl text-white/40">
            Track all the items you have requested
            through JASTIP.
          </p>

        </div>

        {/* Transactions */}

        <div className="space-y-6">

          {transactions.map((transaction) => (

            <div
              key={transaction.id}
              className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.03]"
            >

              {/* Transaction header */}

              <div className="flex flex-col gap-4 border-b border-white/10 p-6 md:flex-row md:items-center md:justify-between">

                <div>

                  <p className="text-xs uppercase tracking-widest text-white/30">
                    Jastip ID
                  </p>

                  <p className="mt-2 font-mono text-sm">
                    {transaction.id}
                  </p>

                  <p className="mt-2 text-xs text-white/30">
                    {formatDate(transaction.createdAt)}
                  </p>

                </div>

                <div className="flex flex-wrap gap-3">

                  <span className="rounded-full border border-emerald-400/20 bg-emerald-400/5 px-4 py-2 text-xs text-emerald-300">
                    {transaction.payment?.status === "PAID" ? "Payment Paid" : "Payment Pending"}
                  </span>

                  <span className={`rounded-full border px-4 py-2 text-xs ${transaction.status === "REJECTED" ? "border-red-400/20 bg-red-400/5 text-red-300" : transaction.status === "DELIVERED" ? "border-emerald-400/20 bg-emerald-400/5 text-emerald-300" : "border-violet-400/20 bg-violet-400/5 text-violet-300"}`}>
                    {orderStatusLabel(transaction.status)}
                  </span>

                </div>

              </div>

              {transaction.status === "REJECTED" && transaction.rejectionReason && (
                <div className="mx-6 mt-5 rounded-xl border border-red-400/20 bg-red-400/5 p-4 text-sm text-red-200">
                  Alasan penolakan: {transaction.rejectionReason}
                </div>
              )}

              {/* Items */}

              <div className="p-6">

                <div className="space-y-4">

                  {transaction.items.map((item) => (

                    <div
                      key={item.id}
                      className="flex items-center gap-4 rounded-2xl border border-white/5 bg-black/20 p-4"
                    >

                      <img
                        src={item.thumbnail}
                        alt={item.title}
                        className="h-20 w-20 rounded-2xl object-cover"
                      />

                      <div className="min-w-0 flex-1">

                        <p className="text-xs uppercase tracking-widest text-white/30">
                          {item.category}
                        </p>

                        <h3 className="mt-2 truncate font-medium">
                          {item.title}
                        </h3>

                        <p className="mt-1 text-sm text-white/30">
                          Quantity: {item.quantity}
                        </p>

                      </div>

                      <div className="text-right">

                        <p className="font-semibold">
                          {formatRupiah(item.price * item.quantity)}
                        </p>

                        <p className="mt-1 text-xs text-white/30">
                          Product
                        </p>

                      </div>

                    </div>

                  ))}

                </div>

                {/* Footer */}

                <div className="mt-6 flex flex-col gap-5 border-t border-white/10 pt-6 md:flex-row md:items-center md:justify-between">

                  <div>

                    <p className="text-xs uppercase tracking-widest text-white/30">
                      Delivery to
                    </p>

                    <p className="mt-2 text-sm text-white/60">
                      {transaction.customer.name}
                    </p>

                    <p className="mt-1 max-w-lg text-xs leading-relaxed text-white/30">
                      {transaction.customer.address}
                    </p>

                  </div>

                  <div className="text-left md:text-right">

                    <p className="text-xs text-white/30">
                      Total Paid
                    </p>

                    <p className="mt-1 text-2xl font-semibold">
                      {formatRupiah(transaction.summary.total)}
                    </p>

                  </div>

                </div>

              </div>

            </div>

          ))}

        </div>

      </div>

    </main>
  );
}

export default MyJastip;