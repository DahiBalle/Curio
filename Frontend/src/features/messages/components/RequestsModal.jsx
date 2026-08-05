import React from 'react';
import './RequestsModal.css';
import { Avatar } from '../../../components/ui/Avatar';

export const RequestsModal = ({ requests, onClose, onAccept, onDecline }) => {
  return (
    <div className="requests-modal-overlay" onClick={onClose}>
      <div className="requests-modal" onClick={e => e.stopPropagation()}>
        <header className="requests-modal__header">
          <h3 className="requests-modal__title">Message Requests</h3>
          <button className="requests-modal__close" onClick={onClose}>&times;</button>
        </header>

        <div className="requests-modal__body">
          {requests.length === 0 ? (
            <div className="requests-modal__empty">No pending requests.</div>
          ) : (
            requests.map(req => (
              <div key={req.id} className="request-item">
                <Avatar src={req.user.avatarUrl} alt={req.user.name} size="medium" />
                <div className="request-item__content">
                  <div className="request-item__header">
                    <span className="request-item__name">{req.user.name}</span>
                    <span className="request-item__time">{req.timeAgo}</span>
                  </div>
                  <p className="request-item__message">{req.message}</p>
                </div>
                <div className="request-item__actions">
                  <button className="request-btn request-btn--accept" onClick={() => onAccept(req.id)}>Accept</button>
                  <button className="request-btn request-btn--decline" onClick={() => onDecline(req.id)}>Decline</button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
