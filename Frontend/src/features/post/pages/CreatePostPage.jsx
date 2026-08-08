import React, { useState } from 'react';
import './CreatePostPage.css';
import { useCreatePost } from '../hooks/useCreatePost';
import { ImageUploader } from '../components/ImageUploader';
import { CancelModal } from '../components/CancelModal';
import { InterestSelector } from '../../onboarding';

export const CreatePostPage = () => {
  const {
    images,
    title,
    body,
    broadTopic,
    narrowTopic,
    isSubmitting,
    error,
    isValid,
    isCancelModalOpen,
    setIsCancelModalOpen,
    addImages,
    removeImage,
    setTitle,
    setBody,
    setBroadTopic,
    setNarrowTopic,
    submitPost,
    handleCancelClick,
    confirmCancel
  } = useCreatePost();

  const [activeModal, setActiveModal] = useState(null); // 'broad' or 'specific'

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
          
          <div className="form-section row-section" style={{ gap: '10px' }}>
            <button 
              type="button" 
              className="topic-button" 
              onClick={() => setActiveModal('broad')}
              style={{
                flex: 1, padding: '12px 16px', borderRadius: '8px', 
                border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text-h)',
                textAlign: 'left', cursor: 'pointer', fontSize: '15px'
              }}
            >
              {broadTopic ? `Broad: ${broadTopic}` : 'Select Broad Topic*'}
            </button>
            <input 
              type="text"
              className="topic-input"
              placeholder="Specific Topic (Optional)"
              value={narrowTopic || ''}
              onChange={(e) => setNarrowTopic(e.target.value)}
              disabled={!broadTopic}
              style={{
                flex: 1, padding: '12px 16px', borderRadius: '8px', 
                border: '1px solid var(--border)', background: 'var(--bg)', color: broadTopic ? 'var(--text-h)' : 'var(--text)',
                fontSize: '15px', opacity: broadTopic ? 1 : 0.5
              }}
            />
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



      {isCancelModalOpen && (
        <CancelModal 
          onConfirm={confirmCancel} 
          onClose={() => setIsCancelModalOpen(false)} 
        />
      )}

      {/* Broad Topic Modal */}
      {activeModal === 'broad' && (
        <div className="modal-overlay" onClick={() => setActiveModal(null)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.4)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ padding: '20px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '12px', minWidth: '500px', maxHeight: '80vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2>Select Broad Topic</h2>
              <button type="button" onClick={() => setActiveModal(null)} style={{ background: 'none', border: 'none', color: 'var(--text)', cursor: 'pointer', fontSize: '20px' }}>✕</button>
            </div>
            <InterestSelector 
              interests={broadTopic ? [broadTopic] : []}
              onChange={(newInterests) => {
                setBroadTopic(newInterests.length > 0 ? newInterests[0] : null);
                if (newInterests.length === 0) setNarrowTopic(null);
                if (newInterests.length > 0) setActiveModal(null); // Close modal on select
              }}
              limit={1}
            />
          </div>
        </div>
      )}

    </div>
  );
};
