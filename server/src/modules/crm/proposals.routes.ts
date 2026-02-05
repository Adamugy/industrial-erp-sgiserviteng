import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth.js';
import { UserRole } from '@prisma/client';
import { ProposalsController } from './proposals.controller.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

const router = Router();

// Apply authentication to all routes
router.use(authenticate);

// List proposals
router.get('/', asyncHandler(ProposalsController.list));

// Get specific proposal
router.get('/:id', asyncHandler(ProposalsController.getById));

// Create new proposal
router.post(
    '/',
    authorize(UserRole.ADMIN, UserRole.MANAGER),
    asyncHandler(ProposalsController.create)
);

// Update proposal
router.put(
    '/:id',
    authorize(UserRole.ADMIN, UserRole.MANAGER),
    asyncHandler(ProposalsController.update)
);

// Adjudicate proposal
router.post(
    '/:id/adjudicate',
    authorize(UserRole.ADMIN, UserRole.MANAGER),
    asyncHandler(ProposalsController.adjudicate)
);

// Delete proposal
router.delete(
    '/:id',
    authorize(UserRole.ADMIN),
    asyncHandler(ProposalsController.delete)
);

export default router;
