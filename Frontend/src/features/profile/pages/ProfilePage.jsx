import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import './ProfilePage.css';
import '../../../app/layouts/TwoColumnLayout.css';
import { useProfile } from '../hooks/useProfile';
import { usePersona } from '../../../context/PersonaContext';
import { useAuth } from '../../../context/AuthContext';
import { ProfileHeader } from '../components/ProfileHeader';
import { PostFeed } from '../../post';
import { PersonaCard, InterestFloor } from '../../persona';
import { PersonaList } from '../components/PersonaList';

export const ProfilePage = () => {
  const { username: paramUsername } = useParams();
  const { user } = useAuth();
  const username = paramUsername || user?.username || '';
  const isOwnProfile = username === (user?.username || '');
  const { profile, setProfile, personas, posts, loading, error } = useProfile(username);
  const { activePersona, interestFloor } = usePersona();
  
  const [selectedPersona, setSelectedPersona] = useState(null);

  if (loading) {
    return <div className="page-loading">Loading profile...</div>;
  }

  if (error) {
    return <div className="page-error">{error}</div>;
  }

  const displayedProfile = selectedPersona ? {
    name: selectedPersona.name,
    bio: selectedPersona.bio,
    avatarUrl: selectedPersona.avatar,
    bannerUrl: selectedPersona.banner,
    postsCount: posts.filter(p => p.author?.id === selectedPersona.id).length,
    isPersona: true, // flag to know it's a persona
    id: selectedPersona.id,
    isActive: activePersona && activePersona.id === selectedPersona.id,
    username: profile?.username // pass the base profile's username
  } : profile;

  const displayedPosts = selectedPersona
    ? posts.filter(p => p.author?.id === selectedPersona.id)
    : posts;

  return (
    <div className="layout-two-column">
      {/* Center — main content */}
      <main className="layout-main">
        <ProfileHeader profile={displayedProfile} onProfileUpdate={setProfile} />

        <div className="layout-content">
          <PersonaList 
            personas={personas} 
            isOwnProfile={isOwnProfile}
            onPersonaCreated={() => window.location.reload()} 
            onPersonaSelected={(persona) => {
              if (selectedPersona?.id === persona.id) {
                setSelectedPersona(null); // toggle off
              } else {
                setSelectedPersona(persona);
              }
            }}
            selectedPersonaId={selectedPersona?.id}
          />
          <PostFeed posts={displayedPosts} />
        </div>
      </main>

      {/* Right aside — Active Persona + Interest Floor */}
      <aside className="layout-aside">
        <div className="layout-sidebar-sticky">
          <PersonaCard persona={activePersona} />
          <InterestFloor activePersona={activePersona} />
        </div>
      </aside>
    </div>
  );
};
