import React from 'react';
import './ProfileFeed.css';
import { PostPreview } from '../../post';

export const ProfileFeed = ({ posts }) => {
  if (!posts || posts.length === 0) return (
    <div className="profile-feed-empty">No posts yet.</div>
  );

  return (
    <div className="profile-feed-container">
      {posts.map((post) => (
        <PostPreview key={post.id} post={post} />
      ))}
    </div>
  );
};
