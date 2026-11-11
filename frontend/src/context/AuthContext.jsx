import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(authService.getStoredUser());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verifyAuth = async () => {
      if (authService.isAuthenticated()) {
        try {
          const userData = await authService.getCurrentUser();
          setUser(userData);
          localStorage.setItem('papermind_user', JSON.stringify(userData));
        } catch (error) {
          console.error("Auth check failed:", error);
          authService.logout();
          setUser(null);
        }
      }
      setLoading(false);
    };

    verifyAuth();
  }, []);

  const login = async (email, password) => {
    const data = await authService.login(email, password);
    setUser(data.user);
    return data;
  };

  const register = async (email, password, fullName) => {
    const data = await authService.register(email, password, fullName);
    return data;
  };

  const logout = () => {
    authService.logout();
    setUser(null);
  };

  const quickDemoLogin = async () => {
    return login("researcher@papermind.ai", "ResearchPass2026!");
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, quickDemoLogin }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
