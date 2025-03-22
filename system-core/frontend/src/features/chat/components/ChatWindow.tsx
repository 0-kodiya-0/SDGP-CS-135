import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  IconButton,
  Typography,
  TextField,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Drawer,
  Tab,
  Tabs,
  Button,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import SendIcon from '@mui/icons-material/Send';
import GroupAddIcon from '@mui/icons-material/GroupAdd';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import { UserSearch } from './UserSearch';
import { GroupChat } from './GroupChat';
import { useAccount } from '../../default/user_account';
import { io, Socket } from 'socket.io-client';
import axios from 'axios';
import { fetchAccountEmail } from '../../default/user_account/utils/account.utils';

interface ChatWindowProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Message {
  _id: string;
  conversationId: string;
  sender: string;
  content: string;
  timestamp: Date;
  read: boolean;
}

interface Conversation {
  _id: string;
  type: 'private' | 'group';
  participants: string[];
  name?: string;
  lastMessage?: {
    content: string;
    sender: string;
    timestamp: Date;
  };
}

interface ParticipantInfo {
  id: string;
  email?: string;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({ isOpen, onClose }) => {
  const [currentTab, setCurrentTab] = useState(0);
  const [message, setMessage] = useState('');
  const [showUserSearch, setShowUserSearch] = useState(false);
  const [showGroupChat, setShowGroupChat] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [socket, setSocket] = useState<Socket | null>(null);
  const { currentAccount } = useAccount();
  const [participantEmails, setParticipantEmails] = useState<Record<string, string>>({});

  // Initialize Socket.IO connection
  useEffect(() => {
    if (!currentAccount?.accountId) return;

    const newSocket = io('http://localhost:3000', {
      withCredentials: true,
      transports: ['websocket']
    });

    newSocket.on('connect', () => {
      console.log('Connected to chat server');
      newSocket.emit('authenticate', currentAccount.accountId);
    });

    newSocket.on('new_message', (message: Message) => {
      console.log('Received new message:', message);
      // Only add the message if it's not from the current user
      // or if it has a real _id (meaning it's from the server)
      if (message.sender !== currentAccount.accountId || message._id) {
        setMessages(prev => {
          // Check if we already have this message (either by _id or matching content and timestamp)
          const isDuplicate = prev.some(m => 
            m._id === message._id || 
            (m.sender === message.sender && 
             m.content === message.content && 
             Math.abs(new Date(m.timestamp).getTime() - new Date(message.timestamp).getTime()) < 1000)
          );
          
          if (isDuplicate) {
            return prev;
          }
          return [...prev, message];
        });
      }
      
      // Update conversation's last message
      setConversations(prev => prev.map(conv => {
        if (conv._id === message.conversationId) {
          return {
            ...conv,
            lastMessage: {
              content: message.content,
              sender: message.sender,
              timestamp: message.timestamp
            }
          };
        }
        return conv;
      }));
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, [currentAccount?.accountId]);

  // Join conversation room when conversation changes
  useEffect(() => {
    if (!socket || !currentConversation) return;

    // Leave previous conversation room if any
    if (currentConversation._id) {
      socket.emit('join_conversation', currentConversation._id);
    }

    // Load messages for the new conversation
    loadMessages();

    return () => {
      if (currentConversation._id) {
        socket.emit('leave_conversation', currentConversation._id);
      }
    };
  }, [currentConversation, socket]);

  // Load conversations
  useEffect(() => {
    const loadConversations = async () => {
      try {
        const response = await axios.get('/api/chat/conversations', {
          withCredentials: true
        });
        setConversations(response.data);
      } catch (error) {
        console.error('Error loading conversations:', error);
      }
    };

    if (isOpen) {
      loadConversations();
    }
  }, [isOpen]);

  // Fetch participant emails when conversations change
  useEffect(() => {
    const fetchEmails = async () => {
      const uniqueParticipants = new Set<string>();
      conversations.forEach(conv => {
        conv.participants.forEach(p => {
          if (p !== currentAccount?.accountId) {
            uniqueParticipants.add(p);
          }
        });
      });

      const emailPromises = Array.from(uniqueParticipants).map(async (participantId) => {
        try {
          const response = await fetchAccountEmail(participantId);
          if (response.success) {
            return [participantId, response.data.email];
          }
          return [participantId, participantId];
        } catch (error) {
          console.error('Error fetching email for participant:', participantId, error);
          return [participantId, participantId];
        }
      });

      const emails = await Promise.all(emailPromises);
      setParticipantEmails(Object.fromEntries(emails));
    };

    if (conversations.length > 0 && currentAccount?.accountId) {
      fetchEmails();
    }
  }, [conversations, currentAccount?.accountId]);

  const loadMessages = async () => {
    if (!currentConversation) return;

    try {
      const response = await axios.get(`/api/chat/conversations/${currentConversation._id}/messages`, {
        withCredentials: true
      });
      setMessages(response.data.reverse()); // Reverse to show newest messages at the bottom
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
    setCurrentConversation(null); // Clear current conversation when switching tabs
  };

  const handleSendMessage = () => {
    if (!message.trim() || !currentConversation || !socket || !currentAccount) return;

    const tempId = `temp-${Date.now()}-${Math.random()}`;
    const newMessage = {
      _id: tempId,
      conversationId: currentConversation._id,
      content: message.trim(),
      sender: currentAccount.accountId,
      timestamp: new Date(),
      read: false
    };

    // Optimistically add the message to the UI
    setMessages(prev => [...prev, newMessage]);

    // Send the message through socket
    socket.emit('send_message', {
      conversationId: currentConversation._id,
      content: message.trim()
    });

    setMessage('');
  };

  const handleConversationCreated = (conversationId: string) => {
    // Reload conversations to include the new one
    axios.get('/api/chat/conversations', {
      withCredentials: true
    }).then(response => {
      setConversations(response.data);
      // Find and set the new conversation as current
      const newConversation = response.data.find((c: Conversation) => c._id === conversationId);
      if (newConversation) {
        setCurrentConversation(newConversation);
      }
    });
  };

  const handleConversationSelect = (conversation: Conversation) => {
    setCurrentConversation(conversation);
  };

  const getOtherParticipantName = (conversation: Conversation) => {
    if (conversation.type === 'group') return conversation.name;
    const otherParticipant = conversation.participants.find(p => p !== currentAccount?.accountId);
    return otherParticipant ? participantEmails[otherParticipant] || otherParticipant : 'Unknown';
  };

  return (
    <Drawer
      anchor="right"
      open={isOpen}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: '450px',
          height: '600px',
          bottom: '20px',
          right: '20px',
          top: 'auto',
          borderRadius: '12px',
          position: 'fixed',
          maxWidth: '90vw',
          maxHeight: '90vh',
        },
      }}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        {/* Header */}
        <Box sx={{ 
          p: 2, 
          borderBottom: 1, 
          borderColor: 'divider',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <Typography variant="h6">
            {currentConversation ? getOtherParticipantName(currentConversation) : 'Chat'}
          </Typography>
          <Box>
            {!currentConversation && (
              <>
                <IconButton size="small" onClick={() => setShowUserSearch(true)}>
                  <PersonAddIcon />
                </IconButton>
                <IconButton size="small" onClick={() => setShowGroupChat(true)}>
                  <GroupAddIcon />
                </IconButton>
              </>
            )}
            <IconButton size="small" onClick={() => currentConversation ? setCurrentConversation(null) : onClose()}>
              <CloseIcon />
            </IconButton>
          </Box>
        </Box>

        {!currentConversation ? (
          <>
            {/* Tabs */}
            <Tabs value={currentTab} onChange={handleTabChange}>
              <Tab label="Messages" />
              <Tab label="Groups" />
            </Tabs>

            {/* Conversations List */}
            <Box sx={{ flexGrow: 1, overflow: 'auto', p: 2 }}>
              <List>
                {conversations
                  .filter(conv => currentTab === 0 ? conv.type === 'private' : conv.type === 'group')
                  .map(conversation => (
                    <ListItem
                      key={conversation._id}
                      button
                      onClick={() => handleConversationSelect(conversation)}
                    >
                      <ListItemAvatar>
                        <Avatar>{getOtherParticipantName(conversation)[0]}</Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={getOtherParticipantName(conversation)}
                        secondary={conversation.lastMessage?.content || 'No messages yet'}
                      />
                    </ListItem>
                  ))}
              </List>
            </Box>
          </>
        ) : (
          <>
            {/* Chat Area */}
            <Box sx={{ flexGrow: 1, overflow: 'auto', p: 2 }}>
              <List>
                {messages.map((msg, index) => (
                  <ListItem
                    key={msg._id || `temp-${index}`}
                    sx={{
                      flexDirection: 'column',
                      alignItems: msg.sender === currentAccount?.accountId ? 'flex-end' : 'flex-start',
                    }}
                  >
                    <Box
                      sx={{
                        maxWidth: '70%',
                        backgroundColor: msg.sender === currentAccount?.accountId ? 'primary.main' : 'grey.200',
                        color: msg.sender === currentAccount?.accountId ? 'white' : 'text.primary',
                        borderRadius: 2,
                        p: 1,
                        mb: 0.5,
                      }}
                    >
                      <Typography variant="body1">{msg.content}</Typography>
                    </Box>
                    <Typography variant="caption" color="text.secondary">
                      {new Date(msg.timestamp).toLocaleTimeString()}
                    </Typography>
                  </ListItem>
                ))}
              </List>
            </Box>

            {/* Message Input */}
            <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Type a message..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                />
                <IconButton color="primary" onClick={handleSendMessage}>
                  <SendIcon />
                </IconButton>
              </Box>
            </Box>
          </>
        )}
      </Box>

      {/* User Search Dialog */}
      {showUserSearch && (
        <UserSearch
          open={showUserSearch}
          onClose={() => setShowUserSearch(false)}
          onConversationCreated={handleConversationCreated}
        />
      )}

      {/* Group Chat Dialog */}
      {showGroupChat && (
        <GroupChat
          open={showGroupChat}
          onClose={() => setShowGroupChat(false)}
          onGroupCreated={handleConversationCreated}
        />
      )}
    </Drawer>
  );
}; 