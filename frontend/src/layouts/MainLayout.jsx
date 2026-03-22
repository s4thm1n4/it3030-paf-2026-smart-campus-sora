import { useState, useEffect, useCallback } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import notificationService from '../services/notificationService';
import Icon from '../components/common/Icon';

const navItems = [
  { path: '/',              label: 'DASHBOARD',     icon: 'dashboard' },
  { path: '/facilities',    label: 'FACILITIES',    icon: 'apartment' },
  { path: '/bookings',      label: 'BOOKINGS',      icon: 'calendar_month' },
  { path: '/tickets',       label: 'TICKETS',       icon: 'confirmation_number' },
  { path: '/notifications', label: 'NOTIFICATIONS', icon: 'notifications' },
];

const adminNav = [
  { path: '/admin', label: 'ADMIN PANEL', icon: 'admin_panel_settings' },
];

export default function MainLayout() {
  const { user, logout, isAdmin } = useAuth();
  const location = useLocation();
  const [unreadCount, setUnreadCount] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const fetchUnreadCount = useCallback(async () => {
    if (!user) return;
    try {
      const res = await notificationService.getUnreadCount();
      setUnreadCount(res.data.count);
    } catch {
      // non-critical
    }
  }, [user]);

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  useEffect(() => {
    if (location.pathname !== '/notifications') fetchUnreadCount();
  }, [location.pathname, fetchUnreadCount]);

  // Close mobile sidebar on navigation
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  const isActive = (path) => location.pathname === path;

  return (
    <div className="flex h-screen overflow-hidden bg-surface">
      {/* ── Mobile Overlay ── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── SIDEBAR ── */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-sidebar transition-transform duration-200 lg:static lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Sidebar Header / Brand */}
        <div className="flex h-14 items-center gap-3 border-b border-sidebar-border px-5">
          <div className="flex h-8 w-8 items-center justify-center bg-primary">
            <Icon name="hub" size={18} className="text-on-primary" />
          </div>
          <div className="flex flex-col">
            <span className="font-display text-xs font-bold tracking-widest text-sidebar-text-active">
              NODE_01
            </span>
            <span className="font-mono text-[10px] text-sidebar-text">
              CAMPUS_CORE
            </span>
          </div>
        </div>

        {/* Nav Links */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          <p className="label-caps mb-2 px-3 text-[10px] text-sidebar-text">
            MODULES
          </p>
          {navItems.map(({ path, label, icon }) => (
            <Link
              key={path}
              to={path}
              className={`group flex items-center gap-3 px-3 py-2.5 text-xs font-medium transition-colors ${
                isActive(path)
                  ? 'bg-sidebar-active text-sidebar-text-active border-l-2 border-primary'
                  : 'text-sidebar-text hover:bg-sidebar-hover hover:text-sidebar-text-active border-l-2 border-transparent'
              }`}
            >
              <Icon
                name={icon}
                size={18}
                filled={isActive(path)}
                className={isActive(path) ? 'text-primary' : 'text-sidebar-text group-hover:text-sidebar-text-active'}
              />
              <span className="tracking-wider">{label}</span>
              {icon === 'notifications' && unreadCount > 0 && (
                <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1.5 font-mono text-[10px] font-bold text-on-accent">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </Link>
          ))}

          {/* Admin section */}
          {isAdmin() && (
            <>
              <div className="my-3 border-t border-sidebar-border" />
              <p className="label-caps mb-2 px-3 text-[10px] text-sidebar-text">
                ADMIN
              </p>
              {adminNav.map(({ path, label, icon }) => (
                <Link
                  key={path}
                  to={path}
                  className={`group flex items-center gap-3 px-3 py-2.5 text-xs font-medium transition-colors ${
                    isActive(path)
                      ? 'bg-sidebar-active text-sidebar-text-active border-l-2 border-primary'
                      : 'text-sidebar-text hover:bg-sidebar-hover hover:text-sidebar-text-active border-l-2 border-transparent'
                  }`}
                >
                  <Icon
                    name={icon}
                    size={18}
                    filled={isActive(path)}
                    className={isActive(path) ? 'text-accent' : 'text-sidebar-text group-hover:text-sidebar-text-active'}
                  />
                  <span className="tracking-wider">{label}</span>
                </Link>
              ))}
            </>
          )}
        </nav>

        {/* Sidebar Footer — User */}
        <div className="border-t border-sidebar-border p-4">
          <div className="flex items-center gap-3">
            {user?.profilePictureUrl ? (
              <img
                src={user.profilePictureUrl}
                alt={user.name}
                className="h-8 w-8 object-cover border border-sidebar-border"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="flex h-8 w-8 items-center justify-center bg-sidebar-surface text-xs font-bold text-sidebar-text-active">
                {user?.name?.charAt(0) ?? '?'}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="truncate text-xs font-medium text-sidebar-text-active">
                {user?.name ?? 'User'}
              </p>
              <p className="truncate font-mono text-[10px] text-sidebar-text">
                {user?.role ?? 'STUDENT'}
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* ── RIGHT CONTENT COLUMN ── */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* ── TOPBAR ── */}
        <header className="flex h-14 items-center justify-between border-b border-cell-border bg-surface-container-lowest px-4 lg:px-6">
          {/* Mobile hamburger */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 text-on-surface-variant hover:text-on-surface lg:hidden"
          >
            <Icon name="menu" size={22} />
          </button>

          {/* Title */}
          <div className="hidden lg:flex items-center gap-2">
            <span className="font-display text-sm font-bold tracking-widest text-on-surface">
              CAMPUS_CORE_V1
            </span>
            <span className="font-mono text-[10px] text-outline">
              // Smart Campus Operations Hub
            </span>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-3">
            {/* Notification bell */}
            {user && (
              <Link
                to="/notifications"
                className={`relative p-2 transition-colors ${
                  isActive('/notifications')
                    ? 'bg-primary-container text-primary'
                    : 'text-on-surface-variant hover:text-primary hover:bg-surface-container-high'
                }`}
              >
                <Icon name="notifications" size={20} filled={isActive('/notifications')} />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 font-mono text-[9px] font-bold text-on-accent">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Link>
            )}

            {/* User name + logout */}
            {user ? (
              <div className="flex items-center gap-3">
                <span className="hidden sm:block font-display text-xs font-medium text-on-surface-variant">
                  {user.name}
                </span>
                <button
                  onClick={logout}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-error hover:bg-error-container transition-colors"
                >
                  <Icon name="logout" size={16} />
                  <span className="hidden sm:inline">LOGOUT</span>
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary-container transition-colors"
              >
                SIGN IN
              </Link>
            )}
          </div>
        </header>

        {/* ── PAGE CONTENT ── */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <Outlet />
        </main>

        {/* ── FOOTER STATUS BAR ── */}
        <footer className="flex h-8 items-center justify-between border-t border-cell-border bg-surface-container-lowest px-4 lg:px-6">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <span className="status-dot status-dot--ok" />
              <span className="font-mono text-[10px] text-outline">SYSTEM_STABLE</span>
            </div>
            <span className="font-mono text-[10px] text-outline-variant">
              UPTIME: 99.97%
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="font-mono text-[10px] text-outline-variant">
              LATENCY: 12ms
            </span>
            <span className="font-mono text-[10px] text-outline-variant">
              v1.0.0-PAF2026
            </span>
          </div>
        </footer>
      </div>
    </div>
  );
}
