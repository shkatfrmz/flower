import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api.js';
import { IconBox, IconCheck } from '../components/Icons.jsx';

const STATUS_META = {
  pending: ['badge-pending', 'Pending'],
  processing: ['badge-processing', 'Processing'],
  shipped: ['badge-shipped', 'Shipped'],
  delivered: ['badge-delivered', 'Delivered'],
  cancelled: ['badge-cancelled', 'Cancelled'],
};

export default function MyOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('placed');

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get('/orders/mine').then((r) => r.data.orders),
      api.get('/seller/orders').then((r) => r.data.items),
    ])
      .then(([placed, received]) => {
        setOrders({ placed, received });
      })
      .catch(() => setOrders({ placed: [], received: [] }))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="page"><div className="spinner" /></div>;

  const placed = orders.placed || [];
  const received = orders.received || [];

  const receivedByOrder = {};
  for (const it of received) {
    if (!receivedByOrder[it.order_id]) {
      receivedByOrder[it.order_id] = {
        order_id: it.order_id,
        customer_name: it.customer_name,
        customer_email: it.customer_email,
        customer_phone: it.customer_phone,
        address: it.address,
        order_status: it.order_status,
        order_date: it.order_date,
        items: [],
        total: 0,
      };
    }
    const o = receivedByOrder[it.order_id];
    o.total += it.price * it.quantity;
    o.items.push(it);
  }
  const receivedList = Object.values(receivedByOrder);

  return (
    <div className="page container" style={{ maxWidth: 880 }}>
      <h1 className="page-title">Orders</h1>
      <p className="page-sub">Orders you placed and sales you have received.</p>

      <div className="tabs">
        <button className={`tab-btn ${tab === 'placed' ? 'active' : ''}`} onClick={() => setTab('placed')}>Orders I placed ({placed.length})</button>
        <button className={`tab-btn ${tab === 'received' ? 'active' : ''}`} onClick={() => setTab('received')}>Sales I received ({receivedList.length})</button>
      </div>

      {tab === 'placed' ? (
        placed.length === 0 ? (
          <div className="empty card" style={{ border: '1px dashed var(--gray-300)' }}>
            <IconBox size={34} />
            <h3>No orders yet</h3>
            <p>When you buy flowers they will show up here.</p>
            <Link to="/shop" className="btn btn-primary mt-16">Browse flowers</Link>
          </div>
        ) : (
          <div className="form" style={{ gap: 18 }}>
            {placed.map((o) => (
              <div key={o.id} className="card card-pad">
                <div className="row between wrap" style={{ marginBottom: 14 }}>
                  <div>
                    <b style={{ fontSize: 16 }}>Order #{o.id}</b>
                    <div className="muted" style={{ fontSize: 13 }}>{o.created_at.slice(0, 10)} - {o.address}</div>
                  </div>
                  <div className="row">
                    <span className={`badge ${(STATUS_META[o.status] || ['badge-pending'])[0]}`}>{(STATUS_META[o.status] || ['Pending'])[1]}</span>
                    <b style={{ fontSize: 16, color: 'var(--rose-600)' }}>${Number(o.total).toFixed(2)}</b>
                  </div>
                </div>
                {(o.items || []).map((it, i) => (
                  <div key={i} className="row" style={{ padding: '8px 0', borderTop: '1px solid var(--gray-100)' }}>
                    <span className="grow" style={{ fontSize: 14 }}>{it.product_name} <span className="muted">x{it.quantity}</span></span>
                    <b style={{ fontSize: 14 }}>${(it.price * it.quantity).toFixed(2)}</b>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )
      ) : receivedList.length === 0 ? (
        <div className="empty card" style={{ border: '1px dashed var(--gray-300)' }}>
          <IconCheck size={34} />
          <h3>No sales yet</h3>
          <p>When customers buy your flowers, the orders appear here.</p>
        </div>
      ) : (
        <div className="form" style={{ gap: 18 }}>
          {receivedList.map((o) => (
            <div key={o.order_id} className="card card-pad">
              <div className="row between wrap" style={{ marginBottom: 14 }}>
                <div>
                  <b style={{ fontSize: 16 }}>Order #{o.order_id}</b>
                  <div className="muted" style={{ fontSize: 13 }}>{o.order_date.slice(0, 10)} - {o.customer_name}, {o.address}</div>
                </div>
                <div className="row">
                  <span className={`badge ${(STATUS_META[o.order_status] || ['badge-pending'])[0]}`}>{(STATUS_META[o.order_status] || ['Pending'])[1]}</span>
                  <b style={{ fontSize: 16, color: 'var(--rose-600)' }}>${Number(o.total).toFixed(2)}</b>
                </div>
              </div>
              {o.items.map((it, i) => (
                <div key={i} className="row" style={{ padding: '8px 0', borderTop: '1px solid var(--gray-100)' }}>
                  <span className="grow" style={{ fontSize: 14 }}>{it.product_name} <span className="muted">x{it.quantity}</span></span>
                  <b style={{ fontSize: 14 }}>${(it.price * it.quantity).toFixed(2)}</b>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}