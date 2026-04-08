import axios from 'axios';

/**
 * Shared Axios instance for SORA UMS API.
 * - baseURL is proxied to localhost:8080 via Vite config
 * - Automatically attaches JWT token from localStorage
 * - Handles 401 responses (redirect to login)
 * - Timeout set to 15s to avoid hanging requests
 */
const api = axios.create({
  baseURL: '/api',
  timeout: 15000,
});

// ── Request interceptor: attach token ──
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
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response interceptor: handle auth errors ──
// NOTE: We do NOT hard-redirect on 401. The React auth context + ProtectedRoute
// handle redirecting to /login. A hard window.location.href would wipe React
// state mid-render and cause a login loop after sign-in.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Only clear credentials if the token that triggered the 401 matches
      // the currently stored token. This prevents a race condition where
      // a stale request from a previous session wipes the NEW token after re-login.
      const requestToken = error.config?.headers?.Authorization?.replace('Bearer ', '');
      const currentToken = localStorage.getItem('token');
      if (!currentToken || requestToken === currentToken) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    return Promise.reject(error);
  }
);

export default api;
