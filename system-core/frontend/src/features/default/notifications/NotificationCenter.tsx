import React from 'react';
import { NotificationItem } from './types';

interface NotificationCenterProps {
    isOpen: boolean;
    onClose: () => void;
    onNotificationRead: (id: string) => void;
    onMarkAllAsRead?: () => void;
    notifications: NotificationItem[];
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
    isOpen,
    onClose,
    onNotificationRead,
    onMarkAllAsRead,
    notifications
}) => {
    if (!isOpen) return null;

    // Calculate if we have any unread notifications
    const hasUnread = notifications.some(n => !n.read);

    // Function to get the correct background color based on notification type
    const getNotificationBackground = (notification: NotificationItem) => {
        if (notification.read) return 'bg-white';

        switch (notification.type) {
            case 'error':
                return 'bg-red-50';
            case 'warning':
                return 'bg-yellow-50';
            case 'success':
                return 'bg-green-50';
            case 'info':
            default:
                return 'bg-blue-50';
        }
    };

    return (
        <div className="absolute right-0 mt-10 w-64 bg-white rounded-md shadow-lg z-20 border">
            <div className="py-2 px-3 border-b flex justify-between items-center">
                <h3 className="text-sm font-semibold">Notifications</h3>
                <button
                    onClick={onClose}
                    className="text-gray-500 hover:text-gray-700"
                    aria-label="Close notifications"
                >
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M9 3L3 9M3 3L9 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </button>
            </div>

            {notifications.length > 0 ? (
                <div className="max-h-64 overflow-y-auto">
                    {notifications.map(notification => (
                        <div
                            key={notification.id}
                            className={`p-3 border-b text-sm ${getNotificationBackground(notification)} hover:bg-gray-50 cursor-pointer`}
                            onClick={() => onNotificationRead(notification.id)}
                        >
                            <div className="flex justify-between items-start">
                                <span className={`${notification.read ? 'font-normal' : 'font-medium'}`}>
                                    {notification.message}
                                </span>
                                {!notification.read && (
                                    <span className="w-2 h-2 rounded-full bg-blue-500 mt-1 flex-shrink-0"></span>
                                )}
                            </div>

                            {notification.timestamp && (
                                <div className="text-xs text-gray-500 mt-1">
                                    {notification.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </div>
                            )}

                            {notification.actionText && (
                                <button
                                    className="mt-2 text-xs text-blue-500 hover:text-blue-700"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (notification.onAction) notification.onAction();
                                    }}
                                >
                                    {notification.actionText}
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            ) : (
                <div className="p-4 text-center text-gray-500 text-sm">
                    No notifications
                </div>
            )}

            {hasUnread && onMarkAllAsRead && (
                <div className="p-2 border-t text-center">
                    <button
                        className="text-blue-500 text-sm hover:text-blue-700"
                        onClick={(e) => {
                            e.stopPropagation();
                            onMarkAllAsRead();
                        }}
                    >
                        Mark all as read
                    </button>
                </div>
            )}
        </div>
    );
};

export default NotificationCenter;