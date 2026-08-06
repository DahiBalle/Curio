import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../features/auth/api/authApi';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const userData = await authApi.getMe();
          setUser(userData);
        } catch (error) {
          console.error('Failed to verify token', error);
          localStorage.removeItem('token');
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = (token, userData) => {
    localStorage.setItem('token', token);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  const completeOnboarding = async () => {
    try {
      const userData = await authApi.getMe();
      setUser(userData);
    } catch (error) {
      console.error('Failed to refresh user after onboarding', error);
      setUser(prev => prev ? { ...prev, onboardingComplete: true } : prev);
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, completeOnboarding }}>
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
