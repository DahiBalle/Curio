import React, { useState, useEffect, useRef } from 'react';
import './EditProfileModal.css';
import { useDebounce } from '../../../hooks/useDebounce';
import { onboardingApi } from '../../onboarding/api/onboardingApi';
import { profileApi } from '../api/profileApi';
import client from '../../../services/client';
import { Avatar } from '../../../components/ui/Avatar';
import defaultAvatar from '../../../assets/default-avatar.png';
import defaultBanner from '../../../assets/default-banner.jpg';

export const EditProfileModal = ({ isOpen, onClose, profile, onSaveSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    bio: '',
    avatarUrl: '',
    bannerUrl: ''
  });

  const [usernameStatus, setUsernameStatus] = useState({ checking: false, available: null, message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const debouncedUsername = useDebounce(formData.username, 500);

  // Initialize form with profile data when modal opens
  useEffect(() => {
    if (isOpen && profile) {
      setFormData({
        name: profile.name || '',
        username: profile.username || '',
        bio: profile.bio || '',
        avatarUrl: profile.avatarUrl || '',
        bannerUrl: profile.bannerUrl || ''
      });
      // Reset username status if they haven't changed it
      setUsernameStatus({ checking: false, available: true, message: '' });
    }
  }, [isOpen, profile]);

  // Handle Username validation
  useEffect(() => {
    let isMounted = true;

    async function checkUsername() {
      // If it's the same as their current username, it's valid automatically
      if (profile && debouncedUsername === profile.username) {
        setUsernameStatus({ checking: false, available: true, message: 'Current username' });
        return;
      }

      if (!debouncedUsername || debouncedUsername.length < 3) {
        setUsernameStatus({ checking: false, available: null, message: 'Username too short' });
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

    if (isOpen) {
      checkUsername();
    }

    return () => {
      isMounted = false;
    };
  }, [debouncedUsername, profile, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'username') {
      setFormData(prev => ({ ...prev, [name]: value.replace(/[^a-zA-Z0-9_]/g, '') }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const avatarInputRef = useRef(null);
  const bannerInputRef = useRef(null);

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('profile_picture', file);
    try {
      const response = await client.put('/profile/upload-picture/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setFormData(prev => ({ ...prev, avatarUrl: response.data.image }));
    } catch (error) {
      console.error("Avatar upload failed", error);
    }
  };

  const handleBannerUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('banner', file);
    try {
      const response = await client.put('/profile/upload-banner/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setFormData(prev => ({ ...prev, bannerUrl: response.data.banner }));
    } catch (error) {
      console.error("Banner upload failed", error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (usernameStatus.available === false) return;

    setIsSubmitting(true);
    try {
      const response = await profileApi.updateProfile({
        first_name: formData.name,
        display_name: formData.name,
        username: formData.username,
        bio: formData.bio,
        avatar_url: formData.avatarUrl,
        banner_url: formData.bannerUrl,
      });
      // Backend returns { message, user } — not { success, profile }
      if (response && response.message) {
        // Merge returned server data back into the existing profile shape
        const updatedProfile = {
          ...profile,
          name: response.user.display_name || response.user.first_name || profile.name,
          username: response.user.username || profile.username,
          bio: response.user.bio || profile.bio,
          avatarUrl: formData.avatarUrl || profile.avatarUrl,
          bannerUrl: formData.bannerUrl || profile.bannerUrl,
        };
        if (onSaveSuccess) onSaveSuccess(updatedProfile);
        onClose();
      }
    } catch (error) {
      console.error('Failed to update profile:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  // Handle click on overlay to close
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
            <h2>Edit profile</h2>
          </div>
          <button 
            type="button" 
            className="edit-profile-save-btn" 
            onClick={handleSubmit}
            disabled={isSubmitting || usernameStatus.available === false}
          >
            {isSubmitting ? 'Saving...' : 'Save'}
          </button>
        </div>

        <div className="edit-profile-content">
          <div className="edit-profile-images">
            <input 
              type="file" 
              ref={bannerInputRef} 
              style={{ display: 'none' }} 
              accept="image/*"
              onChange={handleBannerUpload} 
            />
            <div 
              className="edit-profile-banner" 
              style={{ cursor: 'pointer', position: 'relative', overflow: 'hidden' }}
              onClick={() => bannerInputRef.current.click()}
            >
              <img 
                src={formData.bannerUrl || defaultBanner} 
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
                onChange={handleAvatarUpload} 
              />
              <div 
                className="edit-profile-avatar-wrapper"
                style={{ cursor: 'pointer' }}
                onClick={() => avatarInputRef.current.click()}
              >
                <img 
                  src={formData.avatarUrl || defaultAvatar} 
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

          <form className="edit-profile-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Name</label>
              <input 
                type="text" 
                name="name" 
                value={formData.name} 
                onChange={handleChange} 
                placeholder="Name" 
                maxLength={50}
              />
            </div>

            <div className="form-group username-group">
              <label>Username</label>
              <div className="username-input-wrapper">
                <span className="username-prefix">@</span>
                <input 
                  type="text" 
                  name="username" 
                  className={usernameStatus.available === false ? 'error' : (usernameStatus.available === true && formData.username !== profile?.username ? 'success' : '')}
                  value={formData.username} 
                  onChange={handleChange} 
                  placeholder="Username" 
                />
              </div>
              <div className="username-status">
                {usernameStatus.checking && <span className="status-checking">Checking...</span>}
                {!usernameStatus.checking && usernameStatus.available === true && formData.username !== profile?.username && (
                  <span className="status-success">✔ {usernameStatus.message}</span>
                )}
                {!usernameStatus.checking && usernameStatus.available === false && (
                  <span className="status-error">❌ {usernameStatus.message}</span>
                )}
              </div>
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
      </div>
    </div>
  );
};
