import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { BagProvider } from './context/BagContext';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import CookieBanner from './components/CookieBanner';

import HomePage     from './pages/HomePage';
import LoginPage    from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ShopPage     from './pages/ShopPage';
import BagPage      from './pages/BagPage';
import CheckoutPage from './pages/CheckoutPage';
import HistoryPage  from './pages/HistoryPage';
import AdminPage    from './pages/AdminPage';
import AdminMessagesPage from './pages/AdminMessagesPage';
import AdminOrdersPage  from './pages/AdminOrdersPage';
import ContactPage     from './pages/ContactPage';
import MyMessagesPage from './pages/MyMessagesPage';

function AppRoutes() {
  const { user, loading, isGuest } = useAuth();

  return (
    <>
      <Navbar />
      <Routes>
        {/* Public */}
        <Route path="/" element={
          loading ? null :
          (!user && !isGuest ? <Navigate to="/login" replace /> : <HomePage />)
        } />
        <Route path="/login"    element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/contact"  element={<ContactPage />} />

        {/* Client-only (guests can browse shop and bag) */}
        <Route path="/shop" element={
          <ProtectedRoute role="client" allowGuest><ShopPage /></ProtectedRoute>
        } />
        <Route path="/bag" element={
          <ProtectedRoute role="client" allowGuest><BagPage /></ProtectedRoute>
        } />
        <Route path="/checkout" element={
          <ProtectedRoute role="client" allowGuest><CheckoutPage /></ProtectedRoute>
        } />
        <Route path="/history" element={
          <ProtectedRoute role="client"><HistoryPage /></ProtectedRoute>
        } />
        <Route path="/messages" element={
          <ProtectedRoute role="client"><MyMessagesPage /></ProtectedRoute>
        } />

        {/* Admin-only */}
        <Route path="/admin" element={
          <ProtectedRoute role="admin"><AdminPage /></ProtectedRoute>
        } />
        <Route path="/admin/messages" element={
          <ProtectedRoute role="admin"><AdminMessagesPage /></ProtectedRoute>
        } />
        <Route path="/admin/orders" element={
          <ProtectedRoute role="admin"><AdminOrdersPage /></ProtectedRoute>
        } />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <CookieBanner />
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <BagProvider>
          <AppRoutes />
        </BagProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
