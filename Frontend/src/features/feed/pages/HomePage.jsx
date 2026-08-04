import React from 'react';
import { useFeed } from '../hooks/useFeed';
import { ProfileFeed } from '../../profile/components/ProfileFeed';
import { usePersona } from '../../../context/PersonaContext';
import { PersonaCard, InterestFloor } from '../../persona';
import '../../profile/pages/ProfilePage.css';

export function HomePage() {
  const { posts, loading, error } = useFeed();
  const { activePersona, interestFloor } = usePersona();

  if (error) {
    return <div className="profile-page-error">Failed to load feed.</div>;
  }

  return (
    <div className="profile-page-layout">
      <main className="profile-page-main">
        <header style={{ marginBottom: '24px', borderBottom: '1px solid #333', paddingBottom: '16px' }}>
          <h2 style={{ margin: '0 0 8px 0', fontSize: '24px', fontWeight: 'bold' }}>Home Feed</h2>
          {activePersona && (
            <p style={{ margin: 0, color: '#888', fontSize: '14px' }}>
              Showing posts for persona: <strong>{activePersona.name}</strong>
            </p>
          )}
        </header>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#888' }}>Loading feed...</div>
        ) : (
          <div className="profile-tab-content">
            <ProfileFeed posts={posts} />
          </div>
        )}
      </main>

      <aside className="profile-page-right-aside">
        <div className="profile-page-sidebar-sticky">
          <PersonaCard persona={activePersona} />
          <InterestFloor labels={interestFloor} />
        </div>
      </aside>
    </div>
  );
}
