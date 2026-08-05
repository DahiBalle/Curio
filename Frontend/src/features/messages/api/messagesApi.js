// Mock data and API structure for messages feature

const mockThreads = [
  {
    id: 'thread-1',
    user: { name: 'Rahul Sharma', username: 'rahulsharma', avatarUrl: 'https://picsum.photos/seed/rahul/40' },
    lastMessage: 'You sent an attachment.',
    timeAgo: '19m',
    isUnread: false,
    isMuted: true
  },
  {
    id: 'thread-2',
    user: { name: 'Chahna Acharya', username: 'chahna_acharya', avatarUrl: 'https://picsum.photos/seed/chahna/40' },
    lastMessage: 'I can understand Mane bhi gusso ave Why ...',
    timeAgo: '19m',
    isUnread: true,
    isMuted: false
  },
  {
    id: 'thread-3',
    user: { name: 'Ketani', username: 'ketani_74', avatarUrl: 'https://picsum.photos/seed/ketani/40' },
    lastMessage: 'You sent an attachment.',
    timeAgo: '38m',
    isUnread: false,
    isMuted: false
  },
  {
    id: 'thread-4',
    user: { name: 'Alice Smith', username: 'alicesmith', avatarUrl: 'https://picsum.photos/seed/alice/40' },
    lastMessage: 'Reacted 😂 to your message',
    timeAgo: '4h',
    isUnread: false,
    isMuted: false
  },
  {
    id: 'thread-5',
    user: { name: 'Denish', username: 'denish', avatarUrl: 'https://picsum.photos/seed/denish/40' },
    lastMessage: 'Denish sent an attachment.',
    timeAgo: '4h',
    isUnread: true,
    isMuted: false
  }
];

const mockRequests = [
  {
    id: 'req-1',
    user: { name: 'Random User', username: 'random123', avatarUrl: 'https://picsum.photos/seed/random/40' },
    message: 'Hey, I love your posts!',
    timeAgo: '1d'
  }
];

export const messagesApi = {
  getThreads: async () => {
    // Real API call:
    // const response = await fetch('/api/messages/threads');
    // return response.json();

    return new Promise(resolve => setTimeout(() => resolve(mockThreads), 500));
  },
  
  getRequests: async () => {
    // Real API call:
    // const response = await fetch('/api/messages/requests');
    // return response.json();

    return new Promise(resolve => setTimeout(() => resolve(mockRequests), 500));
  },

  getUnreadCount: async () => {
    // Real API call:
    // const response = await fetch('/api/messages/unread-count');
    // return response.json();

    return new Promise(resolve => setTimeout(() => {
      const count = mockThreads.filter(t => t.isUnread).length;
      resolve({ count });
    }, 300));
  },

  acceptRequest: async (requestId) => {
    // Real API call:
    // await fetch(`/api/messages/requests/${requestId}/accept`, { method: 'POST' });
    return new Promise(resolve => setTimeout(() => resolve({ success: true }), 300));
  },

  declineRequest: async (requestId) => {
    // Real API call:
    // await fetch(`/api/messages/requests/${requestId}/decline`, { method: 'POST' });
    return new Promise(resolve => setTimeout(() => resolve({ success: true }), 300));
  }
};
