import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PostFeed } from '../../post';
import { usePersona } from '../../../context/PersonaContext';
import { PersonaCard, InterestFloor } from '../../persona';
import { postApi } from '../../post/api/postApi';
import '../../../app/layouts/TwoColumnLayout.css';

export const SearchPage = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { activePersona } = usePersona();

  useEffect(() => {
    let isMounted = true;
    const fetchSearchResults = async () => {
      setLoading(true);
      setError(null);
      try {
        const results = await postApi.searchPosts(query);
        if (isMounted) {
          setPosts(results);
        }
      } catch (err) {
        if (isMounted) setError('Failed to load search results');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    if (query) {
      fetchSearchResults();
    } else {
      setPosts([]);
      setLoading(false);
    }

    return () => { isMounted = false; };
  }, [query]);

  return (
    <div className="layout-two-column">
      <main className="layout-main">
        <header style={{ marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid #333' }}>
          <h2 style={{ margin: '0', fontSize: '24px', fontWeight: 'bold' }}>
            Search Results for "{query}"
          </h2>
        </header>

        <div className="layout-content">
          {loading ? (
             <div style={{ textAlign: 'center', padding: '40px', color: '#888' }}>Searching...</div>
          ) : error ? (
             <div style={{ textAlign: 'center', padding: '40px', color: '#ff3040' }}>{error}</div>
          ) : posts.length === 0 ? (
             <div style={{ textAlign: 'center', padding: '40px', color: '#888' }}>
                No results found for "{query}". Try a different search term.
             </div>
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
