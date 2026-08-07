import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import './Sidebar.css';
import { Avatar } from '../ui/Avatar';
import { useAuth } from '../../context/AuthContext';

export const Sidebar = ({ onSearchClick }) => {
  const { logout, user } = useAuth();
  return (
    <aside className="sidebar">
      <div className="sidebar__brand">
        <span className="sidebar__logo-text">Curio</span>
      </div>

      <nav className="sidebar__nav">
        <NavLink to="/" className={({ isActive }) => `sidebar__nav-item ${isActive ? 'active' : ''}`} end>
          <svg className="sidebar__icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
          <span className="sidebar__label">Home</span>
        </NavLink>

        <button className="sidebar__nav-item sidebar__btn" onClick={onSearchClick}>
          <svg className="sidebar__icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <span className="sidebar__label">Search</span>
        </button>

        <div className="sidebar__nav-item" style={{ cursor: 'not-allowed', opacity: 0.5 }} title="Coming soon">
          <div className="sidebar__icon-wrapper">
            <svg className="sidebar__icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </div>
          <span className="sidebar__label">
            Messages <span style={{ fontSize: '10px', backgroundColor: '#1d9bf0', padding: '2px 6px', borderRadius: '10px', marginLeft: '6px', color: 'white', fontWeight: 'bold' }}>Beta</span>
          </span>
        </div>

        <a href="#" className="sidebar__nav-item">
          <svg className="sidebar__icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
          <span className="sidebar__label">Notifications</span>
        </a>

        <NavLink to="/create" className={({ isActive }) => `sidebar__nav-item ${isActive ? 'active' : ''}`}>
          <svg className="sidebar__icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <line x1="12" y1="8" x2="12" y2="16" />
            <line x1="8" y1="12" x2="16" y2="12" />
          </svg>
          <span className="sidebar__label">Create</span>
        </NavLink>

        <NavLink to="/profile" className={({ isActive }) => `sidebar__nav-item ${isActive ? 'active' : ''}`}>
          <Avatar src={user?.profile?.profile_picture || user?.profile_picture} alt="Profile" size="small" />
          <span className="sidebar__label">Profile</span>
        </NavLink>
      </nav>

      <div className="sidebar__footer">
        <button className="sidebar__nav-item sidebar__btn" onClick={logout}>
          <svg className="sidebar__icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          <span className="sidebar__label">Logout</span>
        </button>
      </div>
    </aside>
  );
};
