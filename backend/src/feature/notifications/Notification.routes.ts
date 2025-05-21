import express from 'express';
import * as NotificationController from './Notification.controller';

const router = express.Router({ mergeParams: true });

/**
 * @route GET /:accountId/notifications
 * @desc Get all notifications for a user
 * @access Private
 */
router.get('/', NotificationController.getNotifications);

/**
 * @route GET /:accountId/notifications/unread
 * @desc Get unread notification count
 * @access Private
 */
router.get('/unread', NotificationController.getUnreadCount);

/**
 * @route POST /:accountId/notifications
 * @desc Create a new notification
 * @access Private
 */
router.post('/', NotificationController.createNotification);

/**
 * @route PATCH /:accountId/notifications/:notificationId/read
 * @desc Mark a notification as read
 * @access Private
 */
router.patch('/:notificationId/read', NotificationController.markAsRead);

/**
 * @route PATCH /:accountId/notifications/read-all
 * @desc Mark all notifications as read
 * @access Private
 */
router.patch('/read-all', NotificationController.markAllAsRead);

/**
 * @route PATCH /:accountId/notifications/:notificationId
 * @desc Update a notification
 * @access Private
 */
router.patch('/:notificationId', NotificationController.updateNotification);

/**
 * @route DELETE /:accountId/notifications/:notificationId
 * @desc Delete a notification
 * @access Private
 */
router.delete('/:notificationId', NotificationController.deleteNotification);

/**
 * @route DELETE /:accountId/notifications
 * @desc Delete all notifications
 * @access Private
 */
router.delete('/', NotificationController.deleteAllNotifications);

export default router;