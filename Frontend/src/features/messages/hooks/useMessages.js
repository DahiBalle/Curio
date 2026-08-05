import { useState, useEffect, useCallback } from 'react';
import { messagesApi } from '../api/messagesApi';

export const useMessages = () => {
  const [threads, setThreads] = useState([]);
  const [requests, setRequests] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchMessagesData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [threadsData, requestsData, unreadData] = await Promise.all([
        messagesApi.getThreads(),
        messagesApi.getRequests(),
        messagesApi.getUnreadCount()
      ]);
      setThreads(threadsData);
      setRequests(requestsData);
      setUnreadCount(unreadData.count);
    } catch (err) {
      setError(err.message || 'Failed to fetch messages');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMessagesData();
  }, [fetchMessagesData]);

  const acceptRequest = async (id) => {
    await messagesApi.acceptRequest(id);
    await fetchMessagesData(); // Refresh list after accepting
  };

  const declineRequest = async (id) => {
    await messagesApi.declineRequest(id);
    await fetchMessagesData();
  };

  return {
    threads,
    requests,
    unreadCount,
    loading,
    error,
    acceptRequest,
    declineRequest,
    refresh: fetchMessagesData
  };
};
