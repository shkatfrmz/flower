import { useRef, useState } from 'react';
import { FaStar } from 'react-icons/fa';
import { useAddToCart } from '../hooks/useAddToCart.jsx';
import { toast } from 'react-hot-toast';

export default function ProductCard({ product, onAddToCart, showAddToCart }) {
  const [isAdded, setIsAdded] = useState(false);
  const ref = useRef(null);
  const { addToCart } = useAddToCart();

  function handleAddToCart() {
    if (!showAddToCart) return;
    addToCart(product);
    setIsAdded(true);
    toast.success('Added to cart');
    setTimeout(() => setIsAdded(false), 2000);
  }

  return (
    <article className="product-card" ref={ref}>
      <div className="product-image-wrapper">
        <img
          src={product.image}
          alt={product.name}
          className="product-image"
        />
        {product.isNew && <span className="badge-new">New</span>}
        {product.isSale && <span className="badge-sale">Sale</span>}
      </div>
      <div className="product-info">
        <h3 className="product-name">{product.name}</h3>
        <p className="product-price">$${product.price}</p>
      </div>
      {showAddToCart && (
        <button
          className={`add-cart ${isAdded ? 'added' : ''}`}
          onClick={handleAddToCart}
          aria-label="Add to cart"
        >
          <span>{isAdded ? 'Added' : 'Add to cart'}</span>
        </button>
      )}
    </article>
  );
}