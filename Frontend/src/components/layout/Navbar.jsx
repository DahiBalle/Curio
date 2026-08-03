import React, { useState } from 'react';
import './Navbar.css';
import { Avatar } from '../ui/Avatar';

export const Navbar = () => {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <nav className="navbar">
      {/* Left: Brand */}
      <div className="navbar__brand">
        <span className="navbar__logo-text">Curio</span>
      </div>

      {/* Center: Search bar */}
      <div className="navbar__search">
        <div className="navbar__search-inner">
          <svg className="navbar__search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            className="navbar__search-input"
            placeholder="Find anything"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button className="navbar__ask-btn">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
            </svg>
            Ask
          </button>
        </div>
      </div>

      {/* Right: Action icons */}
      <div className="navbar__actions">
        {/* Chat */}
        <button className="navbar__icon-btn" aria-label="Chat">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        </button>

        {/* Create Post */}
        <button className="navbar__icon-btn" aria-label="Create">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <line x1="12" y1="8" x2="12" y2="16" />
            <line x1="8" y1="12" x2="16" y2="12" />
          </svg>
          <span className="navbar__icon-label">Create</span>
        </button>

        {/* Notifications */}
        <button className="navbar__icon-btn" aria-label="Notifications">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
        </button>

        {/* User avatar */}
        <button className="navbar__avatar-btn" aria-label="Profile">
          <Avatar src="https://picsum.photos/id/64/32/32" alt="User" size="small" />
        </button>
      </div>
    </nav>
  );
};
