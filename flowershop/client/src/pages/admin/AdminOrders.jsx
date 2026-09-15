import { useEffect, useState } from 'react';
import api from '../../api.js';
import { OrderBadge } from './AdminOverview.jsx';

const STATUSES = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];

export default function AdminOrders({ onToast }) {
  const [orders, setOrders] = useState([]);
  const [status, setStatus] = useState('all');

  useEffect(() => {
    api.get('/admin/orders', { params: { status } })
      .then((r) => setOrders(r.data.orders))
      .catch(() => setOrders([]));
  }, [status]);

  async function changeStatus(id, newStatus) {
    try {
      await api.put(`/admin/orders/${id}/status`, { status: newStatus });
      setOrders((os) => os.map((o) => (o.id === id ? { ...o, status: newStatus } : o)));
      onToast('Order status updated', 'success');
    } catch (e) {
      onToast(e.response?.data?.error || 'Update failed', 'error');
    }
  }

  async function remove(id) {
    if (!window.confirm(`Delete order #${id} permanently?`)) return;
    try {
      await api.delete(`/admin/orders/${id}`);
      setOrders((os) => os.filter((o) => o.id !== id));
      onToast('Order deleted', 'success');
    } catch (e) {
      onToast(e.response?.data?.error || 'Delete failed', 'error');
    }
  }

  return (
    <>
      <div className="tabs">
        <button className={`tab-btn ${status === 'all' ? 'active' : ''}`} onClick={() => setStatus('all')}>All</button>
        {STATUSES.map((s) => (
          <button key={s} className={`tab-btn ${status === s ? 'active' : ''}`} onClick={() => setStatus(s)}>{s}</button>
        ))}
      </div>

      {orders.length === 0 ? (
        <div className="empty card" style={{ border: '1px dashed var(--gray-300)' }}><h3>No orders</h3><p>Orders will appear here.</p></div>
      ) : (
        <div className="form" style={{ gap: 16 }}>
          {orders.map((o) => (
            <div key={o.id} className="card card-pad">
              <div className="row between wrap" style={{ marginBottom: 12 }}>
                <div>
                  <b style={{ fontSize: 16 }}>Order #{o.id}</b>
                  <span className="muted" style={{ fontSize: 13, marginLeft: 10 }}>{o.created_at.slice(0, 10)}</span>
                </div>
                <div className="row" style={{ gap: 8 }}>
                  <OrderBadge status={o.status} />
                  <select
                    className="select"
                    style={{ width: 'auto', padding: '6px 10px', fontSize: 13 }}
                    value={o.status}
                    onChange={(e) => changeStatus(o.id, e.target.value)}
                  >
                    {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              <div className="row wrap" style={{ fontSize: 14, gap: 18, marginBottom: 10, color: 'var(--gray-600)' }}>
                <span><b>{o.customer_name}</b> - {o.customer_email}</span>
                <span>Phone: {o.customer_phone || '—'}</span>
                <span>Address: {o.address}</span>
                {o.note && <span>Note: "{o.note}"</span>}
              </div>

              <div className="card" style={{ background: 'var(--gray-50)', border: 'none', padding: '10px 14px' }}>
                {(o.items || []).map((it) => (
                  <div key={it.id} className="row between" style={{ fontSize: 14, padding: '5px 0' }}>
                    <span>{it.product_name} <span className="muted">(seller #{it.seller_id})</span> x{it.quantity}</span>
                    <b>${(it.price * it.quantity).toFixed(2)}</b>
                  </div>
                ))}
                <div className="row between" style={{ fontSize: 15, borderTop: '1px solid var(--gray-200)', marginTop: 6, paddingTop: 8 }}>
                  <b>Total</b>
                  <b style={{ color: 'var(--rose-600)' }}>${Number(o.total).toFixed(2)}</b>
                </div>
              </div>

              <div className="row" style={{ justifyContent: 'flex-end', marginTop: 10 }}>
                <button className="btn btn-danger btn-sm" onClick={() => remove(o.id)}>Delete order</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}