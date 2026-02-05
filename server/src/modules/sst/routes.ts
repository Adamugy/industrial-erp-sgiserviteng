import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth.js';
import { UserRole } from '@prisma/client';
import { SSTController } from './sst.controller.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

const router = Router();

// ==================== INCIDENTS ====================
router.get('/incidents', authenticate, asyncHandler(SSTController.listIncidents));
router.post('/incidents', authenticate, asyncHandler(SSTController.createIncident));
router.patch(
    '/incidents/:id/status',
    authenticate,
    authorize(UserRole.ADMIN, UserRole.SAFETY, UserRole.MANAGER),
    asyncHandler(SSTController.updateIncidentStatus)
);

// ==================== APR (Análise Preliminar de Risco) ====================
router.get('/aprs', authenticate, asyncHandler(SSTController.listAPRs));
router.post('/aprs', authenticate, asyncHandler(SSTController.createAPR));
router.patch(
    '/aprs/:id/approve',
    authenticate,
    authorize(UserRole.ADMIN, UserRole.SAFETY),
    asyncHandler(SSTController.approveAPR)
);

// ==================== WORK PERMITS ====================
router.get('/work-permits', authenticate, asyncHandler(SSTController.listWorkPermits));
router.post('/work-permits', authenticate, asyncHandler(SSTController.createWorkPermit));

export default router;
