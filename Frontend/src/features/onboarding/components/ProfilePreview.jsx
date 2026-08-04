import React from 'react';
import './ProfilePreview.css';

export function ProfilePreview({ data }) {
  const { username, name, bio, avatar, banner } = data;

  const displayUsername = username ? `@${username}` : '@username';
  const displayName = name || 'Your Name';
  const displayBio = bio || 'Your bio will appear here...';

  return (
    <div className="profile-preview-container">
      <div className="profile-preview-header">
        <div 
          className="profile-preview-banner" 
          style={{ backgroundImage: banner ? `url(${banner})` : 'none' }}
        >
          {!banner && <div className="profile-preview-banner-placeholder" />}
        </div>
        
        <div className="profile-preview-avatar-wrapper">
          {avatar ? (
            <img src={avatar} alt="Avatar" className="profile-preview-avatar" />
          ) : (
            <div className="profile-preview-avatar-placeholder" />
          )}
        </div>

        <div className="profile-preview-info">
          <h2 className="profile-preview-name">{displayName}</h2>
          <p className="profile-preview-username">{displayUsername}</p>
          <p className="profile-preview-bio">{displayBio}</p>
        </div>
      </div>

      <div className="profile-preview-tabs">
        <div className="profile-preview-tab active">Posts</div>
        <div className="profile-preview-tab">Reels</div>
      </div>

      <div className="profile-preview-empty-state">
        <div className="empty-state-icon">📸</div>
        <h3>No posts yet</h3>
        <p>Your future posts will appear here</p>
      </div>
    </div>
  );
}
