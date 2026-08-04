import axios from 'axios';

// --- MOCK DATA ---
const generateMockFeed = (personaId) => {
  // Generate slightly different feeds based on personaId
  return [
    {
      id: `feed-post-${personaId}-1`,
      authorAvatar: `https://picsum.photos/seed/${personaId}1/40/40`,
      subreddit: personaId === 1 ? 'Skate Life' : 'Tech Enthusiast',
      timeAgo: '2h',
      title: personaId === 1 ? 'Landed a new trick today!' : 'Just built my new PC, check it out!',
      description: personaId === 1 ? 'Finally got this down after weeks of practice. #skateboarding' : 'Specs: Ryzen 9, 32GB RAM, RTX 4080. It took all weekend but it was worth it! #tech',
      imageUrl: `https://picsum.photos/seed/${personaId}1img/500/300`,
      upvotes: 120,
      commentsCount: 45
    },
    {
      id: `feed-post-${personaId}-2`,
      authorAvatar: `https://picsum.photos/seed/${personaId}2/40/40`,
      subreddit: personaId === 1 ? 'Tony Hawk Fans' : 'Code Newbie',
      timeAgo: '5h',
      title: personaId === 1 ? 'Classic footage of the 900!' : 'Learning React is so fun.',
      description: personaId === 1 ? 'Never gets old watching this historic moment.' : 'Just wrapped my head around hooks and context. Next up: Redux.',
      upvotes: 300,
      commentsCount: 20
    },
    {
      id: `feed-post-${personaId}-3`,
      authorAvatar: `https://picsum.photos/seed/${personaId}3/40/40`,
      subreddit: personaId === 1 ? 'Vans' : 'StackOverflow',
      timeAgo: '1d',
      title: personaId === 1 ? 'New arrivals drop tomorrow.' : 'Why does my div have a scrollbar?',
      description: personaId === 1 ? 'Get ready for the exclusive summer collection dropping at 9 AM.' : 'I have tried overflow: hidden but it keeps showing up on mobile. Please help!',
      imageUrl: `https://picsum.photos/seed/${personaId}3img/500/300`,
      upvotes: 1500,
      commentsCount: 200
    }
  ];
};

export const feedApi = {
  getFeed: async (personaId) => {
    // --- FUTURE API CALL ---
    // try {
    //   const response = await axios.get(`/api/v1/feed`, { params: { personaId } });
    //   return response.data;
    // } catch (error) {
    //   console.error("Error fetching feed:", error);
    //   throw error;
    // }

    // --- MOCK RETURN ---
    return new Promise((resolve) => {
      setTimeout(() => {
        // Fallback to a default persona if none provided
        const id = personaId || 1;
        resolve(generateMockFeed(id));
      }, 500);
    });
  }
};
