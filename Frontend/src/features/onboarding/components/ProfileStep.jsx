import React from 'react';
import './OnboardingSteps.css';

const AVATAR_PRESETS = [
  'https://picsum.photos/seed/a1/100',
  'https://picsum.photos/seed/a2/100',
  'https://picsum.photos/seed/a3/100',
  'https://picsum.photos/seed/a4/100'
];

const BANNER_PRESETS = [
  'https://picsum.photos/seed/b1/600/200',
  'https://picsum.photos/seed/b2/600/200',
  'https://picsum.photos/seed/b3/600/200'
];

export function ProfileStep({ data, updateData }) {
  const handleRandomize = () => {
    const rAvatar = `https://picsum.photos/seed/${Math.random()}/100`;
    const rBanner = `https://picsum.photos/seed/${Math.random()}/600/200`;
    updateData('avatar', rAvatar);
    updateData('banner', rBanner);
  };

  return (
    <div className="onboarding-step-container">
      <h2 className="step-title">Set up your profile</h2>
      <p className="step-subtitle">Tell us a bit about yourself (Optional)</p>

      <div className="profile-images-setup">
        <div 
          className="setup-banner"
          style={{ backgroundImage: data.banner ? `url(${data.banner})` : 'none' }}
        >
          {!data.banner && <span>Banner Image</span>}
        </div>
        
        <div className="setup-avatar-row">
          <div className="setup-avatar-wrapper">
            {data.avatar ? (
              <img src={data.avatar} alt="Avatar" className="setup-avatar" />
            ) : (
              <div className="setup-avatar-placeholder" />
            )}
          </div>
          
          <button className="randomize-btn" onClick={handleRandomize}>
            🎲 Randomize Look
          </button>
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
