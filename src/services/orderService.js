const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:4000").replace(/\/$/, "");
export const TRANSACTION_STORAGE_KEY = "jastip_transactions";
const TOKEN_KEY = "jastip_customer_token";

export const readLocalTransactions = () => [];
export const syncTransactions = async () => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (!token) return [];
  const response = await fetch(`${API_URL}/api/my/orders`, {
    headers: { Authorization: `Bearer ${token}`, "ngrok-skip-browser-warning": "true" },
  });
  if (!response.ok) throw new Error(response.status === 401 ? "Silakan login kembali." : "Riwayat transaksi gagal dimuat dari server.");
  return response.json();
};
export const orderStatusLabel = (status) => ({
  PROCESSING: "Menunggu approval", APPROVED: "Approved", REJECTED: "Rejected",
  PURCHASED: "Purchased", DELIVERED: "Delivered",
}[String(status || "PROCESSING").toUpperCase()] || "Processing");
