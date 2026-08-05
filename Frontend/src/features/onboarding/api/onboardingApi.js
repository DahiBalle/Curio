import client from '../../../services/client';

/*
// Simulated delay to make the mock API feel real
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

*/

export const onboardingApi = {
  checkUsernameAvailability: async (username) => {
    const { data } = await client.get('', { params: { username } });
    return data;
  },

  submitOnboarding: async (payload) => {
    // If payload contains files (like avatar), use FormData in the component 
    // and pass it here, or construct it here. Assuming payload is an object or FormData.
    const { data } = await client.post('', payload);
    return data;
  }
};
