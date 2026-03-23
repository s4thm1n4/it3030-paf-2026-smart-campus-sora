import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import MainLayout from './layouts/MainLayout';
import ProtectedRoute from './components/common/ProtectedRoute';

// Pages
import HomePage from './pages/Home/HomePage';
import LoginPage from './pages/Login/LoginPage';
import FacilitiesPage from './pages/Facilities/FacilitiesPage';
import BookingsPage from './pages/Bookings/BookingsPage';
import TicketsPage from './pages/Tickets/TicketsPage';
import TicketDetailPage from './pages/Tickets/TicketDetailPage';
import NotificationsPage from './pages/Notifications/NotificationsPage';
import AdminPage from './pages/Admin/AdminPage';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="top-right" />
        <Routes>
          {/* Public */}
          <Route path="/login" element={<LoginPage />} />

          {/* Protected — wrapped in MainLayout (navbar + footer) */}
          <Route element={<MainLayout />}>
            <Route path="/" element={<HomePage />} />

            <Route path="/facilities" element={
              <ProtectedRoute><FacilitiesPage /></ProtectedRoute>
            } />

            <Route path="/bookings" element={
              <ProtectedRoute><BookingsPage /></ProtectedRoute>
            } />

            <Route path="/tickets" element={
              <ProtectedRoute><TicketsPage /></ProtectedRoute>
            } />

            <Route path="/tickets/:id" element={
              <ProtectedRoute><TicketDetailPage /></ProtectedRoute>
            } />

            <Route path="/notifications" element={
              <ProtectedRoute><NotificationsPage /></ProtectedRoute>
            } />

            <Route path="/admin" element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <AdminPage />
              </ProtectedRoute>
            } />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
