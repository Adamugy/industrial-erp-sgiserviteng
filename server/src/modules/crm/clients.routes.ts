import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth.js';
import { UserRole } from '@prisma/client';
import { ClientsController } from './clients.controller.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

const router = Router();

// Apply authentication to all routes
router.use(authenticate);

// List clients
router.get('/', asyncHandler(ClientsController.list));

// Get specific client
router.get('/:id', asyncHandler(ClientsController.getById));

// Create new client
router.post(
    '/',
    authorize(UserRole.ADMIN, UserRole.MANAGER),
    asyncHandler(ClientsController.create)
);

// Update client
router.put(
    '/:id',
    authorize(UserRole.ADMIN, UserRole.MANAGER),
    asyncHandler(ClientsController.update)
);

// Delete client
router.delete(
    '/:id',
    authorize(UserRole.ADMIN),
    asyncHandler(ClientsController.delete)
);

export default router;
