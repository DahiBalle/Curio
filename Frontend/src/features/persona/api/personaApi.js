import client from '../../../services/client';

export const personaApi = {
  getPersonas: async (username) => {
    const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
    if (!token) return [];
    try {
      const { data } = await client.get('/personas/', { params: { username } });
      return data.personas || [];
    } catch (error) {
      if (error.response && error.response.status === 401) {
        return [];
      }
      throw error;
    }
  },

  getActivePersona: async () => {
    const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
    if (!token) return null;
    try {
      const { data } = await client.get('/personas/active/');
      return data.active_persona || null;
    } catch (error) {
      if (error.response && error.response.status === 401) {
        return null;
      }
      throw error;
    }
  },

  getInterestFloor: async (personaId) => {
    const { data } = await client.get(`/personas/${personaId}/interest-floor/`);
    return data;
  },

  switchPersona: async (personaId) => {
    const { data } = await client.post('/personas/switch/', { persona_id: personaId });
    return data;
  },

  updatePersona: async (personaId, formData) => {
    const { data } = await client.put(`/personas/${personaId}/update/`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return data;
  },

  updateInterests: async (personaId, interests) => {
    const { data } = await client.put(`/personas/${personaId}/update/`, { interests });
    return data;
  },

  createPersona: async (formData) => {
    const { data } = await client.post('/personas/create/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return data;
  }
};
