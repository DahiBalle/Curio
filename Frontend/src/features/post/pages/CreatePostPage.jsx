import React from 'react';
import './CreatePostPage.css';
import { useCreatePost } from '../hooks/useCreatePost';
import { ImageUploader } from '../components/ImageUploader';
import { CancelModal } from '../components/CancelModal';

export const CreatePostPage = () => {
  const {
    images,
    title,
    body,
    availableTopics,
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

  const handleBroadTopicChange = (e) => {
    const selectedId = e.target.value;
    const topic = availableTopics.find(t => t.id === selectedId);
    setBroadTopic(topic || null);
    setNarrowTopic(null); // Reset narrow topic when broad changes
  };

  const handleNarrowTopicChange = (e) => {
    if (!broadTopic) return;
    const selectedId = e.target.value;
    const topic = broadTopic.subtopics.find(t => t.id === selectedId);
    setNarrowTopic(topic || null);
  };

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
            <select 
              className="topic-select" 
              value={broadTopic?.id || ''} 
              onChange={handleBroadTopicChange}
              required
            >
              <option value="" disabled>Select Broad Topic*</option>
              {availableTopics.map(topic => (
                <option key={topic.id} value={topic.id}>{topic.name}</option>
              ))}
            </select>
            
            <select 
              className="topic-select" 
              value={narrowTopic?.id || ''} 
              onChange={handleNarrowTopicChange}
              disabled={!broadTopic}
              required
            >
              <option value="" disabled>Select Narrow Topic*</option>
              {broadTopic?.subtopics?.map(topic => (
                <option key={topic.id} value={topic.id}>{topic.name}</option>
              ))}
            </select>
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
    </div>
  );
};
