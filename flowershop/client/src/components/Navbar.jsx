import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useCart } from '../context/CartContext.jsx';
import { IconCart, IconFlower, IconLogout, IconUser } from './Icons.jsx';

export default function Navbar({ onToast }) {
  const { user, logout } = useAuth();
  const { count } = useCart();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    function onClick(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  function handleLogout() {
    logout();
    onToast('Signed out', 'success');
    navigate('/');
  }

  const navItems = [
    { to: '/', label: 'Home' },
    { to: '/shop', label: 'Shop' },
    { to: '/graph', label: 'Graph' },
  ];
  if (user) {
    navItems.push({ to: user.role === 'admin' ? '/admin' : '/dashboard', label: user.role === 'admin' ? 'Admin' : 'My Shop' });
  }

  return (
    <header className="header">
      {/* Left spacer */}
      <div className="header-left" />
      {/* Logo */}
      <div className="logo">
        <Link to="/" className="logo-link">
          <span className="logo-flower"><IconFlower size={32} /></span>
          PetalBloom
        </Link>
      </div>
      {/* Right side: nav, icons, menu button */}
      <div className="header-right">
        {/* Desktop nav */}
        <nav className="nav">
          {navItems.map((item) => (
            <NavLink key={item.to} to={item.to} className={({ isActive }) => (isActive ? 'active' : '')} end={item.to === '/'}>
              {item.label}
            </NavLink>
          ))}
          {user && (
            <>
              <NavLink to={user.role === 'admin' ? '/admin' : '/dashboard'} className="nav-link">
                {user.role === 'admin' ? 'Admin' : 'My Shop'}
              </NavLink>
            </>
          )}
        </nav>
        {/* Icons: cart and user */}
        <div className="header-icons">
          <Link to="/cart" className="icon-link cart-link" aria-label="Cart">
            <IconCart size={18} />
            {count > 0 && <span className="cart-count">{count}</span>}
          </Link>
          {user ? (
            <div className="user-menu" ref={menuRef}>
              <span className="avatar">{user.username.slice(0, 1).toUpperCase()}</span>
              <button className="btn-user" onClick={() => setMenuOpen((o) => !o)}>
                {user.username}
              </button>
              {menuOpen && (
                <div className="user-dropdown">
                  <Link to={user.role === 'admin' ? '/admin' : '/dashboard'} onClick={() => setMenuOpen(false)}>
                    {user.role === 'admin' ? 'Admin Panel' : 'My Shop'}
                  </Link>
                    <button onClick={() => {handleLogout(); setMenuOpen(false);}}>
                    Sign out
                  </button>
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
        {/* Mobile menu button */}
        <button className="menu-btn" onClick={() => setMenuOpen(!menuOpen)}>
          <IconFlower size={25} />
        </button>
      </div>
      {/* Mobile nav overlay */}
      {menuOpen && (
        <div className="mobile-nav-overlay" onClick={() => setMenuOpen(false)}>
          <nav className="mobile-nav">
            {navItems.map((item) => (
              <Link key={item.to} to={item.to} className="mobile-nav-link" end={item.to === '/'}>
                {item.label}
              </Link>
            ))}
            {user && (
              <>
                <Link to={user.role === 'admin' ? '/admin' : '/dashboard'} className="mobile-nav-link">
                  {user.role === 'admin' ? 'Admin Panel' : 'My Shop'}
                </Link>
                <button onClick={handleLogout} className="mobile-nav-link">
                  Sign out
                </button>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}