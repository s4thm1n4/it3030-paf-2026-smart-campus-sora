import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth();

  // While AuthContext is restoring user from localStorage, show spinner
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  // Fallback: check localStorage directly in case React state hasn't caught up yet
  const hasToken = !!localStorage.getItem('token');
  const storedUser = (() => {
    try { return JSON.parse(localStorage.getItem('user')); } catch { return null; }
  })();

  const resolvedUser = user || storedUser;

  if (!resolvedUser || !hasToken) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(resolvedUser.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
}
