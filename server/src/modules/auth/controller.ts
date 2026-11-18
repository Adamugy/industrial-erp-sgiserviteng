import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { ApprovalStatus, NotificationType, UserRole } from '@prisma/client';
import { prisma } from '../../index.js';
import { UnauthorizedError, ConflictError } from '../../utils/errors.js';
import { logger } from '../../utils/logger.js';
import { signSession } from './tokens.js';
import {
    REQUESTABLE_ROLES,
    initialAccess,
    initialsOf,
    normalizeEmail,
    publicUserSelect,
} from './policy.js';
import { config } from '../../config.js';

const BCRYPT_COST = 12;
// Hash fictício: o login demora o mesmo quer o email exista quer não (evita enumeração por tempo).
const DUMMY_HASH = bcrypt.hashSync('dummy-password-for-timing', BCRYPT_COST);

const emailSchema = z.string().trim().toLowerCase().email().max(254);

const loginSchema = z.object({
    email: emailSchema,
    password: z.string().min(1).max(128),
});

const newPasswordSchema = z
    .string()
    .min(10, 'A palavra-passe deve ter pelo menos 10 caracteres.')
    .max(128)
    .regex(/[A-Za-z]/, 'Inclua pelo menos uma letra.')
    .regex(/[0-9]/, 'Inclua pelo menos um número.');

const registerSchema = z
    .object({
        name: z.string().trim().min(2).max(100),
        email: emailSchema,
        password: newPasswordSchema,
    })
    // Campos como "role" são ignorados de propósito: ninguém escolhe o próprio papel.
    .strip();

const changePasswordSchema = z
    .object({ currentPassword: z.string().max(128).optional(), newPassword: newPasswordSchema })
    .strict();

const onboardingSchema = z
    .object({
        requestedRole: z.enum(Object.keys(REQUESTABLE_ROLES) as [keyof typeof REQUESTABLE_ROLES, ...(keyof typeof REQUESTABLE_ROLES)[]]),
        name: z.string().trim().min(2).max(100).optional(),
        department: z.string().trim().max(100).optional().or(z.literal('')),
        jobTitle: z.string().trim().max(100).optional().or(z.literal('')),
        phone: z.string().trim().max(30).regex(/^[0-9+()\s-]*$/, 'Telefone inválido.').optional().or(z.literal('')),
    })
    .strip();

function sessionResponse(user: { id: string }, publicUser: unknown) {
    return { token: signSession(user.id), user: publicUser };
}

/** Avisa os administradores de que há um pedido de acesso/função para rever. */
async function notifyAdmins(titulo: string, mensagem: string) {
    const admins = await prisma.user.findMany({
        where: { role: UserRole.ADMIN, active: true, approvalStatus: ApprovalStatus.APPROVED },
        select: { id: true },
    });
    if (admins.length === 0) return;
    await prisma.notification.createMany({
        data: admins.map((a) => ({ userId: a.id, tipo: NotificationType.ALERTA, titulo, mensagem, linkUrl: '/users' })),
    });
}

export class AuthController {
    static async login(req: Request, res: Response) {
        const { email, password } = loginSchema.parse(req.body);

        const user = await prisma.user.findUnique({
            where: { email },
            select: { ...publicUserSelect, passwordHash: true },
        });

        const ok = await bcrypt.compare(password, user?.passwordHash || DUMMY_HASH);
        if (!user || !user.passwordHash || !ok || !user.active || user.approvalStatus === ApprovalStatus.REJECTED) {
            logger.warn('Login falhado', { email });
            throw new UnauthorizedError('Email ou palavra-passe incorretos.');
        }

        const { passwordHash: _omit, ...publicUser } = user;
        logger.info(`Login: ${user.email}`);
        res.json(sessionResponse(user, publicUser));
    }

    static async register(req: Request, res: Response) {
        const data = registerSchema.parse(req.body);
        const email = normalizeEmail(data.email);

        const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } });
        if (existing) {
            throw new ConflictError('Já existe uma conta com este email. Entre ou recupere a palavra-passe.');
        }

        // Email/palavra-passe: o email não é verificado → nunca há aprovação automática.
        const access = initialAccess(email, false);
        const user = await prisma.user.create({
            data: {
                name: data.name,
                email,
                passwordHash: await bcrypt.hash(data.password, BCRYPT_COST),
                avatar: initialsOf(data.name),
                role: access.role,
                approvalStatus: access.approvalStatus,
                emailVerified: false,
                onboardingCompleted: false,
            },
            select: publicUserSelect,
        });

        logger.info(`Nova conta (email): ${user.email} → ${user.approvalStatus}`);
        res.status(201).json(sessionResponse(user, user));
    }

    static async me(req: Request, res: Response) {
        res.json({ user: req.user });
    }

    static async refresh(req: Request, res: Response) {
        res.json({ token: signSession(req.user!.id) });
    }

    /** Onboarding: o utilizador PEDE uma função; o papel só muda quando um ADMIN aprova. */
    static async onboarding(req: Request, res: Response) {
        const data = onboardingSchema.parse(req.body);
        const current = req.user!;
        const requested = REQUESTABLE_ROLES[data.requestedRole];

        // Se já tem esse papel (ou pede o nível base e já está aprovado), não há nada para aprovar.
        const needsReview = requested !== current.role;

        const user = await prisma.user.update({
            where: { id: current.id },
            data: {
                ...(data.name ? { name: data.name, avatar: initialsOf(data.name) } : {}),
                department: data.department || null,
                jobTitle: data.jobTitle || null,
                phone: data.phone || null,
                requestedRole: needsReview ? requested : null,
                onboardingCompleted: true,
            },
            select: publicUserSelect,
        });

        if (needsReview || user.approvalStatus === ApprovalStatus.PENDING) {
            await notifyAdmins(
                'Novo pedido de acesso',
                `${user.name} (${user.email}) pediu a função ${data.requestedRole.replace('_', ' ')}.`
            );
        }

        res.json({ user });
    }

    /**
     * Alterar palavra-passe. Exige a atual (se existir), termina todas as outras sessões
     * e devolve uma sessão nova para este dispositivo.
     */
    static async changePassword(req: Request, res: Response) {
        const { currentPassword, newPassword } = changePasswordSchema.parse(req.body);
        const user = await prisma.user.findUnique({ where: { id: req.user!.id }, select: { id: true, passwordHash: true } });
        if (!user) throw new UnauthorizedError('Sessão inválida.');

        if (user.passwordHash) {
            const ok = await bcrypt.compare(currentPassword || '', user.passwordHash);
            if (!ok) throw new UnauthorizedError('A palavra-passe atual está incorreta.');
            if (await bcrypt.compare(newPassword, user.passwordHash)) {
                throw new ConflictError('A nova palavra-passe tem de ser diferente da atual.');
            }
        }

        // Arredondado ao segundo: o novo token (iat em segundos) continua válido; os anteriores não.
        const now = new Date(Math.floor(Date.now() / 1000) * 1000);
        await prisma.user.update({
            where: { id: user.id },
            data: { passwordHash: await bcrypt.hash(newPassword, BCRYPT_COST), sessionsValidAfter: now },
        });
        logger.info(`Palavra-passe alterada: ${req.user!.email}`);
        res.json({ token: signSession(user.id) });
    }

    /** Quais fornecedores de login estão configurados (o frontend só mostra esses botões). */
    static async providers(_req: Request, res: Response) {
        res.json({
            password: true,
            google: Boolean(config.oauth.google),
            microsoft: Boolean(config.oauth.microsoft),
        });
    }
}
