import React from 'react';
import './ProfileHeader.css';
import { Avatar } from '../../../components/ui/Avatar';
import { Button } from '../../../components/ui/Button';
import { Icon } from '../../../components/ui/Icon';

import { EditPersonaModal } from '../../persona/components/EditPersonaModal';
import { useAuth } from '../../../context/AuthContext';
import { usePersona } from '../../../context/PersonaContext';
import defaultBanner from '../../../assets/default-banner.jpg';

export const ProfileHeader = ({ profile, onProfileUpdate }) => {
  const { user } = useAuth();
  const { switchPersona } = usePersona();
  const [isEditPersonaModalOpen, setIsEditPersonaModalOpen] = React.useState(false);

  const isOwnProfile = profile.username === user?.username;

  const handleMakeActive = async () => {
    if (profile.id) {
      await switchPersona(profile.id);
    }
  };




  if (!profile) return null;

  return (
    <header className="profile-header">
      <div className="profile-header__banner">
        <img 
          src={profile.bannerUrl || defaultBanner} 
          alt={`${profile.name} banner`} 
          className="profile-banner-image" 
          onError={(e) => { e.target.onerror = null; e.target.src = defaultBanner; }}
        />
      </div>

      <div className="profile-header__bottom">
        <div className="profile-header__top-row">
          <div className="profile-header__avatar">
            <Avatar src={profile.avatarUrl} alt={profile.name} size="large" />
          </div>
          
          <div className="profile-actions-desktop">
            {profile.isPersona && isOwnProfile ? (
              <>
                {profile.isActive ? (
                  <Button variant="secondary" disabled>Active Persona</Button>
                ) : (
                  <Button variant="primary" onClick={handleMakeActive}>Make Active</Button>
                )}
                <Button variant="secondary" onClick={() => setIsEditPersonaModalOpen(true)}>Edit persona</Button>
              </>
            ) : profile.isPersona ? (
              null // Don't show anything for someone else's persona
            ) : isOwnProfile ? (
              <Button variant="secondary" onClick={() => setIsEditPersonaModalOpen(true)}>Edit profile</Button>
            ) : (
              <>
              </>
            )}
          </div>
        </div>

        <section className="profile-header__info">
          <div className="profile-header__name-row">
            <h1 className="profile-name">{profile.name}</h1>
            {profile.isVerified && <Icon name="verified" size={18} className="profile-verified" color="#0095f6" />}
          </div>
          <h2 className="profile-username">@{profile.username}</h2>

          <div className="profile-bio-container">
            <div className="profile-bio-text">{profile.bio}</div>
            
            <div className="profile-threads-badge">
              <Icon name="threads" size={12} color="var(--text-h)" />
              <span>{profile.threadsUsername}</span>
            </div>
            
            <ul className="profile-stats">

              <li><strong>{profile.postsCount}</strong> posts</li>
            </ul>


          </div>
          
          <div className="profile-actions-mobile">
            {profile.isPersona && isOwnProfile ? (
              <>
                {profile.isActive ? (
                  <Button variant="secondary" disabled className="flex-1">Active Persona</Button>
                ) : (
                  <Button variant="primary" className="flex-1" onClick={handleMakeActive}>Make Active</Button>
                )}
                <Button variant="secondary" className="flex-1" onClick={() => setIsEditPersonaModalOpen(true)}>Edit persona</Button>
              </>
            ) : profile.isPersona ? (
              null // Don't show anything for someone else's persona
            ) : isOwnProfile ? (
              <Button variant="secondary" className="flex-1" onClick={() => setIsEditPersonaModalOpen(true)}>Edit profile</Button>
            ) : (
              <>
              </>
            )}
            <Button variant="secondary" className="profile-add-contact">
              <Icon name="addContact" size={16} />
            </Button>
          </div>
        </section>
      </div>


      
      <EditPersonaModal
        isOpen={isEditPersonaModalOpen}
        onClose={() => setIsEditPersonaModalOpen(false)}
        persona={profile}
        onSaveSuccess={(updatedPersona) => {
          if (onProfileUpdate) onProfileUpdate(updatedPersona);
        }}
      />
    </header>
  );
};
