import client from '../../../services/client';

export const postApi = {
  getPost: async (postId) => {
    const { data } = await client.get(`/posts/${postId}/`);
    return data;
  },

  votePost: async (postId, direction, personaId) => {
    const { data } = await client.post(`/posts/${postId}/vote/`, { direction, personaId });
    return data;
  },

  recordClick: async (postId, personaId) => {
    const { data } = await client.post(`/posts/${postId}/click/`, { personaId });
    return data;
  },

  recordImpression: async (postIds, personaId) => {
    if (!Array.isArray(postIds)) {
      postIds = [postIds];
    }
    const { data } = await client.post(`/posts/impression/`, { postIds, personaId });
    return data;
  }
};
