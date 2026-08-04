import { useState, useEffect } from 'react';
import { feedApi } from '../api/feedApi';
import { usePersona } from '../../../context/PersonaContext';

export function useFeed() {
  const { activePersona } = usePersona();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // If activePersona isn't loaded yet, don't fetch
    if (!activePersona) return;

    const fetchFeed = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await feedApi.getFeed(activePersona.id);
        setPosts(data);
      } catch (err) {
        console.error("Failed to fetch feed", err);
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchFeed();
  }, [activePersona]);

  return { posts, loading, error };
}
