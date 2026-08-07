import React, { useEffect, useRef } from 'react';
import './PostFeed.css';
import { PostPreview } from './PostPreview'; // Now in the same folder

export const PostFeed = ({ posts, fetchMore, loadingMore, hasMore }) => {
  const loadMoreRef = useRef(null);

  useEffect(() => {
    if (!hasMore || loadingMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && fetchMore) {
          fetchMore();
        }
      },
      { threshold: 0.1 }
    );

    const currentRef = loadMoreRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [hasMore, loadingMore, fetchMore]);

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
      
      {hasMore && (
        <div 
          ref={loadMoreRef} 
          style={{ height: '50px', display: 'flex', justifyContent: 'center', alignItems: 'center', margin: '20px 0' }}
        >
          {loadingMore && <span style={{ color: '#888' }}>Loading more...</span>}
        </div>
      )}
      
      {!hasMore && posts.length > 0 && (
        <div style={{ textAlign: 'center', padding: '40px', color: '#888' }}>
          <h3>No more posts to show</h3>
          <p>You've caught up on all the content for this persona!</p>
        </div>
      )}
    </div>
  );
};
