import React, { useRef } from 'react';
import './ImageUploader.css';

export const ImageUploader = ({ images, onAddImages, onRemoveImage }) => {
  const fileInputRef = useRef(null);

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      onAddImages(e.target.files);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onAddImages(e.dataTransfer.files);
    }
  };

  return (
    <div className="image-uploader-container">
      {images.length > 0 && (
        <div className="image-preview-slider">
          {images.map((img, index) => (
            <div key={index} className="image-preview-item">
              <img src={img.previewUrl} alt={`preview-${index}`} />
              <button 
                type="button" 
                className="btn-remove-image"
                onClick={() => onRemoveImage(index)}
                title="Remove image"
              >
                &times;
              </button>
            </div>
          ))}
        </div>
      )}

      {images.length < 4 && (
        <div 
          className={`upload-zone ${images.length > 0 ? 'compact' : ''}`}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="upload-zone-content">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
            <span className="upload-zone-text">Click or drag photos here</span>
          </div>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileSelect} 
            accept="image/*,video/*" 
            multiple 
            hidden 
          />
        </div>
      )}
    </div>
  );
};
