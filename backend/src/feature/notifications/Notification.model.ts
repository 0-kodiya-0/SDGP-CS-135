import mongoose, { Document, Schema } from 'mongoose';
import dbConfig from '../../config/db.config';

// Define notification type
export type NotificationType = 'info' | 'success' | 'warning' | 'error';

// Notification interface
export interface Notification {
    id: string;
    accountId: string;
    title: string;
    message: string;
    type: NotificationType;
    read: boolean;
    link?: string;
    timestamp: number;
    expiresAt?: number;
    metadata?: Record<string, any>;
}

// Request to create a notification
export interface CreateNotificationRequest {
    accountId: string;
    title: string;
    message: string;
    type: NotificationType;
    link?: string;
    expiresAt?: number;
    metadata?: Record<string, any>;
}

// Update notification request
export interface UpdateNotificationRequest {
    read?: boolean;
    title?: string;
    message?: string;
    link?: string;
    expiresAt?: number;
    metadata?: Record<string, any>;
}

// Query parameters for getting notifications
export interface GetNotificationsParams {
    accountId: string;
    read?: boolean;
    type?: NotificationType;
    limit?: number;
    offset?: number;
}

// Notification schema
const NotificationSchema = new Schema({
    accountId: { type: String, required: true, index: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: {
        type: String,
        required: true,
        enum: ['info', 'success', 'warning', 'error'],
        default: 'info'
    },
    read: { type: Boolean, default: false, index: true },
    link: { type: String },
    timestamp: { type: Number, default: () => Date.now(), index: true },
    expiresAt: { type: Number },
    metadata: { type: Schema.Types.Mixed }
}, {
    timestamps: true,
    versionKey: false
});

// Set up TTL index for auto-expiration
NotificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0, sparse: true });

// Document interface for Mongoose
export interface NotificationDocument extends Document, Omit<Notification, 'id'> {
    _id: mongoose.Types.ObjectId;
}

// Convert document to Notification interface
export function toNotification(doc: NotificationDocument): Notification {
    return {
        id: doc._id.toString(),
        accountId: doc.accountId,
        title: doc.title,
        message: doc.message,
        type: doc.type,
        read: doc.read,
        link: doc.link,
        timestamp: doc.timestamp,
        expiresAt: doc.expiresAt,
        metadata: doc.metadata
    };
}

// Initialize model with database connection
const initNotificationModel = async () => {
    const connection = await dbConfig.connectAccountsDB();
    return connection.model<NotificationDocument>('Notification', NotificationSchema);
};

export default initNotificationModel;