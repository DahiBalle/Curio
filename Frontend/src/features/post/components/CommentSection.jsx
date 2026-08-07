import React, { useState } from 'react';
import { CommentItem } from './CommentItem';
import { postApi } from '../api/postApi';
import './CommentSection.css';

export const CommentSection = ({ comments = [], postId, onCommentAdded }) => {
  const [topLevelComments, setTopLevelComments] = useState(comments);
  const [newCommentContent, setNewCommentContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleTopLevelSubmit = async (e) => {
    e.preventDefault();
    if (!newCommentContent.trim()) return;

    setIsSubmitting(true);
    try {
      const newComment = await postApi.createComment(postId, newCommentContent);
      setTopLevelComments([newComment, ...topLevelComments]);
      setNewCommentContent('');
      if (onCommentAdded) onCommentAdded();
    } catch (error) {
      console.error('Failed to post comment', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="comment-section">
      <div className="comment-section__header">
        <h3>Comments</h3>
      </div>
      
      <form className="comment-create-form" onSubmit={handleTopLevelSubmit}>
        <input
          type="text"
          placeholder="Add a comment..."
          value={newCommentContent}
          onChange={(e) => setNewCommentContent(e.target.value)}
          disabled={isSubmitting}
          className="comment-create-input"
        />
        <button type="submit" disabled={isSubmitting || !newCommentContent.trim()} className="comment-create-submit">
          Comment
        </button>
      </form>

      <div className="comment-section__list">
        {topLevelComments.length === 0 ? (
          <div className="comment-section__empty">No comments yet. Be the first to start the conversation!</div>
        ) : (
          topLevelComments.map(comment => (
            <CommentItem 
              key={comment.id} 
              comment={comment} 
              postId={postId}
              onReplyAdded={onCommentAdded} 
            />
          ))
        )}
      </div>
    </div>
  );
};
