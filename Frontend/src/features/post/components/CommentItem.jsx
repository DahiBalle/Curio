import React, { useState } from 'react';
import { Avatar } from '../../../components/ui/Avatar';
import './CommentSection.css';
import { postApi } from '../api/postApi';

export const CommentItem = ({ comment, postId, onReplyAdded }) => {
  const [isReplying, setIsReplying] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localReplies, setLocalReplies] = useState(comment.replies || []);

  const handleReplySubmit = async (e) => {
    e.preventDefault();
    if (!replyContent.trim()) return;

    setIsSubmitting(true);
    try {
      const newComment = await postApi.createComment(postId, replyContent, comment.id);
      setLocalReplies([...localReplies, newComment]);
      setReplyContent('');
      setIsReplying(false);
      if (onReplyAdded) onReplyAdded();
    } catch (error) {
      console.error('Failed to post reply', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="comment-thread">
      <div className="comment-item">
        <div className="comment-item__sidebar">
          <Avatar src={comment.authorAvatar} alt={comment.author} size="small" />
          {localReplies && localReplies.length > 0 && (
            <div className="comment-item__thread-line" />
          )}
        </div>
        <div className="comment-item__content">
          <div className="comment-item__header">
            <span className="comment-item__author">{comment.author}</span>
            <span className="comment-item__dot">•</span>
            <span className="comment-item__time">{comment.timeAgo}</span>
          </div>
          <div className="comment-item__text">{comment.content}</div>
          <div className="comment-item__actions">
            <button className="comment-item__action-btn">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path>
              </svg>
              <span>{comment.upvotes || 0}</span>
            </button>
            <button className="comment-item__action-btn" onClick={() => setIsReplying(!isReplying)}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
              <span>Reply</span>
            </button>
          </div>

          {isReplying && (
            <form className="comment-reply-form" onSubmit={handleReplySubmit}>
              <input
                type="text"
                placeholder="Write a reply..."
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                disabled={isSubmitting}
                className="comment-reply-input"
                autoFocus
              />
              <button type="submit" disabled={isSubmitting || !replyContent.trim()} className="comment-reply-submit">
                Post
              </button>
            </form>
          )}
        </div>
      </div>
      
      {localReplies && localReplies.length > 0 && (
        <div className="comment-replies">
          {localReplies.map(reply => (
            <CommentItem 
              key={reply.id} 
              comment={reply} 
              postId={postId}
              onReplyAdded={onReplyAdded}
            />
          ))}
        </div>
      )}
    </div>
  );
};
