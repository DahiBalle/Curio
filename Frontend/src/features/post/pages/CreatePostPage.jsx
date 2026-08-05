import React from 'react';
import './CreatePostPage.css';
import { useCreatePost } from '../hooks/useCreatePost';
import { ImageUploader } from '../components/ImageUploader';
import { LabelModal } from '../components/LabelModal';
import { CancelModal } from '../components/CancelModal';

const AVAILABLE_LABELS = [
  { id: 'tech', label: 'Technology', icon: '💻' },
  { id: 'art', label: 'Art & Design', icon: '🎨' },
  { id: 'gaming', label: 'Gaming', icon: '🎮' },
  { id: 'music', label: 'Music', icon: '🎵' },
  { id: 'science', label: 'Science', icon: '🔬' },
  { id: 'memes', label: 'Memes', icon: '😂' },
  { id: 'news', label: 'News', icon: '📰' },
  { id: 'sports', label: 'Sports', icon: '⚽' },
];

export const CreatePostPage = () => {
  const {
    images,
    title,
    body,
    labels,
    isSubmitting,
    error,
    isValid,
    isCancelModalOpen,
    setIsCancelModalOpen,
    isLabelModalOpen,
    setIsLabelModalOpen,
    addImages,
    removeImage,
    setTitle,
    setBody,
    toggleLabel,
    submitPost,
    handleCancelClick,
    confirmCancel
  } = useCreatePost();

  return (
    <div className="create-post-page">
      <div className="create-post-content">
        <header className="create-post-header">
          <h1 className="create-post-title">Create a post</h1>
          <button type="button" className="btn-cancel" onClick={handleCancelClick}>
            Cancel
          </button>
        </header>
        
        {error && <div className="create-post-error">{error}</div>}

        <form className="create-post-form" onSubmit={submitPost}>
          
          <div className="form-section row-section">
            <button 
              type="button" 
              className="btn-add-label"
              onClick={() => setIsLabelModalOpen(true)}
            >
              Select label-tiles*
            </button>
            <div className="inline-labels-container">
              {labels.map(id => {
                const labelObj = AVAILABLE_LABELS.find(l => l.id === id);
                return (
                  <button 
                    key={`inline-sel-${id}`} 
                    className="inline-selected-label"
                    onClick={() => toggleLabel(id)}
                    type="button"
                  >
                    {labelObj?.label || id} &times;
                  </button>
                );
              })}
              {labels.length > 0 && (
                <span className="selected-labels-text">
                  {labels.length} selected
                </span>
              )}
            </div>
          </div>

          <div className="form-section">
            <input 
              type="text"
              className="title-input"
              placeholder="Title*"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={300}
            />
          </div>

          <div className="form-section">
            <textarea 
              className="body-input"
              placeholder="Body text (optional)"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows="6"
            />
          </div>

          <div className="form-section">
            <ImageUploader 
              images={images} 
              onAddImages={addImages} 
              onRemoveImage={removeImage} 
            />
          </div>

          <div className="create-post-footer">
            <button 
              type="submit" 
              className="btn-publish" 
              disabled={!isValid || isSubmitting}
            >
              {isSubmitting ? 'Publishing...' : 'Post'}
            </button>
          </div>

        </form>
      </div>

      {isLabelModalOpen && (
        <LabelModal
          availableLabels={AVAILABLE_LABELS}
          selectedLabels={labels}
          onToggleLabel={toggleLabel}
          onClose={() => setIsLabelModalOpen(false)}
        />
      )}

      {isCancelModalOpen && (
        <CancelModal 
          onConfirm={confirmCancel} 
          onClose={() => setIsCancelModalOpen(false)} 
        />
      )}
    </div>
  );
};
