import { Request, Response } from 'express';
import { z } from 'zod';
import { ApprovalStatus, NotificationType, UserRole } from '@prisma/client';
import { prisma } from '../../index.js';
import { BadRequestError, ForbiddenError, NotFoundError } from '../../utils/errors.js';
import { logger } from '../../utils/logger.js';

const adminListSelect = {
    id: true, name: true, email: true, role: true, avatar: true, active: true, createdAt: true,
    approvalStatus: true, requestedRole: true, onboardingCompleted: true,
    department: true, jobTitle: true, phone: true, emailVerified: true, approvedAt: true,
} as const;

const directorySelect = { id: true, name: true, email: true, role: true, avatar: true, active: true, createdAt: true } as const;

const roleSchema = z.nativeEnum(UserRole);
const idSchema = z.string().min(1).max(64);

const updateSchema = z
    .object({
        name: z.string().trim().min(2).max(100).optional(),
        role: roleSchema.optional(),
        active: z.boolean().optional(),
        department: z.string().trim().max(100).nullable().optional(),
        jobTitle: z.string().trim().max(100).nullable().optional(),
    })
    .strict();

async function audit(req: Request, acao: string, entidadeId: string, dados: unknown) {
    try {
        await prisma.auditLog.create({
            data: { userId: req.user!.id, acao, entidade: 'User', entidadeId, dadosDepois: dados as any, ip: req.ip, userAgent: req.get('user-agent')?.slice(0, 255) },
        });
    } catch (err) {
        logger.warn('AuditLog falhou', err as any);
    }
}

function guardSelf(req: Request, targetId: string, change: { role?: UserRole; active?: boolean }) {
    if (targetId !== req.user!.id) return;
    if ((change.role && change.role !== UserRole.ADMIN) || change.active === false) {
        throw new BadRequestError('Não pode remover o seu próprio acesso de administrador.');
    }
}

export class UsersController {
    /** ADMIN vê tudo (incl. pedidos pendentes); MANAGER vê só o diretório de utilizadores aprovados. */
    static async list(req: Request, res: Response) {
        if (req.user!.role === UserRole.ADMIN) {
            const users = await prisma.user.findMany({
                select: adminListSelect,
                orderBy: [{ approvalStatus: 'asc' }, { createdAt: 'desc' }],
            });
            return res.json(users);
        }
        const users = await prisma.user.findMany({
            where: { approvalStatus: ApprovalStatus.APPROVED, active: true },
            select: directorySelect,
            orderBy: { name: 'asc' },
        });
        res.json(users);
    }

    static async getById(req: Request, res: Response) {
        const id = idSchema.parse(req.params.id);
        const me = req.user!;
        // Cada um vê o seu perfil; ADMIN e MANAGER veem os outros.
        if (id !== me.id && me.role !== UserRole.ADMIN && me.role !== UserRole.MANAGER) {
            throw new ForbiddenError('Sem permissão para ver este utilizador.');
        }
        const user = await prisma.user.findUnique({
            where: { id },
            select: me.role === UserRole.ADMIN ? adminListSelect : directorySelect,
        });
        if (!user) throw new NotFoundError('Utilizador não encontrado');
        res.json(user);
    }

    static async update(req: Request, res: Response) {
        const id = idSchema.parse(req.params.id);
        const data = updateSchema.parse(req.body);
        guardSelf(req, id, data);

        const user = await prisma.user.update({ where: { id }, data, select: adminListSelect });
        await audit(req, 'USER_UPDATE', id, data);
        res.json(user);
    }

    /** Aprova a conta e atribui o papel (por omissão, o que o utilizador pediu). */
    static async approve(req: Request, res: Response) {
        const id = idSchema.parse(req.params.id);
        const body = z.object({ role: roleSchema.optional() }).strict().parse(req.body ?? {});

        const target = await prisma.user.findUnique({ where: { id }, select: { role: true, requestedRole: true } });
        if (!target) throw new NotFoundError('Utilizador não encontrado');

        const role = body.role ?? target.requestedRole ?? target.role;
        guardSelf(req, id, { role });

        const user = await prisma.user.update({
            where: { id },
            data: {
                role,
                approvalStatus: ApprovalStatus.APPROVED,
                requestedRole: null,
                active: true,
                approvedAt: new Date(),
                approvedById: req.user!.id,
            },
            select: adminListSelect,
        });
        await prisma.notification.create({
            data: {
                userId: id, tipo: NotificationType.INFO,
                titulo: 'Acesso aprovado',
                mensagem: `A sua conta foi aprovada com o perfil ${role}.`,
            },
        });
        await audit(req, 'USER_APPROVE', id, { role });
        res.json(user);
    }

    /** Recusa o pedido. Se a conta já estava aprovada, mantém o papel atual e só limpa o pedido. */
    static async reject(req: Request, res: Response) {
        const id = idSchema.parse(req.params.id);
        if (id === req.user!.id) throw new BadRequestError('Não pode recusar a sua própria conta.');

        const target = await prisma.user.findUnique({ where: { id }, select: { approvalStatus: true } });
        if (!target) throw new NotFoundError('Utilizador não encontrado');

        const user = await prisma.user.update({
            where: { id },
            data: target.approvalStatus === ApprovalStatus.APPROVED
                ? { requestedRole: null }
                : { approvalStatus: ApprovalStatus.REJECTED, requestedRole: null },
            select: adminListSelect,
        });
        await audit(req, 'USER_REJECT', id, { previous: target.approvalStatus });
        res.json(user);
    }
}
