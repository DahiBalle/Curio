import React from 'react';
import './MessagesPage.css';
import { useMessages } from '../hooks/useMessages';
import { MessagesList } from '../components/MessagesList';
import { MessagesEmptyState } from '../components/MessagesEmptyState';

export const MessagesPage = () => {
  const { threads, requests, loading, error, acceptRequest, declineRequest } = useMessages();

  if (error) {
    return <div className="messages-page-error">{error}</div>;
  }

  return (
    <div className="messages-page-layout">
      <aside className="messages-page-sidebar">
        {loading ? (
          <div className="messages-page-loading">Loading...</div>
        ) : (
          <MessagesList 
            threads={threads} 
            requests={requests}
            onAcceptRequest={acceptRequest}
            onDeclineRequest={declineRequest}
          />
        )}
      </aside>
      
      <main className="messages-page-main">
        <MessagesEmptyState />
      </main>
    </div>
  );
};
