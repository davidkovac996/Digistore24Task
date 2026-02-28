import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children, role, allowGuest }) {
  const { user, loading, isGuest } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '8rem' }}>
        <span
          className="spinner"
          style={{ width: 36, height: 36, borderWidth: 3, color: 'var(--caramel)' }}
        />
      </div>
    );
  }

  if (allowGuest && isGuest) return children;
  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) {
    return <Navigate to={user.role === 'admin' ? '/admin' : '/shop'} replace />;
  }

  return children;
}
