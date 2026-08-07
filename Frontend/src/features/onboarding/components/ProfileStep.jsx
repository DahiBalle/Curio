import React, { useRef } from 'react';
import './OnboardingSteps.css';
import client from '../../../services/client';
import defaultAvatar from '../../../assets/default-avatar.png';
import defaultBanner from '../../../assets/default-banner.jpg';

export function ProfileStep({ data, updateData }) {
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
      updateData('avatar', response.data.image);
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
      updateData('banner', response.data.banner);
    } catch (error) {
      console.error("Banner upload failed", error);
    }
  };
  return (
    <div className="onboarding-step-container">
      <h2 className="step-title">Create your default Persona</h2>
      <p className="step-subtitle">This will be your primary identity. You can create more personas later.</p>

      <div className="profile-images-setup">
        <input 
          type="file" 
          ref={bannerInputRef} 
          style={{ display: 'none' }} 
          accept="image/*"
          onChange={handleBannerUpload} 
        />
        <div 
          className="setup-banner"
          style={{ cursor: 'pointer', position: 'relative', overflow: 'hidden' }}
          onClick={() => bannerInputRef.current.click()}
        >
          <img 
            src={data.banner || defaultBanner} 
            alt="Banner"
            style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', top: 0, left: 0 }}
            onError={(e) => { e.target.onerror = null; e.target.src = defaultBanner; }}
          />
          {!data.banner && <span style={{ zIndex: 1, position: 'relative' }}>Click to upload Banner Image</span>}
        </div>
        
        <div className="setup-avatar-row">
          <input 
            type="file" 
            ref={avatarInputRef} 
            style={{ display: 'none' }} 
            accept="image/*"
            onChange={handleAvatarUpload} 
          />
          <div 
            className="setup-avatar-wrapper" 
            style={{ cursor: 'pointer' }}
            onClick={() => avatarInputRef.current.click()}
          >
            {data.avatar ? (
              <img 
                src={data.avatar} 
                alt="Avatar" 
                className="setup-avatar" 
                onError={(e) => { e.target.onerror = null; e.target.src = defaultAvatar; }}
              />
            ) : (
              <div className="setup-avatar-placeholder">
                <span>+</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="step-input-group">
        <label className="step-label">Display Name</label>
        <input
          type="text"
          className="step-input"
          placeholder="e.g. Tony Hawk"
          value={data.name}
          onChange={(e) => updateData('name', e.target.value)}
        />
      </div>

      <div className="step-input-group">
        <label className="step-label">Bio</label>
        <textarea
          className="step-textarea"
          placeholder="What do you want people to know about you?"
          value={data.bio}
          onChange={(e) => updateData('bio', e.target.value)}
          rows={3}
        />
      </div>
    </div>
  );
}
