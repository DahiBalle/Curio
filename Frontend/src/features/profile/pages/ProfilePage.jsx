import React from 'react';
import './ProfilePage.css';
import '../../../app/layouts/TwoColumnLayout.css';
import { useProfile } from '../hooks/useProfile';
import { usePersona } from '../../../context/PersonaContext';
import { useAuth } from '../../../context/AuthContext';
import { ProfileHeader } from '../components/ProfileHeader';
import { PersonaList } from '../components/PersonaList';
import { PostFeed } from '../../post';
import { PersonaCard, InterestFloor } from '../../persona';

export const ProfilePage = () => {
  const { user } = useAuth();
  const username = user?.username || '';
  const { profile, setProfile, personas, posts, loading, error } = useProfile(username);
  const { activePersona, interestFloor } = usePersona();

  if (loading) {
    return <div className="page-loading">Loading profile...</div>;
  }

  if (error) {
    return <div className="page-error">{error}</div>;
  }

  return (
    <div className="layout-two-column">
      {/* Center — main content */}
      <main className="layout-main">
        <ProfileHeader profile={profile} onProfileUpdate={setProfile} />
        <PersonaList personas={personas} />

        <div className="layout-content">
          <PostFeed posts={posts} />
        </div>
      </main>

      {/* Right aside — Active Persona + Interest Floor */}
      <aside className="layout-aside">
        <div className="layout-sidebar-sticky">
          <PersonaCard persona={activePersona} />
          <InterestFloor labels={interestFloor} />
        </div>
      </aside>
    </div>
  );
};
