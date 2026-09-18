import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('agriowl_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('agriowl_access_token'));

  useEffect(() => {
    if (user) {
      localStorage.setItem('agriowl_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('agriowl_user');
    }
  }, [user]);

  const login = async (username, password) => {
    try {
      const res = await authApi.login({ username, password });
      if (res.data.success) {
        setUser(res.data.user);
        setToken(res.data.tokens.access);
        localStorage.setItem('agriowl_access_token', res.data.tokens.access);
        return { success: true, user: res.data.user };
      }
    } catch (err) {
      // Demo fallback if backend is offline
      if (username === 'admin' && password === 'AgriOwl2026!') {
        const adminUser = { username: 'admin', role: 'ADMIN', first_name: 'AgriOwl Admin' };
        setUser(adminUser);
        setToken('demo_admin_jwt_token');
        localStorage.setItem('agriowl_access_token', 'demo_admin_jwt_token');
        return { success: true, user: adminUser };
      }
      return { success: false, message: err.response?.data?.message || 'Login failed' };
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('agriowl_access_token');
    localStorage.removeItem('agriowl_user');
  };

  const isAdmin = user?.role === 'ADMIN' || user?.is_staff || user?.username === 'admin';

  return (
    <AuthContext.Provider value={{ user, token, isAdmin, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
