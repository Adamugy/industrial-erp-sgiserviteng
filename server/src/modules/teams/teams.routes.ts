import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth.js';
import { UserRole } from '@prisma/client';
import { TeamsController } from './teams.controller.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

const router = Router();

// Apply authentication to all routes
router.use(authenticate);

// List teams
router.get('/', asyncHandler(TeamsController.list));

// Get specific team
router.get('/:id', asyncHandler(TeamsController.getById));

// Create new team
router.post(
    '/',
    authorize(UserRole.ADMIN, UserRole.MANAGER),
    asyncHandler(TeamsController.create)
);

// Update team
router.put(
    '/:id',
    authorize(UserRole.ADMIN, UserRole.MANAGER),
    asyncHandler(TeamsController.update)
);

// Add team member
router.post(
    '/:id/members',
    authorize(UserRole.ADMIN, UserRole.MANAGER),
    asyncHandler(TeamsController.addMember)
);

// Remove team member
router.delete(
    '/:id/members/:userId',
    authorize(UserRole.ADMIN, UserRole.MANAGER),
    asyncHandler(TeamsController.removeMember)
);

// Delete team
router.delete(
    '/:id',
    authorize(UserRole.ADMIN),
    asyncHandler(TeamsController.delete)
);

export default router;
