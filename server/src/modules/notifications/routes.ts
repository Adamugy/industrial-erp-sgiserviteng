import { Router } from 'express';
import { authenticate } from '../../middleware/auth.js';
import { NotificationsController } from './controller.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

const router = Router();

// Apply authentication to all routes
router.use(authenticate);

// Get user's notifications
router.get('/', asyncHandler(NotificationsController.list));

// Get unread count
router.get('/count', asyncHandler(NotificationsController.getUnreadCount));

// Mark specific notification as read
router.patch('/:id/read', asyncHandler(NotificationsController.markAsRead));

// Mark all as read
router.post('/read-all', asyncHandler(NotificationsController.markAllAsRead));

export default router;
