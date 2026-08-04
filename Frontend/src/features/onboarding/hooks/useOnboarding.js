import { useState, useEffect, useCallback } from 'react';
import { onboardingApi } from '../api/onboardingApi';
import { useDebounce } from '../../../hooks/useDebounce';

const LOCAL_STORAGE_KEY = 'onboarding_draft';

const INITIAL_STATE = {
  username: '',
  name: '',
  bio: '',
  avatar: '',
  banner: '',
  interests: []
};

export function useOnboarding() {
  const [currentStep, setCurrentStep] = useState(0);
  const [data, setData] = useState(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      return saved ? JSON.parse(saved) : INITIAL_STATE;
    } catch {
      return INITIAL_STATE;
    }
  });

  const [usernameStatus, setUsernameStatus] = useState({ checking: false, available: null, message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const debouncedUsername = useDebounce(data.username, 500);

  // Save to local storage on data change
  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
  }, [data]);

  // Username validation effect
  useEffect(() => {
    let isMounted = true;

    async function checkUsername() {
      if (!debouncedUsername || debouncedUsername.length < 3) {
        setUsernameStatus({ checking: false, available: null, message: '' });
        return;
      }

      setUsernameStatus(prev => ({ ...prev, checking: true }));

      try {
        const result = await onboardingApi.checkUsernameAvailability(debouncedUsername);
        if (isMounted) {
          setUsernameStatus({ checking: false, available: result.available, message: result.message });
        }
      } catch (err) {
        if (isMounted) {
          setUsernameStatus({ checking: false, available: false, message: err.message });
        }
      }
    }

    checkUsername();

    return () => {
      isMounted = false;
    };
  }, [debouncedUsername]);

  const updateData = useCallback((field, value) => {
    setData(prev => ({ ...prev, [field]: value }));
  }, []);

  const nextStep = useCallback(() => {
    // If on step 0 (Username), prevent proceeding if username is not available
    if (currentStep === 0 && !usernameStatus.available) return;
    setCurrentStep(prev => prev + 1);
  }, [currentStep, usernameStatus.available]);

  const prevStep = useCallback(() => {
    setCurrentStep(prev => Math.max(0, prev - 1));
  }, []);

  const submit = async () => {
    setIsSubmitting(true);
    try {
      await onboardingApi.submitOnboarding(data);
      // Clear draft on successful submit
      localStorage.removeItem(LOCAL_STORAGE_KEY);
      nextStep(); // Go to Confetti screen
    } catch (error) {
      console.error('Submission failed', error);
      // Handle error gracefully if needed
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    currentStep,
    data,
    updateData,
    nextStep,
    prevStep,
    submit,
    isSubmitting,
    usernameStatus,
    setCurrentStep
  };
}
