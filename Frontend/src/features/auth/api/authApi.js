// Auth specific endpoint functions
import client from '../../../services/client';

export const authApi = {
  /**
   * Check whether an email address is already registered.
   * GET /api/accounts/check-email/?email=<address>
   * Returns { exists: boolean }
   *
   * TODO: update the endpoint path once the backend route is finalised.
   */
  checkEmailExists: async (email) => {
    // Leave the URL empty until the backend endpoint is ready.
    // Replace '' with the real path, e.g. '/accounts/check-email/'
    const endpoint = '';

    if (!endpoint) return { exists: false };

    const { data } = await client.get(endpoint, {
      params: { email },
    });

    return data; // expected shape: { exists: boolean }
  },

  signup: async (payload) => {

    const { data } = await client.post('/signup/', payload);
    return {
      ...data,
      token: data.token || data.access
    };
  },

  login: async (payload) => {
    const { data } = await client.post('/login/', payload);
    return {
      ...data,
      token: data.token || data.access
    };

  },

  getMe: async () => {
    // Expected response: { username: '...', onboardingComplete: true }

    const { data } = await client.get('/profile/');

    return data;
  }
};
