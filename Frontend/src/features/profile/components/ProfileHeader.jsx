import React from 'react';
import './ProfileHeader.css';
import { Avatar } from '../../../components/ui/Avatar';
import { Button } from '../../../components/ui/Button';
import { Icon } from '../../../components/ui/Icon';

export const ProfileHeader = ({ profile }) => {
  if (!profile) return null;

  return (
    <header className="profile-header">
      <div className="profile-header__avatar">
        <Avatar src={profile.avatarUrl} alt={profile.name} size="large" />
      </div>
      
      <section className="profile-header__info">
        <div className="profile-header__top-row">
          <h2 className="profile-username">{profile.username}</h2>
          {profile.isVerified && <Icon name="verified" size={18} className="profile-verified" color="#0095f6" />}
          
          <div className="profile-actions-desktop">
            <Button variant="primary">Follow</Button>
            <Button variant="secondary">Message</Button>
            <Button variant="secondary" className="profile-add-contact">
              <Icon name="addContact" size={16} />
            </Button>
          </div>
          
          <button className="profile-options-btn">
            <Icon name="options" size={24} />
          </button>
        </div>

        <ul className="profile-stats">
          <li><strong>{profile.postsCount}</strong> posts</li>
          <li><strong>{profile.followersCount}</strong> followers</li>
          <li><strong>{profile.followingCount}</strong> following</li>
        </ul>

        <div className="profile-bio-container">
          <h1 className="profile-name">{profile.name}</h1>
          <div className="profile-threads-badge">
            <Icon name="threads" size={12} color="var(--text-h)" />
            <span>{profile.threadsUsername}</span>
          </div>
          <div className="profile-bio-text">{profile.bio}</div>
          <a href="#" className="profile-bio-link">
            {profile.hashtag}
          </a>
          <a href="#" className="profile-external-link">
            <Icon name="link" size={14} />
            <span>{profile.link}</span>
          </a>
          
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
          <Button variant="primary" className="flex-1">Follow</Button>
          <Button variant="secondary" className="flex-1">Message</Button>
          <Button variant="secondary" className="profile-add-contact">
            <Icon name="addContact" size={16} />
          </Button>
        </div>
      </section>
    </header>
  );
};
