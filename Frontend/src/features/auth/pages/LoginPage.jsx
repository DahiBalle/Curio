import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LoginForm } from '../components/LoginForm';
import { authApi } from '../api/authApi';
import { useAuth } from '../../../context/AuthContext';

export function LoginPage({ onLoginComplete }) {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const navigate = useNavigate();
  const { login } = useAuth();

  const toggleTheme = () => setIsDarkMode(prev => !prev);

  const handleLoginComplete = async ({ email, password }) => {
    setIsSubmitting(true);
    try {
      const response = await authApi.login({ email, password });

      if (response && response.token) {
        login(response.token, response.user);
        navigate('/');
      }
    } catch (error) {
      console.error('Login failed', error);
      const message = error?.response?.data?.error
        || error?.response?.data?.detail
        || 'Login failed. Please check your credentials.';
      alert(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      width: '100%',
      backgroundColor: isDarkMode ? '#1a202c' : '#f7fafc',
      transition: 'background-color 0.3s ease'
    }}>
      <LoginForm
        onLoginComplete={onLoginComplete || handleLoginComplete}
        isDarkMode={isDarkMode}
        onToggleTheme={toggleTheme}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}
