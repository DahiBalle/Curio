import { useState, useEffect } from 'react';
import { profileApi } from '../api/profileApi';

export const useProfile = (username) => {
  const [profile, setProfile] = useState(null);
  const [personas, setPersonas] = useState([]);
  const [posts, setPosts] = useState([]);
  const [activePersona, setActivePersona] = useState(null);
  const [interestFloor, setInterestFloor] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const fetchAllData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [profileData, personasData, postsData, activePersonaData, interestFloorData] = await Promise.all([
          profileApi.getProfile(username),
          profileApi.getPersonas(username),
          profileApi.getPosts(username),
          profileApi.getActivePersona(username),
          profileApi.getInterestFloor(1) // default persona id
        ]);

        if (isMounted) {
          setProfile(profileData);
          setPersonas(personasData);
          setPosts(postsData);
          setActivePersona(activePersonaData);
          setInterestFloor(interestFloorData);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message || 'Failed to fetch profile data');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchAllData();

    return () => {
      isMounted = false;
    };
  }, [username]);

  return {
    profile,
    personas,
    posts,
    activePersona,
    interestFloor,
    loading,
    error,
    setProfile
  };
};
