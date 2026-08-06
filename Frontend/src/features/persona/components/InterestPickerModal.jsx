import React, { useState } from 'react';
import '../../profile/components/EditProfileModal.css';
import '../../onboarding/components/OnboardingSteps.css';
import { InterestSelector } from '../../onboarding/components/InterestSelector';
import client from '../../../services/client';

export const InterestPickerModal = ({ isOpen, onClose, activePersona, onSuccess }) => {
  const [interests, setInterests] = useState(activePersona?.interests || []);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Sync state when modal opens
  React.useEffect(() => {
    if (isOpen && activePersona) {
      setInterests(activePersona.interests || []);
    }
  }, [isOpen, activePersona]);

  if (!isOpen || !activePersona) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const response = await client.put(`/personas/${activePersona.id}/update/`, {
        interests: interests
      });
      
      if (response.data.persona) {
        if (onSuccess) onSuccess(response.data.persona);
        onClose();
      }
    } catch (err) {
      console.error('Failed to update interests:', err);
      setError(err.response?.data?.error || 'Failed to update interests');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="edit-profile-overlay" onClick={handleOverlayClick}>
      <div className="edit-profile-modal">
        <div className="edit-profile-header">
          <div className="edit-profile-header-left">
            <button type="button" className="edit-profile-close-btn" onClick={onClose}>✕</button>
            <h2>Edit Interests</h2>
          </div>
          <button 
            type="button" 
            className="edit-profile-save-btn" 
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Saving...' : 'Save'}
          </button>
        </div>

        <div className="edit-profile-content" style={{ padding: '20px' }}>
          <div className="onboarding-step-container" style={{ margin: 0, padding: 0, boxShadow: 'none' }}>
            <h2 className="step-title" style={{ fontSize: '1.2rem', marginBottom: '8px' }}>Update {activePersona.name}'s interests</h2>
            <p className="step-subtitle">Pick interests to personalize this persona's feed.</p>
            
            {error && <div className="status-error" style={{ marginBottom: '15px', color: 'red' }}>{error}</div>}

            <InterestSelector 
              interests={interests} 
              onChange={setInterests} 
            />
          </div>
        </div>
      </div>
    </div>
  );
};
