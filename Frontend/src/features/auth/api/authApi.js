// Auth specific endpoint functions
import client from '../../../services/client';

export const authApi = {
  checkUsername: async (username) => {
    const { data } = await client.get('/accounts/check-username/', {
      params: { username },
    });
    return data; // expected shape: { available: boolean }
  },

  checkEmailExists: async (email) => {
    const { data } = await client.get('/accounts/check-email/', {
      params: { email },
    });
    return data; // expected shape: { exists: boolean }
  },

  signup: async (payload) => {
    const { data } = await client.post('/auth/signup/', payload);
    return {
      ...data,
      token: data.token || data.access
    };
  },

  login: async (payload) => {
    const { data } = await client.post('/auth/login/', payload);
    return {
      ...data,
      token: data.token || data.access
    };
  },

  getMe: async () => {
    const { data } = await client.get('/auth/me/');
    return data;
  }
};
