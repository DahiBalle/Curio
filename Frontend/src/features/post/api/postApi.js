import client from '../../../services/client';

export const postApi = {
  getPost: async (postId) => {
    const id = String(postId).replace('post-', '');
    const { data } = await client.get(`/posts/${id}/`);
    return data;
  },

  votePost: async (postId, direction, personaId) => {
    const id = String(postId).replace('post-', '');
    const { data } = await client.post(`/posts/${id}/vote/`, { direction, personaId });
    return data;
  },

  recordClick: async (postId, personaId) => {
    const id = String(postId).replace('post-', '');
    const { data } = await client.post(`/posts/${id}/click/`, { personaId });
    return data;
  },

  recordImpression: async (postIds, personaId) => {
    if (!Array.isArray(postIds)) {
      postIds = [postIds];
    }
    const cleanIds = postIds.map(id => String(id).replace('post-', ''));
    const { data } = await client.post(`/posts/impression/`, { postIds: cleanIds, personaId });
    return data;
  },

  toggleSave: async (postId) => {
    const id = String(postId).replace('post-', '');
    const { data } = await client.post(`/posts/${id}/save/`);
    return data;
  }
};
