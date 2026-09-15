import { createContext, useContext, useEffect, useState } from 'react';
import api from '../api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('pb_user')); } catch { return null; }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('pb_token');
    if (!token) { setLoading(false); return; }
    api.get('/auth/me')
      .then((res) => { setUser(res.data.user); localStorage.setItem('pb_user', JSON.stringify(res.data.user)); })
      .catch(() => { localStorage.removeItem('pb_token'); localStorage.removeItem('pb_user'); setUser(null); })
      .finally(() => setLoading(false));
  }, []);

  async function login(username, password) {
    const res = await api.post('/auth/login', { username, password });
    localStorage.setItem('pb_token', res.data.token);
    localStorage.setItem('pb_user', JSON.stringify(res.data.user));
    setUser(res.data.user);
    return res.data.user;
  }

  async function register(username, email, password) {
    const res = await api.post('/auth/register', { username, email, password });
    localStorage.setItem('pb_token', res.data.token);
    localStorage.setItem('pb_user', JSON.stringify(res.data.user));
    setUser(res.data.user);
    return res.data.user;
  }

  function logout() {
    localStorage.removeItem('pb_token');
    localStorage.removeItem('pb_user');
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, setUser, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}