import React, { createContext, useContext, useState, useEffect } from 'react';
import { profileApi } from '../features/profile/api/profileApi';

const PersonaContext = createContext();

export function PersonaProvider({ children }) {
  const [activePersona, setActivePersona] = useState(null);
  const [personas, setPersonas] = useState([]);
  const [interestFloor, setInterestFloor] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializePersonas = async () => {
      try {
        setLoading(true);
        const [fetchedPersonas, fetchedActivePersona] = await Promise.all([

          profileApi.getPersonas(),
          profileApi.getActivePersona()

        ]);
        
        setPersonas(fetchedPersonas);
        setActivePersona(fetchedActivePersona);
      } catch (error) {
        console.error('Failed to initialize personas', error);
      } finally {
        setLoading(false);
      }
    };

    initializePersonas();
  }, []);

  useEffect(() => {
    const fetchInterestFloor = async () => {
      if (!activePersona) return;
      try {
        const floorData = await profileApi.getInterestFloor(activePersona.id);
        setInterestFloor(floorData);
      } catch (error) {
        console.error('Failed to fetch interest floor', error);
      }
    };
    fetchInterestFloor();
  }, [activePersona]);

  const switchPersona = (personaId) => {
    const newActive = personas.find(p => p.id === personaId);
    if (newActive) {
      setActivePersona(newActive);
    }
  };

  return (
    <PersonaContext.Provider value={{ activePersona, personas, interestFloor, switchPersona, loading }}>
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
