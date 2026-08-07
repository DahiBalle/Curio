import { useState } from 'react';
import { isValidEmail, hasNoWhiteSpace } from '../../../utils/validators';
import './PasswordForm.css';

export function LoginForm({
  onLoginComplete,
  isDarkMode: propIsDarkMode,
  onToggleTheme
}) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isFocusedEmail, setIsFocusedEmail] = useState(false);
  const [isFocusedPassword, setIsFocusedPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [emailTouched, setEmailTouched] = useState(false);

  const hasSpace = !hasNoWhiteSpace(email);
  const emailValid = isValidEmail(email) && !hasSpace;
  const showError = emailTouched && email.length > 0 && !isValidEmail(email) && !hasSpace;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setEmailTouched(true);
    if (!emailValid || hasSpace || !password) return;

    if (onLoginComplete) {

      onLoginComplete({ email, password });

    }
  };

  return (
    <div className="tablet-panel">

      {/* Header: Mode Switch */}
      <div className="panel-header-row" style={{ justifyContent: 'flex-end' }}>
        {/* The switch has been removed */}
      </div>

      {/* Title */}
      <h2 className="panel-title">
        Welcome back
      </h2>

      {/* Form */}
      <form className="email-form-body" onSubmit={handleSubmit}>
        <div className={`input-container ${isFocusedEmail ? 'focused' : ''} ${showError || hasSpace ? 'error' : ''}`}>
          <label className="input-label" htmlFor="login-email">Email</label>
          <div className="input-wrapper">
            <input
              id="login-email"
              type="email"
              className="password-input"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setEmailTouched(true);
              }}
              onFocus={() => setIsFocusedEmail(true)}
              onBlur={() => { setIsFocusedEmail(false); setEmailTouched(true); }}
              autoFocus
            />
            {email.length > 0 && (
              <button
                type="button"
                className="toggle-visibility-btn"
                onClick={() => setEmail('')}
                aria-label="Clear email"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            )}
          </div>
        </div>

        {hasSpace && (
          <p className="email-error-text">*email cannot contain spaces</p>
        )}

        {showError && !hasSpace && (
          <p className="email-error-text">Please enter a valid email address</p>
        )}

        {emailValid && (
          <div className="email-valid-badge">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" fill="#48BB78" />
              <path d="M9 12l2 2 4-4" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span>Looks good!</span>
          </div>
        )}

        <div className={`input-container ${isFocusedPassword ? 'focused' : ''}`}>
          <label className="input-label" htmlFor="login-password">Password</label>
          <div className="input-wrapper">
            <input
              id="login-password"
              type={showPassword ? 'text' : 'password'}
              className="password-input"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onFocus={() => setIsFocusedPassword(true)}
              onBlur={() => setIsFocusedPassword(false)}
            />
            <button
              type="button"
              className="toggle-visibility-btn"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                  <line x1="1" y1="1" x2="23" y2="23"></line>
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                  <circle cx="12" cy="12" r="3"></circle>
                </svg>
              )}
            </button>
          </div>
        </div>

        <button
          type="submit"
          className="continue-btn"
          disabled={!emailValid || hasSpace || !password}
        >
          Log in
        </button>

        <div className="auth-switch-prompt">
          Don't have an account? <a href="/signup" className="auth-switch-link">Sign up</a>
        </div>
      </form>
    </div>
  );
}
