import React, { useState, useEffect } from 'react';
import { Box, List, ListItem, ListItemAvatar, ListItemText, Avatar, IconButton, Typography, Menu, MenuItem, CircularProgress } from '@mui/material';
import { UserPlus, Users, Trash2 } from 'lucide-react';
import { UserSearch } from './UserSearch';
import { GroupChat } from './GroupChat';
import axios from 'axios';
import { useAccount } from '../../user_account';
import { useTabStore } from '../../../required/tab_view';
import { fetchAccountEmail } from '../../user_account/utils/account.utils';
import { ComponentTypes } from '../../../required/tab_view/types/types.views';
import { API_BASE_URL } from '../../../../conf/axios';

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

export default function ChatSummaryView() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [showUserSearch, setShowUserSearch] = useState(false);
  const [showGroupChat, setShowGroupChat] = useState(false);
  const [participantEmails, setParticipantEmails] = useState<Record<string, string>>({});
  const { currentAccount } = useAccount();
  const { addTab, closeTabs } = useTabStore();
  const [contextMenu, setContextMenu] = useState<{
    mouseX: number;
    mouseY: number;
    conversationId: string;
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentAccount?.id) {
      loadConversations();
    }
  }, [currentAccount?.id]);

  useEffect(() => {
    const fetchEmails = async () => {
      const uniqueParticipants = new Set<string>();
      conversations.forEach(conv => {
        conv.participants.forEach(p => {
          if (p !== currentAccount?.id) {
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

    if (conversations.length > 0 && currentAccount?.id) {
      fetchEmails();
    }
  }, [conversations, currentAccount?.id]);

  const loadConversations = async () => {
    if (!currentAccount?.id) return;

    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/chat/${currentAccount.id}/conversations`, {
        withCredentials: true
      });
      setConversations(response.data);
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConversationCreated = (conversationId: string) => {
    loadConversations();
  };

  const handleConversationClick = (conversation: Conversation) => {
    if (!currentAccount?.id) return;

    const otherParticipant = conversation.participants.find(p => p !== currentAccount.id);
    const title = conversation.type === 'group'
      ? conversation.name || 'Group Chat'
      : (otherParticipant && participantEmails[otherParticipant]) || 'Chat';

    addTab(title, null, ComponentTypes.CHAT_CONVERSATION,
      {
        conversationId: conversation._id,
        conversationType: conversation.type,
        conversationName: conversation.name || title
      }
    );
  };

  const getOtherParticipantName = (conversation: Conversation) => {
    // Remove the console.log
    if (conversation.type === 'group') return conversation.name || 'Group Chat';

    const otherParticipant = conversation.participants.find(p => p !== currentAccount?.id);
    if (!otherParticipant) return 'Unknown';

    // Check if we have the email mapping
    const email = participantEmails[otherParticipant];
    if (!email) return 'Loading...'; // Show loading state instead of ID

    // Format email for display - show name part only
    return email.split('@')[0] || email;
  };

  const handleContextMenu = (event: React.MouseEvent, conversationId: string) => {
    event.preventDefault();
    event.stopPropagation();
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
    if (!contextMenu?.conversationId || !currentAccount?.id) return;

    const conversationId = contextMenu.conversationId;
    setIsDeleting(conversationId);

    try {
      // Close any tabs associated with this conversation
      closeTabs((tab) => {
        const params = tab.params as any;
        return params?.conversationId === conversationId;
      });

      // Delete the conversation
      await axios.delete(`${API_BASE_URL}/chat/${currentAccount.id}/conversations/${conversationId}`, {
        withCredentials: true
      });

      setConversations(prev => prev.filter(conv => conv._id !== conversationId));
    } catch (error) {
      console.error('Error deleting conversation:', error);
    } finally {
      setIsDeleting(null);
      handleCloseContextMenu();
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
        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" height="100%">
            <CircularProgress />
          </Box>
        ) : conversations.length === 0 ? (
          <Box display="flex" flexDirection="column" justifyContent="center" alignItems="center" height="80%" p={3}>
            <Typography variant="body1" color="text.secondary" textAlign="center">
              No conversations yet
            </Typography>
            <Typography variant="body2" color="text.secondary" textAlign="center" mt={1}>
              Start by adding a new chat
            </Typography>
          </Box>
        ) : (
          <List>
            {conversations.map(conversation => (
              <ListItem
                key={conversation._id}
                button
                onClick={() => handleConversationClick(conversation)}
                onContextMenu={(e) => handleContextMenu(e, conversation._id)}
                className="hover:bg-gray-50 relative"
                sx={{
                  opacity: isDeleting === conversation._id ? 0.5 : 1,
                  pointerEvents: isDeleting === conversation._id ? 'none' : 'auto'
                }}
              >
                <ListItemAvatar>
                  <Avatar>
                    {conversation.type === 'group' ? (
                      <Users className="w-5 h-5" />
                    ) : (
                      getOtherParticipantName(conversation)[0]?.toUpperCase() || '?'
                    )}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={getOtherParticipantName(conversation)}
                  secondary={conversation.lastMessage?.content || 'No messages yet'}
                  primaryTypographyProps={{
                    style: {
                      textOverflow: 'ellipsis',
                      overflow: 'hidden',
                      whiteSpace: 'nowrap'
                    }
                  }}
                  secondaryTypographyProps={{
                    style: {
                      textOverflow: 'ellipsis',
                      overflow: 'hidden',
                      whiteSpace: 'nowrap'
                    }
                  }}
                />
                {isDeleting === conversation._id && (
                  <Box position="absolute" right={16} display="flex" alignItems="center">
                    <CircularProgress size={24} />
                  </Box>
                )}
              </ListItem>
            ))}
          </List>
        )}
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
        <MenuItem
          onClick={handleDeleteConversation}
          className="text-red-600"
          disabled={!!isDeleting}
        >
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