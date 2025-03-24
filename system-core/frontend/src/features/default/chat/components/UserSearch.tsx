import React, { useState, useEffect } from 'react';
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

interface UserSearchProps {
  open: boolean;
  onClose: () => void;
  onConversationCreated?: (conversationId: string) => void;
}

export const UserSearch: React.FC<UserSearchProps> = ({ open, onClose, onConversationCreated }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredContacts, setFilteredContacts] = useState<PersonType[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { currentAccount } = useAccount();
  const { session } = useAuth();
  const { contacts, loading, searchContacts } = useContacts(currentAccount?.accountId || '');

  useEffect(() => {
    const searchUsers = async () => {
      if (searchQuery) {
        const result = await searchContacts(searchQuery, {
          pageSize: 10,
          readMask: 'emailAddresses,names,photos'
        });
        setFilteredContacts(result?.contacts || []);
      } else {
        setFilteredContacts([]);
      }
    };

    searchUsers();
  }, [searchQuery, searchContacts]);

  const handleSearch = () => {
    // Search is handled by the useEffect above
  };

  const handleAddUser = async (contact: PersonType) => {
    try {
      const email = contact.emailAddresses?.[0]?.value;
      if (!email) return;

      if (!session) {
        setError('You must be logged in to start a conversation');
        return;
      }

      setIsCreating(true);
      setError(null);
      
      // Create a private conversation with the selected user
      // Updated API endpoint path with base URL
      const response = await axios.post('/api/v1/chat/conversations/private', {
        otherUserId: email // Using email as the user ID for now
      }, {
        withCredentials: true, // Important for sending cookies
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
      } else {
        setError('Failed to create conversation. Please try again.');
      }
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogTitle>Add New Chat</DialogTitle>
        <DialogContent>
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
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '20px' }}>
              <CircularProgress />
            </div>
          ) : (
            <List>
              {filteredContacts.map((contact) => {
                const email = contact.emailAddresses?.[0]?.value;
                const name = contact.names?.[0]?.displayName;
                const photo = contact.photos?.[0]?.url;

                if (!email) return null;

                return (
                  <ListItem
                    key={contact.resourceName}
                    secondaryAction={
                      <IconButton 
                        edge="end" 
                        onClick={() => handleAddUser(contact)}
                        disabled={isCreating || !session}
                      >
                        {isCreating ? <CircularProgress size={24} /> : <PersonAddIcon />}
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
              })}
            </List>
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