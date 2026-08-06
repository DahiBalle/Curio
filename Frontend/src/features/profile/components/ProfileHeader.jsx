import React from 'react';
import './ProfileHeader.css';
import { Avatar } from '../../../components/ui/Avatar';
import { Button } from '../../../components/ui/Button';
import { Icon } from '../../../components/ui/Icon';
import { UserListModal } from './UserListModal';
import { EditProfileModal } from './EditProfileModal';
import { useAuth } from '../../../context/AuthContext';

export const ProfileHeader = ({ profile, onProfileUpdate }) => {
  const { user } = useAuth();
  const [isFollowingModalOpen, setIsFollowingModalOpen] = React.useState(false);
  const [isFollowersModalOpen, setIsFollowersModalOpen] = React.useState(false);
  const [isEditProfileModalOpen, setIsEditProfileModalOpen] = React.useState(false);

  const isOwnProfile = profile.username === user?.username;

  // Mock data for the modals
  const mockFollowing = [
    { id: 1, name: 'Rahul Sharma', username: 'rahulsharma', avatarUrl: 'https://picsum.photos/seed/rahul/40', isVerified: true },
    { id: 2, name: 'Chahna Acharya', username: 'chahna_acharya', avatarUrl: 'https://picsum.photos/seed/chahna/40', isVerified: false },
    { id: 3, name: 'Patel', username: 'patel155', avatarUrl: 'https://picsum.photos/seed/patel/40', isVerified: false },
    { id: 4, name: 'Ketani', username: 'ketani_74', avatarUrl: 'https://picsum.photos/seed/ketani/40', isVerified: true },
  ];

  const mockFollowers = [
    { id: 5, name: 'Alice Smith', username: 'alicesmith', avatarUrl: 'https://picsum.photos/seed/alice/40', isVerified: false },
    { id: 6, name: 'Bob Jones', username: 'bobjones', avatarUrl: 'https://picsum.photos/seed/bob/40', isVerified: true },
    { id: 7, name: 'Charlie Brown', username: 'charlieb', avatarUrl: 'https://picsum.photos/seed/charlie/40', isVerified: false },
  ];

  if (!profile) return null;

  return (
    <header className="profile-header">
      <div className="profile-header__banner">
        {profile.bannerUrl ? (
          <img src={profile.bannerUrl} alt={`${profile.name} banner`} className="profile-banner-image" />
        ) : (
          <div className="profile-header__banner-placeholder"></div>
        )}
      </div>

      <div className="profile-header__bottom">
        <div className="profile-header__top-row">
          <div className="profile-header__avatar">
            <Avatar src={profile.avatarUrl} alt={profile.name} size="large" />
          </div>
          
          <div className="profile-actions-desktop">
            <button className="profile-options-btn">
              <Icon name="options" size={24} />
            </button>
            {isOwnProfile ? (
              <Button variant="secondary" onClick={() => setIsEditProfileModalOpen(true)}>Edit profile</Button>
            ) : (
              <>
                <Button variant="secondary">Message</Button>
                <Button variant="primary">Follow</Button>
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
              <li onClick={() => setIsFollowingModalOpen(true)} style={{ cursor: 'pointer' }}><strong>{profile.followingCount}</strong> following</li>
              <li onClick={() => setIsFollowersModalOpen(true)} style={{ cursor: 'pointer' }}><strong>{profile.followersCount}</strong> followers</li>
              <li><strong>{profile.postsCount}</strong> posts</li>
            </ul>

            {profile.followedByCount > 0 && (
              <div className="profile-followed-by">
                <div className="profile-followed-by-avatars">
                  <Avatar src="https://picsum.photos/24/24" size="small" />
                  <Avatar src="https://picsum.photos/25/25" size="small" className="avatar-overlap" />
                  <Avatar src="https://picsum.photos/26/26" size="small" className="avatar-overlap" />
                </div>
                <span>
                  Followed by <strong>{profile.followedBy[0]}</strong>, <strong>{profile.followedBy[1]}</strong> + {profile.followedByCount} more
                </span>
              </div>
            )}
          </div>
          
          <div className="profile-actions-mobile">
            {isOwnProfile ? (
              <Button variant="secondary" className="flex-1" onClick={() => setIsEditProfileModalOpen(true)}>Edit profile</Button>
            ) : (
              <>
                <Button variant="primary" className="flex-1">Follow</Button>
                <Button variant="secondary" className="flex-1">Message</Button>
              </>
            )}
            <Button variant="secondary" className="profile-add-contact">
              <Icon name="addContact" size={16} />
            </Button>
          </div>
        </section>
      </div>

      <UserListModal 
        isOpen={isFollowingModalOpen}
        onClose={() => setIsFollowingModalOpen(false)}
        title="Following"
        users={mockFollowing}
        actionType="following"
      />
      
      <UserListModal 
        isOpen={isFollowersModalOpen}
        onClose={() => setIsFollowersModalOpen(false)}
        title="Followers"
        users={mockFollowers}
        actionType="remove"
      />
      
      <EditProfileModal
        isOpen={isEditProfileModalOpen}
        onClose={() => setIsEditProfileModalOpen(false)}
        profile={profile}
        onSaveSuccess={(updatedProfile) => {
          if (onProfileUpdate) onProfileUpdate(updatedProfile);
        }}
      />
    </header>
  );
};
