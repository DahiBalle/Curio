import { useState } from 'react';
import { LoginForm } from '../components/LoginForm';

export function LoginPage({ onLoginComplete }) {
  const [isDarkMode, setIsDarkMode] = useState(false);

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
      <LoginForm
        onLoginComplete={onLoginComplete}
        isDarkMode={isDarkMode}
        onToggleTheme={toggleTheme}
      />
    </div>
  );
}
