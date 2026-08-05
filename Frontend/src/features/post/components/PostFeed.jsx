import React from 'react';
import './PostFeed.css';
import { PostPreview } from './PostPreview'; // Now in the same folder

export const PostFeed = ({ posts }) => {
  if (!posts || posts.length === 0) return (
    <div className="post-feed-empty">No posts yet.</div>
  );

  return (
    <div className="post-feed-container">
      {posts.map((post) => (
        <PostPreview key={post.id} post={post} />
      ))}
    </div>
  );
};
