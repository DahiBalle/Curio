import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './SearchOverlay.css';
import { useClickOutside } from '../../hooks/useClickOutside';

export const SearchOverlay = ({ onClose }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const overlayRef = useRef(null);
  const navigate = useNavigate();

  useClickOutside(overlayRef, onClose);

  const handleSearch = () => {
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      onClose();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="search-overlay-backdrop">
      <div className="search-overlay" ref={overlayRef}>
        <div className="search-overlay__inner">
          <svg className="search-overlay__icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            className="search-overlay__input"
            placeholder="Find anything"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            autoFocus
          />
          <button className="search-overlay__ask-btn" onClick={handleSearch}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
            </svg>
            Ask
          </button>
        </div>
      </div>
    </div>
  );
};
