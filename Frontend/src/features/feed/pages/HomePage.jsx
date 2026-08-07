import React from 'react';
import { useFeed } from '../hooks/useFeed';
import { PostFeed } from '../../post';
import { usePersona } from '../../../context/PersonaContext';
import { PersonaCard, InterestFloor } from '../../persona';
import '../../../app/layouts/TwoColumnLayout.css';

export function HomePage() {
  const { posts, loading, error, fetchMore, loadingMore, hasMore } = useFeed();
  const { activePersona, interestFloor } = usePersona();

  if (error) {
    return (
      <div className="page-error" style={{ padding: '40px', textAlign: 'center', color: 'red' }}>
        <h3>Failed to load feed.</h3>
        <p>Error details: {error.message || String(error)}</p>
        <p style={{ fontSize: '12px', color: '#888' }}>Please copy this error and share it.</p>
      </div>
    );
  }

  return (
    <div className="layout-two-column">
      <main className="layout-main">
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
          <div className="layout-content">
            <PostFeed 
              posts={posts} 
              fetchMore={fetchMore}
              loadingMore={loadingMore}
              hasMore={hasMore}
            />
          </div>
        )}
      </main>

      <aside className="layout-aside">
        <div className="layout-sidebar-sticky">
          <PersonaCard persona={activePersona} />
          <InterestFloor activePersona={activePersona} />
        </div>
      </aside>
    </div>
  );
}
