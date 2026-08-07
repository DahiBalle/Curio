import React, { useState, useEffect } from 'react';
import { PostFeed } from '../../post';
import { usePersona } from '../../../context/PersonaContext';
import { PersonaCard, InterestFloor } from '../../persona';
import client from '../../../services/client';
import '../../../app/layouts/TwoColumnLayout.css';

export const SavedPage = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { activePersona } = usePersona();

  useEffect(() => {
    let isMounted = true;
    const fetchSavedPosts = async () => {
      setLoading(true);
      try {
        const { data } = await client.get('/profile/saved-posts/');
        if (isMounted) {
          setPosts(data.posts || []);
        }
      } catch (err) {
        if (isMounted) setError('Failed to load saved posts');
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchSavedPosts();
    return () => isMounted = false;
  }, []);

  return (
    <div className="layout-two-column">
      <main className="layout-main">
        <header style={{ marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid #333' }}>
          <h2 style={{ margin: '0', fontSize: '24px', fontWeight: 'bold' }}>Saved Posts</h2>
        </header>

        <div className="layout-content">
          {loading ? (
             <div style={{ textAlign: 'center', padding: '40px', color: '#888' }}>Loading saved posts...</div>
          ) : error ? (
             <div style={{ textAlign: 'center', padding: '40px', color: '#ff3040' }}>{error}</div>
          ) : posts.length === 0 ? (
             <div style={{ textAlign: 'center', padding: '40px', color: '#888' }}>You haven't saved any posts yet.</div>
          ) : (
            <PostFeed posts={posts} />
          )}
        </div>
      </main>

      <aside className="layout-aside">
        <div className="layout-sidebar-sticky">
          <PersonaCard persona={activePersona} />
          <InterestFloor activePersona={activePersona} />
        </div>
      </aside>
    </div>
  );
};
