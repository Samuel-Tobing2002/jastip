const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:4000").replace(/\/$/, "");
export const TRANSACTION_STORAGE_KEY = "jastip_transactions";
export const readLocalTransactions = () => {
  try { return JSON.parse(localStorage.getItem(TRANSACTION_STORAGE_KEY) || "[]"); }
  catch { return []; }
};
export const syncTransactions = async (transactions = readLocalTransactions()) => {
  const synced = await Promise.all(transactions.map(async (transaction) => {
    try {
      const response = await fetch(`${API_URL}/api/orders/${encodeURIComponent(transaction.id)}`);
      if (!response.ok) return transaction;
      return { ...transaction, ...(await response.json()) };
    } catch { return transaction; }
  }));
  localStorage.setItem(TRANSACTION_STORAGE_KEY, JSON.stringify(synced));
  return synced;
};
export const orderStatusLabel = (status) => ({
  PROCESSING: "Menunggu approval", APPROVED: "Approved", REJECTED: "Rejected",
  PURCHASED: "Purchased", DELIVERED: "Delivered",
}[String(status || "PROCESSING").toUpperCase()] || "Processing");
