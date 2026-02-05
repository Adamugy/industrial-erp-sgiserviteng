import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth.js';
import { UserRole } from '@prisma/client';
import { ContractorsController } from './contractors.controller.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

const router = Router();

// List contractors
router.get('/', authenticate, asyncHandler(ContractorsController.list));

// Create contractor
router.post('/', authenticate, asyncHandler(ContractorsController.create));

// Update contractor induction
router.patch(
    '/:id/induction',
    authenticate,
    authorize(UserRole.ADMIN, UserRole.SAFETY),
    asyncHandler(ContractorsController.updateInduction)
);

// Update contractor EPI
router.patch(
    '/:id/epi',
    authenticate,
    authorize(UserRole.ADMIN, UserRole.SAFETY),
    asyncHandler(ContractorsController.updateEPI)
);

// Delete contractor
router.delete(
    '/:id',
    authenticate,
    authorize(UserRole.ADMIN),
    asyncHandler(ContractorsController.delete)
);

export default router;
