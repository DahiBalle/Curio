import React, { useState } from 'react';
import './ProfilePage.css';
import '../../../app/layouts/TwoColumnLayout.css';
import { useProfile } from '../hooks/useProfile';
import { usePersona } from '../../../context/PersonaContext';
import { ProfileHeader } from '../components/ProfileHeader';
import { PersonaList } from '../components/PersonaList';
import { PostFeed } from '../../post';
import { Tabs } from '../../../components/ui/Tabs';
import { PersonaCard, InterestFloor } from '../../persona';

export const ProfilePage = () => {
  // Hardcoded 'redbull' for demo purposes
  const { profile, setProfile, personas, posts, loading, error } = useProfile('redbull');
  const { activePersona, interestFloor } = usePersona();
  const [activeTab, setActiveTab] = useState(0);

  if (loading) {
    return <div className="page-loading">Loading profile...</div>;
  }

  if (error) {
    return <div className="page-error">{error}</div>;
  }

  const tabs = [
    { label: 'Posts', icon: 'grid' },
    { label: 'Reels', icon: 'reels' },
    { label: 'Tagged', icon: 'tags' }
  ];

  return (
    <div className="layout-two-column">
      {/* Center — main content */}
      <main className="layout-main">
        <ProfileHeader profile={profile} onProfileUpdate={setProfile} />
        <PersonaList personas={personas} />

        <Tabs tabs={tabs} defaultTab={0} onTabChange={setActiveTab} />

        <div className="layout-content">
          {activeTab === 0 && <PostFeed posts={posts} />}
          {activeTab === 1 && <PostFeed posts={posts.filter(p => p.type === 'video')} />}
          {activeTab === 2 && <PostFeed posts={[]} />}
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
