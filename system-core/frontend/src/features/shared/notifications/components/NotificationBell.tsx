import React, { useRef, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { useConsentStore } from '../store/consentStore';
import { NotificationPanel } from './NotificationPanel';
import { useNotificationStore } from '../store/useNotificationStore';

interface NotificationBellProps {
  className?: string;
}

export function NotificationBell({ className }: NotificationBellProps) {
  const { unreadCount, isOpen, toggleNotificationPanel, setOpen } = useNotificationStore();
  const { requests, setOpen: setConsentOpen } = useConsentStore();

  const bellRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Calculate total count (notifications + consent requests)
  const totalCount = unreadCount + requests.length;

  // Close panel when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isOpen &&
        bellRef.current &&
        panelRef.current &&
        !bellRef.current.contains(event.target as Node) &&
        !panelRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
        setConsentOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, setOpen, setConsentOpen]);

  // Auto-open when there are consent requests
  useEffect(() => {
    if (requests.length > 0) {
      setOpen(true);
      setConsentOpen(true);
    }
  }, [requests.length, setOpen, setConsentOpen]);

  const handleBellClick = () => {
    toggleNotificationPanel();
    setConsentOpen(isOpen);
  };

  // Check if bell should pulse (when there are consent requests)
  const shouldPulse = requests.length > 0;

  return (
    <div className="relative">
      <button
        ref={bellRef}
        className={`p-1.5 hover:bg-gray-100 rounded relative ${className} ${shouldPulse ? 'animate-pulse' : ''}`}
        onClick={handleBellClick}
        aria-label="Notifications and Requests"
      >
        <Bell className="w-5 h-5" />

        {/* Count badge */}
        {totalCount > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 text-xs bg-red-500 text-white rounded-full flex items-center justify-center">
            {totalCount > 9 ? '9+' : totalCount}
          </span>
        )}
      </button>

      {/* Combined notification and consent panel */}
      {isOpen && (
        <div
          ref={panelRef}
          className="absolute right-0 mt-2 w-80 max-h-96 bg-white border border-gray-200 rounded shadow-lg z-20 overflow-hidden"
        >
          <NotificationPanel />
        </div>
      )}
    </div>
  );
}

export default NotificationBell;