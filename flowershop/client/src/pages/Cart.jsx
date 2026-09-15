import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useCart } from '../context/CartContext.jsx';
import { useApi } from '../hooks/useApi.jsx';
import { toast } from 'react-hot-toast';

export default function Cart() {
  const { user } = useAuth();
  const { cart, clearCart, removeFromCart, updateQuantity } = useCart();
  const navigate = useNavigate();
  const { apiPost } = useApi();

  if (!user) {
    navigate('/login');
    return null;
  }

  function handleCheckout() {
    if (cart.length === 0) {
      toast.error('Your cart is empty');
      return;
    }
    // TODO: implement checkout
    toast.success('Checkout initiated (not implemented yet)');
    clearCart();
    navigate('/');
  }

  function handleRemove(id) {
    removeFromCart(id);
    toast.success('Item removed from cart');
  }

  function handleUpdate(id, quantity) {
    updateQuantity(id, quantity);
    toast.success('Cart updated');
  }

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="cart-page">
      <h1 className="cart-title">Your Shopping Cart</h1>
      {cart.length === 0 ? (
        <div className="empty-cart">
          <p>Your cart is empty.</p>
          <Link to="/shop" className="btn-primary">
            Continue Shopping
          </Link>
        </div>
      ) : (
        <>
          <div className="cart-items">
            {cart.map((item) => (
              <div key={item.id} className="cart-item">
                <img src={item.image} alt={item.name} className="cart-item-image" />
                <div className="cart-item-details">
                  <h3 className="cart-item-name">{item.name}</h3>
                  <p className="cart-item-price">$${item.price}</p>
                  <div className="cart-item-quantity">
                    <button
                      onClick={() => handleUpdate(item.id, Math.max(item.quantity - 1, 1))}
                      className="qty-btn"
                      disabled={item.quantity <= 1}
                    >
                      &minus;
                    </button>
                    <span className="qty-value">{item.quantity}</span>
                    <button
                      onClick={() => handleUpdate(item.id, item.quantity + 1)}
                      className="qty-btn"
                    >
                      &plus;
                    </button>
                  </div>
                  <p className="cart-item-total">$${(item.price * item.quantity).toFixed(2)}</p>
                </div>
                <button onClick={() => handleRemove(item.id)} className="remove-btn">
                  &times;
                </button>
              </div>
            ))}
          </div>
          <div className="cart-summary">
            <p className="cart-items-text">{cartItemCount} item{cartItemCount !== 1 ? 's' : ''} in cart</p>
            <p className="cart-subtotal">Subtotal: <span>$${subtotal.toFixed(2)}</span></p>
            <button onClick={handleCheckout} className="btn-primary checkout-btn">
              Proceed to Checkout
            </button>
            <button onClick={() => clearCart()} className="btn-link clear-cart">
              Clear Cart
            </button>
          </div>
        </>
      )}
    </div>
  );
}