import axios from 'axios';

const api = axios.create({ baseURL: '/api' });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('pb_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response && err.response.status === 401) {
      localStorage.removeItem('pb_token');
      localStorage.removeItem('pb_user');
    }
    return Promise.reject(err);
  }
);

export function authHeaders() {
  const token = localStorage.getItem('pb_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export function imgSrc(keyOrUrl) {
  if (!keyOrUrl) return '/img/default';
  return keyOrUrl.startsWith('http') || keyOrUrl.startsWith('/') ? keyOrUrl : `/img/${keyOrUrl}`;
}

export default api;