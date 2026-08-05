import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export const ProtectedRoute = ({ children }) => {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#0b1416', color: '#f5f5f5' }}>Loading...</div>;
  }

  if (!user) {
    // Redirect to signup if not logged in
    return <Navigate to="/signup" state={{ from: location }} replace />;
  }

  if (user && !user.onboardingComplete && location.pathname !== '/onboarding') {
    // Redirect to onboarding if not complete
    return <Navigate to="/onboarding" replace />;
  }

  return children;
};
