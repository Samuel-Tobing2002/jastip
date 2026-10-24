// Legacy product prices are stored in thousands; display them as whole Rupiah.
export const formatRupiah = (value) => new Intl.NumberFormat("id-ID", {
  style: "currency", currency: "IDR", maximumFractionDigits: 0,
}).format(Number(value || 0) * 1000);
