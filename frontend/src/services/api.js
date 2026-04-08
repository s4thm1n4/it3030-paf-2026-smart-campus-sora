import axios from 'axios';

/**
 * Shared Axios instance.
 * - baseURL is proxied to localhost:8080 via Vite config
 * - Automatically attaches JWT token from localStorage
 * - Handles 401 responses (redirect to login)
 */
const api = axios.create({
  baseURL: '/api',
});

// ── Request interceptor: attach token + Content-Type ──
api.interceptors.request.use(
  (config) => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (e) {
      // localStorage not available — skip
    }
    // For FormData let the browser set Content-Type with the correct multipart boundary.
    // For everything else default to JSON.
    if (!(config.data instanceof FormData)) {
      config.headers['Content-Type'] = 'application/json';
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response interceptor: handle auth errors ──
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const url = (error.config?.url || '').toString();
      const isGoogleLoginPost = url.includes('/auth/google');

      localStorage.removeItem('token');
      localStorage.removeItem('user');
      try {
        window.dispatchEvent(new CustomEvent('auth:session-invalid'));
      } catch {
        /* ignore */
      }

      // Don't hard-redirect when already on login (avoids a confusing reload loop).
      // Don't redirect on failed Google token exchange — user is already on login.
      const onLoginPage = window.location.pathname === '/login';
      if (!isGoogleLoginPost && !onLoginPage) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
