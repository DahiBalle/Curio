import { useState } from 'react';
import { EmailForm } from '../components/EmailForm';
import { PasswordForm } from '../components/PasswordForm';
import { ConfirmPasswordForm } from '../components/ConfirmPasswordForm';

export function SignupPage({ onSignupComplete }) {
  const [step, setStep] = useState('email');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(false);

  const handleEmailContinue = (validEmail) => {
    setEmail(validEmail);
    setStep('password');
  };

  const handlePasswordContinue = (validPassword) => {
    setPassword(validPassword);
    setStep('confirmPassword');
  };

  const handleConfirmSubmit = (data) => {
    if (onSignupComplete) {
      onSignupComplete(data);
    } else {
      alert(`Success! Account created for ${data.email}.`);
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
