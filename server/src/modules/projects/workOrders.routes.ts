import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth.js';
import { UserRole } from '@prisma/client';
import { WorkOrdersController } from './workOrders.controller.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

const router = Router();

// Apply authentication to all routes
router.use(authenticate);

// List work orders
router.get('/', asyncHandler(WorkOrdersController.list));

// Get specific work order
router.get('/:id', asyncHandler(WorkOrdersController.getById));

// Create new work order
router.post(
    '/',
    authorize(UserRole.ADMIN, UserRole.MANAGER, UserRole.SAFETY),
    asyncHandler(WorkOrdersController.create)
);

// Update status
router.patch('/:id/status', asyncHandler(WorkOrdersController.updateStatus));

// Validate SST
router.patch(
    '/:id/sst-validate',
    authorize(UserRole.ADMIN, UserRole.MANAGER, UserRole.SAFETY),
    asyncHandler(WorkOrdersController.validateSST)
);

// Update work order
router.put(
    '/:id',
    authorize(UserRole.ADMIN, UserRole.MANAGER),
    asyncHandler(WorkOrdersController.update)
);

// Delete work order
router.delete(
    '/:id',
    authorize(UserRole.ADMIN),
    asyncHandler(WorkOrdersController.delete)
);

export default router;
