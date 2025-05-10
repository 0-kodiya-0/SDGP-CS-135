import { Check, Trash2, X, AlertTriangle } from 'lucide-react';
import { useConsentStore } from '../store/consentStore';
import { Notification, useNotificationStore } from '../store/useNotificationStore';

export function NotificationPanel() {
    const {
        notifications,
        markAsRead,
        markAllAsRead,
        removeNotification,
        clearAllNotifications
    } = useNotificationStore();

    const {
        requests,
        respondToRequest
    } = useConsentStore();

    // Function to format the timestamp
    const formatTime = (timestamp: number): string => {
        const date = new Date(timestamp);
        const now = new Date();

        // If today, show time
        if (date.toDateString() === now.toDateString()) {
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }

        // If this year, show month and day
        if (date.getFullYear() === now.getFullYear()) {
            return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
        }

        // Otherwise show date
        return date.toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' });
    };

    // Handle notification click
    const handleNotificationClick = (notification: Notification) => {
        // Mark as read
        markAsRead(notification.id);

        // Navigate to link if specified
        if (notification.link) {
            window.open(notification.link, '_blank');
        }
    };

    // Check if there's any content to show
    const hasContent = notifications.length > 0 || requests.length > 0;

    // Get icon color based on notification type
    const getTypeColor = (type: Notification['type']): string => {
        switch (type) {
            case 'info': return 'text-blue-500';
            case 'warning': return 'text-yellow-500';
            case 'error': return 'text-red-500';
            case 'success': return 'text-green-500';
            default: return 'text-gray-500';
        }
    };

    return (
        <div className="flex flex-col h-full max-h-96">
            {/* Header with tabs */}
            <div className="flex justify-between items-center border-b p-3">
                <h3 className="font-medium">Notifications</h3>
                <div className="flex space-x-2">
                    {notifications.length > 0 && (
                        <>
                            <button
                                onClick={markAllAsRead}
                                className="text-xs text-blue-600 hover:text-blue-800 flex items-center"
                                title="Mark all as read"
                            >
                                <Check className="w-3 h-3 mr-1" />
                                <span>Read all</span>
                            </button>
                            <button
                                onClick={clearAllNotifications}
                                className="text-xs text-gray-600 hover:text-gray-800 flex items-center"
                                title="Clear all notifications"
                            >
                                <Trash2 className="w-3 h-3 mr-1" />
                                <span>Clear all</span>
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Consent requests section (always at the top) */}
            {requests.length > 0 && (
                <div className="border-b bg-yellow-50">
                    <div className="px-3 py-2 text-sm font-medium flex items-center text-yellow-800">
                        <AlertTriangle className="h-4 w-4 mr-1.5" />
                        Permission Requests
                    </div>

                    {requests.map((request) => (
                        <div
                            key={request.id}
                            className="p-3 border-t border-yellow-100 bg-yellow-50"
                        >
                            <div className="flex-1">
                                <div className="flex justify-between items-start">
                                    <h4 className="text-sm font-medium text-black pr-6">
                                        {request.title}
                                    </h4>
                                    <span className="text-xs text-gray-500 whitespace-nowrap ml-2">
                                        {formatTime(request.timestamp)}
                                    </span>
                                </div>
                                <p className="text-sm text-gray-700 mt-1 mb-3">
                                    {request.message}
                                </p>

                                {/* Action buttons */}
                                <div className="flex space-x-2 mt-2">
                                    <button
                                        className="px-3 py-1.5 text-sm bg-green-500 text-white rounded hover:bg-green-600 flex-1 font-medium"
                                        onClick={() => respondToRequest(request.id, true)}
                                    >
                                        Allow
                                    </button>
                                    <button
                                        className="px-3 py-1.5 text-sm bg-gray-200 text-gray-800 rounded hover:bg-gray-300 flex-1 font-medium"
                                        onClick={() => respondToRequest(request.id, false)}
                                    >
                                        Deny
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Regular notifications section */}
            <div className="overflow-y-auto flex-grow">
                {!hasContent ? (
                    <div className="p-4 text-center text-gray-500">
                        No notifications
                    </div>
                ) : notifications.length === 0 ? (
                    <div className="p-4 text-center text-gray-500">
                        No notifications
                    </div>
                ) : (
                    notifications.map((notification) => (
                        <div
                            key={notification.id}
                            className={`p-3 border-b hover:bg-gray-50 cursor-pointer flex relative ${notification.read ? 'opacity-75' : ''}`}
                            onClick={() => handleNotificationClick(notification)}
                        >
                            {/* Left indicator for type */}
                            <div className={`w-1 absolute left-0 top-0 bottom-0 ${getTypeColor(notification.type)}`}></div>

                            {/* Content */}
                            <div className="flex-1 pl-1">
                                <div className="flex justify-between">
                                    <h4 className={`text-sm font-medium ${!notification.read ? 'text-black' : 'text-gray-700'}`}>
                                        {notification.title}
                                    </h4>
                                    <span className="text-xs text-gray-500">
                                        {formatTime(notification.timestamp)}
                                    </span>
                                </div>
                                <p className="text-sm text-gray-600 mt-1">
                                    {notification.message}
                                </p>
                            </div>

                            {/* Delete button */}
                            <button
                                className="ml-2 text-gray-400 hover:text-gray-700 self-start mt-1"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    removeNotification(notification.id);
                                }}
                                title="Remove notification"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

export default NotificationPanel;