import { useState } from 'react';
import { isValidEmail, hasNoWhiteSpace } from '../../../utils/validators';
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

  const isDarkMode = propIsDarkMode !== undefined ? propIsDarkMode : localIsDarkMode;
  const toggleTheme = onToggleTheme || (() => setLocalIsDarkMode(prev => !prev));

  const hasSpace = !hasNoWhiteSpace(email);
  const emailValid = isValidEmail(email) && !hasSpace;
  const showError = touched && email.length > 0 && !isValidEmail(email) && !hasSpace;

  const handleSubmit = (e) => {
    e.preventDefault();
    setTouched(true);
    if (emailValid && !hasSpace && onContinue) {
      onContinue(email);
    }
  };

  return (
    <div className={`tablet-panel ${isDarkMode ? 'dark-theme' : 'light-theme'}`}>

      {/* Header: Step Label & Mode Switch */}
      <div className="panel-header-row">
        <div className="header-left-group">
          <span className="step-label">{stepLabel}</span>
        </div>

        <button
          type="button"
          className={`theme-toggle-switch ${isDarkMode ? 'dark' : 'light'}`}
          onClick={toggleTheme}
          aria-label="Toggle theme"
        >
          <div className="toggle-icons">
            <svg className="toggle-svg sun" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="5"></circle>
              <line x1="12" y1="1" x2="12" y2="3"></line>
              <line x1="12" y1="21" x2="12" y2="23"></line>
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
              <line x1="1" y1="12" x2="3" y2="12"></line>
              <line x1="21" y1="12" x2="23" y2="12"></line>
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
            </svg>
            <svg className="toggle-svg moon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
            </svg>
          </div>
          <div className="toggle-knob"></div>
        </button>
      </div>

      {/* Title */}
      <h2 className="panel-title">
        What's your email address?
      </h2>

      {/* Form */}
      <form className="email-form-body" onSubmit={handleSubmit}>
        <div className={`input-container ${isFocused ? 'focused' : ''} ${showError || hasSpace ? 'error' : ''}`}>
          <label className="input-label" htmlFor="email-field">Email</label>
          <div className="input-wrapper">
            <input
              id="email-field"
              type="email"
              className="password-input"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setTouched(true); }}
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

        {emailValid && (
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
          disabled={!emailValid || hasSpace}
        >
          Continue
        </button>
      </form>
    </div>
  );
}
