import client from '../../../services/client';

const cleanId = (id, prefix = 'post-') => String(id).replace(prefix, '');

export const postApi = {
  getPost: async (postId) => {
    const { data } = await client.get(`/posts/${cleanId(postId)}/`);
    return data;
  },

  searchPosts: async (query, page = 1) => {
    const { data } = await client.get('/posts/', { params: { q: query, page } });
    return data.posts || [];
  },

  votePost: async (postId, direction, personaId) => {
    const { data } = await client.post(`/posts/${cleanId(postId)}/vote/`, { direction, personaId });
    return data;
  },

  recordClick: async (postId, personaId) => {
    const { data } = await client.post(`/posts/${cleanId(postId)}/click/`, { personaId });
    return data;
  },

  recordImpression: async (postIds, personaId) => {
    if (!Array.isArray(postIds)) {
      postIds = [postIds];
    }
    const cleanIds = postIds.map(id => cleanId(id));
    const { data } = await client.post(`/posts/impression/`, { postIds: cleanIds, personaId });
    return data;
  },

  toggleSave: async (postId) => {
    const { data } = await client.post(`/posts/${cleanId(postId)}/save/`);
    return data;
  },

  createComment: async (postId, content, parentId = null) => {
    const payload = { content };
    if (parentId) {
      payload.parentId = cleanId(parentId, 'comment-');
    }
    const { data } = await client.post(`/posts/${cleanId(postId)}/comments/create/`, payload);
    return data;
  }
};
