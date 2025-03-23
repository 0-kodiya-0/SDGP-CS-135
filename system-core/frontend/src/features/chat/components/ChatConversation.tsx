import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  TextField,
  IconButton,
  Typography,
  Avatar,
} from '@mui/material';
import { Send } from 'lucide-react';
import { useAccount } from '../../default/user_account';
import { io, Socket } from 'socket.io-client';
import axios from 'axios';
import { fetchAccountEmail, fetchAccountDetails } from '../../default/user_account/utils/account.utils';

interface Message {
  _id: string;
  conversationId: string;
  sender: string;
  content: string;
  timestamp: Date;
  read: boolean;
}

interface AccountInfo {
  email: string;
  imageUrl?: string;
}

interface ChatConversationProps {
  conversationId: string;
}

export default function ChatConversation({ conversationId }: ChatConversationProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [socket, setSocket] = useState<Socket | null>(null);
  const [participantInfo, setParticipantInfo] = useState<Record<string, AccountInfo>>({});
  const { currentAccount } = useAccount();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!currentAccount?.accountId) return;

    const newSocket = io('http://localhost:3000', {
      withCredentials: true,
      transports: ['websocket']
    });

    newSocket.on('connect', () => {
      console.log('Connected to chat server');
      newSocket.emit('authenticate', currentAccount.accountId);
      newSocket.emit('join_conversation', conversationId);
    });

    newSocket.on('new_message', (message: Message) => {
      if (message.conversationId === conversationId) {
        setMessages(prev => {
          const isDuplicate = prev.some(m => 
            m._id === message._id || 
            (m.sender === message.sender && 
             m.content === message.content && 
             Math.abs(new Date(m.timestamp).getTime() - new Date(message.timestamp).getTime()) < 1000)
          );
          
          if (isDuplicate) return prev;
          return [...prev, message];
        });
        scrollToBottom();
      }
    });

    setSocket(newSocket);

    return () => {
      newSocket.emit('leave_conversation', conversationId);
      newSocket.close();
    };
  }, [currentAccount?.accountId, conversationId]);

  useEffect(() => {
    loadMessages();
  }, [conversationId]);

  useEffect(() => {
    const fetchParticipantInfo = async () => {
      const uniqueSenders = new Set(messages.map(m => m.sender));
      const infoPromises = Array.from(uniqueSenders).map(async (senderId) => {
        try {
          const [emailResponse, detailsResponse] = await Promise.all([
            fetchAccountEmail(senderId),
            fetchAccountDetails(senderId)
          ]);

          return [senderId, {
            email: emailResponse.success ? emailResponse.data.email : senderId,
            imageUrl: detailsResponse.success ? detailsResponse.data?.imageUrl : undefined
          }];
        } catch (error) {
          console.error('Error fetching participant info:', senderId, error);
          return [senderId, { email: senderId }];
        }
      });

      const info = await Promise.all(infoPromises);
      setParticipantInfo(Object.fromEntries(info));
    };

    if (messages.length > 0) {
      fetchParticipantInfo();
    }
  }, [messages]);

  const loadMessages = async () => {
    try {
      const response = await axios.get(`/api/chat/conversations/${conversationId}/messages`, {
        withCredentials: true
      });
      setMessages(response.data.reverse());
      scrollToBottom();
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const handleSendMessage = () => {
    if (!newMessage.trim() || !socket || !currentAccount) return;

    const tempId = `temp-${Date.now()}-${Math.random()}`;
    const message = {
      _id: tempId,
      conversationId,
      content: newMessage.trim(),
      sender: currentAccount.accountId,
      timestamp: new Date(),
      read: false
    };

    setMessages(prev => [...prev, message]);
    socket.emit('send_message', {
      conversationId,
      content: newMessage.trim()
    });

    setNewMessage('');
    scrollToBottom();
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const getInitials = (email: string) => {
    return email.split('@')[0].slice(0, 2).toUpperCase();
  };

  const getGoogleAvatarUrl = (email: string) => {
    // For Google accounts, we can use their profile picture URL pattern
    if (email.endsWith('@gmail.com')) {
      return `https://lh3.googleusercontent.com/a/${email.split('@')[0]}=s32-c`;
    }
    return undefined;
  };

  return (
    <Box className="h-full flex flex-col bg-gray-50">
      <Box className="flex-1 overflow-y-auto p-4">
        {messages.map((message, index) => {
          const isCurrentUser = message.sender === currentAccount?.accountId;
          const info = participantInfo[message.sender] || { email: message.sender };
          const avatarUrl = info.imageUrl || getGoogleAvatarUrl(info.email);

          return (
            <Box
              key={message._id || `temp-${index}`}
              className={`flex items-end mb-4 ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
            >
              <Box className={`flex items-end ${isCurrentUser ? 'flex-row-reverse' : 'flex-row'} max-w-[60%] group`}>
                <Box className={`flex-shrink-0 ${isCurrentUser ? 'ml-2' : 'mr-2'}`}>
                  <Avatar 
                    src={avatarUrl}
                    alt={getInitials(info.email)}
                    className={`w-8 h-8 text-sm ${isCurrentUser ? 'bg-blue-500' : 'bg-gray-400'}`}
                    sx={{ 
                      width: 32, 
                      height: 32, 
                      fontSize: '0.875rem',
                      '& img': {
                        objectFit: 'cover'
                      }
                    }}
                  >
                    {getInitials(info.email)}
                  </Avatar>
                </Box>
                <Box className="flex flex-col">
                  <Typography 
                    variant="caption" 
                    className={`text-gray-600 mb-1 ${isCurrentUser ? 'text-right' : 'text-left'}`}
                  >
                    {info.email.split('@')[0]}
                  </Typography>
                  <Box
                    className={`
                      px-5 py-3 rounded-2xl max-w-full break-words
                      ${isCurrentUser 
                        ? 'bg-blue-500 text-white rounded-br-sm' 
                        : 'bg-gray-100 text-gray-900 rounded-bl-sm'
                      }
                    `}
                  >
                    <Typography className="whitespace-pre-wrap text-lg">{message.content}</Typography>
                  </Box>
                  <Typography 
                    variant="caption" 
                    className={`text-gray-500 mt-1 opacity-0 group-hover:opacity-100 transition-opacity
                      ${isCurrentUser ? 'text-right' : 'text-left'}`}
                  >
                    {formatTime(new Date(message.timestamp))}
                  </Typography>
                </Box>
              </Box>
            </Box>
          );
        })}
        <div ref={messagesEndRef} />
      </Box>

      <Box className="p-4 bg-white border-t">
        <Box className="flex gap-2 items-center">
          <TextField
            fullWidth
            size="small"
            placeholder="Type a message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
            multiline
            maxRows={4}
            className="bg-gray-50"
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: '24px',
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'rgba(0, 0, 0, 0.23)',
                },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#3b82f6',
                }
              }
            }}
          />
          <IconButton 
            color="primary" 
            onClick={handleSendMessage}
            className="bg-blue-500 hover:bg-blue-600 text-white"
            sx={{
              width: 40,
              height: 40,
              '&:hover': {
                backgroundColor: '#2563eb',
              }
            }}
          >
            <Send className="w-5 h-5" />
          </IconButton>
        </Box>
      </Box>
    </Box>
  );
} 