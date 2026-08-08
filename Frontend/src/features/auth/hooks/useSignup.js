import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../api/authApi';
import { useAuth } from '../../../context/AuthContext';

export function useSignup(onSignupComplete) {
  const [step, setStep] = useState('email');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleEmailContinue = (validEmail) => {
    setEmail(validEmail);
    setStep('password');
  };

  const handlePasswordContinue = (validPassword) => {
    setPassword(validPassword);
    setStep('confirmPassword');
  };

  const handleConfirmSubmit = async (data) => {
    setIsSubmitting(true);
    setError(null);
    try {
      const response = await authApi.signup({
        email: data.email || email,
        password: data.password || password
      });

      if (response && response.token) {
        login(response.token, response.user);
        
        if (onSignupComplete) {
          onSignupComplete(data);
        } else {
          navigate('/onboarding');
        }
      }
    } catch (err) {
      console.error('Signup failed', err);
      const message = err?.response?.data?.error
        || err?.response?.data?.detail
        || (typeof err?.response?.data === 'string' ? err.response.data : null)
        || 'Signup failed. Please try again.';
      setError(message);
      alert(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    step,
    setStep,
    email,
    password,
    isSubmitting,
    error,
    handleEmailContinue,
    handlePasswordContinue,
    handleConfirmSubmit
  };
}
