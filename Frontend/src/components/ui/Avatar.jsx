import React from 'react';
import './Avatar.css';
import defaultAvatar from '../../assets/default-avatar.png';

export const Avatar = ({ src, alt = '', size = 'medium', hasRing = false, className = '' }) => {
  return (
    <div className={`ui-avatar-container ui-avatar--${size} ${hasRing ? 'ui-avatar--ring' : ''} ${className}`}>
      <img 
        src={src || defaultAvatar} 
        alt={alt} 
        className="ui-avatar-image" 
        onError={(e) => { e.target.onerror = null; e.target.src = defaultAvatar; }}
      />
    </div>
  );
};
