import React from 'react';
import { EmailForm } from '../components/EmailForm';
import { PasswordForm } from '../components/PasswordForm';
import { ConfirmPasswordForm } from '../components/ConfirmPasswordForm';
import { useSignup } from '../hooks/useSignup';

export function SignupPage({ onSignupComplete }) {
  const {
    step,
    setStep,
    email,
    password,
    handleEmailContinue,
    handlePasswordContinue,
    handleConfirmSubmit
  } = useSignup(onSignupComplete);

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
      {step === 'email' && (
        <EmailForm
          onContinue={handleEmailContinue}
          stepLabel="Step 1/3"
        />
      )}

      {step === 'password' && (
        <PasswordForm
          email={email}
          onContinue={handlePasswordContinue}
          onBack={() => setStep('email')}
          stepLabel="Step 2/3"
        />
      )}

      {step === 'confirmPassword' && (
        <ConfirmPasswordForm
          email={email}
          password={password}
          onSubmit={handleConfirmSubmit}
          onBack={() => setStep('password')}
          stepLabel="Step 3/3"
        />
      )}
    </div>
  );
}
