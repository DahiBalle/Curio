import React from 'react';
import './PersonaCard.css';
import { Avatar } from '../../../components/ui/Avatar';

export const PersonaCard = ({ persona }) => {
  if (!persona) return null;

  return (
    <div className="persona-card">
      {/* Top row: avatar on left, name on right */}
      <div className="persona-card__header">
        <Avatar src={persona.avatar || persona.avatarUrl} alt={persona.name} size="medium" />
        <div className="persona-card__header-info">
          <h3 className="persona-card__name">{persona.name}</h3>
        </div>
      </div>

      {/* Bio */}
      {persona.bio && (
        <p className="persona-card__bio">{persona.bio}</p>
      )}

    </div>
  );
};
