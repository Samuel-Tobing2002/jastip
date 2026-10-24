import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

const CartContext = createContext();

const CART_STORAGE_KEY = "jastip_cart";

export function CartProvider({ children }) {
  const [cart, setCart] = useState(() => {
    try {
      const savedCart = localStorage.getItem(CART_STORAGE_KEY);

      return savedCart
        ? JSON.parse(savedCart)
        : [];
    } catch (error) {
      console.error("Failed to load cart:", error);
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(
      CART_STORAGE_KEY,
      JSON.stringify(cart)
    );
  }, [cart]);

  const addToCart = (product, quantity = 1) => {
    setCart((currentCart) => {
      const cartKey = (item) => `${item.id}::${item.selectedColor || ""}::${item.selectedSize || ""}`;
      const existingProduct = currentCart.find((item) => cartKey(item) === cartKey(product));

      if (existingProduct) {
        return currentCart.map((item) =>
          cartKey(item) === cartKey(product)
            ? {
                ...item,
                quantity: Math.min(Number(item.stock || 0), item.quantity + quantity),
              }
            : item
        );
      }

      return [
        ...currentCart,
        {
          ...product,
          quantity: Math.min(Number(product.stock || 0), quantity),
        },
      ];
    });
  };

  const sameVariant = (item, target) => item.id === target.id && (item.selectedColor || "") === (target.selectedColor || "") && (item.selectedSize || "") === (target.selectedSize || "");
  const removeFromCart = (target) => {
    setCart((currentCart) => currentCart.filter((item) => typeof target === "string" ? item.id !== target : !sameVariant(item, target)));
  };

  const updateQuantity = (target, quantity) => {
    if (quantity <= 0) { removeFromCart(target); return; }
    setCart((currentCart) => currentCart.map((item) => sameVariant(item, target) ? { ...item, quantity: Math.min(Number(item.stock || 0), quantity) } : item));
  };

  const clearCart = () => {
    setCart([]);
  };

  const totalItems = cart.reduce(
    (total, item) =>
      total + item.quantity,
    0
  );

  const productSubtotal = cart.reduce(
    (total, item) =>
      total + item.price * item.quantity,
    0
  );

  const baseSubtotal = cart.reduce(
    (total, item) =>
      total + (item.basePrice || item.price) * item.quantity,
    0
  );

  const jastipFee = productSubtotal - baseSubtotal;

  const shippingFee =
    cart.length > 0 ? 15 : 0;

  const total =
    productSubtotal +
    shippingFee;

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        totalItems,
        productSubtotal,
        baseSubtotal,
        jastipFee,
        shippingFee,
        total,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
