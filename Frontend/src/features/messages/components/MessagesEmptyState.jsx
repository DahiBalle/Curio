import React from 'react';
import './MessagesEmptyState.css';

export const MessagesEmptyState = () => {
  return (
    <div className="messages-empty">
      <div className="messages-empty__icon-container">
        <svg className="messages-empty__icon" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
          <line x1="22" y1="2" x2="11" y2="13" />
          <polygon points="22 2 15 22 11 13 2 9 22 2" />
        </svg>
      </div>
      <h2 className="messages-empty__title">Your messages</h2>
      <p className="messages-empty__subtitle">Select user to chat with.</p>
      <button className="messages-empty__btn">Send message</button>
    </div>
  );
};
