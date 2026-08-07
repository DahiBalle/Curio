import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import client from '../../../services/client';
import { postApi } from '../api/postApi';
import './PostPreview.css';
import { Avatar } from '../../../components/ui/Avatar';
import { usePersona } from '../../../context/PersonaContext';

export const PostPreview = ({ post, isDetailView = false }) => {
  const navigate = useNavigate();
  const { activePersona } = usePersona();
  const cardRef = useRef(null);
  const impressionRecorded = useRef(false);
  const authorName = post.author?.name || post.subreddit || 'Unknown';
  const authorAvatar = post.author?.avatar || post.authorAvatar;
  const timeAgo = post.created_at ? new Date(post.created_at).toLocaleDateString() : post.timeAgo;
  const imageUrl = post.media && post.media.length > 0 ? post.media[0].url : post.imageUrl;
  const description = post.content || post.description;
  const hasImage = !!imageUrl;
  
  const [isLiked, setIsLiked] = useState(post.is_liked || false);
  const [likeCount, setLikeCount] = useState(post.stats?.likes || post.upvotes || 0);
  
  const commentsCount = post.stats?.comments || post.commentsCount || 0;
  const label = post.tags || post.label;

  const handleLike = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    const newIsLiked = !isLiked;
    setIsLiked(newIsLiked);
    setLikeCount(prev => newIsLiked ? prev + 1 : Math.max(0, prev - 1));
    
    try {
      const direction = newIsLiked ? 1 : 0;
      await postApi.votePost(post.id, direction, activePersona?.id);
    } catch (err) {
      setIsLiked(!newIsLiked);
      setLikeCount(prev => !newIsLiked ? prev + 1 : Math.max(0, prev - 1));
      console.error('Failed to toggle like:', err);
    }
  };

  useEffect(() => {
    if (isDetailView) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && !impressionRecorded.current) {
          impressionRecorded.current = true;
          postApi.recordImpression([post.id], activePersona?.id).catch(err => console.error(err));
          observer.disconnect();
        }
      },
      { threshold: 0.5 } // Record impression when 50% of the post is visible
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, [post.id, isDetailView, activePersona?.id]);

  const handleCardClick = (e) => {
    if (isDetailView) return;
    
    // Check if the click originated from an interactive element
    const isInteractive = e.target.closest('button') || e.target.closest('a');
    if (isInteractive) return;

    // Record click and navigate
    postApi.recordClick(post.id, activePersona?.id).catch(err => console.error(err));
    navigate(`/post/${post.id}`);
  };

  return (
    <article 
      className={`post-preview ${isDetailView ? 'post-preview--detail' : ''}`} 
      ref={cardRef} 
      onClick={handleCardClick}
      style={{ cursor: isDetailView ? 'default' : 'pointer' }}
    >
      {/* Header: Avatar + subreddit + time + options */}
      <div className="post-preview__header">
        <div className="post-preview__header-left">
          <Avatar src={authorAvatar} alt={authorName} size="small" />
          <Link 
            to={post.author?.username ? `/profile/${post.author.username}` : '#'} 
            className="post-preview__subreddit"
            onClick={(e) => e.stopPropagation()}
            style={{ textDecoration: 'none', color: 'inherit' }}
          >
            {authorName}
          </Link>
          <span className="post-preview__dot">•</span>
          <span className="post-preview__time">{timeAgo}</span>
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
      {!hasImage && label && (
        <div className="post-preview__label-row">
          <span className="post-preview__label">{label}</span>
        </div>
      )}

      {/* Description with truncation */}
      {description && (
        <p className={`post-preview__description ${isDetailView ? 'post-preview__description--full' : (hasImage ? 'post-preview__description--short' : 'post-preview__description--long')}`}>
          {description}
        </p>
      )}

      {/* Image */}
      {hasImage && (
        <div className="post-preview__media">
          <img
            src={imageUrl}
            alt={post.title}
            className="post-preview__image"
            loading="lazy"
          />
        </div>
      )}

      {/* Footer: action buttons */}
      <div className="post-preview__footer">
        <button 
          className={`post-preview__action-btn ${isLiked ? 'post-preview__action-btn--liked' : ''}`}
          onClick={handleLike}
          style={isLiked ? { color: '#ff3040' } : {}}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill={isLiked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
          </svg>
          <span>{likeCount}</span>
        </button>

        <button className="post-preview__action-btn">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          <span>{commentsCount}</span>
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

      {/* Comment Input Box for Detail View */}
      {isDetailView && (
        <div className="post-preview__comment-box" onClick={(e) => e.stopPropagation()}>
          <input 
            type="text" 
            placeholder="Join the conversation" 
            className="post-preview__comment-input"
          />
        </div>
      )}
    </article>
  );
};
