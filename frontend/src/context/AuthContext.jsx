import { createContext, useContext, useState, useEffect } from 'react';
import api from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(undefined); // undefined = loading
  const [loading, setLoading] = useState(true);
  const [isGuest, setIsGuest] = useState(() => sessionStorage.getItem('isGuest') === 'true');

  useEffect(() => {
    // On mount: try to restore session via refresh token cookie
    api
      .post('/auth/refresh')
      .then((res) => {
        window.__accessToken = res.data.accessToken;
        return api.get('/auth/me');
      })
      .then((res) => setUser(res.data.user))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const login = async (email, password) => {
    sessionStorage.removeItem('isGuest');
    setIsGuest(false);
    const res = await api.post('/auth/login', { email, password });
    window.__accessToken = res.data.accessToken;
    setUser(res.data.user);
    return res.data.user;
  };

  const register = async (email, password) => {
    sessionStorage.removeItem('isGuest');
    setIsGuest(false);
    const res = await api.post('/auth/register', { email, password });
    window.__accessToken = res.data.accessToken;
    setUser(res.data.user);
    return res.data.user;
  };

  const logout = async () => {
    await api.post('/auth/logout').catch(() => {});
    window.__accessToken = null;
    setUser(null);
  };

  const enterAsGuest = () => {
    sessionStorage.setItem('isGuest', 'true');
    setIsGuest(true);
  };

  const exitGuest = () => {
    sessionStorage.removeItem('isGuest');
    setIsGuest(false);
  };

  return (
    <AuthContext.Provider value={{ user, loading, isGuest, login, register, logout, enterAsGuest, exitGuest }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
