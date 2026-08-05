import React, { useState } from 'react';
import './MessagesList.css';
import { Avatar } from '../../../components/ui/Avatar';
import { useAuth } from '../../../context/AuthContext';
import { RequestsModal } from './RequestsModal';

export const MessagesList = ({ threads, requests, onAcceptRequest, onDeclineRequest }) => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [isRequestsModalOpen, setIsRequestsModalOpen] = useState(false);

  const filteredThreads = threads.filter(t =>
    t.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.user.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="messages-list">
      <div className="messages-list__header">
        <h2 className="messages-list__username">{user?.username || 'Messages'}</h2>
      </div>

      <div className="messages-list__search">
        <div className="messages-search-bar">
          <svg className="messages-search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input
            type="text"
            placeholder="Search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="messages-list__tabs">
        <h3 className="messages-tab active">Messages</h3>
        {requests.length > 0 ? (
          <button className="requests-tab-btn" onClick={() => setIsRequestsModalOpen(true)}>
            Requests <span className="requests-count">({requests.length})</span>
          </button>
        ) : (
          <span className="requests-tab-empty">Requests</span>
        )}
      </div>

      <div className="messages-list__threads">
        {filteredThreads.map(thread => (
          <div key={thread.id} className="thread-item">
            <div className="thread-item__avatar">
              <Avatar src={thread.user.avatarUrl} alt={thread.user.name} size="medium" />
              {thread.isUnread && <div className="thread-item__unread-dot" />}
            </div>
            <div className="thread-item__content">
              <span className={`thread-item__name ${thread.isUnread ? 'unread' : ''}`}>{thread.user.name}</span>
              <div className="thread-item__snippet-row">
                <span className={`thread-item__snippet ${thread.isUnread ? 'unread' : ''}`}>{thread.lastMessage}</span>
                <span className="thread-item__time">· {thread.timeAgo}</span>
              </div>
            </div>
            {thread.isMuted && (
              <div className="thread-item__muted">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                  <line x1="23" y1="9" x2="17" y2="15"></line>
                  <line x1="17" y1="9" x2="23" y2="15"></line>
                </svg>
              </div>
            )}
          </div>
        ))}
      </div>

      {isRequestsModalOpen && (
        <RequestsModal
          requests={requests}
          onClose={() => setIsRequestsModalOpen(false)}
          onAccept={(id) => {
            onAcceptRequest(id);
            if (requests.length <= 1) setIsRequestsModalOpen(false);
          }}
          onDecline={(id) => {
            onDeclineRequest(id);
            if (requests.length <= 1) setIsRequestsModalOpen(false);
          }}
        />
      )}
    </div>
  );
};
