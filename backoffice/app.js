// const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:4000").replace(/\/$/, "");

const API_URL = (import.meta.env.VITE_API_URL || "https://confront-radiantly-polar.ngrok-free.dev").replace(/\/$/, "");

async function apiFetch(path, options = {}) {
  const headers = new Headers(options.headers || {});

  headers.set("ngrok-skip-browser-warning", "true");

  return fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });
}

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
let activeSection = "orders";

const money = (value) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(Number(value || 0) * 1000);
const imageUrl = (value) =>
  value?.startsWith("/uploads/") ? `${API_URL}${value}` : value;


const request = async (path, options = {}) => {
  const headers = new Headers(options.headers || {});

  headers.set("ngrok-skip-browser-warning", "true");

  if (options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || `Request gagal (HTTP ${response.status}).`);
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
  const orderQuery = window.orderQuery || "";
  const orderStatusFilter = window.orderStatusFilter || "ALL";
  const visibleOrders = orders.filter((order) => {
    const q = orderQuery.toLocaleLowerCase("id-ID");
    const searchable = [order.id, order.customer?.name, order.customer?.phone, order.customer?.address, ...(order.items || []).map((item) => item.title)].join(" ").toLocaleLowerCase("id-ID");
    return (!q || searchable.includes(q)) && (orderStatusFilter === "ALL" || String(order.status).toUpperCase() === orderStatusFilter);
  });

  app.innerHTML = `
    <section class="shell">
      <header class="topbar">
        <div>
          <div class="brand">JASTIP</div>
          <p class="eyebrow">Backoffice product manager</p>
        </div>
        <nav class="backoffice-nav" aria-label="Menu backoffice">
          <button class="button ${activeSection === "products" ? "" : "secondary"}" id="showProducts" type="button">Create Product</button>
          <button class="button ${activeSection === "orders" ? "" : "secondary"}" id="showOrders" type="button">Order Center <span class="nav-count">${orders.filter((order) => order.status === "PROCESSING").length}</span></button>
        </nav>
        <button class="button secondary" id="logoutButton" type="button">Logout</button>
      </header>

      <section id="productsSection" style="display:${activeSection === "products" ? "block" : "none"};">
        <div class="section-heading">
          <div><p class="eyebrow">Product management</p><h1>Create Product</h1><p class="copy">Tambah produk baru dan kelola katalog yang tampil di website JASTIP.</p></div>
          <div class="section-stat"><strong>${products.length}</strong><span>Produk aktif</span></div>
        </div>
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
              <label class="field">
                <span>Warna tersedia (pisahkan dengan koma)</span>
                <input name="colors" placeholder="Hitam, Putih, Abu-abu, Beige" />
              </label>
              <div class="row">
                <label class="field">
                  <span>Harga modal (ribuan Rupiah)</span>
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
                    <div class="product-actions"><span class="stock-pill ${Number(product.stock) <= 0 ? "sold-out" : ""}">Stok: ${Number(product.stock || 0)}${Number(product.stock) <= 0 ? " · SOLD OUT" : ""}</span><button class="button secondary" data-edit="${escapeHtml(product.id)}" type="button">Edit</button><button class="button danger" data-delete="${escapeHtml(product.id)}" type="button">Delete</button></div>
                  </article>
                `
              )
              .join("") || `<p class="copy">Belum ada produk.</p>`}
          </div>
        </section>
      </section>

      </section>

      <section class="panel" style="display:${activeSection === "orders" ? "block" : "none"}; margin-top: 24px;" id="ordersPanel">
        <div class="orders-heading">
          <div>
            <p class="eyebrow">Order center</p>
            <h2>Pesanan masuk <span class="notification-count">${orders.filter((order) => order.status === "PROCESSING").length}</span></h2>
            <p class="copy">Periksa bukti pembayaran dan detail pemesan, lalu kelola setiap tahap pesanan.</p>
          </div>
          <button class="button secondary" id="refreshOrders" type="button">Refresh orders</button>
        </div>
        <div class="order-kpi-grid">
          ${[{label:"Semua pesanan",status:"ALL",count:orders.length},{label:"Menunggu approval",status:"PROCESSING",count:orders.filter(o=>String(o.status).toUpperCase()==="PROCESSING").length},{label:"Approved",status:"APPROVED",count:orders.filter(o=>String(o.status).toUpperCase()==="APPROVED").length},{label:"Purchased",status:"PURCHASED",count:orders.filter(o=>String(o.status).toUpperCase()==="PURCHASED").length},{label:"Delivered",status:"DELIVERED",count:orders.filter(o=>String(o.status).toUpperCase()==="DELIVERED").length},{label:"Rejected",status:"REJECTED",count:orders.filter(o=>String(o.status).toUpperCase()==="REJECTED").length}].map(item=>`<button class="order-kpi ${orderStatusFilter===item.status?"active":""}" type="button" data-status-shortcut="${item.status}"><span>${item.label}</span><strong>${item.count}</strong></button>`).join("")}
        </div>
        <section class="status-chart panel"><div class="status-chart-head"><div><p class="eyebrow">Ringkasan operasional</p><h3>Distribusi status pesanan</h3></div><span>${orders.length} pesanan tercatat</span></div>
          ${["PROCESSING","APPROVED","PURCHASED","DELIVERED","REJECTED"].map(status=>{const count=orders.filter(o=>String(o.status).toUpperCase()===status).length;const pct=orders.length?Math.round(count/orders.length*100):0;return `<div class="status-bar-row"><div><span>${statusLabel(status)}</span><strong>${count} <small>(${pct}%)</small></strong></div><div class="status-bar-track"><span class="status-bar-fill status-fill-${status.toLowerCase()}" style="width:${pct}%"></span></div></div>`}).join("")}
        </section>
        <div class="order-filters"><input id="orderSearch" type="search" value="${escapeHtml(orderQuery)}" placeholder="Cari nama, nomor HP, alamat, ID, atau produk..."/><select id="orderStatusFilter"><option value="ALL" ${orderStatusFilter === "ALL" ? "selected" : ""}>Semua status</option>${["PROCESSING","APPROVED","REJECTED","PURCHASED","DELIVERED"].map((status) => `<option value="${status}" ${orderStatusFilter === status ? "selected" : ""}>${statusLabel(status)}</option>`).join("")}</select></div>
        ${ordersError ? `<div class="message error" style="margin-top:18px">Pesanan belum dapat dimuat: ${escapeHtml(ordersError)}. Jika menggunakan Supabase, jalankan supabase/schema.sql terbaru untuk membuat tabel orders.</div>` : ""}
        ${visibleOrders.length ? `<div class="orders-list">${visibleOrders.map((order) => {
          const status = String(order.status || "PROCESSING").toUpperCase();
          const proof = order.payment?.proofUrl ? imageUrl(order.payment.proofUrl) : "";
          const itemSummary = (order.items || []).map((item) => `${item.title} × ${item.quantity}${item.selectedColor ? ` · Warna: ${item.selectedColor}` : ""}${item.selectedSize ? ` · Ukuran: ${item.selectedSize}` : ""}`).join(", ");
          const total = Number(order.summary?.total || 0);
          return `<article class="order-card">
            <div class="order-card-top">
              <div><p class="order-id">${escapeHtml(order.id)}</p><p class="order-date">${new Date(order.createdAt).toLocaleString("id-ID")}</p></div>
              <span class="order-status status-${status.toLowerCase()}">${escapeHtml(statusLabel(status))}</span>
            </div>
            <div class="order-summary"><div><strong>${escapeHtml(order.customer?.name || "Pelanggan")}</strong><p>${escapeHtml(itemSummary)}</p><p>${escapeHtml(order.customer?.phone || "-")}</p><p>${escapeHtml(order.customer?.address || "-")}</p></div><strong>${money(total)}</strong></div>
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

  document.querySelector("#showProducts").addEventListener("click", () => {
    activeSection = "products";
    message = "";
    error = "";
    renderDashboard();
  });
  document.querySelector("#showOrders").addEventListener("click", () => {
    activeSection = "orders";
    message = "";
    error = "";
    renderDashboard();
  });

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
          colors: String(formData.get("colors") || "").split(",").map((color) => color.trim()).filter(Boolean),
          imageUploads,
        }),
      });

      form.reset();
      await loadDashboard();
      activeSection = "products";
      showMessage("Produk baru berhasil diupload ke website.");
    } catch (err) {
      showMessage(err.message, true);
    }
  });

  document.querySelectorAll("[data-edit]").forEach((button) => {
    button.addEventListener("click", async () => {
      const product = products.find((item) => item.id === button.dataset.edit);
      if (!product) return;
      const result = await window.Swal?.fire({
        title: "Edit produk",
        html: `<div class="swal-product-form">
          <label>Nama produk<input id="edit-title" class="swal2-input" value="${escapeHtml(product.title)}"></label>
          <label>Deskripsi<textarea id="edit-description" class="swal2-textarea">${escapeHtml(product.description || "")}</textarea></label>
          <div class="swal-product-row"><label>Kategori<input id="edit-category" class="swal2-input" value="${escapeHtml(product.category || "fashion")}"></label><label>Stok tersedia<input id="edit-stock" class="swal2-input" type="number" min="0" value="${Number(product.stock ?? 0)}"></label></div>
          <div class="swal-product-row"><label>Harga modal (ribuan Rp)<input id="edit-price" class="swal2-input" type="number" min="0" step="1" value="${Number(product.basePrice ?? 0)}"></label><label>Rating<input id="edit-rating" class="swal2-input" type="number" min="0" max="5" step="0.1" value="${Number(product.rating || 4.8)}"></label></div>
          <label>Warna (pisahkan dengan koma)<input id="edit-colors" class="swal2-input" value="${escapeHtml((product.colors || []).join(", "))}"></label>
        </div>`,
        width: 680,
        focusConfirm: false,
        showCancelButton: true,
        confirmButtonText: "Simpan perubahan",
        cancelButtonText: "Batal",
        confirmButtonColor: "#111111",
        cancelButtonColor: "#777777",
        customClass: { popup: "jastip-swal-popup", htmlContainer: "jastip-swal-html" },
        preConfirm: () => {
          const value = (id) => document.getElementById(id).value.trim();
          const stock = Number(value("edit-stock")); const price = Number(value("edit-price")); const rating = Number(value("edit-rating"));
          if (!value("edit-title") || !value("edit-category") || !Number.isInteger(stock) || stock < 0 || !Number.isFinite(price) || price < 0 || !Number.isFinite(rating) || rating < 0 || rating > 5) {
            window.Swal.showValidationMessage("Periksa nama, kategori, stok, harga, dan rating."); return false;
          }
          return { title: value("edit-title"), description: value("edit-description"), category: value("edit-category"), stock, basePrice: price, rating, colors: value("edit-colors").split(",").map((c) => c.trim()).filter(Boolean) };
        }
      });
      if (!result?.isConfirmed) return;
      try {
        await request(`/api/admin/products/${encodeURIComponent(product.id)}`, { method: "PUT", body: JSON.stringify(result.value) });
        await loadDashboard(); renderDashboard();
        await window.Swal?.fire({ icon: "success", title: "Produk diperbarui", text: "Perubahan produk dan stok sudah tersimpan.", confirmButtonColor: "#111111" });
      } catch (err) { await window.Swal?.fire({ icon: "error", title: "Gagal memperbarui produk", text: err.message, confirmButtonColor: "#111111" }); }
    });
  });

  document.querySelectorAll("[data-delete]").forEach((button) => {
    button.addEventListener("click", async () => {
      const result = await window.Swal?.fire({ icon: "warning", title: "Hapus produk?", text: "Produk ini akan dihapus dari katalog.", showCancelButton: true, confirmButtonText: "Ya, hapus", cancelButtonText: "Batal", confirmButtonColor: "#b42318" });
      if (!result?.isConfirmed) return;
      try {
        await request(`/api/admin/products/${button.dataset.delete}`, { method: "DELETE" });
        await loadDashboard(); renderDashboard();
        await window.Swal?.fire({ icon: "success", title: "Produk dihapus", confirmButtonColor: "#111111" });
      } catch (err) { await window.Swal?.fire({ icon: "error", title: "Gagal menghapus", text: err.message, confirmButtonColor: "#111111" }); }
    });
  });

  document.querySelector("#refreshOrders")?.addEventListener("click", async () => {
    try { await loadDashboard(); renderDashboard(); }
    catch (err) { showMessage(err.message, true); }
  });

  document.querySelector("#orderSearch")?.addEventListener("input", (event) => { window.orderQuery = event.target.value; const pos = event.target.selectionStart; renderDashboard(); const next = document.querySelector("#orderSearch"); next?.focus(); next?.setSelectionRange(pos, pos); });
  document.querySelector("#orderStatusFilter")?.addEventListener("change", (event) => { window.orderStatusFilter = event.target.value; renderDashboard(); });
  document.querySelectorAll("[data-status-shortcut]").forEach((button) => button.addEventListener("click", () => { window.orderStatusFilter = button.dataset.statusShortcut; activeSection = "orders"; renderDashboard(); }));

  document.querySelectorAll("[data-order-action]").forEach((button) => {
    button.addEventListener("click", async () => {
      const action = button.dataset.orderAction;
      const titles = { approve: "Approve pembayaran?", reject: "Tolak pesanan?", purchased: "Konfirmasi pembelian?", delivered: "Tandai pesanan terkirim?" };
      const prompts = { approve: "Pastikan bukti pembayaran sudah diperiksa.", reject: "Pesanan akan ditolak dan alasan penolakan dicatat.", purchased: "Konfirmasi bahwa produk sudah dibeli dari supplier.", delivered: "Pastikan pesanan sudah diterima pelanggan." };
      let reason = "";
      const result = await window.Swal?.fire({ icon: action === "reject" ? "warning" : "question", title: titles[action] || "Ubah status pesanan?", text: prompts[action] || "Lanjutkan perubahan status?", input: action === "reject" ? "textarea" : undefined, inputLabel: action === "reject" ? "Alasan penolakan" : undefined, inputPlaceholder: action === "reject" ? "Tuliskan alasan yang jelas..." : undefined, inputValidator: action === "reject" ? (value) => !value?.trim() ? "Alasan penolakan wajib diisi." : undefined : undefined, showCancelButton: true, confirmButtonText: action === "reject" ? "Ya, tolak" : "Ya, lanjutkan", cancelButtonText: "Batal", confirmButtonColor: action === "reject" ? "#b42318" : "#111111" });
      if (!result?.isConfirmed) return;
      if (action === "reject") reason = result.value.trim();
      button.disabled = true;
      try {
        await request(`/api/admin/orders/${encodeURIComponent(button.dataset.orderId)}`, { method: "PATCH", body: JSON.stringify({ action, reason }) });
        await loadDashboard(); activeSection = "orders"; renderDashboard();
        const success = action === "approve" ? "Pembayaran berhasil di-approve." : action === "reject" ? "Pesanan berhasil ditolak." : action === "purchased" ? "Status pembelian berhasil diperbarui." : "Status pesanan berhasil diperbarui.";
        await window.Swal?.fire({ icon: "success", title: "Berhasil", text: success, confirmButtonColor: "#111111" });
      } catch (err) { await window.Swal?.fire({ icon: "error", title: "Perubahan gagal", text: err.message, confirmButtonColor: "#111111" }); }
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
