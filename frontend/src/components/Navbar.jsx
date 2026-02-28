import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useBag } from '../context/BagContext';
import api from '../api';
import './Navbar.css';

export default function Navbar() {
  const { user, logout, isGuest, exitGuest } = useAuth();
  const { bagCount } = useBag();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [newOrdersCount, setNewOrdersCount] = useState(0);
  const [newRepliesCount, setNewRepliesCount] = useState(0);
  const [repliedIds, setRepliedIds] = useState([]);

  useEffect(() => {
    if (!user || user.role !== 'admin') return;
    const fetchUnread = () =>
      api.get('/contact/admin/unread-count')
        .then(r => setUnreadMessages(r.data.unread))
        .catch(() => {});
    fetchUnread();
    const interval = setInterval(fetchUnread, 60_000);
    return () => clearInterval(interval);
  }, [user]);

  useEffect(() => {
    if (!user || user.role !== 'admin') return;
    const fetchOrderCount = () =>
      api.get('/orders/admin/unread-count')
        .then(r => setNewOrdersCount(r.data.count))
        .catch(() => {});
    fetchOrderCount();
    const interval = setInterval(fetchOrderCount, 60_000);
    return () => clearInterval(interval);
  }, [user]);

  useEffect(() => {
    if (pathname === '/admin/messages') setUnreadMessages(0);
    if (pathname === '/admin/orders') setNewOrdersCount(0);
  }, [pathname]);

  useEffect(() => {
    if (!user || user.role !== 'client') return;
    const fetchReplied = () =>
      api.get('/contact/mine/replied-ids')
        .then(r => setRepliedIds(r.data.ids))
        .catch(() => {});
    fetchReplied();
    const interval = setInterval(fetchReplied, 60_000);
    return () => clearInterval(interval);
  }, [user]);

  useEffect(() => {
    if (!user || user.role !== 'client') return;
    setNewRepliesCount(repliedIds.length);
  }, [repliedIds, pathname, user]);

  useEffect(() => {
    if (!user || user.role !== 'client') return;
    const handler = (e) => {
      if (e.detail?.all) {
        setNewRepliesCount(0);
        setRepliedIds([]);
      } else {
        setNewRepliesCount(prev => Math.max(0, prev - 1));
      }
    };
    window.addEventListener('replies-seen', handler);
    return () => window.removeEventListener('replies-seen', handler);
  }, [user]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const isActive = (path) => pathname === path;

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="navbar-logo">
          <span className="logo-icon">☕</span>
          <span className="logo-text">Bean <em>&amp;</em> Brew</span>
        </Link>

        <div className="navbar-links">
          {(user || isGuest) && (
            <Link to="/" className={`nav-link ${isActive('/') ? 'active' : ''}`}>Home</Link>
          )}
          {user && user.role === 'client' && (
            <Link to="/contact" className={`nav-link ${isActive('/contact') ? 'active' : ''}`}>Contact</Link>
          )}

          {user && user.role === 'admin' && (
            <>
              <Link to="/admin" className={`nav-link ${isActive('/admin') ? 'active' : ''}`}>
                Inventory
              </Link>
              <Link to="/admin/orders" className={`nav-link nav-messages ${isActive('/admin/orders') ? 'active' : ''}`}>
                Orders
                {newOrdersCount > 0 && <span className="bag-badge">{newOrdersCount}</span>}
              </Link>
              <Link to="/admin/messages" className={`nav-link nav-messages ${isActive('/admin/messages') ? 'active' : ''}`}>
                Messages
                {unreadMessages > 0 && <span className="bag-badge">{unreadMessages}</span>}
              </Link>
            </>
          )}

          {user && user.role === 'client' && (
            <>
              <Link to="/shop" className={`nav-link ${isActive('/shop') ? 'active' : ''}`}>
                Shop
              </Link>
              <Link to="/history" className={`nav-link ${isActive('/history') ? 'active' : ''}`}>
                My Orders
              </Link>
              <Link to="/messages" className={`nav-link nav-messages ${isActive('/messages') ? 'active' : ''}`}>
                My Messages
                {newRepliesCount > 0 && <span className="bag-badge">{newRepliesCount}</span>}
              </Link>
              <Link to="/bag" className={`nav-link nav-bag ${isActive('/bag') ? 'active' : ''}`}>
                🛒 Cart
                {bagCount > 0 && <span className="bag-badge">{bagCount}</span>}
              </Link>
            </>
          )}

          {user && (
            <div className="nav-user">
              <span className="nav-email">{user.email}</span>
              <span className={`tag tag-${user.role}`}>{user.role}</span>
              <button className="btn btn-ghost btn-sm" onClick={handleLogout}>
                Sign Out
              </button>
            </div>
          )}

          {isGuest && (
            <>
              <Link to="/shop" className={`nav-link ${isActive('/shop') ? 'active' : ''}`}>Shop</Link>
              <Link to="/bag" className={`nav-link nav-bag ${isActive('/bag') ? 'active' : ''}`}>
                🛒 Cart
                {bagCount > 0 && <span className="bag-badge">{bagCount}</span>}
              </Link>
              <div className="nav-user">
                <span className="nav-email">Guest</span>
                <button className="btn btn-ghost btn-sm" onClick={() => { exitGuest(); navigate('/login'); }}>
                  Sign In
                </button>
                <Link to="/register" className="btn btn-primary btn-sm" onClick={exitGuest}>Register</Link>
              </div>
            </>
          )}

        </div>
      </div>
    </nav>
  );
}
