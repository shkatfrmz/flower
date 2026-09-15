import { useEffect, useMemo, useState } from 'react';
import api from '../../api.js';
import { IconSearch } from '../../components/Icons.jsx';

export default function AdminUsers({ onToast }) {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    refresh();
  }, []);

  function refresh() {
    api.get('/admin/users').then((r) => setUsers(r.data.users)).catch(() => {});
  }

  async function update(id, body) {
    try {
      await api.put(`/admin/users/${id}`, body);
      refresh();
      onToast('User updated', 'success');
    } catch (e) {
      onToast(e.response?.data?.error || 'Update failed', 'error');
    }
  }

  async function remove(id) {
    if (!window.confirm('Delete this user? Their products and orders will be removed too.')) return;
    try {
      await api.delete(`/admin/users/${id}`);
      setUsers((us) => us.filter((u) => u.id !== id));
      onToast('User deleted', 'success');
    } catch (e) {
      onToast(e.response?.data?.error || 'Delete failed', 'error');
    }
  }

  const filtered = useMemo(() => {
    if (!search) return users;
    const q = search.toLowerCase();
    return users.filter((u) => u.username.toLowerCase().includes(q) || u.email.toLowerCase().includes(q));
  }, [users, search]);

  return (
    <>
      <div className="row" style={{ marginBottom: 20, maxWidth: 380 }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <span style={{ position: 'absolute', left: 12, top: 11, color: 'var(--gray-400)' }}><IconSearch size={17} /></span>
          <input className="input" style={{ paddingLeft: 38 }} placeholder="Search users..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="empty card" style={{ border: '1px dashed var(--gray-300)' }}><h3>No users found</h3></div>
      ) : (
        <div className="card table-wrap">
          <table className="tbl">
            <thead>
              <tr><th>User</th><th>Role</th><th>Status</th><th>Joined</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr key={u.id}>
                  <td>
                    <b style={{ fontSize: 14 }}>{u.username}</b>
                    <div className="muted" style={{ fontSize: 12 }}>{u.email}</div>
                  </td>
                  <td>
                    <select className="select" style={{ width: 'auto', padding: '5px 10px', fontSize: 13 }} value={u.role} onChange={(e) => update(u.id, { role: e.target.value })}>
                      <option value="seller">seller</option>
                      <option value="admin">admin</option>
                    </select>
                  </td>
                  <td>
                    <select className="select" style={{ width: 'auto', padding: '5px 10px', fontSize: 13 }} value={u.status} onChange={(e) => update(u.id, { status: e.target.value })}>
                      <option value="active">active</option>
                      <option value="suspended">suspended</option>
                    </select>
                  </td>
                  <td className="muted" style={{ fontSize: 13 }}>{u.created_at.slice(0, 10)}</td>
                  <td>
                    <div className="actions">
                      {u.status === 'active' ? (
                        <button className="btn btn-outline btn-sm" onClick={() => update(u.id, { status: 'suspended' })}>Suspend</button>
                      ) : (
                        <button className="btn btn-success btn-sm" onClick={() => update(u.id, { status: 'active' })}>Unsuspend</button>
                      )}
                      <button className="btn btn-danger btn-sm" onClick={() => remove(u.id)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}