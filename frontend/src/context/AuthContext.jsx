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
    } catch {
      // Bad data in localStorage — clear it and start fresh
      localStorage.removeItem('user');
      localStorage.removeItem('token');
    } finally {
      setLoading(false);
    }
  }, []);

  // Keep React auth state in sync when API clears session (401) without a full reload
  useEffect(() => {
    const onSessionInvalid = () => setUser(null);
    window.addEventListener('auth:session-invalid', onSessionInvalid);
    return () => window.removeEventListener('auth:session-invalid', onSessionInvalid);
  }, []);

  const login = async (googleCredential) => {
    const response = await authService.googleLogin(googleCredential);
    const { token, id, name, email, role, profilePictureUrl } = response.data;
    if (!token || typeof token !== 'string' || token.length < 20) {
      throw new Error('Invalid login response from server');
    }
    localStorage.setItem('token', token);
    try {
      // Confirm JWT is accepted before setting user (avoids redirect to Tickets then immediate 401 loop).
      await authService.getProfile();
    } catch (e) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      throw e;
    }
    const userData = { id, name, email, role, profilePictureUrl };
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
  /** ADMIN, TECHNICIAN, or MANAGER — can see full ticket queue */
  const isStaff = () =>
    user?.role === 'ADMIN' || user?.role === 'TECHNICIAN' || user?.role === 'MANAGER';

  return (
    <AuthContext.Provider
      value={{ user, loading, login, logout, isAdmin, isTechnician, isManager, isStaff }}
    >
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
