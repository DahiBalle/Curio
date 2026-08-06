import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { postApi } from '../api/postApi';
import { PostPreview } from '../components/PostPreview';
import { usePersona } from '../../../context/PersonaContext';
import { PersonaCard, InterestFloor } from '../../persona';
import '../../../app/layouts/TwoColumnLayout.css';

export function PostDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { activePersona } = usePersona();

  useEffect(() => {
    let isMounted = true;

    const fetchPost = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await postApi.getPost(id);
        if (isMounted) {
          setPost(data);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message || 'Failed to load post.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    if (id) {
      fetchPost();
    }
  }, [id]);

  return (
    <div className="layout-two-column">
      <main className="layout-main">
        <header style={{ marginBottom: '24px', paddingBottom: '16px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button 
            onClick={() => navigate(-1)} 
            style={{ 
              background: 'none', border: 'none', color: '#f5f5f5', 
              cursor: 'pointer', display: 'flex', alignItems: 'center',
              padding: '8px', borderRadius: '50%', backgroundColor: '#1a2426'
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
          </button>
          <h2 style={{ margin: '0', fontSize: '24px', fontWeight: 'bold' }}>Post</h2>
        </header>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#888' }}>Loading post...</div>
        ) : error ? (
          <div className="page-error" style={{ textAlign: 'center', padding: '40px', color: '#ff3040' }}>{error}</div>
        ) : post ? (
          <div className="layout-content">
            <PostPreview post={post} isDetailView={true} />
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '40px', color: '#888' }}>Post not found.</div>
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
