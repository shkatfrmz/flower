import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useApi } from '../hooks/useApi.jsx';
import { toast } from 'react-hot-toast';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { apiGet, apiDelete } = useApi();

  if (!user) {
    navigate('/login');
    return null;
  }

  useEffect(() => {
    async function loadProducts() {
      try {
        const res = await apiGet(`/users/${user.id}/products`);
        setProducts(res.data);
      } catch (err) {
        toast.error('Failed to load your products');
      } finally {
        setLoading(false);
      }
    }
    loadProducts();
  }, [apiGet, user.id, toast]);

  async function handleDelete(productId) {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    try {
      await apiDelete(`/products/${productId}`);
      setProducts(products.filter(p => p.id !== productId));
      toast.success('Product deleted');
    } catch (err) {
      toast.error('Failed to delete product');
    }
  }

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="dashboard">
      <h1 className="dashboard-title">Hello, {user.username}! 👋</h1>
      <p className="dashboard-subtitle">Manage your flower products below</p>
      <Link to="/products/new" className="btn-primary">
        + Add New Product
      </Link>
      {products.length === 0 ? (
        <p className="empty-state">
          You haven't added any products yet. Click the button above to get started!
        </p>
      ) : (
        <div className="product-list">
          {products.map((product) => (
                <div key={product.id} className="product-card">
                  <img src={product.image} alt={product.name} className="product-image" />
                  <div className="product-info">
                    <h3 className="product-name">{product.name}</h3>
                    <p className="product-price">$${product.price}</p>
                    <p className="product-stock">Stock: {product.stock}</p>
                    <span className={`badge ${product.isApproved ? 'approved' : 'pending'}`}>
                      {product.isApproved ? 'Approved' : 'Pending Approval'}
                    </span>
                  </div>
                  <div className="product-actions">
                    <Link to={`/products/${product.id}/edit`} className="btn-link">Edit</Link>
                    <button onClick={() => handleDelete(product.id)} className="btn-link delete">Delete</button>
                  </div>
                </div>
            ))}
        </div>
      )}
    </div>
  );
}