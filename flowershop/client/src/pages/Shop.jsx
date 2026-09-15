import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useCart } from '../context/CartContext.jsx';
import ProductCard from '../components/ProductCard.jsx';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useApi } from '../hooks/useApi.jsx';

export default function Shop() {
  const { user } = useAuth();
  const { cart, addToCart } = useCart();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const { category } = useParams();
  const navigate = useNavigate();
  const { apiGet } = useApi();

  useEffect(() => {
    async function loadData() {
      try {
        const [productsRes, categoriesRes] = await Promise.all([
          apiGet('/products'),
          apiGet('/categories')
        ]);
        setProducts(productsRes.data);
        setCategories(categoriesRes.data);
      } catch (err) {
        toast.error('Failed to load shop data');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [apiGet]);

  const filteredProducts = category
    ? products.filter(p => p.category === decodeURIComponent(category))
    : products;

  const handleAddToCart = (product) => {
    if (product.stock <= 0) {
      toast.error('Out of stock');
      return;
    }
    const existing = cart.find(item => item.id === product.id);
    if (existing) {
      if (existing.quantity >= product.stock) {
        toast.error('Cannot add more than available stock');
        return;
      }
    }
    addToCart(product);
    toast.success('Added to cart');
  };

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <>
      <section className="category-section">
        <div className="category-grid">
          <Link to="/shop" className={`category-card ${!category ? 'active' : ''}`}>
            <span className="category-icon">🌸</span>
            <span className="category-label">All Flowers</span>
          </Link>
          {categories.map((cat) => (
            <Link
              key={cat.id}
              to={`/shop/${encodeURIComponent(cat.name)}`}
              className={`category-card ${category === cat.name ? 'active' : ''}`}
            >
              <span className="category-icon">{cat.icon || '🌺'}</span>
              <span className="category-label">{cat.name}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="products-section">
        <h2 className="section-title">{category ? `Flowers in ${category}` : 'Our Collection'}</h2>
        <div className="product-grid">
          {filteredProducts.length === 0 ? (
            <p className="no-products">No products found in this category.</p>
          ) : (
            filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onAddToCart={handleAddToCart}
                showAddToCart={!user || user.role !== 'admin'}
              />
            ))
          )}
        </div>
      </section>
    </>
  );
}