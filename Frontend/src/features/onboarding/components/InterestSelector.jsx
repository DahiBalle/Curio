import React, { useState } from 'react';
import './InterestSelector.css';

const SUGGESTED_INTERESTS = [
  'Skateboarding', 'Technology', 'Music', 'Gaming', 'Art',
  'Coding', 'Fashion', 'Fitness', 'Food', 'Travel',
  'Movies', 'Books', 'Photography', 'Design', 'Science'
];

export function InterestSelector({ interests, onChange }) {
  const [searchTerm, setSearchTerm] = useState('');

  const handleAdd = (interest) => {
    if (interests.length < 10 && !interests.includes(interest)) {
      onChange([...interests, interest]);
    }
  };

  const handleRemove = (interestToRemove) => {
    onChange(interests.filter(i => i !== interestToRemove));
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && searchTerm.trim()) {
      handleAdd(searchTerm.trim());
      setSearchTerm('');
    }
  };

  // Filter suggested that are not already selected and match search
  const availableSuggestions = SUGGESTED_INTERESTS.filter(
    i => !interests.includes(i) && i.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="interest-selector">
      <div className="interest-selector-header">
        <span className="interest-count">{interests.length}/10 selected</span>
      </div>

      {/* Selected Interests Area */}
      <div className="selected-interests-area">
        {interests.length === 0 ? (
          <div className="empty-interests-text">Select topics to personalize your feed</div>
        ) : (
          <div className="selected-interests-grid">
            {interests.map(interest => (
              <button 
                key={interest} 
                className="interest-chip selected" 
                onClick={() => handleRemove(interest)}
              >
                {interest} ✕
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Search Input */}
      <div className="interest-search-container">
        <input 
          type="text"
          className="interest-search-input"
          placeholder="Search or add custom interest... (Press Enter)"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={interests.length >= 10}
        />
      </div>

      {/* Suggested Area */}
      <div className="suggested-interests-container">
        <h4 className="suggested-heading">Suggested for you</h4>
        <div className="suggested-interests-grid">
          {availableSuggestions.map(interest => (
            <button 
              key={interest} 
              className="interest-chip"
              onClick={() => handleAdd(interest)}
              disabled={interests.length >= 10}
            >
              + {interest}
            </button>
          ))}
          {searchTerm && !availableSuggestions.includes(searchTerm) && (
            <button 
              className="interest-chip custom"
              onClick={() => {
                handleAdd(searchTerm.trim());
                setSearchTerm('');
              }}
              disabled={interests.length >= 10}
            >
              + Add "{searchTerm}"
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
