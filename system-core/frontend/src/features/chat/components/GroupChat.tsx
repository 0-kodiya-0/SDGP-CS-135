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
  Chip,
  Box,
  CircularProgress,
  Snackbar,
  Alert,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import { useAccount } from '../../default/user_account';
import { useContacts } from '../../default/contacts/hooks/useContacts.google';
import { PersonType } from '../../default/contacts/types/types.data';
import { useAuth } from '../../default/user_account/contexts/AuthContext';
import axios from 'axios';

interface GroupChatProps {
  open: boolean;
  onClose: () => void;
  onGroupCreated?: (conversationId: string) => void;
}

interface SelectedUser {
  id: string;
  email: string;
  name: string;
  photo?: string;
}

export const GroupChat: React.FC<GroupChatProps> = ({ open, onClose, onGroupCreated }) => {
  const [groupName, setGroupName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<SelectedUser[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { currentAccount } = useAccount();
  const { session } = useAuth();
  const { contacts, loading, searchContacts } = useContacts(currentAccount?.accountId || '');
  const [filteredContacts, setFilteredContacts] = useState<PersonType[]>([]);

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

  const handleAddUser = (contact: PersonType) => {
    const email = contact.emailAddresses?.[0]?.value;
    const name = contact.names?.[0]?.displayName;
    const photo = contact.photos?.[0]?.url;

    if (!email || !name) return;

    if (!selectedUsers.find(u => u.email === email)) {
      setSelectedUsers([...selectedUsers, {
        id: contact.resourceName || email,
        email,
        name,
        photo
      }]);
    }
  };

  const handleRemoveUser = (email: string) => {
    setSelectedUsers(selectedUsers.filter(user => user.email !== email));
  };

  const handleCreateGroup = async () => {
    if (!groupName || selectedUsers.length === 0 || !session) {
      setError('Please provide a group name and select at least one user');
      return;
    }

    try {
      setIsCreating(true);
      setError(null);

      const response = await axios.post('/api/chat/conversations/group', {
        name: groupName,
        participants: selectedUsers.map(user => user.email)
      }, {
        withCredentials: true
      });

      if (response.data) {
        onGroupCreated?.(response.data._id);
        onClose();
      }
    } catch (error) {
      console.error('Error creating group:', error);
      setError('Failed to create group. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogTitle>Create Group Chat</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Group Name"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            sx={{ mb: 2, mt: 1 }}
          />

          <Box sx={{ mb: 2 }}>
            {selectedUsers.map((user) => (
              <Chip
                key={user.id}
                avatar={<Avatar src={user.photo}>{user.name[0]}</Avatar>}
                label={user.name}
                onDelete={() => handleRemoveUser(user.email)}
                sx={{ mr: 1, mb: 1 }}
              />
            ))}
          </Box>

          <TextField
            fullWidth
            placeholder="Search users to add..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              endAdornment: (
                <IconButton onClick={() => setSearchQuery(searchQuery)}>
                  <SearchIcon />
                </IconButton>
              ),
            }}
            sx={{ mb: 2 }}
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

                if (!email || !name) return null;

                const isSelected = selectedUsers.some(u => u.email === email);

                return (
                  <ListItem
                    key={contact.resourceName}
                    secondaryAction={
                      <IconButton 
                        edge="end" 
                        onClick={() => handleAddUser(contact)}
                        disabled={isSelected || isCreating}
                      >
                        {isCreating ? <CircularProgress size={24} /> : <PersonAddIcon />}
                      </IconButton>
                    }
                  >
                    <ListItemAvatar>
                      <Avatar src={photo}>{name[0]}</Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={name}
                      secondary={email}
                    />
                  </ListItem>
                );
              })}
            </List>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button
            onClick={handleCreateGroup}
            disabled={!groupName || selectedUsers.length === 0 || isCreating}
            variant="contained"
          >
            {isCreating ? 'Creating...' : 'Create Group'}
          </Button>
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