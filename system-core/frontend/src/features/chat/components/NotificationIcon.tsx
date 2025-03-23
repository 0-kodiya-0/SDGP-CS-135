import React, { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { useAccount } from '../../default/user_account';
import axios from 'axios';
import { io, Socket } from 'socket.io-client';

export function NotificationIcon() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [socket, setSocket] = useState<Socket | null>(null);
  const { currentAccount } = useAccount();

  useEffect(() => {
    if (!currentAccount?.accountId) return;

    // Fetch initial unread count
    const fetchUnreadCount = async () => {
      try {
        const response = await axios.get('/api/chat/unread-count', {
          withCredentials: true
        });
        setUnreadCount(response.data.count);
      } catch (error) {
        console.error('Error fetching unread count:', error);
      }
    };

    fetchUnreadCount();

    // Set up socket connection
    const newSocket = io('http://localhost:3000', {
      withCredentials: true,
      transports: ['websocket']
    });

    newSocket.on('connect', () => {
      console.log('Connected to chat server');
      newSocket.emit('authenticate', currentAccount.accountId);
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
      className="p-1.5 hover:bg-gray-100 rounded relative"
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