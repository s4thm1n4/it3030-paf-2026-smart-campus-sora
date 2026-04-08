import { createContext, useContext, useState, useEffect } from 'react';
import authService from '../services/authService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Restore user from localStorage on mount
    // Wrapped in try/catch to handle any corrupted stored data
    try {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const parsed = JSON.parse(storedUser);
        setUser(parsed);
      }
    } catch (e) {
      // Bad data in localStorage — clear it and start fresh
      localStorage.removeItem('user');
      localStorage.removeItem('token');
    } finally {
      setLoading(false);
    }
  }, []);

  // Refresh user profile from backend to pick up role changes
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;
    authService.getProfile()
      .then((res) => {
        const { id, name, email, role, profilePictureUrl } = res.data;
        const fresh = { id, name, email, role, profilePictureUrl };
        localStorage.setItem('user', JSON.stringify(fresh));
        setUser(fresh);
      })
      .catch(() => {
        // token expired or invalid — clear auth
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
      });
  }, []);

  const login = async (googleCredential) => {
    const response = await authService.googleLogin(googleCredential);
    const { token, id, name, email, role, profilePictureUrl } = response.data;
    const userData = { id, name, email, role, profilePictureUrl };
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    return userData;
  };

  const logout = () => {
    authService.logout();
    setUser(null);
  };

  const isAdmin = () => user?.role === 'ADMIN';
  const isTechnician = () => user?.role === 'TECHNICIAN';
  const isManager = () => user?.role === 'MANAGER';
  const isStaff = () => ['ADMIN', 'TECHNICIAN', 'MANAGER'].includes(user?.role);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, isAdmin, isTechnician, isManager, isStaff }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
