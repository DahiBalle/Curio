import React from 'react';
import { useOnboarding } from '../hooks/useOnboarding';
import { Stepper } from '../components/Stepper';
import { UsernameStep } from '../components/UsernameStep';
import { ProfileStep } from '../components/ProfileStep';
import { InterestsStep } from '../components/InterestsStep';
import { ReviewStep } from '../components/ReviewStep';
import { ConfettiScreen } from '../components/ConfettiScreen';
import './OnboardingPage.css';

export function OnboardingPage() {
  const {
    currentStep,
    data,
    updateData,
    nextStep,
    prevStep,
    submit,
    isSubmitting,
    usernameStatus
  } = useOnboarding();

  // Determine if 'Next' button should be disabled
  const isNextDisabled = () => {
    if (currentStep === 0 && !usernameStatus.available) return true;
    return false;
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return <UsernameStep data={data} updateData={updateData} usernameStatus={usernameStatus} />;
      case 1:
        return <ProfileStep data={data} updateData={updateData} />;
      case 2:
        return <InterestsStep data={data} updateData={updateData} />;
      case 3:
        return <ReviewStep data={data} updateData={updateData} />;
      case 4:
        return <ConfettiScreen />;
      default:
        return null;
    }
  };

  return (
    <div className="onboarding-page">
      <div className="onboarding-content">
        
        {currentStep < 4 && (
          <div className="onboarding-header">
            <Stepper currentStep={currentStep} />
          </div>
        )}

        <div className="onboarding-step-body">
          {renderStep()}
        </div>

        {currentStep < 4 && (
          <div className="onboarding-footer">
            <div className="footer-left">
              {currentStep > 0 && (
                <button className="nav-btn btn-back" onClick={prevStep}>
                  Back
                </button>
              )}
            </div>

            <div className="footer-right">
              {currentStep > 0 && currentStep < 3 && (
                <button className="nav-btn btn-skip" onClick={nextStep}>
                  Skip
                </button>
              )}
              
              {currentStep < 3 ? (
                <button 
                  className="nav-btn btn-next" 
                  onClick={nextStep}
                  disabled={isNextDisabled()}
                >
                  Next
                </button>
              ) : (
                <button 
                  className="nav-btn btn-finish" 
                  onClick={submit}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Finishing...' : 'Complete Setup'}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
