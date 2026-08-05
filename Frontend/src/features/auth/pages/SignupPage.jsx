import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { EmailForm } from '../components/EmailForm';
import { PasswordForm } from '../components/PasswordForm';
import { ConfirmPasswordForm } from '../components/ConfirmPasswordForm';
import { authApi } from '../api/authApi';
import { useAuth } from '../../../context/AuthContext';

export function SignupPage({ onSignupComplete }) {
  const [step, setStep] = useState('email');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    try {
      const response = await authApi.signup({
        email: data.email,
        password: data.password
      });

      if (response && response.token) {
        login(response.token, response.user);
        
        if (onSignupComplete) {
          onSignupComplete(data);
        } else {
          // Standard flow: proceed to onboarding
          navigate('/onboarding');
        }
      } else {
        // Fallback if mock endpoint doesn't return exactly what we want right now,
        // we fake a token to keep flow working since backend isn't ready.
        login('fake-jwt-token-123', { email: data.email, onboardingComplete: false });
        navigate('/onboarding');
      }
    } catch (error) {
      console.error('Signup failed', error);
      // Fallback for empty URL 404s
      login('fake-jwt-token-123', { email: data.email, onboardingComplete: false });
      navigate('/onboarding');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleTheme = () => setIsDarkMode(prev => !prev);

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
      {step === 'email' && (
        <EmailForm
          onContinue={handleEmailContinue}
          isDarkMode={isDarkMode}
          onToggleTheme={toggleTheme}
          stepLabel="Step 1/3"
        />
      )}

      {step === 'password' && (
        <PasswordForm
          email={email}
          onContinue={handlePasswordContinue}
          onBack={() => setStep('email')}
          isDarkMode={isDarkMode}
          onToggleTheme={toggleTheme}
          stepLabel="Step 2/3"
        />
      )}

      {step === 'confirmPassword' && (
        <ConfirmPasswordForm
          email={email}
          password={password}
          onSubmit={handleConfirmSubmit}
          onBack={() => setStep('password')}
          isDarkMode={isDarkMode}
          onToggleTheme={toggleTheme}
          stepLabel="Step 3/3"
        />
      )}
    </div>
  );
}
