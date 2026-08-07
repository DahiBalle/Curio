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
  const { activePersona, interestFloor, setActivePersona } = usePersona();

  const [selectedPersona, setSelectedPersona] = useState(null);

  React.useEffect(() => {
    if (personas && personas.length > 0) {
      if (activePersona && isOwnProfile && !selectedPersona) {
        const activeP = personas.find(p => Number(p.id) === Number(activePersona.id));
        if (activeP) {
          setSelectedPersona(activeP);
          return;
        }
      }
      if (!selectedPersona) {
        const defaultP = personas.find(p => Number(p.id) === Number(profile?.id)) || personas[0];
        setSelectedPersona(defaultP);
      }
    }
  }, [personas, profile, activePersona, isOwnProfile, selectedPersona]);

  if (loading) {
    return <div className="page-loading">Loading profile...</div>;
  }

  if (error) {
    return <div className="page-error">{error}</div>;
  }

  // If we haven't selected a persona yet (still running useEffect), fallback to profile temporarily
  const activeDisplayPersona = selectedPersona || personas?.[0] || profile;

  const displayedProfile = {
    name: activeDisplayPersona?.name,
    bio: activeDisplayPersona?.bio,
    avatarUrl: activeDisplayPersona?.avatarUrl || activeDisplayPersona?.avatar,
    bannerUrl: activeDisplayPersona?.bannerUrl || activeDisplayPersona?.banner,
    postsCount: posts.length,
    isPersona: true,
    id: activeDisplayPersona?.id,
    isActive: Boolean(activePersona && activeDisplayPersona && Number(activePersona.id) === Number(activeDisplayPersona.id)),
    username: profile?.username // pass the base profile's username
  };


  const displayedPosts = posts;

  return (
    <div className="layout-two-column">
      {/* Center — main content */}
      <main className="layout-main">
        <ProfileHeader
          profile={displayedProfile}
          onProfileUpdate={(updatedData) => {
            if (updatedData.id === selectedPersona?.id) {
              setSelectedPersona(updatedData);
            }
            if (activePersona && updatedData.id === activePersona.id) {
              setActivePersona(updatedData);
            }
            setProfile(updatedData);
          }}
        />

        <div className="layout-content">
          <PersonaList
            personas={personas}
            isOwnProfile={isOwnProfile}
            onPersonaCreated={() => window.location.reload()}
            onPersonaSelected={(persona) => {
              setSelectedPersona(persona);
            }}
            selectedPersonaId={selectedPersona?.id}
            defaultPersonaId={profile?.id}
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
