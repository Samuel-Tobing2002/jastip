import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";

import Navbar from "./components/Navbar";

import Home from "./pages/Home";
import Products from "./pages/Products";
import ProductDetail from "./pages/ProductDetail";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import MyJastip from "./pages/MyJastip";
import TransactionHistory from "./pages/TransactionHistory";
import OrderWhatsApp from "./pages/OrderWhatsApp";
import Account from "./pages/Account";
import Reviews from "./pages/Reviews";

const TOKEN_KEY = "jastip_customer_token";

function RequireAuth({ children }) {
  const location = useLocation();
  if (!localStorage.getItem(TOKEN_KEY)) {
    return <Navigate to="/account" replace state={{ from: location.pathname, loginRequired: true }} />;
  }
  return children;
}

function SiteLayout() {
  const location = useLocation();
  const loggedIn = Boolean(localStorage.getItem(TOKEN_KEY));
  const hideHeader = location.pathname === "/account" && !loggedIn;
  return <>
      {!hideHeader && <Navbar />}
      <Routes>

        <Route
          path="/"
          element={<Home />}
        />

        <Route path="/products" element={<RequireAuth><Products /></RequireAuth>} />

        <Route path="/products/:id" element={<RequireAuth><ProductDetail /></RequireAuth>} />

        <Route path="/cart" element={<RequireAuth><Cart /></RequireAuth>} />

        <Route path="/checkout" element={<RequireAuth><Checkout /></RequireAuth>} />

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
        <Route path="/account" element={<Account />} />
        <Route path="/reviews" element={<Reviews />} />

      </Routes>
    </>;
}

function App() {
  return <BrowserRouter><SiteLayout /></BrowserRouter>;
}

export default App;
