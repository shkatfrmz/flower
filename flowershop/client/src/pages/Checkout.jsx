import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api.js';
import { useCart } from '../context/CartContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { imgSrc } from '../api.js';

export default function Checkout({ onToast }) {
  const { items, total, clear } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    customer_name: user ? '' : '',
    customer_email: user ? user.email : '',
    customer_phone: '',
    address: '',
    note: '',
  });

  function set(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  if (items.length === 0) {
    return (
      <div className="page container">
        <div className="empty">
          <h3>Nothing to check out</h3>
          <Link to="/shop" className="btn btn-primary mt-16">Browse flowers</Link>
        </div>
      </div>
    );
  }

  async function submit(e) {
    e.preventDefault();
    setError('');
    if (!form.customer_name || !form.customer_email || !form.address) {
      setError('Please fill in name, email and address');
      return;
    }
    setSending(true);
    try {
      const res = await api.post('/orders', {
        items: items.map((i) => ({ product_id: i.product_id, quantity: i.quantity })),
        ...form,
      });
      clear();
      onToast('Order placed successfully', 'success');
      navigate(`/order-confirmed?order=${res.data.order.id}&total=${res.data.total}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Could not place order');
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="page container">
      <h1 className="page-title">Checkout</h1>
      <p className="page-sub">Almost there - tell us where to deliver the blooms.</p>

      <div className="cart-layout">
        <form className="card card-pad" onSubmit={submit}>
          <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: 20, marginBottom: 16 }}>Delivery details</h3>
          {error && <div className="form-error">{error}</div>}
          <div className="form">
            <div className="field">
              <label>Full name</label>
              <input className="input" value={form.customer_name} onChange={(e) => set('customer_name', e.target.value)} placeholder="Jane Doe" required />
            </div>
            <div className="field">
              <label>Email</label>
              <input className="input" type="email" value={form.customer_email} onChange={(e) => set('customer_email', e.target.value)} placeholder="jane@example.com" required />
            </div>
            <div className="field">
              <label>Phone</label>
              <input className="input" value={form.customer_phone} onChange={(e) => set('customer_phone', e.target.value)} placeholder="+1 555 000 0000" />
            </div>
            <div className="field">
              <label>Delivery address</label>
              <textarea className="textarea" value={form.address} onChange={(e) => set('address', e.target.value)} placeholder="Street, city, postcode" required />
            </div>
            <div className="field">
              <label>Note for the seller (optional)</label>
              <input className="input" value={form.note} onChange={(e) => set('note', e.target.value)} placeholder="Ring the doorbell twice" />
            </div>
            <button className="btn btn-primary btn-lg" type="submit" disabled={sending}>
              {sending ? 'Placing order...' : `Place order - $${total.toFixed(2)}`}
            </button>
          </div>
        </form>

        <div className="card card-pad" style={{ position: 'sticky', top: 88 }}>
          <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: 20, marginBottom: 14 }}>Items</h3>
          {items.map((item) => (
            <div key={item.product_id} className="row" style={{ padding: '10px 0', borderBottom: '1px solid var(--gray-100)', alignItems: 'center' }}>
              <img src={imgSrc(item.image)} alt={item.name} style={{ width: 44, height: 44, borderRadius: 8, objectFit: 'cover' }} />
              <div className="grow" style={{ fontSize: 14 }}>
                <b>{item.name}</b>
                <div className="muted" style={{ fontSize: 12 }}>x{item.quantity}</div>
              </div>
              <b style={{ fontSize: 14 }}>${(item.price * item.quantity).toFixed(2)}</b>
            </div>
          ))}
          <div className="summary-row total" style={{ marginTop: 10 }}>
            <span>Total</span><span>${total.toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}