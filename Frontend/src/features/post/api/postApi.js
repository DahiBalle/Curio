import client from '../../../services/client';

export const postApi = {
  getPost: async (postId) => {
    const { data } = await client.get(`/posts/${postId}/`);
    return data;
  },

  recordClick: async (postId) => {
    const { data } = await client.post(`/posts/${postId}/click/`);
    return data;
  },

  recordImpression: async (postId) => {
    const { data } = await client.post(`/posts/${postId}/impression/`);
    return data;
  }
};
