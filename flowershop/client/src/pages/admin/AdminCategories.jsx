import { useEffect, useState } from 'react';
import api from '../../api.js';
import { IconEdit, IconPlus, IconTrash } from '../../components/Icons.jsx';

export default function AdminCategories({ onToast }) {
  const [categories, setCategories] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', description: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    refresh();
  }, []);

  function refresh() {
    api.get('/admin/categories').then((r) => setCategories(r.data.categories)).catch(() => {});
  }

  function openCreate() {
    setEditing(null);
    setForm({ name: '', description: '' });
    setShowForm(true);
  }

  function openEdit(c) {
    setEditing(c);
    setForm({ name: c.name, description: c.description || '' });
    setShowForm(true);
  }

  async function submit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        await api.put(`/admin/categories/${editing.id}`, form);
        onToast('Category updated', 'success');
      } else {
        await api.post('/admin/categories', form);
        onToast('Category created', 'success');
      }
      setShowForm(false);
      refresh();
    } catch (err) {
      onToast(err.response?.data?.error || 'Save failed', 'error');
    } finally {
      setSaving(false);
    }
  }

  async function remove(c) {
    if (!window.confirm(`Delete category "${c.name}"?`)) return;
    try {
      await api.delete(`/admin/categories/${c.id}`);
      refresh();
      onToast('Category deleted', 'success');
    } catch (err) {
      onToast(err.response?.data?.error || 'Delete failed', 'error');
    }
  }

  const label = categories.map((c) => c.name);

  return (
    <>
      <div className="row between wrap" style={{ marginBottom: 20 }}>
        <p className="muted" style={{ margin: 0 }}>Categories organize the shop. Products in a deleted category must be moved first.</p>
        <button className="btn btn-primary" onClick={openCreate}><IconPlus size={15} /> New category</button>
      </div>

      {categories.length === 0 ? (
        <div className="empty card" style={{ border: '1px dashed var(--gray-300)' }}><h3>No categories yet</h3><p>Create the first one to get started.</p></div>
      ) : (
        <div className="grid grid-cats">
          {categories.map((c) => (
            <div key={c.id} className="card card-pad" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div className="row between wrap">
                <b style={{ fontSize: 16, fontFamily: 'var(--font-serif)' }}>{c.name}</b>
                <span className="badge badge-seller">{c.product_count} {Number(c.product_count) === 1 ? 'product' : 'products'}</span>
              </div>
              <p className="muted" style={{ fontSize: 13, margin: 0, flex: 1 }}>{c.description || 'No description'}</p>
              <div className="row" style={{ marginTop: 6 }}>
                <button className="btn btn-outline btn-sm grow" onClick={() => openEdit(c)}><IconEdit size={13} /> Edit</button>
                <button className="btn btn-danger btn-sm" onClick={() => remove(c)}><IconTrash size={13} /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <button className="btn btn-ghost btn-sm modal-close" onClick={() => setShowForm(false)}>x</button>
            <h3>{editing ? `Edit "${editing.name}"` : 'New category'}</h3>
            <form className="form" onSubmit={submit}>
              <div className="field">
                <label>Name</label>
                <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Peonies" required />
                {label.includes(form.name) && !(editing && editing.name === form.name) && form.name && (
                  <span className="form-hint" style={{ color: '#b91c1c' }}>This name already exists.</span>
                )}
              </div>
              <div className="field">
                <label>Description</label>
                <textarea className="textarea" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Short description shown to shoppers" />
              </div>
              <div className="row" style={{ justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save category'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}