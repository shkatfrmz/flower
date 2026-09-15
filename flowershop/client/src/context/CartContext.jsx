import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    try { return JSON.parse(localStorage.getItem('pb_cart')) || []; } catch { return []; }
  });

  useEffect(() => {
    localStorage.setItem('pb_cart', JSON.stringify(items));
  }, [items]);

  function addItem(product, qty = 1) {
    setItems((prev) => {
      const existing = prev.find((i) => i.product_id === product.id);
      if (existing) {
        return prev.map((i) => (i.product_id === product.id ? { ...i, quantity: i.quantity + qty } : i));
      }
      return [...prev, { product_id: product.id, name: product.name, price: product.price, image: Array.isArray(product.images) && product.images[0] ? product.images[0] : product.images, quantity: qty, stock: product.stock }];
    });
  }

  function updateQty(productId, qty) {
    setItems((prev) => prev.map((i) => (i.product_id === productId ? { ...i, quantity: qty } : i)).filter((i) => i.quantity > 0));
  }

  function removeItem(productId) {
    setItems((prev) => prev.filter((i) => i.product_id !== productId));
  }

  function clear() {
    setItems([]);
  }

  const total = useMemo(() => items.reduce((s, i) => s + i.price * i.quantity, 0), [items]);
  const count = useMemo(() => items.reduce((s, i) => s + i.quantity, 0), [items]);

  return (
    <CartContext.Provider value={{ items, addItem, updateQty, removeItem, clear, total, count }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}