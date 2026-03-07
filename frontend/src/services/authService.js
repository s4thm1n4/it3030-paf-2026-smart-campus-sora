import api from './api';

const authService = {
  googleLogin: (credential) => api.post('/auth/google', { credential }),
  getProfile: () => api.get('/auth/me'),
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },
};

export default authService;
