import React from 'react';
import './EditPersonaModal.css';
import { useEditPersona } from '../hooks/useEditPersona';
import defaultAvatar from '../../../assets/default-avatar.png';
import defaultBanner from '../../../assets/default-banner.jpg';

export const EditPersonaModal = ({ isOpen, onClose, persona, onSaveSuccess }) => {
  const {
    formData,
    errorMsg,
    isSubmitting,
    avatarInputRef,
    bannerInputRef,
    handleChange,
    handleAvatarUpload,
    handleBannerUpload,
    handleSubmit
  } = useEditPersona({ isOpen, persona, onSaveSuccess, onClose });

  if (!isOpen) return null;

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
            <h2>Edit Persona</h2>
          </div>
          <button 
            type="button" 
            className="edit-profile-save-btn" 
            onClick={handleSubmit}
            disabled={isSubmitting || !formData.name.trim()}
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
            {errorMsg && <div className="error-message" style={{ color: 'red', marginBottom: '10px' }}>{errorMsg}</div>}
            
            <div className="form-group">
              <label>Name</label>

              <input 
                type="text" 
                name="name" 
                value={formData.name} 
                onChange={handleChange} 
                placeholder="Persona Name" 
                maxLength={50}
                required
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
      </div>
    </div>
  );
};
