import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth.js';
import { UserRole } from '@prisma/client';
import { UsersController } from './controller.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

const router = Router();

// Apply authentication to all routes
router.use(authenticate);

// List all users (admin/manager only)
router.get(
    '/',
    authorize(UserRole.ADMIN, UserRole.MANAGER),
    asyncHandler(UsersController.list)
);

// Get specific user
router.get('/:id', asyncHandler(UsersController.getById));

// Update user (admin only)
router.patch(
    '/:id',
    authorize(UserRole.ADMIN),
    asyncHandler(UsersController.update)
);

export default router;
