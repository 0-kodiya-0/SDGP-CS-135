import { NotificationItem } from "./types";

interface NotificationDisplayProps {
    notifications: NotificationItem[];
}

const NotificationDisplay: React.FC<NotificationDisplayProps> = ({ notifications }) => {
    return (
        <div className="fixed top-4 right-4 z-50 space-y-2">
            {notifications.map(notification => (
                <div
                    key={notification.id}
                    className={`p-4 rounded shadow-md ${notification.type === 'success' ? 'bg-green-100 border-l-4 border-green-500' :
                            notification.type === 'warning' ? 'bg-yellow-100 border-l-4 border-yellow-500' :
                                notification.type === 'error' ? 'bg-red-100 border-l-4 border-red-500' :
                                    'bg-blue-100 border-l-4 border-blue-500'
                        }`}
                >
                    <div className="flex items-start">
                        <div className="ml-3">
                            <p className="text-sm font-medium text-gray-900">{notification.message}</p>
                            {notification.actionText && (
                                <button
                                    className="mt-1 text-xs text-blue-500 hover:text-blue-700"
                                    onClick={() => notification.onAction && notification.onAction()}
                                >
                                    {notification.actionText}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default NotificationDisplay;