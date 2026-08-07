import React, { createContext, useContext, useState, useEffect } from 'react';
import { profileApi } from '../features/profile/api/profileApi';
import { useAuth } from './AuthContext';
import client from '../services/client';

const PersonaContext = createContext();

export function PersonaProvider({ children }) {
  const { user } = useAuth();
  const [activePersona, setActivePersona] = useState(null);
  const [personas, setPersonas] = useState([]);
  const [interestFloor, setInterestFloor] = useState([]);
  const [loading, setLoading] = useState(true);

  const initializePersonas = async () => {
    const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
    if (!token || !user) {
      setPersonas([]);
      setActivePersona(null);
      setInterestFloor([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const [fetchedPersonas, fetchedActivePersona] = await Promise.all([
        profileApi.getPersonas(),
        profileApi.getActivePersona()
      ]);
      
      setPersonas(fetchedPersonas);
      const active = fetchedActivePersona || (fetchedPersonas && fetchedPersonas.length > 0 ? fetchedPersonas[0] : null);
      setActivePersona(active);
    } catch (error) {
      console.error('Failed to initialize personas', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    initializePersonas();
  }, [user]);

  useEffect(() => {
    const fetchInterestFloor = async () => {
      if (!activePersona || !activePersona.id) {
        setInterestFloor([]);
        return;
      }
      try {
        const floorData = await profileApi.getInterestFloor(activePersona.id);
        setInterestFloor(floorData);
      } catch (error) {
        console.error('Failed to fetch interest floor', error);
      }
    };
    fetchInterestFloor();
  }, [activePersona]);

  const switchPersona = async (personaId) => {
    const newActive = personas.find(p => Number(p.id) === Number(personaId));
    if (newActive) {
      setActivePersona(newActive);
      try {
        await client.post('/personas/switch/', { persona_id: personaId });
      } catch (e) {
        console.error('Failed to switch persona on backend', e);
      }
    }
  };

  return (
    <PersonaContext.Provider value={{ 
      activePersona, 
      personas, 
      interestFloor, 
      switchPersona, 
      loading, 
      setActivePersona,
      refreshPersonas: initializePersonas
    }}>
      {children}
    </PersonaContext.Provider>
  );
}

export function usePersona() {
  const context = useContext(PersonaContext);
  if (context === undefined) {
    throw new Error('usePersona must be used within a PersonaProvider');
  }
  return context;
}
