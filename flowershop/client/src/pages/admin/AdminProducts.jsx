import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import api, { imgSrc } from '../../api.js';
import { IconCheck, IconX } from '../../components/Icons.jsx';

const STATUS_META = {
  pending: 'badge-pending',
  approved: 'badge-approved',
  rejected: 'badge-rejected',
};

export default function AdminProducts({ onToast }) {
  const [params, setParams] = useSearchParams();
  const status = params.get('status') || 'all';
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    setLoading(true);
    api.get('/admin/products', { params: { status } })
      .then((r) => setProducts(r.data.products))
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, [status]);

  const filtered = useMemo(() => {
    if (!search) return products;
    const q = search.toLowerCase();
    return products.filter((p) => p.name.toLowerCase().includes(q) || (p.seller_name || '').toLowerCase().includes(q));
  }, [products, search]);

  async function changeStatus(id, newStatus) {
    try {
      await api.put(`/admin/products/${id}/status`, { status: newStatus });
      setProducts((ps) => ps.map((p) => (p.id === id ? { ...p, status: newStatus } : p)));
      onToast(`Product marked ${newStatus}`, 'success');
    } catch (e) {
      onToast(e.response?.data?.error || 'Update failed', 'error');
    }
  }

  async function remove(id) {
    if (!window.confirm('Delete this product permanently?')) return;
    try {
      await api.delete(`/admin/products/${id}`);
      setProducts((ps) => ps.filter((p) => p.id !== id));
      onToast('Product deleted', 'success');
    } catch (e) {
      onToast(e.response?.data?.error || 'Delete failed', 'error');
    }
  }

  return (
    <>
      <div className="tabs">
        {[
          { key: 'all', label: 'All' },
          { key: 'pending', label: 'Pending review' },
          { key: 'approved', label: 'Approved' },
          { key: 'rejected', label: 'Rejected' },
        ].map((t) => (
          <button key={t.key} className={`tab-btn ${status === t.key ? 'active' : ''}`} onClick={() => {
            const next = new URLSearchParams(params);
            if (t.key === 'all') next.delete('status');
            else next.set('status', t.key);
            setParams(next, { replace: true });
          }}>{t.label}</button>
        ))}
        <input className="input" style={{ marginLeft: 'auto', width: 200 }} placeholder="Search name / seller..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {loading ? (
        <div className="spinner" />
      ) : filtered.length === 0 ? (
        <div className="empty card" style={{ border: '1px dashed var(--gray-300)' }}><h3>Nothing here</h3><p>No products match this filter.</p></div>
      ) : (
        <div className="card table-wrap">
          <table className="tbl">
            <thead>
              <tr><th>Product</th><th>Seller</th><th>Price</th><th>Stock</th><th>Status</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id}>
                  <td>
                    <button className="row" style={{ border: 'none', background: 'none', padding: 0, textAlign: 'left', gap: 10, cursor: 'pointer' }} onClick={() => setExpanded(expanded === p.id ? null : p.id)}>
                      <img className="thumb" src={imgSrc(firstImage(p))} alt="" />
                      <b style={{ fontSize: 14, color: 'inherit' }}>{p.name}</b>
                    </button>
                  </td>
                  <td>{p.seller_name}</td>
                  <td>${Number(p.price).toFixed(2)}</td>
                  <td>{p.stock}</td>
                  <td><span className={`badge ${STATUS_META[p.status] || 'badge-pending'}`}>{p.status}</span></td>
                  <td>
                    <div className="actions">
                      {p.status === 'pending' && (
                        <>
                          <button className="btn btn-success btn-sm" title="Approve" onClick={() => changeStatus(p.id, 'approved')}><IconCheck size={14} /> Approve</button>
                          <button className="btn btn-danger btn-sm" title="Reject" onClick={() => changeStatus(p.id, 'rejected')}><IconX size={14} /> Reject</button>
                        </>
                      )}
                      {p.status === 'rejected' && (
                        <button className="btn btn-success btn-sm" onClick={() => changeStatus(p.id, 'approved')}>Approve</button>
                      )}
                      {p.status === 'approved' && (
                        <button className="btn btn-danger btn-sm" onClick={() => changeStatus(p.id, 'rejected')}>Reject</button>
                      )}
                      <button className="btn btn-danger btn-sm" onClick={() => remove(p.id)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {expanded && (
        <div className="modal-overlay" onClick={() => setExpanded(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            {(() => {
              const p = products.find((x) => x.id === expanded);
              if (!p) return null;
              return (
                <>
                  <h3>{p.name}</h3>
                  <div className="row wrap" style={{ gap: 8, marginBottom: 12 }}>
                    <span className={`badge ${STATUS_META[p.status] || ''}`}>{p.status}</span>
                    <span className="badge badge-seller">{p.seller_name}</span>
                    <span className="badge">{p.category_name || 'General'}</span>
                  </div>
                  <img src={imgSrc(firstImage(p))} alt="" style={{ width: '100%', maxHeight: 300, objectFit: 'cover', borderRadius: 12, marginBottom: 14 }} />
                  <p style={{ color: 'var(--gray-600)', fontSize: 14, marginBottom: 12 }}>{p.description || 'No description.'}</p>
                  <div className="row between">
                    <b style={{ fontSize: 18, color: 'var(--rose-600)' }}>${Number(p.price).toFixed(2)}</b>
                    <span className="muted">Stock: {p.stock}</span>
                  </div>
                  <div className="row" style={{ justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
                    <button className="btn btn-outline" onClick={() => setExpanded(null)}>Close</button>
                    {p.status !== 'approved' && <button className="btn btn-success" onClick={() => { changeStatus(p.id, 'approved'); setExpanded(null); }}>Approve</button>}
                    {p.status === 'approved' && <button className="btn btn-danger" onClick={() => { changeStatus(p.id, 'rejected'); setExpanded(null); }}>Reject</button>}
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}
    </>
  );
}

function firstImage(p) {
  try { const arr = JSON.parse(p.images); return arr.length ? arr[0] : ''; } catch { return ''; }
}