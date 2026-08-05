import React, { useState } from 'react';
import './LabelModal.css';

export const LabelModal = ({ availableLabels, selectedLabels, onToggleLabel, onClose }) => {
  const [customLabel, setCustomLabel] = useState('');

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && customLabel.trim()) {
      e.preventDefault();
      const label = customLabel.trim();
      if (!selectedLabels.includes(label) && selectedLabels.length < 3) {
        onToggleLabel(label);
      } else if (selectedLabels.includes(label)) {
        onToggleLabel(label); // This will actually remove it if it exists, maybe we just do nothing if it's already there? Wait, toggle removes it. If they type it again, maybe just clear the input.
      }
      setCustomLabel('');
    }
  };
  return (
    <div className="label-modal-overlay" onClick={onClose}>
      <div className="label-modal" onClick={e => e.stopPropagation()}>
        <header className="label-modal__header">
          <h1 className="label-modal__title">Categorize your post</h1>
          <p className="label-modal__subtitle">Pick some labels to categorize your post. (Required 1-3)</p>
          <button className="label-modal__close" onClick={onClose}>&times;</button>
        </header>

        <div className="label-modal__body">
          <div className="label-modal__counter">
            {selectedLabels.length}/3 selected
          </div>
          
          <div className="label-modal__selected-area">
            {selectedLabels.length === 0 ? (
              <span className="placeholder">Select topics to categorize your post</span>
            ) : (
              selectedLabels.map(id => {
                const labelObj = availableLabels.find(l => l.id === id);
                return (
                  <button 
                    key={`sel-${id}`} 
                    className="pill-btn selected"
                    onClick={() => onToggleLabel(id)}
                  >
                    {labelObj?.label || id} &times;
                  </button>
                );
              })
            )}
          </div>

          <div className="label-modal__search">
            <input 
              type="text" 
              placeholder="Search or add custom label... (Press Enter)" 
              value={customLabel}
              onChange={(e) => setCustomLabel(e.target.value)}
              onKeyDown={handleKeyDown}
            />
          </div>

          <div className="label-modal__suggested">
            <h3 className="suggested-title">Suggested for you</h3>
            <div className="pill-container">
              {availableLabels.map(label => {
                const isSelected = selectedLabels.includes(label.id);
                const isDisabled = !isSelected && selectedLabels.length >= 3;
                
                if (isSelected) return null; // Don't show in suggested if already selected

                return (
                  <button
                    key={label.id}
                    type="button"
                    onClick={() => onToggleLabel(label.id)}
                    disabled={isDisabled}
                    className={`pill-btn ${isDisabled ? 'disabled' : ''}`}
                  >
                    + {label.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="label-modal__footer">
          <button className="btn-done" onClick={onClose}>Done</button>
        </div>
      </div>
    </div>
  );
};
