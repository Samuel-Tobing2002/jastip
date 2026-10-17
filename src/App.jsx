import { BrowserRouter, Routes, Route } from "react-router-dom";

import Navbar from "./components/Navbar";

import Home from "./pages/Home";
import Products from "./pages/Products";
import ProductDetail from "./pages/ProductDetail";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import MyJastip from "./pages/MyJastip";
import TransactionHistory from "./pages/TransactionHistory";
import OrderWhatsApp from "./pages/OrderWhatsApp";

function App() {
  return (
    <BrowserRouter>

      <Navbar />

      <Routes>

        <Route
          path="/"
          element={<Home />}
        />

        <Route
          path="/products"
          element={<Products />}
        />

        <Route
          path="/products/:id"
          element={<ProductDetail />}
        />

        <Route
          path="/cart"
          element={<Cart />}
        />

        <Route
          path="/checkout"
          element={<Checkout />}
        />

        <Route
          path="/jastip"
          element={<MyJastip />}
        />

        <Route
          path="/history"
          element={<TransactionHistory />}
        />

        <Route
          path="/order-whatsapp"
          element={<OrderWhatsApp />}
        />

      </Routes>

    </BrowserRouter>
  );
}

export default App;
