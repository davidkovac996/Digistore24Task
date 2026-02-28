import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  withCredentials: true, // send cookies (refresh token)
});

// Attach access token from memory on every request
api.interceptors.request.use((config) => {
  const token = window.__accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auto-refresh access token on 401
let refreshing = null;
api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config;
    if (
      err.response?.status === 401 &&
      !original._retry &&
      !original.url?.includes('/auth/')
    ) {
      original._retry = true;
      if (!refreshing) {
        refreshing = axios
          .post('/api/auth/refresh', {}, { withCredentials: true })
          .then((r) => {
            window.__accessToken = r.data.accessToken;
            refreshing = null;
          })
          .catch(() => {
            window.__accessToken = null;
            refreshing = null;
            window.location.href = '/login';
          });
      }
      await refreshing;
      original.headers.Authorization = `Bearer ${window.__accessToken}`;
      return api(original);
    }
    return Promise.reject(err);
  }
);

export default api;
