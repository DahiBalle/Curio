import React from 'react';
import { LoginForm } from '../components/LoginForm';
import { useLogin } from '../hooks/useLogin';

export function LoginPage({ onLoginComplete }) {
  const { isSubmitting, handleLoginSubmit } = useLogin(onLoginComplete);

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      width: '100%',
      backgroundColor: 'var(--bg)',
      transition: 'background-color 0.3s ease'
    }}>
      <LoginForm
        onLoginComplete={handleLoginSubmit}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}
