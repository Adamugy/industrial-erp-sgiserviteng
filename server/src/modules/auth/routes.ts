import { Router } from 'express';
import { authenticate } from '../../middleware/auth.js';
import { AuthController } from './controller.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

const router = Router();

// Login
router.post('/login', asyncHandler(AuthController.login));

// Register
router.post('/register', asyncHandler(AuthController.register));

// Get current user info
router.get('/me', authenticate, asyncHandler(AuthController.me));

// Refresh token
router.post('/refresh', authenticate, asyncHandler(AuthController.refresh));

export default router;
