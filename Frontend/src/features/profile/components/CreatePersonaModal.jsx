import React, { useState, useRef } from 'react';
import './EditProfileModal.css'; // Reusing edit profile styles for step 1
import '../../onboarding/components/OnboardingSteps.css'; // Reusing onboarding styles for step 2
import { InterestSelector } from '../../onboarding/components/InterestSelector';
import client from '../../../services/client';
import { Avatar } from '../../../components/ui/Avatar';
import defaultAvatar from '../../../assets/default-avatar.png';
import defaultBanner from '../../../assets/default-banner.jpg';

export const CreatePersonaModal = ({ isOpen, onClose, onSuccess }) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    bio: '',
    interests: []
  });
  const [avatarFile, setAvatarFile] = useState(null);
  const [bannerFile, setBannerFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [bannerPreview, setBannerPreview] = useState(null);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const avatarInputRef = useRef(null);
  const bannerInputRef = useRef(null);

  if (!isOpen) return null;

  const handleAvatarSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleBannerSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setBannerFile(file);
      setBannerPreview(URL.createObjectURL(file));
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const submitData = new FormData();
      submitData.append('name', formData.name);
      submitData.append('bio', formData.bio);
      submitData.append('interests', JSON.stringify(formData.interests));
      
      if (avatarFile) {
        submitData.append('avatar', avatarFile);
      }
      if (bannerFile) {
        submitData.append('banner', bannerFile);
      }

      const response = await client.post('/personas/create/', submitData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      if (response.data.id) {
        if (onSuccess) onSuccess(response.data);
        onClose();
        // Reset form
        setStep(1);
        setFormData({ name: '', bio: '', interests: [] });
        setAvatarFile(null);
        setBannerFile(null);
        setAvatarPreview(null);
        setBannerPreview(null);
      }
    } catch (err) {
      console.error('Failed to create persona:', err);
      setError(err.response?.data?.error || 'Failed to create persona');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const renderStep1 = () => (
    <>
      <div className="edit-profile-header">
        <div className="edit-profile-header-left">
          <button type="button" className="edit-profile-close-btn" onClick={onClose}>✕</button>
          <h2>Create Persona</h2>
        </div>
        <button 
          type="button" 
          className="edit-profile-save-btn" 
          onClick={() => setStep(2)}
          disabled={!formData.name.trim()}
        >
          Next
        </button>
      </div>

      <div className="edit-profile-content">
        <div className="edit-profile-images">
          <input 
            type="file" 
            ref={bannerInputRef} 
            style={{ display: 'none' }} 
            accept="image/*"
            onChange={handleBannerSelect} 
          />
          <div 
            className="edit-profile-banner" 
            style={{ cursor: 'pointer', position: 'relative', overflow: 'hidden' }}
            onClick={() => bannerInputRef.current.click()}
          >
            <img 
              src={bannerPreview || defaultBanner} 
              alt="Banner"
              style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', top: 0, left: 0 }}
              onError={(e) => { e.target.onerror = null; e.target.src = defaultBanner; }}
            />
            <div className="edit-profile-image-overlay" style={{ zIndex: 1 }}>
              <span className="camera-icon">📷</span>
            </div>
          </div>
          <div className="edit-profile-avatar-row">
            <input 
              type="file" 
              ref={avatarInputRef} 
              style={{ display: 'none' }} 
              accept="image/*"
              onChange={handleAvatarSelect} 
            />
            <div 
              className="edit-profile-avatar-wrapper"
              style={{ cursor: 'pointer' }}
              onClick={() => avatarInputRef.current.click()}
            >
              <img 
                src={avatarPreview || defaultAvatar} 
                alt="Avatar" 
                className="edit-profile-avatar" 
                onError={(e) => { e.target.onerror = null; e.target.src = defaultAvatar; }}
              />
              <div className="edit-profile-image-overlay avatar-overlay">
                <span className="camera-icon">📷</span>
              </div>
            </div>
          </div>
        </div>

        <form className="edit-profile-form" onSubmit={(e) => { e.preventDefault(); setStep(2); }}>
          <div className="form-group">
            <label>Persona Name</label>
            <input 
              type="text" 
              name="name" 
              value={formData.name} 
              onChange={handleChange} 
              placeholder="Name" 
              maxLength={50}
              autoFocus
            />
          </div>

          <div className="form-group">
            <label>Bio</label>
            <textarea 
              name="bio" 
              value={formData.bio} 
              onChange={handleChange} 
              placeholder="Bio" 
              maxLength={160}
              rows={3}
            />
          </div>
        </form>
      </div>
    </>
  );

  const renderStep2 = () => (
    <>
      <div className="edit-profile-header">
        <div className="edit-profile-header-left">
          <button type="button" className="edit-profile-close-btn" onClick={() => setStep(1)}>←</button>
          <h2>Select Interests</h2>
        </div>
        <button 
          type="button" 
          className="edit-profile-save-btn" 
          onClick={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Creating...' : 'Create'}
        </button>
      </div>

      <div className="edit-profile-content" style={{ padding: '20px' }}>
        <div className="onboarding-step-container" style={{ margin: 0, padding: 0, boxShadow: 'none' }}>
          <h2 className="step-title" style={{ fontSize: '1.2rem', marginBottom: '8px' }}>What is this persona into?</h2>
          <p className="step-subtitle">Pick interests to personalize this persona's feed.</p>
          
          {error && <div className="status-error" style={{ marginBottom: '15px', color: 'red' }}>{error}</div>}

          <InterestSelector 
            interests={formData.interests} 
            onChange={(newInterests) => setFormData(prev => ({ ...prev, interests: newInterests }))} 
          />
        </div>
      </div>
    </>
  );

  return (
    <div className="edit-profile-overlay" onClick={handleOverlayClick}>
      <div className="edit-profile-modal">
        {step === 1 ? renderStep1() : renderStep2()}
      </div>
    </div>
  );
};
