import React from 'react';
import './ProfileFeed.css';
import { Icon } from '../../../components/ui/Icon';

export const ProfileFeed = ({ posts }) => {
  if (!posts || posts.length === 0) return (
    <div className="profile-feed-empty">No posts yet.</div>
  );

  return (
    <div className="profile-feed-grid">
      {posts.map((post) => (
        <div key={post.id} className="profile-feed-item">
          <img src={post.imageUrl} alt="Post" className="profile-feed-image" />
          {post.type === 'video' && (
            <div className="profile-feed-icon">
              <Icon name="reels" size={20} color="#fff" />
            </div>
          )}
          <div className="profile-feed-overlay">
            <div className="profile-feed-stats">
              <span>❤️ 1.2k</span>
              <span>💬 300</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
