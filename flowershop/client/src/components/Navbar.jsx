import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useCart } from '../context/CartContext.jsx';
import { IconCart, IconFlower } from './Icons.jsx';

export default function Navbar({ onToast }) {
  const { user, logout } = useAuth();
  const { count } = useCart();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const userRef = useRef(null);

  useEffect(() => {
    function onClick(e) {
      if (userRef.current && !userRef.current.contains(e.target)) setUserOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  function handleLogout() {
    logout();
    if (onToast) onToast('Signed out', 'success');
    setUserOpen(false);
    navigate('/');
  }

  const navItems = [
    { to: '/', label: 'Home' },
    { to: '/shop', label: 'Shop' },
    { to: '/graph', label: 'Graph' },
  ];

  return (
    <header className="header">
      <nav className={`nav${mobileOpen ? ' open' : ''}`}>
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) => (isActive ? 'active' : '')}
            onClick={() => setMobileOpen(false)}
          >
            {item.label}
          </NavLink>
        ))}
      </nav>

      <Link to="/" className="logo">
        <span className="logo-flower"><IconFlower size={28} /></span>
        PETALBLOOM
      </Link>

      <div className="header-icons">
        <Link to="/cart" className="cart-link" aria-label="Cart">
          <IconCart size={20} />
          {count > 0 && <span className="cart-count">{count}</span>}
        </Link>
        {user ? (
          <div className="user-menu" ref={userRef}>
            <button className="btn-user" onClick={() => setUserOpen((o) => !o)}>
              {user.username}
            </button>
            {userOpen && (
              <div className="user-dropdown">
                <Link to={user.role === 'admin' ? '/admin' : '/dashboard'} onClick={() => setUserOpen(false)}>
                  {user.role === 'admin' ? 'Admin Panel' : 'My Shop'}
                </Link>
                <button onClick={handleLogout}>Sign out</button>
              </div>
            )}
          </div>
        ) : (
          <>
            <Link to="/login" className="btn-login">Sign in</Link>
            <Link to="/register" className="btn-register">Sell flowers</Link>
          </>
        )}
      </div>

      <button className="menu-btn" onClick={() => setMobileOpen((o) => !o)} aria-label="Menu">
        ☰
      </button>
    </header>
  );
}
