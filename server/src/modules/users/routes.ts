import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth.js';
import { UserRole } from '@prisma/client';
import { UsersController } from './controller.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

const router = Router();

router.use(authenticate);

router.get('/', authorize(UserRole.ADMIN, UserRole.MANAGER), asyncHandler(UsersController.list));
router.get('/:id', asyncHandler(UsersController.getById));
router.patch('/:id', authorize(UserRole.ADMIN), asyncHandler(UsersController.update));
router.post('/:id/approve', authorize(UserRole.ADMIN), asyncHandler(UsersController.approve));
router.post('/:id/reject', authorize(UserRole.ADMIN), asyncHandler(UsersController.reject));

export default router;
