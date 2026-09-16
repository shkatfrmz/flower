import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useCart } from '../context/CartContext.jsx';
import { useAddToCart } from '../hooks/useAddToCart.jsx';
import { useApi } from '../hooks/useApi.jsx';
import { toast } from 'react-hot-toast';
import { FaStar } from 'react-icons/fa';

export default function ProductDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const { cart, addToCart } = useCart();
  const { addToCart: addToCartHook } = useAddToCart();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const { apiGet } = useApi();

  useEffect(() => {
    async function loadProduct() {
      try {
        const res = await apiGet(`/products/${id}`);
        setProduct(res.data);
        setQuantity(Math.min(res.data.stock, 1));
      } catch (err) {
        toast.error('Product not found');
        navigate('/shop');
      } finally {
        setLoading(false);
      }
    }
    loadProduct();
  }, [id, apiGet, navigate, toast]);

  if (loading || !product) return <div className="loading">Loading...</div>;

  const inCart = cart.find(item => item.id === product.id);
  const cartQuantity = inCart ? inCart.quantity : 0;
  const maxCanAdd = product.stock - cartQuantity;
  const handleIncrease = () => {
    if (quantity < product.stock && quantity < cartQuantity + 5) setQuantity(q => q + 1);
  };
  const handleDecrease = () => {
    if (quantity > 1) setQuantity(q => q - 1);
  };
  const handleAdd = () => {
    if (maxCanAdd <= 0) {
      toast.error('Cannot add more than available stock');
      return;
    }
    addToCartHook({ ...product, quantity });
    toast.success('Added to cart');
  };

  return (
    <div className="product-detail">
      <Link to="/shop" className="back-link">
        &larr; Back to shop
      </Link>
      <div className="product-detail-grid">
        <div className="product-detail-image">
          <img src={product.image} alt={product.name} />
        </div>
        <div className="product-detail-info">
          <h1 className="product-title">{product.name}</h1>
          <p className="product-description">{product.description}</p>
          <div className="product-price">$${product.price}</div>
          <div className="product-stock">
            <span className="stock-label">In stock:</span>
            <span className="stock-quantity">{product.stock}</span>
          </div>
          <div className="product-actions">
            <div className="quantity-selector">
              <button onClick={handleDecrease} className="qty-btn {-}{quantity <= 1 ? 'disabled' : ''}">
                &minus;
              </button>
              <span className="qty-value">{quantity}</span>
              <button onClick={handleIncrease} className="qty-btn {quantity >= product.stock ? 'disabled' : ''}">
                &plus;
              </button>
            </div>
            <button
              onClick={handleAdd}
              className="btn-primary add-to-cart-btn"
              disabled={maxCanAdd <= 0}
            >
              {maxCanAdd <= 0 ? 'Out of Stock' : 'Add to Cart'}
            </button>
          </div>
          {user && user.role === 'admin' && (
            <div className="admin-actions">
              <Link to={`/admin/products/${product.id}/edit`} className="btn-link">
                Edit Product
              </Link>
              <button
                onClick={() => {
                  if (window.confirm('Delete this product?')) {
                    // TODO: implement delete
                    toast.success('Product deleted (not implemented yet)');
                  }
                }}
                className="btn-link delete-btn"
              >
                Delete Product
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}