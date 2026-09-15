import { useEffect, useState } from 'react';
import { NavLink, Route, Routes } from 'react-router-dom';
import api from '../../api.js';
import AdminOverview from './AdminOverview.jsx';
import AdminProducts from './AdminProducts.jsx';
import AdminOrders from './AdminOrders.jsx';
import AdminUsers from './AdminUsers.jsx';
import AdminCategories from './AdminCategories.jsx';
import { IconBox, IconChart, IconGrid, IconTag, IconUsers } from '../../components/Icons.jsx';

export default function Admin({ onToast }) {
  const [pending, setPending] = useState(0);

  useEffect(() => {
    api.get('/admin/stats').then((r) => setPending(r.data.stats.pendingProducts)).catch(() => {});
  }, []);

  const menu = [
    { to: '/admin', label: 'Overview', icon: <IconChart size={16} />, end: true },
    { to: '/admin/products', label: pending ? `Products (${pending})` : 'Products', icon: <IconGrid size={16} /> },
    { to: '/admin/orders', label: 'Orders', icon: <IconBox size={16} /> },
    { to: '/admin/users', label: 'Users', icon: <IconUsers size={16} /> },
    { to: '/admin/categories', label: 'Categories', icon: <IconTag size={16} /> },
  ];

  return (
    <div className="page container">
      <div className="dash-layout">
        <nav className="side-nav card card-pad" style={{ position: 'sticky', top: 88 }}>
          {menu.map((m) => (
            <NavLink key={m.to} to={m.to} end={m.end} className={({ isActive }) => (isActive ? 'active' : '')}>
              {m.icon} {m.label}
            </NavLink>
          ))}
        </nav>

        <div>
          <h1 className="page-title">Admin panel</h1>
          <p className="page-sub">Full control over the PetalBloom marketplace.</p>
          <Routes>
            <Route index element={<AdminOverview onToast={onToast} />} />
            <Route path="products" element={<AdminProducts onToast={onToast} />} />
            <Route path="orders" element={<AdminOrders onToast={onToast} />} />
            <Route path="users" element={<AdminUsers onToast={onToast} />} />
            <Route path="categories" element={<AdminCategories onToast={onToast} />} />
          </Routes>
        </div>
      </div>
    </div>
  );
}