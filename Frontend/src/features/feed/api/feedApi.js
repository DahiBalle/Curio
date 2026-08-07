import client from '../../../services/client';


export const feedApi = {
  getFeed: async (personaId, page = 1, options = {}) => {
    const { data } = await client.get('/feed/', { params: { personaId, page }, ...options });
    return data.posts || [];
  },
  logImpression: async (personaId, postIds) => {
    if (!personaId || !postIds || postIds.length === 0) return;
    // Extract actual numeric IDs from "post-123"
    const numericIds = postIds.map(idStr => {
      const parts = idStr.split('-');
      return parts.length > 1 ? parseInt(parts[1], 10) : parseInt(idStr, 10);
    }).filter(id => !isNaN(id));
    
    if (numericIds.length === 0) return;
    
    await client.post('/posts/impression/', {
      personaId,
      postIds: numericIds
    });
  }
};
