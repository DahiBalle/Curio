import React from 'react';
import { InterestSelector } from './InterestSelector';
import './OnboardingSteps.css';

export function InterestsStep({ data, updateData }) {
  return (
    <div className="onboarding-step-container">
      <h2 className="step-title">What are you into?</h2>
      <p className="step-subtitle">Pick some interests so we can personalize your feed. (Optional)</p>

      <InterestSelector 
        interests={data.interests} 
        onChange={(newInterests) => updateData('interests', newInterests)} 
      />

      {data.interests.length > 0 && (
        <div className="interest-preview-box">
          <p><strong>Your feed will include:</strong> {data.interests.join(' • ')}</p>
        </div>
      )}
    </div>
  );
}
