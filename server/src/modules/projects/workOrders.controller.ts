import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma, io } from '../../index.js';
import { NotFoundError } from '../../utils/errors.js';

const workOrderSchema = z.object({
    projectId: z.string(),
    teamId: z.string().optional(),
    descricao: z.string(),
    tipoTrabalho: z.string().optional(), // Mapping to schema if needed
    tipoManutencao: z.enum(['PREVENTIVA', 'CORRETIVA', 'INSTALACAO']),
    prioridade: z.enum(['BAIXA', 'MEDIA', 'ALTA', 'URGENTE']).optional(),
    local: z.string().optional(),
    dataAbertura: z.string().optional(),
    dataInicioPrevista: z.string().optional(),
    dataFimPrevista: z.string().optional(),
});

function generateCode() {
    const year = new Date().getFullYear();
    const random = Math.floor(100 + Math.random() * 900);
    return `OS-${year}-${random}`;
}

export class WorkOrdersController {
    static async list(req: Request, res: Response) {
        const { status, projectId, teamId, prioridade } = req.query;

        const workOrders = await prisma.workOrder.findMany({
            where: {
                ...(status && { status: status as any }),
                ...(projectId && { projectId: projectId as string }),
                ...(teamId && { teamId: teamId as string }),
                ...(prioridade && { prioridade: prioridade as any }),
            },
            include: {
                project: { select: { id: true, designacao: true, codigoObra: true } },
                team: { select: { id: true, nome: true } },
            },
            orderBy: [{ prioridade: 'desc' }, { createdAt: 'desc' }],
        });
        res.json(workOrders);
    }

    static async getById(req: Request, res: Response) {
        const { id } = req.params;
        const workOrder = await prisma.workOrder.findUnique({
            where: { id: id as string },
            include: {
                project: {
                    include: {
                        client: { select: { id: true, name: true } },
                    },
                },
                team: {
                    include: {
                        leader: { select: { id: true, name: true } },
                        members: {
                            include: {
                                user: { select: { id: true, name: true, avatar: true } },
                            },
                        },
                    },
                },
                timesheets: {
                    include: {
                        user: { select: { id: true, name: true } },
                    },
                    orderBy: { dataReferencia: 'desc' },
                },
                aprs: true,
                workPermits: true,
            },
        });

        if (!workOrder) throw new NotFoundError('Ordem de Serviço não encontrada');

        res.json(workOrder);
    }

    static async create(req: Request, res: Response) {
        const data = workOrderSchema.parse(req.body);

        const workOrder = await prisma.workOrder.create({
            data: {
                codigo: generateCode(),
                projectId: data.projectId,
                teamId: data.teamId,
                descricao: data.descricao,
                tipoManutencao: data.tipoManutencao,
                prioridade: data.prioridade || 'MEDIA',
                local: data.local,
                dataAbertura: data.dataAbertura ? new Date(data.dataAbertura) : new Date(),
                dataInicioPrevista: data.dataInicioPrevista ? new Date(data.dataInicioPrevista) : null,
                dataFimPrevista: data.dataFimPrevista ? new Date(data.dataFimPrevista) : null,
            },
            include: {
                project: { select: { id: true, designacao: true } },
                team: { select: { id: true, nome: true } },
            },
        });

        // Notify team if assigned
        if (data.teamId) {
            const team = await prisma.team.findUnique({
                where: { id: data.teamId },
                include: { members: true },
            });

            if (team) {
                const userIds = team.members.map(m => m.userId);

                await prisma.notification.createMany({
                    data: userIds.map(userId => ({
                        userId,
                        tipo: 'INFO',
                        titulo: 'Nova OS Atribuída',
                        mensagem: `OS ${workOrder.codigo}: ${workOrder.descricao}`,
                        linkUrl: `/projects?os=${workOrder.id}`,
                    })),
                });

                userIds.forEach(userId => {
                    io.to(`user:${userId}`).emit('notification:new', {
                        tipo: 'INFO',
                        titulo: 'Nova OS Atribuída',
                        mensagem: `OS ${workOrder.codigo}: ${workOrder.descricao}`,
                    });
                });
            }
        }

        io.emit('workOrder:created', workOrder);
        res.status(201).json(workOrder);
    }

    static async updateStatus(req: Request, res: Response) {
        const { id } = req.params;
        const { status } = req.body;

        const updates: any = { status };
        if (status === 'EM_EXECUCAO' && !req.body.skipStartDate) {
            updates.dataInicioReal = new Date();
        }
        if (status === 'CONCLUIDA') {
            updates.dataFimReal = new Date();
        }

        const workOrder = await prisma.workOrder.update({
            where: { id: id as string },
            data: updates,
            include: {
                project: { select: { id: true, designacao: true } },
            },
        });

        io.emit('workOrder:statusChanged', workOrder);
        res.json(workOrder);
    }

    static async validateSST(req: Request, res: Response) {
        const { id } = req.params;
        const workOrder = await prisma.workOrder.update({
            where: { id: id as string },
            data: { sstValidado: true },
        });

        io.emit('workOrder:sstValidated', { id: workOrder.id });
        res.json(workOrder);
    }

    static async update(req: Request, res: Response) {
        const { id } = req.params;
        const data = workOrderSchema.partial().parse(req.body);

        const workOrder = await prisma.workOrder.update({
            where: { id: id as string },
            data: {
                ...data,
                dataAbertura: data.dataAbertura ? new Date(data.dataAbertura) : undefined,
                dataInicioPrevista: data.dataInicioPrevista ? new Date(data.dataInicioPrevista) : undefined,
                dataFimPrevista: data.dataFimPrevista ? new Date(data.dataFimPrevista) : undefined,
            },
        });

        io.emit('workOrder:updated', workOrder);
        res.json(workOrder);
    }

    static async delete(req: Request, res: Response) {
        const { id } = req.params;
        await prisma.workOrder.delete({ where: { id: id as string } });
        io.emit('workOrder:deleted', { id });
        res.json({ message: 'Ordem de Serviço eliminada com sucesso' });
    }
}
