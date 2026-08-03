import React from 'react';
import './PostPreview.css';
import { Avatar } from '../../../components/ui/Avatar';

export const PostPreview = ({ post }) => {
  const hasImage = !!post.imageUrl;

  return (
    <article className="post-preview">
      {/* Header: Avatar + subreddit + time + options */}
      <div className="post-preview__header">
        <div className="post-preview__header-left">
          <Avatar src={post.authorAvatar} alt={post.subreddit} size="small" />
          <span className="post-preview__subreddit">{post.subreddit}</span>
          <span className="post-preview__dot">•</span>
          <span className="post-preview__time">{post.timeAgo}</span>
        </div>
        <button className="post-preview__options-btn" aria-label="More options">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <circle cx="5" cy="12" r="2" />
            <circle cx="12" cy="12" r="2" />
            <circle cx="19" cy="12" r="2" />
          </svg>
        </button>
      </div>

      {/* Title */}
      <h3 className="post-preview__title">{post.title}</h3>

      {/* Label badge (shown below title for text-only posts) */}
      {!hasImage && post.label && (
        <div className="post-preview__label-row">
          <span className="post-preview__label">{post.label}</span>
        </div>
      )}

      {/* Description with truncation */}
      {post.description && (
        <p className={`post-preview__description ${hasImage ? 'post-preview__description--short' : 'post-preview__description--long'}`}>
          {post.description}
        </p>
      )}

      {/* Image */}
      {hasImage && (
        <div className="post-preview__media">
          <img
            src={post.imageUrl}
            alt={post.title}
            className="post-preview__image"
            loading="lazy"
          />
        </div>
      )}

      {/* Footer: action buttons */}
      <div className="post-preview__footer">
        <button className="post-preview__action-btn">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 19V5M5 12l7-7 7 7" />
          </svg>
          <span>{post.upvotes}</span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 5v14M19 12l-7 7-7-7" />
          </svg>
        </button>

        <button className="post-preview__action-btn">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          <span>{post.commentsCount}</span>
        </button>

        <button className="post-preview__action-btn">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="1 4 1 10 7 10" />
            <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
          </svg>
        </button>

        <button className="post-preview__action-btn">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="18" cy="5" r="3" />
            <circle cx="6" cy="12" r="3" />
            <circle cx="18" cy="19" r="3" />
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
          </svg>
          <span>Share</span>
        </button>
      </div>
    </article>
  );
};
