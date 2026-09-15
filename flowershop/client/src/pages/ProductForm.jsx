import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import api, { imgSrc } from '../api.js';
import { IconImage, IconPlus } from '../components/Icons.jsx';

export default function ProductForm({ onToast, editId }) {
  const { id } = useParams();
  const editing = Boolean(id);
  const navigate = useNavigate();

  const [categories, setCategories] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    name: '',
    category_id: '',
    description: '',
    price: '',
    stock: '50',
    images: [],
  });

  useEffect(() => {
    api.get('/store/categories').then((r) => setCategories(r.data.categories)).catch(() => {});
    if (editing) {
      api.get('/seller/products').then((r) => {
        const p = r.data.products.find((x) => String(x.id) === String(id));
        if (!p) return;
        let images = [];
        try { images = Array.isArray(p.images) ? p.images : JSON.parse(p.images); } catch { images = []; }
        setForm({
          name: p.name,
          category_id: p.category_id ? String(p.category_id) : '',
          description: p.description || '',
          price: String(p.price),
          stock: String(p.stock),
          images,
        });
      }).catch(() => {});
    }
  }, [id, editing]);

  function set(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    setError('');
    try {
      const fd = new FormData();
      fd.append('image', file);
      const res = await api.post('/seller/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      set('images', [...form.images, res.data.url]);
      onToast('Image uploaded', 'success');
    } catch (err) {
      setError(err.response?.data?.error || 'Upload failed');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  }

  function removeImage(url) {
    set('images', form.images.filter((i) => i !== url));
  }

  async function submit(e) {
    e.preventDefault();
    setError('');
    if (!form.name.trim()) return setError('Give your flower a name');
    if (!form.price || Number(form.price) <= 0) return setError('Enter a valid price');
    setSaving(true);
    try {
      if (editing) {
        await api.put(`/seller/products/${id}`, {
          ...form,
          price: Number(form.price),
          stock: Number(form.stock) || 0,
          category_id: form.category_id ? Number(form.category_id) : null,
        });
        onToast('Product updated', 'success');
      } else {
        const res = await api.post('/seller/products', {
          ...form,
          price: Number(form.price),
          stock: Number(form.stock) || 0,
          category_id: form.category_id ? Number(form.category_id) : null,
        });
        onToast(res.data.message, 'success');
      }
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Could not save product');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="page container" style={{ maxWidth: 760 }}>
      <Link to="/dashboard" className="btn btn-ghost btn-sm" style={{ marginBottom: 16 }}>Back to my shop</Link>
      <h1 className="page-title">{editing ? 'Edit product' : 'Add a new flower'}</h1>
      <p className="page-sub">
        {editing
          ? 'Update the listing. Once saved the item is reviewed again for approval.'
          : 'Name your bloom, set your price and add a photo. New listings appear after admin approval.'}
      </p>

      <form className="card card-pad" onSubmit={submit}>
        {error && <div className="form-error" style={{ marginBottom: 16 }}>{error}</div>}
        <div className="form">
          <div className="field">
            <label>Product name</label>
            <input className="input" value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="e.g. Pink Peony Bouquet" />
          </div>

          <div className="row">
            <div className="field grow">
              <label>Category</label>
              <select className="select" value={form.category_id} onChange={(e) => set('category_id', e.target.value)}>
                <option value="">General / other</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="field" style={{ width: 180 }}>
              <label>Price (USD)</label>
              <input className="input" type="number" min="0.01" step="0.01" value={form.price} onChange={(e) => set('price', e.target.value)} placeholder="19.99" />
            </div>
            <div className="field" style={{ width: 120 }}>
              <label>Stock</label>
              <input className="input" type="number" min="0" value={form.stock} onChange={(e) => set('stock', e.target.value)} placeholder="50" />
            </div>
          </div>

          <div className="field">
            <label>Description</label>
            <textarea className="textarea" value={form.description} onChange={(e) => set('description', e.target.value)} placeholder="Tell buyers about your flowers - variety, size, freshness, occasion..." />
            <span className="form-hint">A good description helps your flower sell faster.</span>
          </div>

          <div className="field">
            <label>Photos</label>
            <div className="row wrap">
              {form.images.map((img) => (
                <div key={img} style={{ position: 'relative', width: 120, height: 120, borderRadius: 12, overflow: 'hidden', border: '1px solid var(--gray-200)' }}>
                  <img src={imgSrc(img)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <button type="button" onClick={() => removeImage(img)} style={{ position: 'absolute', top: 4, right: 4, background: 'rgba(0,0,0,0.6)', color: '#fff', border: 'none', borderRadius: 50, width: 24, height: 24, fontSize: 12, cursor: 'pointer' }}>x</button>
                </div>
              ))}
              <label style={{ width: 120, height: 120, border: '1.5px dashed var(--gray-300)', borderRadius: 12, display: 'grid', placeItems: 'center', cursor: 'pointer', textAlign: 'center', fontSize: 13, color: 'var(--gray-500)' }}>
                {uploading ? <span>Uploading...</span> : <><IconImage size={20} /><span>{form.images.length ? 'Add more' : 'Add photo'}</span></>}
                <input type="file" accept="image/*" onChange={handleUpload} style={{ display: 'none' }} />
              </label>
            </div>
            <span className="form-hint">JPG or PNG up to 5MB. A clear photo helps buyers trust your listing.</span>
          </div>

          <div className="row">
            <button className="btn btn-primary btn-lg grow" type="submit" disabled={saving || uploading}>
              {saving ? 'Saving...' : editing ? 'Save changes' : 'Submit for approval'}
            </button>
            <Link to="/dashboard" className="btn btn-outline">Cancel</Link>
          </div>
        </div>
      </form>
    </div>
  );
}