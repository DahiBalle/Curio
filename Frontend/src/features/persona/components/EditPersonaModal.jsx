import React, { useState, useEffect, useRef } from 'react';
import './EditPersonaModal.css';
import client from '../../../services/client';
import { Avatar } from '../../../components/ui/Avatar';
import defaultAvatar from '../../../assets/default-avatar.png';
import defaultBanner from '../../../assets/default-banner.jpg';

export const EditPersonaModal = ({ isOpen, onClose, persona, onSaveSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    bio: '',
    avatarUrl: '',
    bannerUrl: ''
  });
  
  const [avatarFile, setAvatarFile] = useState(null);
  const [bannerFile, setBannerFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize form with persona data when modal opens
  useEffect(() => {
    if (isOpen && persona) {
      setFormData({
        name: persona.name || '',
        bio: persona.bio || '',
        avatarUrl: persona.avatarUrl || persona.imageUrl || '',
        bannerUrl: persona.bannerUrl || ''
      });
      setAvatarFile(null);
      setBannerFile(null);
    }
  }, [isOpen, persona]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const avatarInputRef = useRef(null);
  const bannerInputRef = useRef(null);

  const handleAvatarUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setAvatarFile(file);
    setFormData(prev => ({ ...prev, avatarUrl: URL.createObjectURL(file) }));
  };

  const handleBannerUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setBannerFile(file);
    setFormData(prev => ({ ...prev, bannerUrl: URL.createObjectURL(file) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!persona?.id) return;

    setIsSubmitting(true);
    try {
      const data = new FormData();
      data.append('name', formData.name);
      data.append('bio', formData.bio);
      if (avatarFile) data.append('avatar', avatarFile);
      if (bannerFile) data.append('banner', bannerFile);

      const response = await client.put(`/personas/${persona.id}/update/`, data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      if (response.data?.success && response.data?.persona) {
        if (onSaveSuccess) onSaveSuccess(response.data.persona);
        onClose();
      }
    } catch (error) {
      console.error('Failed to update persona:', error);
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
