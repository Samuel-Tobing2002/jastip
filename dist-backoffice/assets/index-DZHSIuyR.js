(function(){let e=document.createElement(`link`).relList;if(e&&e.supports&&e.supports(`modulepreload`))return;for(let e of document.querySelectorAll(`link[rel="modulepreload"]`))n(e);new MutationObserver(e=>{for(let t of e)if(t.type===`childList`)for(let e of t.addedNodes)e.tagName===`LINK`&&e.rel===`modulepreload`&&n(e)}).observe(document,{childList:!0,subtree:!0});function t(e){let t={};return e.integrity&&(t.integrity=e.integrity),e.referrerPolicy&&(t.referrerPolicy=e.referrerPolicy),t.credentials=e.crossOrigin===`use-credentials`?`include`:e.crossOrigin===`anonymous`?`omit`:`same-origin`,t}function n(e){if(e.ep)return;e.ep=!0;let n=t(e);fetch(e.href,n)}})();var e=`https://confront-radiantly-polar.ngrok-free.dev`.replace(/\/$/,``),t=`jastip_backoffice_token`,n=document.querySelector(`#app`),r=localStorage.getItem(t)||``,i=[],a=[],o=``,s={profitPercent:25,ownerWhatsapp:``},c=``,l=``,u=`products`,d=e=>`$${Number(e||0).toFixed(2)}`,f=t=>t?.startsWith(`/uploads/`)?`${e}${t}`:t,p=async(t,n={})=>{let i=new Headers(n.headers||{});i.set(`ngrok-skip-browser-warning`,`true`),n.body&&!i.has(`Content-Type`)&&i.set(`Content-Type`,`application/json`),r&&i.set(`Authorization`,`Bearer ${r}`);let a=await fetch(`${e}${t}`,{...n,headers:i}),o=await a.json().catch(()=>({}));if(!a.ok)throw Error(o.message||`Request gagal (HTTP ${a.status}).`);return o},m=e=>new Promise((t,n)=>{if(!e){t(``);return}let r=new FileReader;r.onload=()=>t(r.result),r.onerror=n,r.readAsDataURL(e)}),h=(e,t=!1)=>{c=t?``:e,l=t?e:``,x()},g=async()=>{[i,s]=await Promise.all([p(`/api/products`),p(`/api/settings`)]);try{a=await p(`/api/admin/orders`),o=``}catch(e){a=[],o=e.message||`Gagal memuat pesanan.`}},_=()=>{n.innerHTML=`
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
          ${l?`<div class="message error">${l}</div>`:``}
          <button class="button" type="submit">Login</button>
        </div>
      </form>
    </section>
  `,document.querySelector(`#loginForm`).addEventListener(`submit`,async e=>{e.preventDefault();let n=new FormData(e.currentTarget);try{r=(await p(`/api/admin/login`,{method:`POST`,body:JSON.stringify({username:n.get(`username`),password:n.get(`password`)})})).token,localStorage.setItem(t,r),l=``,await g(),x()}catch(e){h(e.message,!0)}})},v=e=>String(e??``).replace(/[&<>"']/g,e=>({"&":`&amp;`,"<":`&lt;`,">":`&gt;`,'"':`&quot;`,"'":`&#39;`})[e]),y=e=>({PROCESSING:`Menunggu review`,APPROVED:`Approved`,REJECTED:`Rejected`,PURCHASED:`Purchased`,DELIVERED:`Delivered`})[e]||e,b=()=>{i.reduce((e,t)=>e+Number(t.basePrice||0),0),i.reduce((e,t)=>e+Number(t.price||0),0),n.innerHTML=`
    <section class="shell">
      <header class="topbar">
        <div>
          <div class="brand">JASTIP</div>
          <p class="eyebrow">Backoffice product manager</p>
        </div>
        <nav class="backoffice-nav" aria-label="Menu backoffice">
          <button class="button ${u===`products`?``:`secondary`}" id="showProducts" type="button">Create Product</button>
          <button class="button ${u===`orders`?``:`secondary`}" id="showOrders" type="button">Order Center <span class="nav-count">${a.filter(e=>e.status===`PROCESSING`).length}</span></button>
        </nav>
        <button class="button secondary" id="logoutButton" type="button">Logout</button>
      </header>

      <section id="productsSection" style="display:${u===`products`?`block`:`none`};">
        <div class="section-heading">
          <div><p class="eyebrow">Product management</p><h1>Create Product</h1><p class="copy">Tambah produk baru dan kelola katalog yang tampil di website JASTIP.</p></div>
          <div class="section-stat"><strong>${i.length}</strong><span>Produk aktif</span></div>
        </div>
      <section class="grid">
        <div>
          <section class="panel">
            <h2>Setting Owner</h2>
            <form class="form" id="settingsForm">
              <label class="field">
                <span>Profit owner (%)</span>
                <input name="profitPercent" type="number" min="0" step="1" value="${s.profitPercent}" />
              </label>
              <label class="field">
                <span>WhatsApp owner</span>
                <input name="ownerWhatsapp" value="${s.ownerWhatsapp||``}" placeholder="6281902515004" />
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
          ${c?`<div class="message" style="margin-top: 16px;">${c}</div>`:``}
          ${l?`<div class="message error" style="margin-top: 16px;">${l}</div>`:``}
          <div class="products">
            ${i.map(e=>`
                  <article class="product">
                    <img src="${f(e.thumbnail)}" alt="${e.title}" />
                    <div>
                      <h3>${e.title}</h3>
                      <p>${e.category} | Modal ${d(e.basePrice)} | Jual ${d(e.price)}</p>
                    </div>
                    <button class="button danger" data-delete="${e.id}" type="button">Delete</button>
                  </article>
                `).join(``)||`<p class="copy">Belum ada produk.</p>`}
          </div>
        </section>
      </section>

      </section>

      <section class="panel" style="display:${u===`orders`?`block`:`none`}; margin-top: 24px;" id="ordersPanel">
        <div class="orders-heading">
          <div>
            <p class="eyebrow">Order center</p>
            <h2>Pesanan masuk <span class="notification-count">${a.filter(e=>e.status===`PROCESSING`).length}</span></h2>
            <p class="copy">Periksa bukti pembayaran dan detail pemesan, lalu kelola setiap tahap pesanan.</p>
          </div>
          <button class="button secondary" id="refreshOrders" type="button">Refresh orders</button>
        </div>
        ${o?`<div class="message error" style="margin-top:18px">Pesanan belum dapat dimuat: ${v(o)}. Jika menggunakan Supabase, jalankan supabase/schema.sql terbaru untuk membuat tabel orders.</div>`:``}
        ${a.length?`<div class="orders-list">${a.map(e=>{let t=String(e.status||`PROCESSING`).toUpperCase(),n=e.payment?.proofUrl?f(e.payment.proofUrl):``,r=(e.items||[]).map(e=>`${e.title} × ${e.quantity}`).join(`, `),i=Number(e.summary?.total||0);return`<article class="order-card">
            <div class="order-card-top">
              <div><p class="order-id">${v(e.id)}</p><p class="order-date">${new Date(e.createdAt).toLocaleString(`id-ID`)}</p></div>
              <span class="order-status status-${t.toLowerCase()}">${v(y(t))}</span>
            </div>
            <div class="order-summary"><div><strong>${v(e.customer?.name||`Pelanggan`)}</strong><p>${v(r)}</p><p>${v(e.customer?.phone||`-`)}</p></div><strong>${d(i)}</strong></div>
            <details class="order-details"><summary>Lihat detail pemesan & bukti pembayaran</summary>
              <div class="order-detail-grid"><div><span>Nama</span><strong>${v(e.customer?.name||`-`)}</strong></div><div><span>Telepon</span><strong>${v(e.customer?.phone||`-`)}</strong></div><div class="full"><span>Alamat</span><strong>${v(e.customer?.address||`-`)}</strong></div><div><span>Subtotal produk</span><strong>${d(e.summary?.productSubtotal)}</strong></div><div><span>Jastip + pengiriman</span><strong>${d(Number(e.summary?.jastipFee||0)+Number(e.summary?.shippingFee||0))}</strong></div><div><span>Total dibayar</span><strong>${d(i)}</strong></div><div><span>Metode pembayaran</span><strong>${v(e.payment?.method||`QR`)}</strong></div></div>
              ${n?`<a class="proof-link" href="${n}" target="_blank" rel="noreferrer"><img class="proof-image" src="${n}" alt="Bukti pembayaran ${v(e.id)}"/><span>Buka bukti pembayaran ukuran penuh ↗</span></a>`:`<p class="message error">Bukti pembayaran belum tersedia.</p>`}
              ${t===`REJECTED`?`<div class="message error">Alasan penolakan: ${v(e.rejectionReason||`-`)}</div>`:``}
            </details>
            <div class="order-actions">${t===`PROCESSING`?`<button class="button" data-order-action="approve" data-order-id="${v(e.id)}" type="button">Approve order</button><button class="button danger" data-order-action="reject" data-order-id="${v(e.id)}" type="button">Reject</button>`:``}${t===`APPROVED`?`<button class="button" data-order-action="purchased" data-order-id="${v(e.id)}" type="button">Confirm Purchased</button>`:``}${t===`PURCHASED`?`<button class="button" data-order-action="delivered" data-order-id="${v(e.id)}" type="button">Confirm Delivered</button>`:``}${t===`DELIVERED`?`<span class="completed-label">✓ Pesanan selesai</span>`:``}</div>
          </article>`}).join(``)}</div>`:`<div class="empty-orders"><strong>Belum ada pesanan masuk.</strong><p>Pesanan baru akan muncul di sini setelah pelanggan mengirim checkout dan bukti pembayaran.</p></div>`}
      </section>
      ${c?`<div class="message" style="margin-top:16px">${c}</div>`:``}
      ${l?`<div class="message error" style="margin-top:16px">${l}</div>`:``}
    </section>
  `,document.querySelector(`#showProducts`).addEventListener(`click`,()=>{u=`products`,c=``,l=``,b()}),document.querySelector(`#showOrders`).addEventListener(`click`,()=>{u=`orders`,c=``,l=``,b()}),document.querySelector(`#logoutButton`).addEventListener(`click`,()=>{r=``,localStorage.removeItem(t),x()}),document.querySelector(`#settingsForm`).addEventListener(`submit`,async e=>{e.preventDefault();let t=new FormData(e.currentTarget);try{s=await p(`/api/admin/settings`,{method:`PUT`,body:JSON.stringify({profitPercent:Number(t.get(`profitPercent`)),ownerWhatsapp:t.get(`ownerWhatsapp`)})}),await g(),h(`Setting owner berhasil disimpan.`)}catch(e){h(e.message,!0)}}),document.querySelector(`#productForm`).addEventListener(`submit`,async e=>{e.preventDefault();let t=e.currentTarget,n=new FormData(t),r=t.querySelector(`input[name="image"]`),i=Array.from(r?.files||[]);try{if(!i.length)throw Error(`Pilih minimal satu gambar produk.`);if(i.length>8)throw Error(`Maksimal 8 gambar untuk setiap produk.`);let e=i.find(e=>e.size>5242880);if(e)throw Error(`Ukuran ${e.name} melebihi 5 MB.`);let r=await Promise.all(i.map(async e=>({fileName:e.name||`product.png`,dataUrl:await m(e)})));await p(`/api/admin/products`,{method:`POST`,body:JSON.stringify({title:n.get(`title`),description:n.get(`description`),category:n.get(`category`),stock:Number(n.get(`stock`)),basePrice:Number(n.get(`basePrice`)),rating:Number(n.get(`rating`)),imageUploads:r})}),t.reset(),await g(),u=`products`,h(`Produk baru berhasil diupload ke website.`)}catch(e){h(e.message,!0)}}),document.querySelectorAll(`[data-delete]`).forEach(e=>{e.addEventListener(`click`,async()=>{try{await p(`/api/admin/products/${e.dataset.delete}`,{method:`DELETE`}),await g(),h(`Produk berhasil dihapus.`)}catch(e){h(e.message,!0)}})}),document.querySelector(`#refreshOrders`)?.addEventListener(`click`,async()=>{try{await g(),b()}catch(e){h(e.message,!0)}}),document.querySelectorAll(`[data-order-action]`).forEach(e=>{e.addEventListener(`click`,async()=>{let t=e.dataset.orderAction,n=``;if(t===`reject`){if(n=window.prompt(`Masukkan alasan penolakan pesanan:`)||``,!n.trim()){h(`Alasan penolakan wajib diisi.`,!0);return}if(!window.confirm(`Yakin menolak pesanan ini?`))return}else if(!window.confirm({approve:`Approve pesanan setelah memeriksa bukti pembayaran?`,purchased:`Konfirmasi bahwa barang sudah dibeli?`,delivered:`Konfirmasi bahwa barang sudah diterima/dikirim ke pelanggan?`}[t]||`Lanjutkan perubahan status?`))return;e.disabled=!0;try{await p(`/api/admin/orders/${encodeURIComponent(e.dataset.orderId)}`,{method:`PATCH`,body:JSON.stringify({action:t,reason:n})}),await g(),u=`orders`,h(t===`approve`?`Pesanan berhasil di-approve.`:t===`reject`?`Pesanan berhasil ditolak.`:t===`purchased`?`Status Purchased berhasil diperbarui.`:`Status Delivered berhasil diperbarui.`)}catch(e){h(e.message,!0)}})})},x=()=>{if(!r){_();return}b()};r?g().catch(()=>{r=``,localStorage.removeItem(t)}).finally(x):x(),window.setInterval(async()=>{if(r)try{let e=await p(`/api/admin/orders`);o=``,JSON.stringify(e)!==JSON.stringify(a)&&(a=e,document.querySelector(`#ordersPanel`)&&b())}catch(e){console.warn(`Order refresh failed:`,e.message)}},15e3);