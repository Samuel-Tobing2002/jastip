import { createServer } from "node:http";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createWriteStream, existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

// Load local .env for development. Platform environment variables (e.g. Koyeb)
// take precedence and are never overwritten.

const envPath = path.join(rootDir, ".env");
if (existsSync(envPath)) {
  const envText = readFileSync(envPath, "utf8");
  for (const line of envText.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const match = trimmed.match(
      /^([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/
    );
    if (!match) continue;
    const key = match[1];
    let value = match[2].trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}


const dataDir = process.env.DATA_DIR || path.join(__dirname, "data");
const uploadDir =
  process.env.UPLOAD_DIR || path.join(rootDir, "public", "uploads");
const productsPath = path.join(dataDir, "products.json");
const settingsPath = path.join(dataDir, "settings.json");
const ordersPath = path.join(dataDir, "orders.json");

const PORT = Number(process.env.PORT || 4000);
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || "admin";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin";
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || "jastip-admin-token";
const CORS_ORIGIN = process.env.CORS_ORIGIN || "*";

const SUPABASE_URL = process.env.SUPABASE_URL || "";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME || "";
const CLOUDINARY_UPLOAD_PRESET = process.env.CLOUDINARY_UPLOAD_PRESET || "";

const useSupabase = Boolean(SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY);
const useCloudinary = Boolean(CLOUDINARY_CLOUD_NAME && CLOUDINARY_UPLOAD_PRESET);

const defaultSettings = {
  profitPercent: 25,
  ownerWhatsapp: "",
};

const normalizeOrigin = (origin) => String(origin || "").trim().replace(/\/$/, "");
const allowedOrigins = CORS_ORIGIN
  .split(",")
  .map(normalizeOrigin)
  .filter(Boolean);

// CORS is set once in the request handler. Do not fall back to the full
// comma-separated CORS_ORIGIN string: browsers require one origin per header.
const sendJson = (res, status, payload) => {
  const headers = {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    Vary: "Origin",
  };
  const allowedOrigin = res.getHeader("Access-Control-Allow-Origin");
  if (allowedOrigin) headers["Access-Control-Allow-Origin"] = allowedOrigin;
  res.writeHead(status, headers);
  res.end(JSON.stringify(payload));
};

const readJson = async (filePath, fallback) => {
  try {
    return JSON.parse(await readFile(filePath, "utf8"));
  } catch (error) {
    if (error.code === "ENOENT") return fallback;
    throw error;
  }
};

const writeJson = async (filePath, data) => {
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, JSON.stringify(data, null, 2));
};

const readBody = (req) =>
  new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 30_000_000) {
        reject(new Error("Request body too large"));
        req.destroy();
      }
    });
    req.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        reject(new Error("Invalid JSON body"));
      }
    });
    req.on("error", reject);
  });

const requireAdmin = (req, res) => {
  const auth = req.headers.authorization || "";
  if (auth !== `Bearer ${ADMIN_TOKEN}`) {
    sendJson(res, 401, { message: "Unauthorized" });
    return false;
  }
  return true;
};

const formatTag = (category = "Fashion") =>
  category
    .replaceAll("-", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

const toProduct = (row) => ({
  id: row.id,
  title: row.title,
  description: row.description,
  category: row.category,
  tag: row.tag || formatTag(row.category),
  basePrice: Number(row.base_price ?? row.basePrice ?? row.price ?? 0),
  stock: Number(row.stock || 0),
  rating: Number(row.rating || 4.8),
  thumbnail: row.thumbnail,
  images: row.images || (row.thumbnail ? [row.thumbnail] : []),
  createdAt: row.created_at || row.createdAt,
});

const toSettings = (row = {}) => ({
  profitPercent: Number(row.profit_percent ?? row.profitPercent ?? 25),
  ownerWhatsapp: String(row.owner_whatsapp ?? row.ownerWhatsapp ?? ""),
});

const withSellingPrice = (product, settings) => {
  const basePrice = Number(product.basePrice ?? product.price ?? 0);
  const profitPercent = Number(settings.profitPercent || 0);
  const price = Number((basePrice * (1 + profitPercent / 100)).toFixed(2));

  return {
    ...product,
    basePrice,
    price,
    profitPercent,
    tag: product.tag || formatTag(product.category),
    images: product.images?.length
      ? product.images
      : product.thumbnail
        ? [product.thumbnail]
        : [],
  };
};

const supabaseRequest = async (pathName, options = {}) => {
  const response = await fetch(`${SUPABASE_URL}/rest/v1${pathName}`, {
    ...options,
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  const text = await response.text();
  let data = null;

  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = { message: text.slice(0, 300) };
    }
  }

  if (!response.ok) {
    throw new Error(
      data?.message || data?.hint || `Supabase request failed (${response.status})`
    );
  }

  return data;
};

const getSettings = async () => {
  if (useSupabase) {
    const rows = await supabaseRequest("/settings?id=eq.app&select=*");
    return toSettings(rows[0] || defaultSettings);
  }

  return readJson(settingsPath, defaultSettings);
};

const saveSettings = async (settings) => {
  if (useSupabase) {
    const rows = await supabaseRequest("/settings?on_conflict=id", {
      method: "POST",
      headers: {
        Prefer: "resolution=merge-duplicates,return=representation",
      },
      body: JSON.stringify({
        id: "app",
        profit_percent: settings.profitPercent,
        owner_whatsapp: settings.ownerWhatsapp,
      }),
    });
    return toSettings(rows[0]);
  }

  await writeJson(settingsPath, settings);
  return settings;
};

const getRawProducts = async () => {
  if (useSupabase) {
    const rows = await supabaseRequest("/products?select=*&order=created_at.desc");
    return rows.map(toProduct);
  }

  const products = await readJson(productsPath, []);
  return products.map(toProduct);
};

const getProducts = async () => {
  const [products, settings] = await Promise.all([
    getRawProducts(),
    getSettings(),
  ]);

  return products.map((product) => withSellingPrice(product, settings));
};

const createProduct = async (product) => {
  if (useSupabase) {
    const rows = await supabaseRequest("/products", {
      method: "POST",
      headers: {
        Prefer: "return=representation",
      },
      body: JSON.stringify({
        id: product.id,
        title: product.title,
        description: product.description,
        category: product.category,
        tag: product.tag,
        base_price: product.basePrice,
        stock: product.stock,
        rating: product.rating,
        thumbnail: product.thumbnail,
        images: product.images,
        created_at: product.createdAt,
      }),
    });
    return toProduct(rows[0]);
  }

  const products = await readJson(productsPath, []);
  await writeJson(productsPath, [product, ...products]);
  return product;
};

const deleteProduct = async (id) => {
  if (useSupabase) {
    await supabaseRequest(`/products?id=eq.${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
    return;
  }

  const products = await readJson(productsPath, []);
  await writeJson(
    productsPath,
    products.filter((product) => product.id !== id)
  );
};


const normalizeOrder = (order) => ({
  ...order,
  status: String(order.status || "PROCESSING").toUpperCase(),
  approvalStatus: order.approvalStatus || order.approval_status || "PENDING",
  purchasedAt: order.purchasedAt || order.purchased_at || null,
  deliveredAt: order.deliveredAt || order.delivered_at || null,
  rejectionReason: order.rejectionReason || order.rejection_reason || "",
  createdAt: order.createdAt || order.created_at || new Date().toISOString(),
  updatedAt: order.updatedAt || order.updated_at || order.createdAt || order.created_at || new Date().toISOString(),
});

const getOrders = async () => {
  if (useSupabase) {
    const rows = await supabaseRequest("/orders?select=*&order=created_at.desc");
    return rows.map((row) => normalizeOrder({
      id: row.id, customer: row.customer, items: row.items, summary: row.summary,
      payment: row.payment, status: row.status, approvalStatus: row.approval_status,
      purchasedAt: row.purchased_at, deliveredAt: row.delivered_at,
      rejectionReason: row.rejection_reason, createdAt: row.created_at, updatedAt: row.updated_at,
    }));
  }
  return (await readJson(ordersPath, [])).map(normalizeOrder);
};

const createOrder = async (order) => {
  const normalized = normalizeOrder(order);
  if (useSupabase) {
    const rows = await supabaseRequest("/orders", {
      method: "POST",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify({
        id: normalized.id, customer: normalized.customer, items: normalized.items,
        summary: normalized.summary, payment: normalized.payment, status: normalized.status,
        approval_status: normalized.approvalStatus, purchased_at: normalized.purchasedAt,
        delivered_at: normalized.deliveredAt, rejection_reason: normalized.rejectionReason,
        created_at: normalized.createdAt, updated_at: normalized.updatedAt,
      }),
    });
    const row = rows[0];
    return normalizeOrder({ ...normalized, ...row, approvalStatus: row.approval_status,
      purchasedAt: row.purchased_at, deliveredAt: row.delivered_at,
      rejectionReason: row.rejection_reason, createdAt: row.created_at, updatedAt: row.updated_at });
  }
  const orders = await readJson(ordersPath, []);
  if (orders.some((item) => item.id === normalized.id)) throw new Error("Order ID sudah digunakan.");
  await writeJson(ordersPath, [normalized, ...orders]);
  return normalized;
};

const updateOrder = async (id, action, reason = "") => {
  const orders = await getOrders();
  const order = orders.find((item) => item.id === id);
  if (!order) return null;
  const now = new Date().toISOString();
  const transitions = {
    approve: { from: "PROCESSING", status: "APPROVED", approvalStatus: "APPROVED" },
    reject: { from: "PROCESSING", status: "REJECTED", approvalStatus: "REJECTED" },
    purchased: { from: "APPROVED", status: "PURCHASED", approvalStatus: "APPROVED", purchasedAt: now },
    delivered: { from: "PURCHASED", status: "DELIVERED", approvalStatus: "APPROVED", deliveredAt: now },
  };
  const transition = transitions[action];
  if (!transition) throw new Error("Aksi status tidak dikenal.");
  if (order.status !== transition.from) {
    throw new Error(`Aksi ${action} tidak dapat dilakukan ketika status ${order.status}.`);
  }
  if (action === "reject" && !String(reason).trim()) throw new Error("Alasan penolakan wajib diisi.");
  const updated = normalizeOrder({ ...order, ...transition, rejectionReason: action === "reject" ? String(reason).trim() : order.rejectionReason, updatedAt: now });
  if (useSupabase) {
    const rows = await supabaseRequest(`/orders?id=eq.${encodeURIComponent(id)}`, {
      method: "PATCH", headers: { Prefer: "return=representation" },
      body: JSON.stringify({ status: updated.status, approval_status: updated.approvalStatus,
        purchased_at: updated.purchasedAt, delivered_at: updated.deliveredAt,
        rejection_reason: updated.rejectionReason, updated_at: updated.updatedAt }),
    });
    const row = rows[0];
    if (!row) return null;
    return normalizeOrder({ ...updated, status: row.status, approvalStatus: row.approval_status,
      purchasedAt: row.purchased_at, deliveredAt: row.delivered_at,
      rejectionReason: row.rejection_reason, createdAt: row.created_at, updatedAt: row.updated_at });
  }
  const saved = orders.map((item) => item.id === id ? updated : item);
  await writeJson(ordersPath, saved);
  return updated;
};

const uploadToCloudinary = async ({ fileName, dataUrl }) => {
  const match = dataUrl?.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
  if (!match) {
    throw new Error("Invalid image data");
  }

  const buffer = Buffer.from(match[2], "base64");
  const formData = new FormData();
  formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
  formData.append("folder", "jastip-products");
  formData.append("file", new Blob([buffer], { type: match[1] }), fileName);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
    {
      method: "POST",
      body: formData,
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error?.message || "Cloudinary upload failed");
  }

  return data.secure_url;
};

const saveUploadedImageLocally = async ({ fileName, dataUrl }) => {
  if (!dataUrl) return "";

  const match = dataUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
  if (!match) {
    throw new Error("Invalid image data");
  }

  await mkdir(uploadDir, { recursive: true });

  const extFromName = path.extname(fileName || "").toLowerCase();
  const extFromMime = match[1].split("/")[1]?.replace("jpeg", "jpg") || "png";
  const extension = extFromName || `.${extFromMime}`;
  const safeName = `${Date.now()}-${Math.random().toString(16).slice(2)}${extension}`;
  const destination = path.join(uploadDir, safeName);

  await new Promise((resolve, reject) => {
    const stream = createWriteStream(destination);
    stream.on("finish", resolve);
    stream.on("error", reject);
    stream.end(Buffer.from(match[2], "base64"));
  });

  return `/uploads/${safeName}`;
};

const saveUploadedImage = async (imageUpload) => {
  if (!imageUpload?.dataUrl) return "";
  return useCloudinary
    ? uploadToCloudinary(imageUpload)
    : saveUploadedImageLocally(imageUpload);
};

const serveStaticUpload = async (req, res, pathname) => {
  const relativePath = pathname.replace(/^\/uploads\//, "");
  const filePath = path.resolve(uploadDir, relativePath);

  if (!filePath.startsWith(uploadDir) || !existsSync(filePath)) {
    sendJson(res, 404, { message: "File not found" });
    return;
  }

  const ext = path.extname(filePath).toLowerCase();
  const mime =
    ext === ".jpg" || ext === ".jpeg"
      ? "image/jpeg"
      : ext === ".webp"
        ? "image/webp"
        : "image/png";

  const requestOrigin = req.headers.origin;
  const normalizedRequestOrigin = normalizeOrigin(requestOrigin);
  const allowedOrigin =
    CORS_ORIGIN.trim() === "*"
      ? "*"
      : normalizedRequestOrigin && allowedOrigins.includes(normalizedRequestOrigin)
        ? requestOrigin
        : null;
  if (!allowedOrigin) {
    sendJson(res, 404, { message: "File not found" });
    return;
  }
  res.writeHead(200, {
    "Content-Type": mime,
    "Access-Control-Allow-Origin": allowedOrigin,
    Vary: "Origin",
  });
  res.end(await readFile(filePath));
};

const server = createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = url.pathname;
  const requestOrigin = req.headers.origin;

  // CORS: allow only an exact origin from the configured allowlist.
  const normalizedRequestOrigin = normalizeOrigin(requestOrigin);
  if (CORS_ORIGIN.trim() === "*") {
    res.setHeader("Access-Control-Allow-Origin", "*");
  } else if (normalizedRequestOrigin && allowedOrigins.includes(normalizedRequestOrigin)) {
    res.setHeader("Access-Control-Allow-Origin", requestOrigin);
  }

  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, PATCH, DELETE, OPTIONS"
  );

  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization"
  );

  res.setHeader("Vary", "Origin");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  try {
    if (pathname === "/api/health" && req.method === "GET") {
      let databaseStatus = useSupabase ? "configured" : "local-json";
      let databaseError = "";

      if (useSupabase) {
        try {
          await supabaseRequest("/settings?select=id&limit=1");
          databaseStatus = "connected";
        } catch (error) {
          databaseStatus = "error";
          databaseError = error.message;
        }
      }

      const warnings = [];
      if (!useSupabase) warnings.push("Supabase is not configured; data uses local JSON files.");
      if (!useCloudinary) warnings.push("Cloudinary is not configured; uploads use local disk storage.");
      if (ADMIN_USERNAME === "admin" || ADMIN_PASSWORD === "admin" || ADMIN_TOKEN === "jastip-admin-token") {
        warnings.push("Default admin credentials/token are active. Set strong production environment variables.");
      }

      sendJson(res, databaseStatus === "error" ? 503 : 200, {
        ok: databaseStatus !== "error",
        database: useSupabase ? "supabase" : "local-json",
        databaseStatus,
        imageStorage: useCloudinary ? "cloudinary" : "local-upload",
        ...(databaseError ? { databaseError } : {}),
        warnings,
      });
      return;
    }

    if (pathname.startsWith("/uploads/") && req.method === "GET") {
      await serveStaticUpload(req, res, pathname);
      return;
    }

    if (pathname === "/api/admin/login" && req.method === "POST") {
      const body = await readBody(req);
      if (body.username === ADMIN_USERNAME && body.password === ADMIN_PASSWORD) {
        sendJson(res, 200, { token: ADMIN_TOKEN });
        return;
      }
      sendJson(res, 401, { message: "Username atau password salah." });
      return;
    }


    if (pathname === "/api/orders" && req.method === "POST") {
      const body = await readBody(req);
      const incoming = body.order || body;
      if (!incoming.id || !incoming.customer?.name || !incoming.customer?.phone || !incoming.customer?.address || !Array.isArray(incoming.items) || incoming.items.length === 0) {
        sendJson(res, 400, { message: "Data pesanan dan pelanggan belum lengkap." });
        return;
      }
      if (!body.paymentProof?.dataUrl) {
        sendJson(res, 400, { message: "Bukti pembayaran wajib diunggah." });
        return;
      }
      const proofUrl = await saveUploadedImage(body.paymentProof);
      const order = normalizeOrder({ ...incoming, payment: { ...(incoming.payment || {}), status: "PAID", method: "QR", proofUrl, paidAt: incoming.payment?.paidAt || new Date().toISOString() }, status: "PROCESSING", approvalStatus: "PENDING", createdAt: incoming.createdAt || new Date().toISOString(), updatedAt: new Date().toISOString() });
      const saved = await createOrder(order);
      sendJson(res, 201, saved);
      return;
    }

    if (pathname.startsWith("/api/orders/") && req.method === "GET") {
      const id = decodeURIComponent(pathname.replace("/api/orders/", ""));
      const order = (await getOrders()).find((item) => item.id === id);
      sendJson(res, order ? 200 : 404, order || { message: "Order tidak ditemukan." });
      return;
    }

    if (pathname === "/api/admin/orders" && req.method === "GET") {
      if (!requireAdmin(req, res)) return;
      const orders = await getOrders();
      sendJson(res, 200, orders);
      return;
    }

    if (pathname.startsWith("/api/admin/orders/") && req.method === "PATCH") {
      if (!requireAdmin(req, res)) return;
      const id = decodeURIComponent(pathname.replace("/api/admin/orders/", ""));
      const body = await readBody(req);
      try {
        const updated = await updateOrder(id, String(body.action || ""), body.reason || "");
        sendJson(res, updated ? 200 : 404, updated || { message: "Order tidak ditemukan." });
      } catch (error) {
        sendJson(res, 400, { message: error.message });
      }
      return;
    }

    if (pathname === "/api/settings" && req.method === "GET") {
      sendJson(res, 200, await getSettings());
      return;
    }

    if (pathname === "/api/admin/settings" && req.method === "PUT") {
      if (!requireAdmin(req, res)) return;
      const body = await readBody(req);
      const settings = {
        profitPercent: Math.max(0, Number(body.profitPercent || 0)),
        ownerWhatsapp: String(body.ownerWhatsapp || "").replace(/\D/g, ""),
      };
      sendJson(res, 200, await saveSettings(settings));
      return;
    }

    if (pathname === "/api/products" && req.method === "GET") {
      const category = url.searchParams.get("category");
      const products = await getProducts();
      sendJson(
        res,
        200,
        category
          ? products.filter((product) => product.category === category)
          : products
      );
      return;
    }

    if (pathname.startsWith("/api/products/") && req.method === "GET") {
      const id = decodeURIComponent(pathname.replace("/api/products/", ""));
      const product = (await getProducts()).find((item) => item.id === id);
      sendJson(
        res,
        product ? 200 : 404,
        product || { message: "Product not found" }
      );
      return;
    }

    if (pathname === "/api/categories" && req.method === "GET") {
      const products = await getRawProducts();
      sendJson(res, 200, [...new Set(products.map((item) => item.category))]);
      return;
    }

    if (pathname === "/api/admin/products" && req.method === "POST") {
      if (!requireAdmin(req, res)) return;

      const body = await readBody(req);
      const title = String(body.title || "").trim();
      const basePrice = Number(body.basePrice);
      const stock = Number(body.stock ?? 0);
      const rating = Number(body.rating ?? 4.8);

      if (!title || !Number.isFinite(basePrice) || basePrice <= 0) {
        sendJson(res, 400, {
          message: "Nama produk dan harga modal yang valid wajib diisi.",
        });
        return;
      }

      if (
        !Number.isInteger(stock) ||
        stock < 0 ||
        !Number.isFinite(rating) ||
        rating < 1 ||
        rating > 5
      ) {
        sendJson(res, 400, {
          message: "Stok harus bilangan bulat >= 0 dan rating harus antara 1 sampai 5.",
        });
        return;
      }

      // Mendukung upload multipel dan format upload lama.
      const imageUploads = Array.isArray(body.imageUploads)
        ? body.imageUploads
        : body.imageUpload
          ? [body.imageUpload]
          : [];

      if (imageUploads.length < 1 || imageUploads.length > 8) {
        sendJson(res, 400, {
          message: "Pilih minimal 1 dan maksimal 8 gambar produk.",
        });
        return;
      }

      const uploadedImages = [];

      for (const imageUpload of imageUploads) {
        const uploadedImage = await saveUploadedImage(imageUpload);

        if (!uploadedImage) {
          throw new Error("Salah satu gambar gagal diunggah.");
        }

        uploadedImages.push(uploadedImage);
      }

      const product = {
        id: `prod-${Date.now()}`,
        title,
        description: String(body.description || "").trim(),
        category: String(body.category || "fashion").trim(),
        tag: formatTag(String(body.category || "fashion")),
        basePrice,
        stock,
        rating,
        thumbnail: uploadedImages[0],
        images: uploadedImages,
        createdAt: new Date().toISOString(),
      };

      const savedProduct = await createProduct(product);

      sendJson(res, 201, savedProduct);
      return;
    }

    if (pathname.startsWith("/api/admin/products/") && req.method === "DELETE") {
      if (!requireAdmin(req, res)) return;
      const id = decodeURIComponent(
        pathname.replace("/api/admin/products/", "")
      );
      await deleteProduct(id);
      sendJson(res, 200, { message: "Product deleted" });
      return;
    }

    sendJson(res, 404, { message: "Route not found" });
  } catch (error) {
    console.error(error);
    sendJson(res, 500, { message: error.message || "Server error" });
  }
});

server.listen(PORT, () => {
  console.log(`JASTIP backend running at http://localhost:${PORT}`);
  console.log(`Database: ${useSupabase ? "Supabase" : "local JSON"}`);
  console.log(`Image storage: ${useCloudinary ? "Cloudinary" : "local uploads"}`);
});
