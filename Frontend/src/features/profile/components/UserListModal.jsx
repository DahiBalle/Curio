import React, { useState } from 'react';
import './UserListModal.css';
import { Avatar } from '../../../components/ui/Avatar';

export const UserListModal = ({ isOpen, onClose, title, users, actionType }) => {
  const [searchQuery, setSearchQuery] = useState('');

  if (!isOpen) return null;

  // Handle click on the background overlay to close
  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    user.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="user-list-modal-overlay" onClick={handleOverlayClick}>
      <div className="user-list-modal">
        <div className="user-list-modal-header">
          <h3>{title}</h3>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>
        
        <div className="user-list-modal-search">
          <div className="search-input-wrapper">
            <span className="search-icon">🔍</span>
            <input 
              type="text" 
              placeholder="Search" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="user-list-modal-content">
          {filteredUsers.map(user => (
            <div key={user.id} className="user-list-item">
              <div className="user-info">
                <Avatar src={user.avatarUrl} alt={user.name} size="medium" />
                <div className="user-details">
                  <div className="user-name-row">
                    <span className="user-username">{user.username}</span>
                    {user.isVerified && <span className="verified-badge">✔</span>}
                  </div>
                  <span className="user-fullname">{user.name}</span>
                </div>
              </div>
              <div className="user-action">
                {actionType === 'following' ? (
                  <button className="action-btn following-btn">Following</button>
                ) : (
                  <button className="action-btn remove-btn">Remove</button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
