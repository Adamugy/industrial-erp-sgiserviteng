import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth.js';
import { UserRole } from '@prisma/client';
import { MaterialsController } from './materials.controller.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

const router = Router();

// Apply authentication to all routes
router.use(authenticate);

// List materials
router.get('/', asyncHandler(MaterialsController.list));

// List critical stock
router.get('/critical', asyncHandler(MaterialsController.listCritical));

// Get specific material
router.get('/:id', asyncHandler(MaterialsController.getById));

// Create new material
router.post(
    '/',
    authorize(UserRole.ADMIN, UserRole.MANAGER),
    asyncHandler(MaterialsController.create)
);

// Stock movement (Entry/Exit)
router.post('/:id/movement', asyncHandler(MaterialsController.registerMovement));

// Batch stock movement
router.post('/batch-movement', asyncHandler(MaterialsController.registerBatchMovement));

// Update material
router.put(
    '/:id',
    authorize(UserRole.ADMIN, UserRole.MANAGER),
    asyncHandler(MaterialsController.update)
);

// Delete material
router.delete(
    '/:id',
    authorize(UserRole.ADMIN),
    asyncHandler(MaterialsController.delete)
);

export default router;
