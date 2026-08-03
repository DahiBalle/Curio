import React, { useState } from 'react';
import './ProfilePage.css';
import { useProfile } from '../hooks/useProfile';
import { ProfileHeader } from '../components/ProfileHeader';
import { PersonaList } from '../components/PersonaList';
import { ProfileFeed } from '../components/ProfileFeed';
import { Tabs } from '../../../components/ui/Tabs';

export const ProfilePage = () => {
  // Hardcoded 'redbull' for demo purposes
  const { profile, personas, posts, loading, error } = useProfile('redbull');
  const [activeTab, setActiveTab] = useState(0);

  if (loading) {
    return <div className="profile-page-loading">Loading profile...</div>;
  }

  if (error) {
    return <div className="profile-page-error">{error}</div>;
  }

  const tabs = [
    { label: 'Posts', icon: 'grid' },
    { label: 'Reels', icon: 'reels' },
    { label: 'Tagged', icon: 'tags' }
  ];

  return (
    <main className="profile-page">
      <div className="profile-page-content">
        <ProfileHeader profile={profile} />
        <PersonaList personas={personas} />
        
        <Tabs tabs={tabs} defaultTab={0} onTabChange={setActiveTab} />
        
        <div className="profile-tab-content">
          {activeTab === 0 && <ProfileFeed posts={posts} />}
          {activeTab === 1 && <ProfileFeed posts={posts.filter(p => p.type === 'video')} />}
          {activeTab === 2 && <ProfileFeed posts={[]} />}
        </div>
      </div>
    </main>
  );
};
