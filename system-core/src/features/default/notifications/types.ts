export interface NotificationItem {
    id: string;
    message: string;
    read: boolean;
    timestamp?: Date;
    type?: 'info' | 'warning' | 'error' | 'success';
    source?: string;
    link?: string;
    actionText?: string;
    onAction?: () => void;
}