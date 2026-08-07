import React from 'react';
import './PostFeed.css';
import { PostPreview } from './PostPreview'; // Now in the same folder

export const PostFeed = ({ posts }) => {
  if (!posts || posts.length === 0) return (
    <div className="post-feed-empty" style={{ textAlign: 'center', padding: '40px', color: '#888' }}>
      <h3>No more posts to show</h3>
      <p>You've caught up on all the content for this persona! Check back later or create a new post.</p>
    </div>
  );

  return (
    <div className="post-feed-container">
      {posts.map((post) => (
        <PostPreview key={post.id} post={post} />
      ))}
    </div>
  );
};
