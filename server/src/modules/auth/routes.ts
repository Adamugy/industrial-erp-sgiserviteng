import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { AuthController } from './controller.js';
import { OAuthController } from './oauth.js';
import { authenticate } from '../../middleware/auth.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

const router = Router();

const tooMany = { status: 'error', code: 'RATE_LIMITED', message: 'Demasiadas tentativas. Tente novamente mais tarde.' };

// Força bruta: 10 tentativas de login falhadas por IP a cada 15 min (os sucessos não contam)
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, limit: 10, skipSuccessfulRequests: true,
    standardHeaders: 'draft-7', legacyHeaders: false, message: tooMany,
});
// Criação de contas: 5 por IP por hora
const registerLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, limit: 5,
    standardHeaders: 'draft-7', legacyHeaders: false, message: tooMany,
});
// Fluxo OAuth e troca de código
const oauthLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, limit: 30,
    standardHeaders: 'draft-7', legacyHeaders: false, message: tooMany,
});

router.get('/providers', asyncHandler(AuthController.providers));
router.post('/login', loginLimiter, asyncHandler(AuthController.login));
router.post('/register', registerLimiter, asyncHandler(AuthController.register));

router.get('/oauth/:provider/start', oauthLimiter, OAuthController.start);
router.get('/oauth/:provider/callback', oauthLimiter, asyncHandler(OAuthController.callback));
router.post('/oauth/exchange', oauthLimiter, asyncHandler(OAuthController.exchange));

router.get('/me', authenticate, asyncHandler(AuthController.me));
router.post('/refresh', authenticate, asyncHandler(AuthController.refresh));
router.post('/onboarding', authenticate, asyncHandler(AuthController.onboarding));

export default router;
