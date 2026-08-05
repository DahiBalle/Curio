import React from 'react';
import './CancelModal.css';

export const CancelModal = ({ onConfirm, onClose }) => {
  return (
    <div className="cancel-modal-overlay" onClick={onClose}>
      <div className="cancel-modal" onClick={e => e.stopPropagation()}>
        <h3 className="cancel-modal__title">Discard post?</h3>
        <p className="cancel-modal__text">
          If you leave, your edits won't be saved.
        </p>
        <div className="cancel-modal__actions">
          <button className="btn-modal-discard" onClick={onConfirm}>Discard</button>
          <button className="btn-modal-cancel" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
};
