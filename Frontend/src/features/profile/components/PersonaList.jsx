import React from 'react';
import './PersonaList.css';
import { Avatar } from '../../../components/ui/Avatar';

export const PersonaList = ({ personas }) => {
  if (!personas || personas.length === 0) return null;

  return (
    <div className="persona-list-container">
      <ul className="persona-list">
        {personas.map((persona) => (
          <li key={persona.id} className="persona-item">
            <div className="persona-avatar-wrapper">
              <Avatar src={persona.imageUrl} alt={persona.title} size="medium" hasRing={false} className="persona-avatar" />
            </div>
            <span className="persona-title">{persona.title}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};
