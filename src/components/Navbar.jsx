import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { ShoppingCart } from "lucide-react";

const navigation = [
  ["Home", "/"],
  ["Shop", "/products"],
  ["Order WA", "/order-whatsapp"],
  ["History", "/history"],
  ["Reviews", "/reviews"],
  ["Guide", "/#how-it-works"],
];

function Navbar() {
  const { totalItems } = useCart();
  const [isMobile, setIsMobile] = useState(() =>
    typeof window === "undefined"
      ? false
      : window.matchMedia("(max-width: 767px)").matches
  );
  const [menuOpen, setMenuOpen] = useState(false);

  const closeMenu = () => {
    setMenuOpen(false);
  };

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 767px)");

    const handleScreenChange = (event) => {
      setIsMobile(event.matches);

      if (!event.matches) {
        setMenuOpen(false);
      }
    };

    handleScreenChange(mediaQuery);
    mediaQuery.addEventListener("change", handleScreenChange);

    return () => {
      mediaQuery.removeEventListener("change", handleScreenChange);
    };
  }, []);

  const renderNavLink = ([label, href], className) =>
    href.startsWith("/#") ? (
      <a
        key={label}
        href={href}
        onClick={closeMenu}
        className={className}
      >
        {label}
      </a>
    ) : (
      <Link
        key={label}
        to={href}
        onClick={closeMenu}
        className={className}
      >
        {label}
      </Link>
    );

  return (
    <header className="fixed top-0 z-50 w-full bg-[#f5f3ef]/95 text-[#0c0c0c] backdrop-blur-xl">
      {!isMobile && (
        <div className="border-b border-black/10 bg-black px-6 py-2 text-[10px] font-semibold uppercase tracking-[0.24em] text-white">
          <div className="mx-auto flex max-w-7xl justify-between">
            <span>Personal shopper pakaian pilihan</span>
            <span>Jakarta based jastip service</span>
          </div>
        </div>
      )}

      <div className={`mx-auto grid h-20 max-w-7xl items-center gap-4 px-6 ${
        isMobile
          ? "grid-cols-[auto_1fr_auto]"
          : "grid-cols-[1fr_auto_1fr] gap-8"
      }`}>
        {isMobile && (
          <div className="flex items-center">
            <button
              type="button"
              onClick={() => setMenuOpen((current) => !current)}
              className="flex h-11 w-11 items-center justify-center border border-black/20 text-xl leading-none"
              aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
              aria-expanded={menuOpen}
            >
              {menuOpen ? "x" : "="}
            </button>
          </div>
        )}

        {!isMobile && (
          <nav className="flex items-center gap-8">
            {navigation.map((item) =>
              renderNavLink(
                item,
                "text-xs font-semibold uppercase tracking-[0.16em] transition hover:text-black/50"
              )
            )}
          </nav>
        )}

        <Link
          to="/"
          onClick={closeMenu}
          className="justify-self-center whitespace-nowrap text-3xl font-black tracking-[0.16em]"
        >
          JASTIP
        </Link>

        <div className="flex items-center justify-end gap-3">
          <Link to="/account" className={`text-xs font-semibold uppercase tracking-[0.16em] ${isMobile ? "hidden" : "block"}`}>Akun</Link>
          <Link
            to="/jastip"
            className={`text-xs font-semibold uppercase tracking-[0.16em] ${
              isMobile ? "hidden" : "block"
            }`}
          >
            Orders
          </Link>

          <Link
            to="/cart"
            onClick={closeMenu}
            aria-label={`Keranjang, ${totalItems} item`}
            className="group flex items-center gap-3 border border-black bg-black px-4 py-3 text-white transition hover:bg-[#333]"
          >
            <ShoppingCart
              size={20}
              strokeWidth={1.8}
              aria-hidden="true"
            />

            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-white px-1.5 text-[10px] font-black text-black">
              {totalItems}
            </span>
          </Link>
        </div>
      </div>

      {isMobile && menuOpen && (
        <div className="fixed left-0 right-0 top-20 z-40 border-t border-black/10 bg-[#f5f3ef] px-6 pb-6 shadow-[0_24px_60px_rgba(0,0,0,0.12)]">
          <nav className="mx-auto flex max-w-7xl flex-col">
            {[...navigation, ["Akun", "/account"], ["Orders", "/jastip"]].map((item) =>
              renderNavLink(
                item,
                "border-b border-black/10 py-5 text-sm font-black uppercase tracking-[0.18em]"
              )
            )}
          </nav>
        </div>
      )}
    </header>
  );
}

export default Navbar;
