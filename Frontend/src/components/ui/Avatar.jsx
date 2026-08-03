import React from 'react';
import './Avatar.css';

export const Avatar = ({ src, alt = '', size = 'medium', hasRing = false, className = '' }) => {
  return (
    <div className={`ui-avatar-container ui-avatar--${size} ${hasRing ? 'ui-avatar--ring' : ''} ${className}`}>
      <img src={src} alt={alt} className="ui-avatar-image" />
    </div>
  );
};
