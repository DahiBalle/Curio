import React, { useState, useEffect, useRef } from 'react';
import './MessageThread.css';
import { Avatar } from '../../../components/ui/Avatar';
import { useAuth } from '../../../context/AuthContext';
import { messagesApi } from '../api/messagesApi';

export const MessageThread = ({ thread }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const ws = useRef(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (!thread) return;

    // Load initial messages via HTTP
    const loadMessages = async () => {
      try {
        const history = await messagesApi.getThreadMessages(thread.id);
        setMessages(history);
        scrollToBottom();
      } catch (err) {
        console.error("Failed to load message history:", err);
      }
    };
    loadMessages();

    // Setup WebSocket
    const token = localStorage.getItem('token');
    // thread.id might be "thread-1", extract number if needed. The backend consumer handles "thread-1" -> "1"
    ws.current = new WebSocket(`ws://localhost:8000/ws/chat/${thread.id}/?token=${token}`);

    ws.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setMessages(prev => [...prev, data]);
      scrollToBottom();
    };

    ws.current.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    return () => {
      if (ws.current) {
        ws.current.close();
      }
    };
  }, [thread]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!inputValue.trim() || !ws.current) return;

    // Send through WebSocket
    ws.current.send(JSON.stringify({
      message: inputValue.trim()
    }));

    setInputValue('');
  };

  if (!thread) return null;

  return (
    <div className="message-thread">
      <div className="message-thread__header">
        <Avatar src={thread.user.avatarUrl} alt={thread.user.name} size="small" />
        <div className="message-thread__header-info">
          <span className="message-thread__name">{thread.user.name}</span>
          <span className="message-thread__username">@{thread.user.username}</span>
        </div>
      </div>

      <div className="message-thread__messages">
        {messages.map((msg, idx) => (
          <div 
            key={msg.id || idx} 
            className={`message-bubble ${msg.senderId === user.id ? 'sent' : 'received'}`}
          >
            {msg.message}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="message-thread__input-container">
        <form onSubmit={handleSend} className="message-thread__form">
          <input
            type="text"
            className="message-thread__input"
            placeholder="Message..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
          />
          <button 
            type="submit" 
            className="message-thread__send-btn"
            disabled={!inputValue.trim()}
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
};
