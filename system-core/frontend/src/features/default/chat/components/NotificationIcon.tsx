import React, { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import axios from 'axios';
import { io, Socket } from 'socket.io-client';
import { useAccount } from '../../user_account';

export function NotificationIcon() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [error, setError] = useState<boolean>(false);
  const { currentAccount } = useAccount();

  useEffect(() => {
    if (!currentAccount?.accountId) return;

    // Fetch initial unread count
    const fetchUnreadCount = async () => {
      try {
        const response = await axios.get('/api/v1/chat/unread-count', {
          withCredentials: true
        });
        setUnreadCount(response.data.count);
        setError(false);
      } catch (error) {
        console.error('Error fetching unread count:', error);
        setError(true);
      }
    };

    fetchUnreadCount();

    // FIXED: Use relative URL with path configuration 
    const newSocket = io('/', {
      path: '/socket.io',
      withCredentials: true,
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });

    newSocket.on('connect', () => {
      console.log('Connected to notification socket');
      setError(false);
      newSocket.emit('authenticate', currentAccount.accountId);
    });

    newSocket.on('connect_error', (err) => {
      console.error('Notification socket connection error:', err);
      setError(true);
    });

    // Listen for new messages
    newSocket.on('new_message', () => {
      setUnreadCount(prev => prev + 1);
    });

    // Listen for messages being read
    newSocket.on('messages_read', () => {
      setUnreadCount(0);
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, [currentAccount?.accountId]);

  return (
    <button
      className={`p-1.5 hover:bg-gray-100 rounded relative ${error ? 'opacity-50' : ''}`}
      aria-label="Notifications"
    >
      <Bell className="w-5 h-5" />
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 w-4 h-4 text-xs bg-red-500 text-white rounded-full flex items-center justify-center">
          {unreadCount}
        </span>
      )}
    </button>
  );
}