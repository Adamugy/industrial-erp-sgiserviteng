import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth.js';
import { UserRole } from '@prisma/client';
import { ProjectsController } from './projects.controller.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

const router = Router();

// Apply authentication to all routes
router.use(authenticate);

// List projects
router.get('/', asyncHandler(ProjectsController.list));

// Get specific project
router.get('/:id', asyncHandler(ProjectsController.getById));

// Create new project
router.post(
    '/',
    authorize(UserRole.ADMIN, UserRole.MANAGER),
    asyncHandler(ProjectsController.create)
);

// Update project
router.put(
    '/:id',
    authorize(UserRole.ADMIN, UserRole.MANAGER),
    asyncHandler(ProjectsController.update)
);

// Update project progress
router.patch('/:id/progress', asyncHandler(ProjectsController.updateProgress));

// Delete project
router.delete(
    '/:id',
    authorize(UserRole.ADMIN),
    asyncHandler(ProjectsController.delete)
);

export default router;
