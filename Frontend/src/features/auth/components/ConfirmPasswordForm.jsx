import { useState } from 'react';
import { hasNoWhiteSpace } from '../../../utils/validators';
import './PasswordForm.css';

export function ConfirmPasswordForm({
  email = "alexsmith.mobbin@gmail.com",
  password = "",
  onSubmit,
  isDarkMode: propIsDarkMode,
  onToggleTheme,
  stepLabel = "Step 3/3",
  onBack
}) {
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [localIsDarkMode, setLocalIsDarkMode] = useState(false);
  const [touched, setTouched] = useState(false);

  const isDarkMode = propIsDarkMode !== undefined ? propIsDarkMode : localIsDarkMode;
  const toggleTheme = onToggleTheme || (() => setLocalIsDarkMode(prev => !prev));

  const hasSpace = !hasNoWhiteSpace(confirmPassword);
  const isMatch = confirmPassword.length > 0 && confirmPassword === password;
  const showMismatchError = touched && confirmPassword.length > 0 && !isMatch && !hasSpace;
  const canSubmit = isMatch && !hasSpace;

  const toggleShowPassword = () => {
    setShowPassword((prev) => !prev);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setTouched(true);
    if (canSubmit) {
      if (onSubmit) {
        onSubmit({ email, password: confirmPassword });
      } else {
        alert("Account created successfully!");
      }
    }
  };

  return (
    <div className="tablet-panel">

      {/* Tablet Panel Header: Back Button & Step Label */}
      <div className="panel-header-row">
        <div className="header-left-group">
          {onBack && (
            <button className="back-btn" onClick={onBack} aria-label="Go back">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="19" y1="12" x2="5" y2="12"></line>
                <polyline points="12 19 5 12 12 5"></polyline>
              </svg>
            </button>
          )}
          <span className="step-label">{stepLabel}</span>
        </div>
      </div>

      {/* Screen Title */}
      <h2 className="panel-title">
        Confirm your password for <span className="panel-email">{email}</span>
      </h2>

      {/* Form */}
      <form className="email-form-body" onSubmit={handleSubmit}>
        <div className={`input-container ${isFocused ? 'focused' : ''} ${showMismatchError || hasSpace ? 'error' : ''}`}>
          <label className="input-label" htmlFor="confirm-password-field">Confirm Password</label>
          <div className="input-wrapper">
            <input
              id="confirm-password-field"
              type={showPassword ? 'text' : 'password'}
              className="password-input"
              placeholder="Re-enter your password"
              value={confirmPassword}
              onChange={(e) => { setConfirmPassword(e.target.value); setTouched(true); }}
              onFocus={() => setIsFocused(true)}
              onBlur={() => { setIsFocused(false); setTouched(true); }}
              autoFocus
              maxLength={16}
            />
            <button
              type="button"
              className="toggle-visibility-btn"
              onClick={toggleShowPassword}
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

        {hasSpace && (
          <p className="password-error-text">*password cannot contain spaces</p>
        )}

        {showMismatchError && (
          <p className="password-error-text">*passwords do not match</p>
        )}

        {isMatch && !hasSpace && (
          <div className="email-valid-badge">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" fill="#48BB78" />
              <path d="M9 12l2 2 4-4" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span>Passwords match!</span>
          </div>
        )}

        <button
          type="submit"
          className="continue-btn"
          disabled={!canSubmit}
        >
          Create Account
        </button>
      </form>
    </div>
  );
}
