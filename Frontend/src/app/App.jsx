import { useState } from 'react';
import { EmailForm, PasswordForm } from '../features/auth';
import './App.css';

function App() {
  const [step, setStep] = useState('email');
  const [email, setEmail] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(false);

  const handleEmailContinue = (validEmail) => {
    setEmail(validEmail);
    setStep('password');
  };

  const handleBack = () => {
    setStep('email');
  };

  return (
    <div className="demo-page-wrapper">
      {step === 'email' && (
        <EmailForm
          onContinue={handleEmailContinue}
          isDarkMode={isDarkMode}
          onToggleTheme={() => setIsDarkMode(prev => !prev)}
          stepLabel="Step 1/2"
        />
      )}
      {step === 'password' && (
        <PasswordForm
          email={email}
          isDarkMode={isDarkMode}
          onToggleTheme={() => setIsDarkMode(prev => !prev)}
          stepLabel="Step 2/2"
          onBack={handleBack}
        />
      )}
    </div>
  );
}

export default App;
