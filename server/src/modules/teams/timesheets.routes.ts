import { Router } from 'express';
import { authenticate } from '../../middleware/auth.js';
import { TimesheetsController } from './timesheets.controller.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

const router = Router();

// Apply authentication to all routes
router.use(authenticate);

// List timesheets (admin/manager view)
router.get('/', asyncHandler(TimesheetsController.list));

// Get current user's timesheets
router.get('/my', asyncHandler(TimesheetsController.listMy));

// Create new timesheet entry
router.post('/', asyncHandler(TimesheetsController.create));

// Update timesheet entry
router.put('/:id', asyncHandler(TimesheetsController.update));

// Delete timesheet entry
router.delete('/:id', asyncHandler(TimesheetsController.delete));

export default router;
