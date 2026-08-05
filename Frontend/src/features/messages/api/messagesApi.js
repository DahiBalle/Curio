import client from '../../../services/client';

/*
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

*/

export const messagesApi = {
  getThreads: async () => {
    const { data } = await client.get('/messages/');
    return data;
  },
  
  getRequests: async () => {
    const { data } = await client.get('/messages/requests/');
    return data;
  },

  getUnreadCount: async () => {
    const { data } = await client.get('/messages/unread-count/');
    return data;
  },

  acceptRequest: async (requestId) => {
    const { data } = await client.post(`/messages/requests/${requestId}/accept/`);
    return data;
  },

  declineRequest: async (requestId) => {
    const { data } = await client.post(`/messages/requests/${requestId}/decline/`);
    return data;
  }
};
