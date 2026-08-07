import { useState } from 'react';
import { 
  hasPasswordNumber, 
  hasPasswordSymbol, 
  hasPasswordCapital, 
  hasPasswordSmall,
  hasNoWhiteSpace
} from '../../../utils/validators';
import './PasswordForm.css';

export function PasswordForm({ 
  email = "alexsmith.mobbin@gmail.com", 
  onContinue,
  isDarkMode: propIsDarkMode, 
  onToggleTheme, 
  stepLabel = "Step 2/3", 
  onBack 
}) {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [localIsDarkMode, setLocalIsDarkMode] = useState(false);

  const isDarkMode = propIsDarkMode !== undefined ? propIsDarkMode : localIsDarkMode;
  const toggleTheme = onToggleTheme || (() => setLocalIsDarkMode(prev => !prev));

  const hasSpace = !hasNoWhiteSpace(password);

  // Compute criteria checks using validators
  const checks = {
    length: password.length >= 8,
    casing: hasPasswordCapital(password) && hasPasswordSmall(password),
    number: hasPasswordNumber(password),
    special: hasPasswordSymbol(password),
    noWhiteSpace: hasNoWhiteSpace(password),
  };

  const isAllMet = checks.length && checks.casing && checks.number && checks.special && checks.noWhiteSpace;

  const toggleShowPassword = () => {
    setShowPassword((prev) => !prev);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isAllMet) {
      if (onContinue) {
        onContinue(password);
      } else {
        alert("Success! Password created successfully.");
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
        Create your password for <span className="panel-email">{email}</span>
      </h2>

      {/* Tablet Content Layout */}
      <form className="panel-content" onSubmit={handleSubmit}>
        
        {/* Left Column: Form Inputs & Continue Button */}
        <div className="panel-col-left">
          <div className={`input-container ${isFocused ? 'focused' : ''} ${hasSpace ? 'error' : ''}`}>
            <label className="input-label" htmlFor="password-field">Password</label>
            <div className="input-wrapper">
              <input
                id="password-field"
                type={showPassword ? 'text' : 'password'}
                className="password-input"
                placeholder="Create a password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
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

          <button
            type="submit"
            className="continue-btn"
            disabled={!isAllMet}
          >
            Continue
          </button>
        </div>

        {/* Right Column: Validation Requirements */}
        <div className="panel-col-right">
          <div className="requirements-list">
            <RequirementRow text="Minimum 8 characters" isMet={checks.length} />
            <RequirementRow text="One uppercase & lowercase letter" isMet={checks.casing} />
            <RequirementRow text="One number" isMet={checks.number} />
            <RequirementRow text="One special character" isMet={checks.special} />
          </div>
        </div>

      </form>
    </div>
  );
}

function RequirementRow({ text, isMet }) {
  return (
    <div className={`requirement-row ${isMet ? 'met' : ''}`}>
      {isMet ? (
        <svg className="requirement-icon" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" fill="#48BB78" />
          <path d="M9 12l2 2 4-4" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ) : (
        <svg className="requirement-icon" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="#CBD5E0" strokeWidth="2.5" fill="none" />
          <path d="M9 9l6 6M15 9l-6 6" stroke="#CBD5E0" strokeWidth="2" strokeLinecap="round" />
        </svg>
      )}
      <span>{text}</span>
    </div>
  );
}
