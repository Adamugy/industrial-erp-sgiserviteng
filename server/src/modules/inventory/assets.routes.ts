import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth.js';
import { UserRole } from '@prisma/client';
import { AssetsController } from './assets.controller.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

const router = Router();

// Apply authentication to all routes
router.use(authenticate);

// List assets
router.get('/', asyncHandler(AssetsController.list));

// List assets needing maintenance
router.get('/maintenance-due', asyncHandler(AssetsController.listMaintenanceDue));

// Get specific asset
router.get('/:id', asyncHandler(AssetsController.getById));

// Create new asset
router.post(
    '/',
    authorize(UserRole.ADMIN, UserRole.MANAGER),
    asyncHandler(AssetsController.create)
);

// Update status
router.patch('/:id/status', asyncHandler(AssetsController.updateStatus));

// Assign to user
router.patch('/:id/assign', asyncHandler(AssetsController.assign));

// Update asset
router.put(
    '/:id',
    authorize(UserRole.ADMIN, UserRole.MANAGER),
    asyncHandler(AssetsController.update)
);

// Delete asset
router.delete(
    '/:id',
    authorize(UserRole.ADMIN),
    asyncHandler(AssetsController.delete)
);

export default router;
