import React, { useState, useEffect } from 'react';
import { authApi } from '../../auth/api/authApi';
import client from '../../../services/client';
import { useDebounce } from '../../../hooks/useDebounce';
import { isValidUsername } from '../../../utils/validators';
import '../../persona/components/EditPersonaModal.css';

export const EditUsernameModal = ({ isOpen, onClose, currentUsername, onSuccess }) => {
  const [username, setUsername] = useState('');
  const [status, setStatus] = useState('idle'); // 'idle' | 'checking' | 'available' | 'taken' | 'invalid'
  const [statusMsg, setStatusMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const debouncedUsername = useDebounce(username, 400);

  useEffect(() => {
    if (isOpen) {
      setUsername(currentUsername || '');
      setStatus('idle');
      setStatusMsg('');
      setIsSubmitting(false);
    }
  }, [isOpen, currentUsername]);

  // Check username availability when debouncedUsername changes
  useEffect(() => {
    if (!isOpen) return;

    const trimmed = debouncedUsername.trim();
    if (!trimmed) {
      setStatus('invalid');
      setStatusMsg('Username is required');
      return;
    }

    if (trimmed.toLowerCase() === (currentUsername || '').toLowerCase()) {
      setStatus('idle');
      setStatusMsg('This is your current username');
      return;
    }

    if (!isValidUsername(trimmed)) {
      setStatus('invalid');
      setStatusMsg('Username must be 3-16 characters (letters, numbers, underscores)');
      return;
    }

    let isMounted = true;
    setStatus('checking');
    setStatusMsg('Checking availability...');

    authApi.checkUsername(trimmed)
      .then((res) => {
        if (!isMounted) return;
        if (res.available) {
          setStatus('available');
          setStatusMsg('✓ Username is available');
        } else {
          setStatus('taken');
          setStatusMsg('✗ Username is already taken');
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        console.error('Failed to check username availability:', err);
        setStatus('invalid');
        setStatusMsg('Error checking username');
      });

    return () => {
      isMounted = false;
    };
  }, [debouncedUsername, currentUsername, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmed = username.trim();
    if (status !== 'available' && trimmed.toLowerCase() !== (currentUsername || '').toLowerCase()) return;

    setIsSubmitting(true);
    try {
      const response = await client.patch('/profile/edit-username/', { username: trimmed });
      if (response.data?.success) {
        if (onSuccess) onSuccess(trimmed);
        onClose();
      }
    } catch (err) {
      console.error('Failed to update username:', err);
      setStatus('taken');
      setStatusMsg(err.response?.data?.error || 'Failed to update username');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isSaveDisabled =
    isSubmitting ||
    status === 'checking' ||
    status === 'taken' ||
    status === 'invalid' ||
    username.trim().toLowerCase() === (currentUsername || '').toLowerCase();

  return (
    <div className="edit-profile-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="edit-profile-modal" style={{ maxWidth: '440px' }}>
        <div className="edit-profile-header">
          <div className="edit-profile-header-left">
            <button type="button" className="edit-profile-close-btn" onClick={onClose}>✕</button>
            <h2>Edit Username</h2>
          </div>
          <button
            type="button"
            className="edit-profile-save-btn"
            onClick={handleSubmit}
            disabled={isSaveDisabled}
          >
            {isSubmitting ? 'Saving...' : 'Save'}
          </button>
        </div>

        <div className="edit-profile-content" style={{ padding: '24px 16px' }}>
          <form className="edit-profile-form" onSubmit={handleSubmit} style={{ padding: 0 }}>
            <div className="form-group">
              <label>Username</label>
              <div className="username-input-wrapper">
                <span className="username-prefix">@</span>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="new_username"
                  maxLength={16}
                  className={status === 'available' ? 'success' : (status === 'taken' || status === 'invalid') ? 'error' : ''}
                  autoFocus
                />
              </div>
              <div className={`username-status ${status === 'checking' ? 'status-checking' :
                  status === 'available' ? 'status-success' :
                    (status === 'taken' || status === 'invalid') ? 'status-error' : ''
                }`}>
                {statusMsg}
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
