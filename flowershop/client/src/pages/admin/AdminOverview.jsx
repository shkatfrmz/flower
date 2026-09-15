import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { imgSrc } from '../../api.js';
import { IconBox, IconChart, IconGrid, IconTag, IconUsers } from '../../components/Icons.jsx';

export default function AdminOverview({ onToast }) {
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get('/admin/stats').then((r) => setData(r.data)).catch(() => onToast('Could not load stats', 'error'));
  }, []);

  if (!data) return <div className="spinner" />;
  const { stats, recentOrders } = data;

  const cards = [
    { label: 'Total users', value: stats.users, hint: `${stats.sellers} sellers`, icon: <IconUsers size={18} />, to: '/admin/users' },
    { label: 'Products', value: stats.products, hint: `${stats.approvedProducts} live`, icon: <IconGrid size={18} />, to: '/admin/products' },
    { label: 'Orders', value: stats.orders, hint: 'all time', icon: <IconBox size={18} />, to: '/admin/orders' },
    { label: 'Revenue', value: `$${Number(stats.revenue).toLocaleString(undefined, { maximumFractionDigits: 0 })}`, hint: 'excl. cancelled', icon: <IconChart size={18} />, to: '/admin/orders' },
    { label: 'Categories', value: stats.categories, hint: 'shop sections', icon: <IconTag size={18} />, to: '/admin/categories' },
  ];

  return (
    <>
      <div className="stat-grid" style={{ marginBottom: 28 }}>
        {cards.map((c) => (
          <Link key={c.label} to={c.to} className="stat-card" style={{ color: 'inherit' }}>
            <div className="row between">
              <div className="lbl">{c.label}</div>
              <span style={{ color: 'var(--rose-500)' }}>{c.icon}</span>
            </div>
            <div className="val">{c.value}</div>
            <div className="dim">{c.hint}</div>
          </Link>
        ))}
      </div>

      {stats.pendingProducts > 0 && (
        <div className="card" style={{ padding: '16px 20px', marginBottom: 24, borderColor: '#fde68a', background: '#fffbeb', display: 'flex', alignItems: 'center', gap: 12 }}>
          <IconGrid size={18} style={{ color: '#d97706' }} />
          <div className="grow">
            <b style={{ color: '#78350f' }}>{stats.pendingProducts} product{stats.pendingProducts > 1 ? 's' : ''} awaiting approval</b>
            <div className="muted" style={{ fontSize: 13 }}>New seller listings need a quick review before they go live.</div>
          </div>
          <Link to="/admin/products?status=pending" className="btn btn-sm" style={{ background: '#d97706', color: '#fff' }}>Review now</Link>
        </div>
      )}

      <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 20, marginBottom: 14 }}>Recent orders</h2>
      {recentOrders.length === 0 ? (
        <div className="empty card" style={{ border: '1px dashed var(--gray-300)' }}><h3>No orders yet</h3><p>Customer orders will appear here.</p></div>
      ) : (
        <div className="card table-wrap">
          <table className="tbl">
            <thead>
              <tr><th>Order</th><th>Customer</th><th>Date</th><th>Status</th><th>Total</th></tr>
            </thead>
            <tbody>
              {recentOrders.map((o) => (
                <tr key={o.id}>
                  <td><b>#{o.id}</b></td>
                  <td>{o.customer_name}</td>
                  <td className="muted">{o.created_at.slice(0, 10)}</td>
                  <td><OrderBadge status={o.status} /></td>
                  <td>${Number(o.total).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

export function OrderBadge({ status }) {
  const map = {
    pending: 'badge-pending',
    processing: 'badge-processing',
    shipped: 'badge-shipped',
    delivered: 'badge-delivered',
    cancelled: 'badge-cancelled',
  };
  return <span className={`badge ${map[status] || 'badge-pending'}`}>{status}</span>;
}

export function productImages(p) {
  try { return JSON.parse(p.images); } catch { return []; }
}

export function firstImage(p) {
  const arr = productImages(p);
  return arr.length ? arr[0] : '';
}