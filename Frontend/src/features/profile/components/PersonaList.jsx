import React, { useState } from 'react';
import './PersonaList.css';
import { Avatar } from '../../../components/ui/Avatar';
import { CreatePersonaModal } from './CreatePersonaModal';
import { Icon } from '../../../components/ui/Icon';

export const PersonaList = ({ personas, onPersonaCreated, onPersonaSelected, selectedPersonaId }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="persona-list-container">
      <ul className="persona-list">
        {personas && personas.map((persona) => (
          <li 
            key={persona.id} 
            className={`persona-item ${selectedPersonaId === persona.id ? 'selected' : ''}`}
            onClick={() => onPersonaSelected && onPersonaSelected(persona)}
          >
            <div className="persona-avatar-wrapper" style={{ borderColor: selectedPersonaId === persona.id ? 'var(--text-p)' : 'var(--border)' }}>
              <Avatar src={persona.avatar} alt={persona.name} size="medium" hasRing={false} className="persona-avatar" />
            </div>
            <span className="persona-title" style={{ color: selectedPersonaId === persona.id ? 'var(--text-p)' : 'var(--text-h)' }}>{persona.name}</span>
          </li>
        ))}
        <li className="persona-item" onClick={() => setIsModalOpen(true)}>
          <div className="persona-avatar-wrapper persona-add-btn">
            <span style={{ fontSize: '24px', color: 'var(--text-p)' }}>+</span>
          </div>
          <span className="persona-title">New</span>
        </li>
      </ul>

      <CreatePersonaModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={onPersonaCreated} 
      />
    </div>
  );
};
