import { useState, useEffect } from 'react';
import { profileApi } from '../api/profileApi';

// Normalize the nested backend response to the flat shape the UI expects
const normalizeProfile = (data) => {
  if (!data) return null;
  const p = data.profile || {};
  return {
    id: data.id,
    username: data.username,
    name: p.display_name || data.first_name || data.username,
    bio: p.bio || '',
    website: p.website || '',
    avatarUrl: p.profile_picture || null,
    bannerUrl: p.banner || null,
    isVerified: p.is_verified || false,
    isPrivate: p.is_private || false,
    postsCount: p.posts ?? 0,
    joined: p.joined || null,
    relationship: data.relationship || {},
  };
};

export const useProfile = (username) => {
  const [profile, setProfile] = useState(null);
  const [personas, setPersonas] = useState([]);
  const [posts, setPosts] = useState([]);
  const [activePersona, setActivePersona] = useState(null);
  const [interestFloor, setInterestFloor] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!username) return;
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
          setProfile(normalizeProfile(profileData));
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
