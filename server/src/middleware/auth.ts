import { Request, Response, NextFunction } from 'express';
import { ApprovalStatus, UserRole } from '@prisma/client';
import { prisma } from '../index.js';
import { verifySession } from '../modules/auth/tokens.js';
import { publicUserSelect } from '../modules/auth/policy.js';

type PublicUser = {
    id: string;
    email: string;
    name: string;
    role: UserRole;
    avatar: string | null;
    active: boolean;
    approvalStatus: ApprovalStatus;
    requestedRole: UserRole | null;
    onboardingCompleted: boolean;
    department: string | null;
    jobTitle: string | null;
    phone: string | null;
};

declare global {
    namespace Express {
        interface Request {
            user?: PublicUser;
        }
    }
}

/** Rotas que uma conta ainda não aprovada pode usar (ver perfil, concluir onboarding). */
const PENDING_ALLOWED = ['/api/auth/me', '/api/auth/onboarding', '/api/auth/refresh'];

export async function authenticate(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ status: 'error', code: 'AUTH_REQUIRED', message: 'Autenticação necessária.' });
    }

    try {
        const { userId } = verifySession(authHeader.slice(7));
        // O papel e o estado vêm SEMPRE da base de dados (alterações têm efeito imediato).
        const user = await prisma.user.findUnique({ where: { id: userId }, select: publicUserSelect });

        if (!user || !user.active || user.approvalStatus === ApprovalStatus.REJECTED) {
            return res.status(401).json({ status: 'error', code: 'AUTH_INVALID', message: 'Sessão inválida. Entre novamente.' });
        }

        if (user.approvalStatus !== ApprovalStatus.APPROVED) {
            const path = req.originalUrl.split('?')[0];
            if (!PENDING_ALLOWED.includes(path)) {
                return res.status(403).json({
                    status: 'error',
                    code: 'ACCOUNT_PENDING',
                    message: 'A sua conta aguarda aprovação de um administrador.',
                });
            }
        }

        req.user = user;
        next();
    } catch (error) {
        next(error);
    }
}

export function authorize(...roles: UserRole[]) {
    return (req: Request, res: Response, next: NextFunction) => {
        if (!req.user) {
            return res.status(401).json({ status: 'error', code: 'AUTH_REQUIRED', message: 'Autenticação necessária.' });
        }
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ status: 'error', code: 'FORBIDDEN', message: 'Sem permissão para esta ação.' });
        }
        next();
    };
}
