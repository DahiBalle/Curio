import React from 'react';
import { ProfilePreview } from './ProfilePreview';
import './ReviewStep.css';
import './OnboardingSteps.css';

export function ReviewStep({ data, updateData }) {
  return (
    <div className="review-step-container">
      <div className="review-left">
        <h2 className="step-title">Review your persona</h2>
        <p className="step-subtitle">Make sure everything looks good. You can edit here, and see it instantly on the right.</p>

        <div className="step-input-group">
          <label className="step-label">Name</label>
          <input
            type="text"
            className="step-input"
            value={data.name}
            onChange={(e) => updateData('name', e.target.value)}
          />
        </div>

        <div className="step-input-group">
          <label className="step-label">Username</label>
          <div className="username-input-wrapper">
            <span className="username-prefix">@</span>
            <input
              type="text"
              className="step-input"
              value={data.username}
              onChange={(e) => updateData('username', e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))}
            />
          </div>
        </div>

        <div className="step-input-group">
          <label className="step-label">Bio</label>
          <textarea
            className="step-textarea"
            value={data.bio}
            onChange={(e) => updateData('bio', e.target.value)}
            rows={3}
          />
        </div>
      </div>

      <div className="review-right">
        <ProfilePreview data={data} />
      </div>
    </div>
  );
}
