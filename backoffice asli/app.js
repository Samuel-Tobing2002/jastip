const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:4000").replace(/\/$/, "");
const TOKEN_KEY = "jastip_backoffice_token";

const app = document.querySelector("#app");

let token = localStorage.getItem(TOKEN_KEY) || "";
let products = [];
let orders = [];
let ordersError = "";
let settings = {
  profitPercent: 25,
  ownerWhatsapp: "",
};
let message = "";
let error = "";

const money = (value) => `$${Number(value || 0).toFixed(2)}`;
const imageUrl = (value) =>
  value?.startsWith("/uploads/") ? `${API_URL}${value}` : value;

const request = async (path, options = {}) => {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || "Request gagal.");
  }

  return data;
};

const fileToDataUrl = (file) =>
  new Promise((resolve, reject) => {
    if (!file) {
      resolve("");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

const showMessage = (text, isError = false) => {
  message = isError ? "" : text;
  error = isError ? text : "";
  render();
};

const loadDashboard = async () => {
  [products, settings] = await Promise.all([
    request("/api/products"),
    request("/api/settings"),
  ]);
  try {
    orders = await request("/api/admin/orders");
    ordersError = "";
  } catch (err) {
    orders = [];
    ordersError = err.message || "Gagal memuat pesanan.";
  }
};

const renderLogin = () => {
  app.innerHTML = `
    <section class="login">
      <form class="login-card" id="loginForm">
        <p class="eyebrow">Backoffice</p>
        <h1>JASTIP Admin</h1>
        <p class="copy">Login untuk upload produk, mengatur profit owner, dan nomor WhatsApp order.</p>
        <div class="form">
          <label class="field">
            <span>Username</span>
            <input name="username" autocomplete="username" required />
          </label>
          <label class="field">
            <span>Password</span>
            <input name="password" type="password" autocomplete="current-password" required />
          </label>
          ${error ? `<div class="message error">${error}</div>` : ""}
          <button class="button" type="submit">Login</button>
        </div>
      </form>
    </section>
  `;

  document.querySelector("#loginForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    try {
      const data = await request("/api/admin/login", {
        method: "POST",
        body: JSON.stringify({
          username: formData.get("username"),
          password: formData.get("password"),
        }),
      });

      token = data.token;
      localStorage.setItem(TOKEN_KEY, token);
      error = "";
      await loadDashboard();
      render();
    } catch (err) {
      showMessage(err.message, true);
    }
  });
};

const escapeHtml = (value) => String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));
const statusLabel = (status) => ({ PROCESSING: "Menunggu review", APPROVED: "Approved", REJECTED: "Rejected", PURCHASED: "Purchased", DELIVERED: "Delivered" }[status] || status);

const renderDashboard = () => {
  const totalBase = products.reduce((sum, item) => sum + Number(item.basePrice || 0), 0);
  const totalSell = products.reduce((sum, item) => sum + Number(item.price || 0), 0);

  app.innerHTML = `
    <section class="shell">
      <header class="topbar">
        <div>
          <div class="brand">JASTIP</div>
          <p class="eyebrow">Backoffice product manager</p>
        </div>
        <button class="button secondary" id="logoutButton" type="button">Logout</button>
      </header>

      <section class="panel" style="margin-top: 28px;">
        <p class="eyebrow">Owner control</p>
        <h1>Kelola produk dan margin.</h1>
        <p class="copy">Harga jual di website frontend dihitung otomatis dari harga modal + profit owner.</p>
        <div class="stats">
          <div class="stat"><strong>${products.length}</strong><span>Produk</span></div>
          <div class="stat"><strong>${settings.profitPercent}%</strong><span>Profit</span></div>
          <div class="stat"><strong>${money(totalSell - totalBase)}</strong><span>Potensi margin</span></div>
        </div>
      </section>

      <section class="grid">
        <div>
          <section class="panel">
            <h2>Setting Owner</h2>
            <form class="form" id="settingsForm">
              <label class="field">
                <span>Profit owner (%)</span>
                <input name="profitPercent" type="number" min="0" step="1" value="${settings.profitPercent}" />
              </label>
              <label class="field">
                <span>WhatsApp owner</span>
                <input name="ownerWhatsapp" value="${settings.ownerWhatsapp || ""}" placeholder="6281902515004" />
              </label>
              <button class="button" type="submit">Simpan Setting</button>
            </form>
          </section>

          <section class="panel" style="margin-top: 24px;">
            <h2>Upload Produk Baru</h2>
            <form class="form" id="productForm">
              <label class="field">
                <span>Nama produk</span>
                <input name="title" required placeholder="Oversized cotton shirt" />
              </label>
              <label class="field">
                <span>Deskripsi</span>
                <textarea name="description" required placeholder="Detail produk, bahan, request warna, dll."></textarea>
              </label>
              <div class="row">
                <label class="field">
                  <span>Kategori</span>
                  <input name="category" required placeholder="mens-shirts" />
                </label>
                <label class="field">
                  <span>Stok</span>
                  <input name="stock" type="number" min="0" value="1" />
                </label>
              </div>
              <div class="row">
                <label class="field">
                  <span>Harga modal</span>
                  <input name="basePrice" type="number" min="0" step="0.01" required placeholder="100" />
                </label>
                <label class="field">
                  <span>Rating</span>
                  <input name="rating" type="number" min="1" max="5" step="0.1" value="4.8" />
                </label>
              </div>
              <label class="field">
                <span>Upload gambar produk (maksimal 8 gambar)</span>
                <input
                  name="image"
                  type="file"
                  accept="image/*"
                  multiple
                  required
                />
              </label>
              <button class="button" type="submit">Upload Produk</button>
            </form>
          </section>
        </div>

        <section class="panel">
          <h2>Produk Website</h2>
          ${message ? `<div class="message" style="margin-top: 16px;">${message}</div>` : ""}
          ${error ? `<div class="message error" style="margin-top: 16px;">${error}</div>` : ""}
          <div class="products">
            ${products
              .map(
                (product) => `
                  <article class="product">
                    <img src="${imageUrl(product.thumbnail)}" alt="${product.title}" />
                    <div>
                      <h3>${product.title}</h3>
                      <p>${product.category} | Modal ${money(product.basePrice)} | Jual ${money(product.price)}</p>
                    </div>
                    <button class="button danger" data-delete="${product.id}" type="button">Delete</button>
                  </article>
                `
              )
              .join("") || `<p class="copy">Belum ada produk.</p>`}
          </div>
        </section>
      </section>

      <section class="panel" style="margin-top: 24px;" id="ordersPanel">
        <div class="orders-heading">
          <div>
            <p class="eyebrow">Order center</p>
            <h2>Pesanan masuk <span class="notification-count">${orders.filter((order) => order.status === "PROCESSING").length}</span></h2>
            <p class="copy">Periksa bukti pembayaran dan detail pemesan, lalu kelola setiap tahap pesanan.</p>
          </div>
          <button class="button secondary" id="refreshOrders" type="button">Refresh orders</button>
        </div>
        ${ordersError ? `<div class="message error" style="margin-top:18px">Pesanan belum dapat dimuat: ${escapeHtml(ordersError)}. Jika menggunakan Supabase, jalankan supabase/schema.sql terbaru untuk membuat tabel orders.</div>` : ""}
        ${orders.length ? `<div class="orders-list">${orders.map((order) => {
          const status = String(order.status || "PROCESSING").toUpperCase();
          const proof = order.payment?.proofUrl ? imageUrl(order.payment.proofUrl) : "";
          const itemSummary = (order.items || []).map((item) => `${item.title} × ${item.quantity}`).join(", ");
          const total = Number(order.summary?.total || 0);
          return `<article class="order-card">
            <div class="order-card-top">
              <div><p class="order-id">${escapeHtml(order.id)}</p><p class="order-date">${new Date(order.createdAt).toLocaleString("id-ID")}</p></div>
              <span class="order-status status-${status.toLowerCase()}">${escapeHtml(statusLabel(status))}</span>
            </div>
            <div class="order-summary"><div><strong>${escapeHtml(order.customer?.name || "Pelanggan")}</strong><p>${escapeHtml(itemSummary)}</p><p>${escapeHtml(order.customer?.phone || "-")}</p></div><strong>${money(total)}</strong></div>
            <details class="order-details"><summary>Lihat detail pemesan & bukti pembayaran</summary>
              <div class="order-detail-grid"><div><span>Nama</span><strong>${escapeHtml(order.customer?.name || "-")}</strong></div><div><span>Telepon</span><strong>${escapeHtml(order.customer?.phone || "-")}</strong></div><div class="full"><span>Alamat</span><strong>${escapeHtml(order.customer?.address || "-")}</strong></div><div><span>Subtotal produk</span><strong>${money(order.summary?.productSubtotal)}</strong></div><div><span>Jastip + pengiriman</span><strong>${money(Number(order.summary?.jastipFee || 0) + Number(order.summary?.shippingFee || 0))}</strong></div><div><span>Total dibayar</span><strong>${money(total)}</strong></div><div><span>Metode pembayaran</span><strong>${escapeHtml(order.payment?.method || "QR")}</strong></div></div>
              ${proof ? `<a class="proof-link" href="${proof}" target="_blank" rel="noreferrer"><img class="proof-image" src="${proof}" alt="Bukti pembayaran ${escapeHtml(order.id)}"/><span>Buka bukti pembayaran ukuran penuh ↗</span></a>` : `<p class="message error">Bukti pembayaran belum tersedia.</p>`}
              ${status === "REJECTED" ? `<div class="message error">Alasan penolakan: ${escapeHtml(order.rejectionReason || "-")}</div>` : ""}
            </details>
            <div class="order-actions">${status === "PROCESSING" ? `<button class="button" data-order-action="approve" data-order-id="${escapeHtml(order.id)}" type="button">Approve order</button><button class="button danger" data-order-action="reject" data-order-id="${escapeHtml(order.id)}" type="button">Reject</button>` : ""}${status === "APPROVED" ? `<button class="button" data-order-action="purchased" data-order-id="${escapeHtml(order.id)}" type="button">Confirm Purchased</button>` : ""}${status === "PURCHASED" ? `<button class="button" data-order-action="delivered" data-order-id="${escapeHtml(order.id)}" type="button">Confirm Delivered</button>` : ""}${status === "DELIVERED" ? `<span class="completed-label">✓ Pesanan selesai</span>` : ""}</div>
          </article>`;
        }).join("")}</div>` : `<div class="empty-orders"><strong>Belum ada pesanan masuk.</strong><p>Pesanan baru akan muncul di sini setelah pelanggan mengirim checkout dan bukti pembayaran.</p></div>`}
      </section>
      ${message ? `<div class="message" style="margin-top:16px">${message}</div>` : ""}
      ${error ? `<div class="message error" style="margin-top:16px">${error}</div>` : ""}
    </section>
  `;

  document.querySelector("#logoutButton").addEventListener("click", () => {
    token = "";
    localStorage.removeItem(TOKEN_KEY);
    render();
  });

  document.querySelector("#settingsForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    try {
      settings = await request("/api/admin/settings", {
        method: "PUT",
        body: JSON.stringify({
          profitPercent: Number(formData.get("profitPercent")),
          ownerWhatsapp: formData.get("ownerWhatsapp"),
        }),
      });
      await loadDashboard();
      showMessage("Setting owner berhasil disimpan.");
    } catch (err) {
      showMessage(err.message, true);
    }
  });

  document.querySelector("#productForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const imageInput = form.querySelector('input[name="image"]');
    const images = Array.from(imageInput?.files || []);

    try {
      if (!images.length) {
        throw new Error("Pilih minimal satu gambar produk.");
      }
      if (images.length > 8) {
        throw new Error("Maksimal 8 gambar untuk setiap produk.");
      }
      const oversized = images.find((image) => image.size > 5 * 1024 * 1024);
      if (oversized) {
        throw new Error(`Ukuran ${oversized.name} melebihi 5 MB.`);
      }

      const imageUploads = await Promise.all(
        images.map(async (image) => ({
          fileName: image.name || "product.png",
          dataUrl: await fileToDataUrl(image),
        }))
      );

      await request("/api/admin/products", {
        method: "POST",
        body: JSON.stringify({
          title: formData.get("title"),
          description: formData.get("description"),
          category: formData.get("category"),
          stock: Number(formData.get("stock")),
          basePrice: Number(formData.get("basePrice")),
          rating: Number(formData.get("rating")),
          imageUploads,
        }),
      });

      form.reset();
      await loadDashboard();
      showMessage("Produk baru berhasil diupload ke website.");
    } catch (err) {
      showMessage(err.message, true);
    }
  });

  document.querySelectorAll("[data-delete]").forEach((button) => {
    button.addEventListener("click", async () => {
      try {
        await request(`/api/admin/products/${button.dataset.delete}`, { method: "DELETE" });
        await loadDashboard();
        showMessage("Produk berhasil dihapus.");
      } catch (err) { showMessage(err.message, true); }
    });
  });

  document.querySelector("#refreshOrders")?.addEventListener("click", async () => {
    try { await loadDashboard(); renderDashboard(); }
    catch (err) { showMessage(err.message, true); }
  });

  document.querySelectorAll("[data-order-action]").forEach((button) => {
    button.addEventListener("click", async () => {
      const action = button.dataset.orderAction;
      let reason = "";
      if (action === "reject") {
        reason = window.prompt("Masukkan alasan penolakan pesanan:") || "";
        if (!reason.trim()) { showMessage("Alasan penolakan wajib diisi.", true); return; }
        if (!window.confirm("Yakin menolak pesanan ini?")) return;
      } else {
        const prompts = { approve: "Approve pesanan setelah memeriksa bukti pembayaran?", purchased: "Konfirmasi bahwa barang sudah dibeli?", delivered: "Konfirmasi bahwa barang sudah diterima/dikirim ke pelanggan?" };
        if (!window.confirm(prompts[action] || "Lanjutkan perubahan status?")) return;
      }
      button.disabled = true;
      try {
        await request(`/api/admin/orders/${encodeURIComponent(button.dataset.orderId)}`, {
          method: "PATCH", body: JSON.stringify({ action, reason }),
        });
        await loadDashboard();
        showMessage(action === "approve" ? "Pesanan berhasil di-approve." : action === "reject" ? "Pesanan berhasil ditolak." : action === "purchased" ? "Status Purchased berhasil diperbarui." : "Status Delivered berhasil diperbarui.");
      } catch (err) { showMessage(err.message, true); }
    });
  });
};

const render = () => {
  if (!token) {
    renderLogin();
    return;
  }

  renderDashboard();
};

if (token) {
  loadDashboard()
    .catch(() => {
      token = "";
      localStorage.removeItem(TOKEN_KEY);
    })
    .finally(render);
} else {
  render();
}

// Refresh order notifications periodically while admin is logged in.
window.setInterval(async () => {
  if (!token) return;
  try {
    const latestOrders = await request("/api/admin/orders");
    ordersError = "";
    if (JSON.stringify(latestOrders) !== JSON.stringify(orders)) {
      orders = latestOrders;
      const panel = document.querySelector("#ordersPanel");
      if (panel) renderDashboard();
    }
  } catch (error) { console.warn("Order refresh failed:", error.message); }
}, 15000);
