import { useState, useEffect } from 'react';
import { personaApi } from '../api/personaApi';

export function useInterestPicker({ isOpen, activePersona, onSuccess, onClose }) {
  const [interests, setInterests] = useState(activePersona?.interests || []);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen && activePersona) {
      setInterests(activePersona.interests || []);
    }
  }, [isOpen, activePersona]);

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!activePersona?.id) return;

    setError(null);
    setIsSubmitting(true);

    try {
      const response = await personaApi.updateInterests(activePersona.id, interests);
      if (response?.persona) {
        if (onSuccess) onSuccess(response.persona);
        if (onClose) onClose();
      }
    } catch (err) {
      console.error('Failed to update interests:', err);
      setError(err.response?.data?.error || 'Failed to update interests');
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    interests,
    setInterests,
    isSubmitting,
    error,
    handleSubmit
  };
}
