import React, { useState } from 'react';
import './PersonaList.css';
import { Avatar } from '../../../components/ui/Avatar';
import { CreatePersonaModal } from './CreatePersonaModal';
import { Icon } from '../../../components/ui/Icon';

export const PersonaList = ({ personas, isOwnProfile = true, onPersonaCreated, onPersonaSelected, selectedPersonaId, defaultPersonaId }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="persona-list-container">
      <ul className="persona-list">
        {personas && personas.map((persona) => {
          const isSelected = selectedPersonaId === persona.id;
          const isDefault = defaultPersonaId === persona.id;
          
          return (
            <li 
              key={persona.id} 
              className={`persona-item ${isSelected ? 'selected' : ''} ${isDefault ? 'is-default' : ''}`}
              onClick={() => onPersonaSelected && onPersonaSelected(persona)}
              style={{ position: 'relative' }}
            >
              {isDefault && (
                <div style={{ position: 'absolute', top: -5, right: -5, zIndex: 2, background: 'var(--bg-primary)', borderRadius: '50%', padding: '2px' }}>
                  <Icon name="verified" size={16} color="#00C853" />
                </div>
              )}
              <div 
                className="persona-avatar-wrapper" 
                style={{ 
                  borderColor: isDefault ? '#00C853' : (isSelected ? 'var(--text-p)' : 'var(--border)'),
                  borderWidth: isDefault ? '2px' : '1px'
                }}
              >
                <Avatar src={persona.avatarUrl || persona.avatar} alt={persona.name} size="medium" hasRing={false} className="persona-avatar" />
              </div>
              <span className="persona-title" style={{ color: isSelected ? 'var(--text-p)' : 'var(--text-h)' }}>{persona.name}</span>
            </li>
          );
        })}
        {isOwnProfile && (
          <li className="persona-item" onClick={() => setIsModalOpen(true)}>
            <div className="persona-avatar-wrapper persona-add-btn">
              <span style={{ fontSize: '24px', color: 'var(--text-p)' }}>+</span>
            </div>
            <span className="persona-title">New</span>
          </li>
        )}
      </ul>

      <CreatePersonaModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={onPersonaCreated} 
      />
    </div>
  );
};
