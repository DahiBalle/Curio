import { useState } from 'react';
import { isValidEmail, hasNoWhiteSpace } from '../../../utils/validators';
import { authApi } from '../api/authApi';
import './PasswordForm.css';

export function EmailForm({
  onContinue,
  isDarkMode: propIsDarkMode,
  onToggleTheme,
  stepLabel = "Step 1/3"
}) {
  const [email, setEmail] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [localIsDarkMode, setLocalIsDarkMode] = useState(false);
  const [touched, setTouched] = useState(false);
  const [accountExists, setAccountExists] = useState(false);
  const [isChecking, setIsChecking] = useState(false);

  const isDarkMode = propIsDarkMode !== undefined ? propIsDarkMode : localIsDarkMode;
  const toggleTheme = onToggleTheme || (() => setLocalIsDarkMode(prev => !prev));

  const hasSpace = !hasNoWhiteSpace(email);
  const emailValid = isValidEmail(email) && !hasSpace;
  const showError = touched && email.length > 0 && !isValidEmail(email) && !hasSpace;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched(true);
    if (!emailValid || hasSpace) return;

    setAccountExists(false);

    try {
      setIsChecking(true);
      const { exists } = await authApi.checkEmailExists(email);
      if (exists) {
        setAccountExists(true);
        return;
      }
    } catch (err) {
      // If the check fails, let the user proceed
      console.error('Email check failed:', err);
    } finally {
      setIsChecking(false);
    }

    if (onContinue) onContinue(email);
  };

  return (
    <div className="tablet-panel">

      {/* Header: Step Label */}
      <div className="panel-header-row">
        <div className="header-left-group">
          <span className="step-label">{stepLabel}</span>
        </div>
      </div>

      {/* Title */}
      <h2 className="panel-title">
        What's your email address?
      </h2>

      {/* Form */}
      <form className="email-form-body" onSubmit={handleSubmit}>
        <div className={`input-container ${isFocused ? 'focused' : ''} ${showError || hasSpace || accountExists ? 'error' : ''}`}>
          <label className="input-label" htmlFor="email-field">Email</label>
          <div className="input-wrapper">
            <input
              id="email-field"
              type="email"
              className="password-input"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setTouched(true);
                setAccountExists(false);
              }}
              onFocus={() => setIsFocused(true)}
              onBlur={() => { setIsFocused(false); setTouched(true); }}
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

        {accountExists && (
          <p className="email-error-text">Account already exists</p>
        )}

        {emailValid && !accountExists && (
          <div className="email-valid-badge">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" fill="#48BB78" />
              <path d="M9 12l2 2 4-4" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span>Looks good!</span>
          </div>
        )}

        <button
          type="submit"
          className="continue-btn"
          disabled={!emailValid || hasSpace || isChecking}
        >
          {isChecking ? 'Checking…' : 'Continue'}
        </button>

        <div className="auth-switch-prompt">
          Already have an account? <a href="/login" className="auth-switch-link">Log in</a>
        </div>
      </form>
    </div>
  );
}
