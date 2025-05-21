import db from '../../config/db';
import { 
    Notification, 
    CreateNotificationRequest, 
    UpdateNotificationRequest, 
    GetNotificationsParams,
    toNotification
} from './Notification.model';
import { getIO } from '../../config/socket.config';
import { ServerError, NotFoundError, ApiErrorCode } from '../../types/response.types';

/**
 * Add a new notification for a user
 */
export async function addUserNotification(data: CreateNotificationRequest): Promise<Notification> {
    try {
        const models = await db.getModels();
        
        // Add current timestamp if not provided
        const timestamp = Date.now();
        
        // Create notification in database
        const newNotification = await models.notifications.Notification.create({
            accountId: data.accountId,
            title: data.title,
            message: data.message,
            type: data.type || 'info',
            read: false,
            link: data.link,
            timestamp,
            expiresAt: data.expiresAt,
            metadata: data.metadata
        });
        
        // Convert to response format
        const notification = toNotification(newNotification);
        
        // Emit realtime notification event via socket.io
        try {
            const io = getIO();
            io.to(`account-${data.accountId}`).emit('notification:new', notification);
        } catch (error) {
            console.error('Failed to emit socket event for notification:', error);
        }
        
        return notification;
    } catch (error) {
        console.error('Failed to add notification:', error);
        throw new ServerError('Failed to add notification');
    }
}

/**
 * Get all notifications for a user
 */
export async function getUserNotifications(params: GetNotificationsParams): Promise<{
    notifications: Notification[];
    total: number;
    unreadCount: number;
}> {
    try {
        const models = await db.getModels();
        
        // Build query based on parameters
        const query: Record<string, any> = { accountId: params.accountId };
        
        if (typeof params.read === 'boolean') {
            query.read = params.read;
        }
        
        if (params.type) {
            query.type = params.type;
        }
        
        // Get paginated notifications
        const limit = params.limit || 20;
        const offset = params.offset || 0;
        
        const notifications = await models.notifications.Notification.find(query)
            .sort({ timestamp: -1 })
            .skip(offset)
            .limit(limit);
        
        // Get total count
        const total = await models.notifications.Notification.countDocuments(query);
        
        // Get unread count
        const unreadCount = await models.notifications.Notification.countDocuments({
            accountId: params.accountId,
            read: false
        });
        
        // Convert to response format
        const notificationResponses = notifications.map(toNotification);
        
        return {
            notifications: notificationResponses,
            total,
            unreadCount
        };
    } catch (error) {
        console.error('Failed to get notifications:', error);
        throw new ServerError('Failed to get notifications');
    }
}

/**
 * Mark a notification as read
 */
export async function markNotificationAsRead(accountId: string, notificationId: string): Promise<Notification> {
    try {
        const models = await db.getModels();
        
        // Find and update the notification
        const notification = await models.notifications.Notification.findOneAndUpdate(
            { _id: notificationId, accountId },
            { read: true },
            { new: true }
        );
        
        if (!notification) {
            throw new NotFoundError('Notification not found', 404, ApiErrorCode.RESOURCE_NOT_FOUND);
        }
        
        // Convert to response format
        const notificationResponse = toNotification(notification);
        
        // Emit update event
        try {
            const io = getIO();
            io.to(`account-${accountId}`).emit('notification:updated', notificationResponse);
        } catch (error) {
            console.error('Failed to emit socket event for notification update:', error);
        }
        
        return notificationResponse;
    } catch (error) {
        if (error instanceof NotFoundError) {
            throw error;
        }
        console.error('Failed to mark notification as read:', error);
        throw new ServerError('Failed to mark notification as read');
    }
}

/**
 * Mark all notifications as read for a user
 */
export async function markAllNotificationsAsRead(accountId: string): Promise<number> {
    try {
        const models = await db.getModels();
        
        // Update all unread notifications for the user
        const result = await models.notifications.Notification.updateMany(
            { accountId, read: false },
            { read: true }
        );
        
        // Emit update event
        try {
            const io = getIO();
            io.to(`account-${accountId}`).emit('notification:all-read');
        } catch (error) {
            console.error('Failed to emit socket event for notifications update:', error);
        }
        
        return result.modifiedCount;
    } catch (error) {
        console.error('Failed to mark all notifications as read:', error);
        throw new ServerError('Failed to mark all notifications as read');
    }
}

/**
 * Update a notification
 */
export async function updateNotification(
    accountId: string, 
    notificationId: string, 
    updates: UpdateNotificationRequest
): Promise<Notification> {
    try {
        const models = await db.getModels();
        
        // Find and update the notification
        const notification = await models.notifications.Notification.findOneAndUpdate(
            { _id: notificationId, accountId },
            updates,
            { new: true }
        );
        
        if (!notification) {
            throw new NotFoundError('Notification not found', 404, ApiErrorCode.RESOURCE_NOT_FOUND);
        }
        
        // Convert to response format
        const notificationResponse = toNotification(notification);
        
        // Emit update event
        try {
            const io = getIO();
            io.to(`account-${accountId}`).emit('notification:updated', notificationResponse);
        } catch (error) {
            console.error('Failed to emit socket event for notification update:', error);
        }
        
        return notificationResponse;
    } catch (error) {
        if (error instanceof NotFoundError) {
            throw error;
        }
        console.error('Failed to update notification:', error);
        throw new ServerError('Failed to update notification');
    }
}

/**
 * Delete a notification
 */
export async function deleteNotification(accountId: string, notificationId: string): Promise<boolean> {
    try {
        const models = await db.getModels();
        
        // Find and delete the notification
        const result = await models.notifications.Notification.deleteOne({
            _id: notificationId,
            accountId
        });
        
        if (result.deletedCount === 0) {
            throw new NotFoundError('Notification not found', 404, ApiErrorCode.RESOURCE_NOT_FOUND);
        }
        
        // Emit delete event
        try {
            const io = getIO();
            io.to(`account-${accountId}`).emit('notification:deleted', notificationId);
        } catch (error) {
            console.error('Failed to emit socket event for notification deletion:', error);
        }
        
        return true;
    } catch (error) {
        if (error instanceof NotFoundError) {
            throw error;
        }
        console.error('Failed to delete notification:', error);
        throw new ServerError('Failed to delete notification');
    }
}

/**
 * Delete all notifications for a user
 */
export async function deleteAllNotifications(accountId: string): Promise<number> {
    try {
        const models = await db.getModels();
        
        // Delete all notifications for the user
        const result = await models.notifications.Notification.deleteMany({ accountId });
        
        // Emit clear event
        try {
            const io = getIO();
            io.to(`account-${accountId}`).emit('notification:all-deleted');
        } catch (error) {
            console.error('Failed to emit socket event for notifications deletion:', error);
        }
        
        return result.deletedCount || 0;
    } catch (error) {
        console.error('Failed to delete all notifications:', error);
        throw new ServerError('Failed to delete all notifications');
    }
}