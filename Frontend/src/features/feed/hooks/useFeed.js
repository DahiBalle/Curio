import { useState, useEffect } from 'react';
import { feedApi } from '../api/feedApi';
import { usePersona } from '../../../context/PersonaContext';

export function useFeed() {
  const { activePersona } = usePersona();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);

  useEffect(() => {
    // If activePersona isn't loaded yet, don't fetch
    if (!activePersona) return;

    const controller = new AbortController();
    const signal = controller.signal;

    const fetchFeed = async () => {
      try {
        setLoading(true);
        setError(null);
        // Pass signal if feedApi supports it, or just ignore result if aborted
        const data = await feedApi.getFeed(activePersona.id, 1, { signal });
        if (!signal.aborted) {
          setPosts(data);
          setHasMore(data.length > 0);
          setPage(1);
        }
      } catch (err) {
        if (!signal.aborted) {
          console.error("Failed to fetch feed", err);
          setError(err);
        }
      } finally {
        if (!signal.aborted) {
          setLoading(false);
        }
      }
    };

    fetchFeed();

    return () => {
      controller.abort();
    };
  }, [activePersona]);

  const fetchMore = async () => {
    if (loading || loadingMore || !hasMore || !activePersona) return;
    try {
      setLoadingMore(true);
      const nextPage = page + 1;
      const data = await feedApi.getFeed(activePersona.id, nextPage);
      if (data.length === 0) {
        setHasMore(false);
      } else {
        // Filter out duplicates in case the backend returns some overlap
        setPosts(prev => {
          const existingIds = new Set(prev.map(p => p.id));
          const newPosts = data.filter(p => !existingIds.has(p.id));
          if (newPosts.length === 0) {
             setHasMore(false);
          }
          return [...prev, ...newPosts];
        });
        setPage(nextPage);
      }
    } catch (err) {
      console.error("Failed to fetch more feed", err);
    } finally {
      setLoadingMore(false);
    }
  };

  return { posts, loading, error, fetchMore, loadingMore, hasMore };
}
