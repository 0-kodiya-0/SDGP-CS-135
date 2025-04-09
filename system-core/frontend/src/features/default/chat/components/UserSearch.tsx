import React, { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  IconButton,
  DialogActions,
  Button,
  CircularProgress,
  Snackbar,
  Alert,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import axios from 'axios';
import { PersonType, useContacts } from '../../contacts';
import { useAccount, useAuth } from '../../user_account';
import { debounce } from 'lodash';
import { useServicePermissions } from '../../user_account/hooks/useServicePermissions.google';
import { API_BASE_URL } from '../../../../conf/axios';

interface UserSearchProps {
  open: boolean;
  onClose: () => void;
  onConversationCreated?: (conversationId: string) => void;
}

export const UserSearch: React.FC<UserSearchProps> = ({ open, onClose, onConversationCreated }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredContacts, setFilteredContacts] = useState<PersonType[]>([]);
  const [isCreating, setIsCreating] = useState<string | null>(null); // Track which user is being added
  const [error, setError] = useState<string | null>(null);
  const { currentAccount } = useAccount();
  const { isAuthenticated } = useAuth();
  const { contacts, loading, searchContacts } = useContacts(currentAccount?.id || '');
  const [existingConversations, setExistingConversations] = useState<string[]>([]);

  // Add permissions hook
  const {
    permissions,
    permissionsLoading,
    permissionError,
    checkAllServicePermissions: checkAllPeoplePermissions,
  } = useServicePermissions(currentAccount?.id || null, 'people');

  // Fetch existing conversations to prevent duplicates
  useEffect(() => {
    const fetchExistingConversations = async () => {
      try {
        if (!currentAccount?.id) return;

        const response = await axios.get(`${API_BASE_URL}/chat/${currentAccount.id}/conversations`, {
          withCredentials: true
        });

        // Extract participant IDs from private conversations
        const participantIds = response.data
          .filter((conv: any) => conv.type === 'private')
          .map((conv: any) => conv.participants.find((p: string) => p !== currentAccount.id));

        setExistingConversations(participantIds);
      } catch (error) {
        console.error('Error fetching existing conversations:', error);
      }
    };

    fetchExistingConversations();
  }, [currentAccount?.id]);

  // Debounced search function to prevent excessive API calls
  const debouncedSearch = useCallback(
    debounce(async (query: string) => {
      if (query && permissions?.readonly?.hasAccess) {
        const result = await searchContacts(query, {
          pageSize: 10,
          readMask: 'emailAddresses,names,photos'
        });

        // Then update your filtering logic with more debugging
        const filteredResults = (result?.contacts || []).filter(contact => {
          const contactId = contact.resourceName?.split('/')?.[1];
          const isCurrentUser = contactId === currentAccount?.id;
          const isExistingConversation = existingConversations.includes(contactId);

          if (isCurrentUser) {
            console.log('Filtered out current user:', contactId);
          }

          return contactId && !isCurrentUser && !isExistingConversation;
        });

        setFilteredContacts(filteredResults);
      } else {
        setFilteredContacts([]);
      }
    }, 300),
    [currentAccount?.id, existingConversations]
  );

  // Effect to trigger debounced search
  useEffect(() => {
    debouncedSearch(searchQuery);
    // Clean up debounce on unmount
    return () => {
      debouncedSearch.cancel();
    };
  }, [searchQuery, debouncedSearch]);

  const handleSearch = () => {
    // Manual search trigger if needed
    debouncedSearch(searchQuery);
  };

  const handleAddUser = async (userId: string) => {
    try {
      if (!isAuthenticated) {
        setError('You must be logged in to start a conversation');
        return;
      }

      // Check if user is trying to create a conversation with themselves
      if (userId === currentAccount?.id) {
        setError('You cannot start a conversation with yourself');
        return;
      }

      // Check if a conversation with this user already exists
      if (existingConversations.includes(userId)) {
        setError('A conversation with this user already exists');
        return;
      }

      setIsCreating(userId);
      setError(null);

      // Create a private conversation with the selected user
      const response = await axios.post(`${API_BASE_URL}/chat/${currentAccount?.id}/conversations/private`, {
        otherUserId: userId
      }, {
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.data) {
        // Notify parent component about the new conversation
        onConversationCreated?.(response.data._id);
        onClose();
      }
    } catch (error) {
      console.error('Error creating conversation:', error);
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        setError('Please log in to start a conversation');
      } else if (axios.isAxiosError(error) && error.response?.status === 409) {
        setError('A conversation with this user already exists');
      } else {
        setError('Failed to create conversation. Please try again.');
      }
    } finally {
      setIsCreating(null);
    }
  };

  // Show permission error if needed
  if (permissionError && !permissionsLoading) {
    return (
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogTitle>Add New Chat</DialogTitle>
        <DialogContent>
          <Alert severity="error">
            {permissionError || 'Missing contact permissions. Please grant access to your contacts.'}
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Close</Button>
        </DialogActions>
      </Dialog>
    );
  }

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogTitle>Add New Chat</DialogTitle>
        <DialogContent>
          {!permissions?.readonly?.hasAccess && !permissionsLoading ? (
            <Alert severity="warning" sx={{ mb: 2 }}>
              Contact permissions are required. Please grant access to use this feature.
              <Button
                color="primary"
                size="small"
                onClick={() => checkAllPeoplePermissions(true)}
                sx={{ ml: 2 }}
              >
                Grant Access
              </Button>
            </Alert>
          ) : (
            <>
              <TextField
                fullWidth
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  endAdornment: (
                    <IconButton onClick={handleSearch}>
                      <SearchIcon />
                    </IconButton>
                  ),
                }}
                sx={{ mb: 2, mt: 1 }}
              />
              {loading || permissionsLoading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '20px' }}>
                  <CircularProgress />
                </div>
              ) : (
                <List>
                  {filteredContacts.length > 0 ? filteredContacts.map((contact) => {
                    const email = contact.emailAddresses?.[0]?.value;
                    const name = contact.names?.[0]?.displayName;
                    const photo = contact.photos?.[0]?.url;
                    const userId = contact.resourceName?.split('/')?.[1] || '';

                    // Skip rendering the current user or users already in conversations
                    if (!email || userId === currentAccount?.id || existingConversations.includes(userId)) {
                      return null;
                    }

                    return (
                      <ListItem
                        key={contact.resourceName}
                        secondaryAction={
                          <IconButton
                            edge="end"
                            onClick={() => handleAddUser(userId)}
                            disabled={isCreating !== null || !isAuthenticated}
                          >
                            {isCreating === userId ? <CircularProgress size={24} /> : <PersonAddIcon />}
                          </IconButton>
                        }
                      >
                        <ListItemAvatar>
                          <Avatar src={photo}>{name ? name[0] : email[0]}</Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={name || email}
                          secondary={email}
                        />
                      </ListItem>
                    );
                  }) : searchQuery ? (
                    <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
                      No contacts found matching "{searchQuery}"
                    </div>
                  ) : null}
                </List>
              )}
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Close</Button>
        </DialogActions>
      </Dialog>
      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setError(null)} severity="error" sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>
    </>
  );
};

export default UserSearch;