import React from 'react';
import { IconButton, Badge } from '@mui/material';
import ChatIcon from '@mui/icons-material/Chat';

interface ChatIconProps {
  unreadCount?: number;
  onClick: () => void;
}

export const ChatIconComponent: React.FC<ChatIconProps> = ({ unreadCount = 0, onClick }) => {
  return (
    <IconButton
      color="inherit"
      onClick={onClick}
      sx={{
        position: 'relative',
      }}
    >
      <Badge badgeContent={unreadCount} color="error" max={99}>
        <ChatIcon />
      </Badge>
    </IconButton>
  );
}; 