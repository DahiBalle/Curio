import React from 'react';
import './InterestFloor.css';
import { Avatar } from '../../../components/ui/Avatar';

export const InterestFloor = ({ labels }) => {
  if (!labels || labels.length === 0) return null;

  return (
    <div className="interest-floor">
      <h4 className="interest-floor__heading">INTEREST FLOOR</h4>
      <ul className="interest-floor__list">
        {labels.map((label) => (
          <li key={label.id} className="interest-floor__item">
            <Avatar src={label.avatarUrl} alt={label.name} size="small" />
            <span className="interest-floor__name">{label.name}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};
