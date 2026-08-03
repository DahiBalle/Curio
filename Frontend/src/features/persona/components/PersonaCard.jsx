import React from 'react';
import './PersonaCard.css';
import { Avatar } from '../../../components/ui/Avatar';

export const PersonaCard = ({ persona }) => {
  if (!persona) return null;

  return (
    <div className="persona-card">
      {/* Top row: avatar on left, name on right */}
      <div className="persona-card__header">
        <Avatar src={persona.avatarUrl} alt={persona.name} size="medium" />
        <div className="persona-card__header-info">
          <h3 className="persona-card__name">{persona.name}</h3>
        </div>
      </div>

      {/* Bio */}
      {persona.bio && (
        <p className="persona-card__bio">{persona.bio}</p>
      )}

      {/* Stats: just Posts */}
      <div className="persona-card__stats">
        <div className="persona-card__stat">
          <span className="persona-card__stat-value">{persona.postsCount}</span>
          <span className="persona-card__stat-label">Posts</span>
        </div>
      </div>
    </div>
  );
};
