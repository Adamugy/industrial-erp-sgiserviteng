import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma, io } from '../../index.js';
import { NotFoundError } from '../../utils/errors.js';

const teamSchema = z.object({
    nome: z.string().min(1),
    leaderId: z.string().optional(),
    especialidadePrincipal: z.enum(['SERRALHARIA', 'ELETRICIDADE', 'MECANICA', 'SOLDADURA', 'PINTURA', 'GERAL']).optional(),
    statusDisponibilidade: z.enum(['DISPONIVEL', 'PARCIALMENTE', 'INDISPONIVEL']).optional(),
    memberIds: z.array(z.string()).optional(),
});

export class TeamsController {
    static async list(req: Request, res: Response) {
        const { status, specialty } = req.query;

        const teams = await prisma.team.findMany({
            where: {
                ...(status && { statusDisponibilidade: status as any }),
                ...(specialty && { especialidadePrincipal: specialty as any }),
            },
            include: {
                leader: { select: { id: true, name: true, avatar: true } },
                members: {
                    include: {
                        user: { select: { id: true, name: true, avatar: true } },
                    },
                },
                _count: { select: { workOrders: true } },
            },
            orderBy: { nome: 'asc' },
        });
        res.json(teams);
    }

    static async getById(req: Request, res: Response) {
        const { id } = req.params;
        const team = await prisma.team.findUnique({
            where: { id: id as any },
            include: {
                leader: { select: { id: true, name: true, email: true, avatar: true } },
                members: {
                    include: {
                        user: { select: { id: true, name: true, email: true, avatar: true } },
                    },
                },
                workOrders: {
                    where: { status: { in: ['ABERTA', 'EM_EXECUCAO'] } },
                    include: {
                        project: { select: { id: true, designacao: true } },
                    },
                    orderBy: { createdAt: 'desc' },
                },
            },
        });

        if (!team) throw new NotFoundError('Equipa não encontrada');

        res.json(team);
    }

    static async create(req: Request, res: Response) {
        const data = teamSchema.parse(req.body);
        const { memberIds, ...teamData } = data;

        const team = await prisma.team.create({
            data: {
                ...teamData,
                members: memberIds
                    ? {
                        create: memberIds.map(userId => ({ userId })),
                    }
                    : undefined,
            },
            include: {
                leader: { select: { id: true, name: true } },
                members: {
                    include: {
                        user: { select: { id: true, name: true } },
                    },
                },
            },
        });

        io.emit('team:created', team);
        res.status(201).json(team);
    }

    static async update(req: Request, res: Response) {
        const { id } = req.params;
        const data = teamSchema.partial().parse(req.body);
        const { memberIds, ...teamData } = data;

        const team = await prisma.team.update({
            where: { id: id as any },
            data: {
                ...teamData,
                members: memberIds
                    ? {
                        deleteMany: {},
                        create: memberIds.map(userId => ({ userId })),
                    }
                    : undefined,
            },
            include: {
                leader: { select: { id: true, name: true } },
                members: {
                    include: {
                        user: { select: { id: true, name: true } },
                    },
                },
            },
        });

        io.emit('team:updated', team);
        res.json(team);
    }

    static async addMember(req: Request, res: Response) {
        const { id } = req.params;
        const { userId } = req.body;

        await prisma.teamMember.create({
            data: {
                teamId: id as string,
                userId: userId as string,
            },
        });

        const team = await prisma.team.findUnique({
            where: { id: id as any },
            include: {
                members: {
                    include: {
                        user: { select: { id: true, name: true } },
                    },
                },
            },
        });

        io.emit('team:memberAdded', { teamId: id, userId });
        res.json(team);
    }

    static async removeMember(req: Request, res: Response) {
        const { id, userId } = req.params;

        await prisma.teamMember.deleteMany({
            where: {
                teamId: id as string,
                userId: userId as string,
            },
        });

        io.emit('team:memberRemoved', { teamId: id, userId });
        res.json({ message: 'Membro removido com sucesso' });
    }

    static async delete(req: Request, res: Response) {
        const { id } = req.params;
        await prisma.team.delete({ where: { id: id as any } });
        io.emit('team:deleted', { id });
        res.json({ message: 'Equipa eliminada com sucesso' });
    }
}
