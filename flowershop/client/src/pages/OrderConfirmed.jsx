import { Link, useLocation } from 'react-router-dom';
import { IconCheck, IconLeaf } from '../components/Icons.jsx';

export default function OrderConfirmed() {
  const { search } = useLocation();
  const orderId = new URLSearchParams(search).get('order');
  const total = new URLSearchParams(search).get('total');

  return (
    <div className="page container">
      <div className="auth-wrap">
        <div className="auth-card" style={{ textAlign: 'center' }}>
          <span style={{ width: 64, height: 64, borderRadius: '50%', background: '#dcfce7', color: '#166534', display: 'grid', placeItems: 'center', margin: '0 auto 18px' }}>
            <IconCheck size={32} />
          </span>
          <h1>Order placed!</h1>
          <p className="muted mt-8">Your flowers are on their way to being prepared.</p>

          <div className="card" style={{ marginTop: 24, padding: 18, background: 'var(--gray-50)', border: 'none', textAlign: 'left' }}>
            <div className="summary-row"><span className="muted">Order number</span><b>#{orderId || '—'}</b></div>
            <div className="summary-row" style={{ borderBottom: 'none' }}><span className="muted">Total charged</span><b>${Number(total || 0).toFixed(2)}</b></div>
          </div>

          <p style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--gray-500)', fontSize: 13, marginTop: 18 }}>
            <IconLeaf size={14} /> Track it anytime in My Orders.
          </p>

          <div className="row" style={{ justifyContent: 'center', marginTop: 22 }}>
            <Link to="/shop" className="btn btn-outline">Keep shopping</Link>
            <Link to="/my-orders" className="btn btn-primary">View my orders</Link>
          </div>
        </div>
      </div>
    </div>
  );
}