import React from 'react';
import './OnboardingSteps.css'; // Shared CSS for steps

export function UsernameStep({ data, updateData, usernameStatus }) {
  return (
    <div className="onboarding-step-container">
      <h2 className="step-title">Choose your username</h2>
      <p className="step-subtitle">This is how people will find you. You can't change this later.</p>

      <div className="step-input-group">
        <label className="step-label">Username</label>
        <div className="username-input-wrapper">
          <span className="username-prefix">@</span>
          <input
            type="text"
            className={`step-input ${usernameStatus.available === false ? 'error' : ''} ${usernameStatus.available === true ? 'success' : ''}`}
            placeholder="e.g. skater_kid"
            value={data.username}
            onChange={(e) => updateData('username', e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))}
          />
        </div>
        
        <div className="username-status">
          {usernameStatus.checking && <span className="status-checking">Checking availability...</span>}
          {!usernameStatus.checking && usernameStatus.available === true && (
            <span className="status-success">✔ {usernameStatus.message}</span>
          )}
          {!usernameStatus.checking && usernameStatus.available === false && (
            <span className="status-error">❌ {usernameStatus.message}</span>
          )}
        </div>
      </div>
    </div>
  );
}
