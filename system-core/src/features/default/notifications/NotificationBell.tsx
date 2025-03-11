import React from 'react';

interface NotificationBellProps {
  count: number;
  onClick: () => void;
  maxCount?: number;
}

export const NotificationBell: React.FC<NotificationBellProps> = ({ count, onClick, maxCount = 9 }) => {
  const displayCount = count > maxCount ? `${maxCount}+` : count;
  
  return (
    <button 
      onClick={onClick}
      className="p-2 relative"
      aria-label={`Notifications${count > 0 ? `: ${count} unread` : ''}`}
    >
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M10 2C7.23858 2 5 4.23858 5 7V10C5 10.1708 4.93815 10.3364 4.82706 10.4606L3.62087 11.8061C3.55077 11.8857 3.5 11.9863 3.5 12.0905V13.5C3.5 13.7761 3.72386 14 4 14H16C16.2761 14 16.5 13.7761 16.5 13.5V12.0905C16.5 11.9863 16.4492 11.8857 16.3791 11.8061L15.1729 10.4606C15.0618 10.3364 15 10.1708 15 10V7C15 4.23858 12.7614 2 10 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M10 18C11.1046 18 12 17.1046 12 16H8C8 17.1046 8.89543 18 10 18Z" fill="currentColor" />
      </svg>
      
      {count > 0 && (
        <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
          {displayCount}
        </span>
      )}
    </button>
  );
};

export default NotificationBell;