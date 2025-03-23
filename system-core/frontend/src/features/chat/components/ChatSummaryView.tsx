import React, { useState, useEffect } from 'react';
import {
  Box,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  IconButton,
  Typography,
  Button,
  Menu,
  MenuItem,
} from '@mui/material';
import { MessageCircle, UserPlus, Users, Trash2 } from 'lucide-react';
import { UserSearch } from './UserSearch';
import { GroupChat } from './GroupChat';
import { useAccount } from '../../default/user_account';
import { useTabs } from '../../required/tab_view/context/TabContext';
import axios from 'axios';
import { fetchAccountEmail } from '../../default/user_account/utils/account.utils';
import ChatConversation from './ChatConversation';

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

export default function ChatSummaryView({ accountId }: { accountId: string }) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [showUserSearch, setShowUserSearch] = useState(false);
  const [showGroupChat, setShowGroupChat] = useState(false);
  const [participantEmails, setParticipantEmails] = useState<Record<string, string>>({});
  const { currentAccount } = useAccount();
  const { addTab } = useTabs();
  const [contextMenu, setContextMenu] = useState<{
    mouseX: number;
    mouseY: number;
    conversationId: string;
  } | null>(null);

  useEffect(() => {
    loadConversations();
  }, []);

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

  const handleConversationCreated = (conversationId: string) => {
    loadConversations();
  };

  const handleConversationClick = (conversation: Conversation) => {
    if (!currentAccount?.accountId) return;

    const otherParticipant = conversation.participants.find(p => p !== currentAccount.accountId);
    const title = conversation.type === 'group' 
      ? conversation.name || 'Group Chat'
      : (otherParticipant && participantEmails[otherParticipant]) || 'Chat';

    addTab(title, <ChatConversation conversationId={conversation._id} />);
  };

  const getOtherParticipantName = (conversation: Conversation) => {
    if (conversation.type === 'group') return conversation.name;
    const otherParticipant = conversation.participants.find(p => p !== currentAccount?.accountId);
    return otherParticipant ? participantEmails[otherParticipant] || otherParticipant : 'Unknown';
  };

  const handleContextMenu = (event: React.MouseEvent, conversationId: string) => {
    event.preventDefault();
    setContextMenu(
      contextMenu === null
        ? { mouseX: event.clientX, mouseY: event.clientY, conversationId }
        : null,
    );
  };

  const handleCloseContextMenu = () => {
    setContextMenu(null);
  };

  const handleDeleteConversation = async () => {
    if (!contextMenu?.conversationId) return;
    
    try {
      await axios.delete(`/api/chat/conversations/${contextMenu.conversationId}`, {
        withCredentials: true
      });
      
      setConversations(prev => prev.filter(conv => conv._id !== contextMenu.conversationId));
      handleCloseContextMenu();
    } catch (error) {
      console.error('Error deleting conversation:', error);
    }
  };

  return (
    <Box className="h-full flex flex-col">
      <Box className="p-4 border-b flex justify-between items-center">
        <Typography variant="h6">Chats</Typography>
        <Box>
          <IconButton onClick={() => setShowUserSearch(true)} size="small" title="New Chat">
            <UserPlus className="w-5 h-5" />
          </IconButton>
          <IconButton onClick={() => setShowGroupChat(true)} size="small" title="New Group">
            <Users className="w-5 h-5" />
          </IconButton>
        </Box>
      </Box>

      <Box className="flex-1 overflow-auto">
        <List>
          {conversations.map(conversation => (
            <ListItem
              key={conversation._id}
              button
              onClick={() => handleConversationClick(conversation)}
              onContextMenu={(e) => handleContextMenu(e, conversation._id)}
              className="hover:bg-gray-50"
            >
              <ListItemAvatar>
                <Avatar>
                  {conversation.type === 'group' ? (
                    <Users className="w-5 h-5" />
                  ) : (
                    getOtherParticipantName(conversation)[0]
                  )}
                </Avatar>
              </ListItemAvatar>
              <ListItemText
                primary={getOtherParticipantName(conversation)}
                secondary={conversation.lastMessage?.content || 'No messages yet'}
              />
            </ListItem>
          ))}
        </List>
      </Box>

      <Menu
        open={contextMenu !== null}
        onClose={handleCloseContextMenu}
        anchorReference="anchorPosition"
        anchorPosition={
          contextMenu !== null
            ? { top: contextMenu.mouseY, left: contextMenu.mouseX }
            : undefined
        }
      >
        <MenuItem onClick={handleDeleteConversation} className="text-red-600">
          <Trash2 className="w-4 h-4 mr-2" />
          Delete Conversation
        </MenuItem>
      </Menu>

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
    </Box>
  );
} 