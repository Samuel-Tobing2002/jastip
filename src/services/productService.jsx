
import axios from "axios";

export const API_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:4000"
).replace(/\/$/, "");

// Tambahkan header untuk request ke backend melalui ngrok.
const api = axios.create({
  baseURL: API_URL,
  headers: {
    "ngrok-skip-browser-warning": "true",
  },
});

const normalizeProduct = (product) => ({
  ...product,
  price: Number(product.price || 0),
  basePrice: Number(product.basePrice || product.price || 0),
  rating: Number(product.rating || 4.8),
  stock: Number(product.stock || 0),
  thumbnail: product.thumbnail?.startsWith("/uploads/")
    ? `${API_URL}${product.thumbnail}`
    : product.thumbnail,
  images: (product.images || []).map((image) =>
    image?.startsWith("/uploads/")
      ? `${API_URL}${image}`
      : image
  ),
  tag:
    product.category
      ?.replaceAll("-", " ")
      .replace(/\b\w/g, (letter) => letter.toUpperCase()) || "Fashion",
});

export const getProducts = async () => {
  const response = await axios.get(`${API_URL}/api/products`, {
    headers: {
      "ngrok-skip-browser-warning": "true",
    },
  });

  return response.data.map(normalizeProduct);
};

export const getProductById = async (id) => {
  const response = await axios.get(
    `${API_URL}/api/products/${id}`,
    {
      headers: {
        "ngrok-skip-browser-warning": "true",
      },
    }
  );

  return normalizeProduct(response.data);
};

export const getCategories = async () => {
  const response = await api.get("/api/categories");
  return response.data;
};

export const getProductsByCategory = async (category) => {
  const response = await api.get("/api/products", {
    params: { category },
  });

  return response.data.map(normalizeProduct);
};

export const getSettings = async () => {
  const response = await api.get("/api/settings");
  return response.data;
};
