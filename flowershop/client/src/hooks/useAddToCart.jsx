import { useCart } from "../context/CartContext.jsx";

export function useAddToCart() {
  const { addToCart } = useCart();

  const addToCartHook = (product) => {
    addToCart(product);
  };

  return { addToCart: addToCartHook };
}
