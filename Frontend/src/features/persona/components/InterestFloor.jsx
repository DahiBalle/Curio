import React, { useState } from 'react';
import './InterestFloor.css';
import { Avatar } from '../../../components/ui/Avatar';
import { InterestPickerModal } from './InterestPickerModal';
import { usePersona } from '../../../context/PersonaContext';

export const InterestFloor = ({ activePersona, onInterestsUpdated }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { setActivePersona } = usePersona();

  if (!activePersona) return null;
  const interests = activePersona.interests || [];

  return (
    <div className="interest-floor">
      <div className="interest-floor__header">
        <h4 className="interest-floor__heading">INTEREST FLOOR</h4>
        <button className="interest-floor__edit-btn" onClick={() => setIsModalOpen(true)}>Edit</button>
      </div>
      <ul className="interest-floor__list">
        {interests.map((interest, index) => (
          <li key={index} className="interest-floor__item">
            <span className="interest-floor__name">{interest}</span>
          </li>
        ))}
      </ul>

      <InterestPickerModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        activePersona={activePersona}
        onSuccess={(updatedPersona) => {
          if (setActivePersona) setActivePersona(updatedPersona);
          if (onInterestsUpdated) onInterestsUpdated(updatedPersona);
        }} 
      />
    </div>
  );
};
