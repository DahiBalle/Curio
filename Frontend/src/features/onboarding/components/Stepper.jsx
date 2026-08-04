import React from 'react';
import './Stepper.css';

const STEPS = ['Username', 'Profile', 'Interests', 'Review'];

export function Stepper({ currentStep }) {
  return (
    <div className="onboarding-stepper">
      {STEPS.map((step, index) => {
        const isActive = index === currentStep;
        const isCompleted = index < currentStep;

        return (
          <div 
            key={step} 
            className={`stepper-item ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}
          >
            <div className="stepper-circle">
              {isCompleted ? '✓' : index + 1}
            </div>
            <div className="stepper-label">{step}</div>
            {index < STEPS.length - 1 && <div className="stepper-line" />}
          </div>
        );
      })}
    </div>
  );
}
