import { useState, useEffect, useCallback } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import notificationService from '../services/notificationService';
import {
  HiOutlineHome,
  HiOutlineBuildingOffice2,
  HiOutlineCalendarDays,
  HiOutlineWrenchScrewdriver,
  HiOutlineBell,
} from 'react-icons/hi2';

const navItems = [
  { path: '/', label: 'Home', icon: HiOutlineHome },
  { path: '/facilities', label: 'Facilities', icon: HiOutlineBuildingOffice2 },
  { path: '/bookings', label: 'Bookings', icon: HiOutlineCalendarDays },
  { path: '/tickets', label: 'Tickets', icon: HiOutlineWrenchScrewdriver },
];

export default function MainLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchUnreadCount = useCallback(async () => {
    if (!user) return;
    try {
      const res = await notificationService.getUnreadCount();
      setUnreadCount(res.data.count);
    } catch {
      // silently fail — badge is non-critical
    }
  }, [user]);

  // Poll unread count every 30 seconds
  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  // Refresh count when navigating away from notifications page
  useEffect(() => {
    if (location.pathname !== '/notifications') {
      fetchUnreadCount();
    }
  }, [location.pathname, fetchUnreadCount]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Top Navbar ── */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            {/* Logo */}
            <div className="flex items-center">
              <Link to="/" className="text-xl font-bold text-indigo-600">
                Smart Campus
              </Link>
            </div>

            {/* Nav Links */}
            <div className="hidden sm:flex sm:items-center sm:space-x-4">
              {navItems.map(({ path, label, icon: Icon }) => (
                <Link
                  key={path}
                  to={path}
                  className={`flex items-center gap-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    location.pathname === path
                      ? 'bg-indigo-50 text-indigo-700'
                      : 'text-gray-600 hover:text-indigo-600 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </Link>
              ))}
            </div>

            {/* Bell + User Menu */}
            <div className="flex items-center gap-4">
              {/* Notification Bell */}
              {user && (
                <Link
                  to="/notifications"
                  className={`relative p-2 rounded-md transition-colors ${
                    location.pathname === '/notifications'
                      ? 'bg-indigo-50 text-indigo-700'
                      : 'text-gray-500 hover:text-indigo-600 hover:bg-gray-50'
                  }`}
                >
                  <HiOutlineBell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </Link>
              )}

              {user ? (
                <>
                  <span className="text-sm text-gray-600">
                    {user.name}
                  </span>
                  <button
                    onClick={logout}
                    className="text-sm text-red-500 hover:text-red-700 font-medium"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <Link to="/login" className="text-sm text-indigo-600 font-medium">
                  Sign In
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* ── Page Content ── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
    </div>
  );
}
