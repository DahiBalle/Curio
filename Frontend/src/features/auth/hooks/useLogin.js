import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../api/authApi';
import { useAuth } from '../../../context/AuthContext';

export function useLogin(onLoginComplete) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleLoginSubmit = async (credentials) => {
    const loginEmail = credentials?.email || email;
    const loginPassword = credentials?.password || password;

    setIsSubmitting(true);
    setError(null);
    try {
      const response = await authApi.login({ email: loginEmail, password: loginPassword });

      if (response && response.token) {
        login(response.token, response.user);
        if (onLoginComplete) {
          onLoginComplete(response);
        } else {
          navigate('/');
        }
      }
      return response;
    } catch (err) {
      console.error('Login failed', err);
      const message = err?.response?.data?.error
        || err?.response?.data?.detail
        || 'Login failed. Please check your credentials.';
      setError(message);
      alert(message);
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    email,
    setEmail,
    password,
    setPassword,
    isSubmitting,
    error,
    handleLoginSubmit
  };
}
