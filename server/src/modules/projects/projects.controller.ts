import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma, io } from '../../index.js';
import { NotFoundError } from '../../utils/errors.js';

const projectSchema = z.object({
    designacao: z.string().min(1),
    clientId: z.string(),
    managerId: z.string().optional(),
    proposalId: z.string().optional(),
    dataInicioPrevista: z.string().datetime().optional(),
    dataFimPrevista: z.string().datetime().optional(),
    orcamentoAprovado: z.number().optional(),
    status: z.enum(['PLANEAMENTO', 'EM_EXECUCAO', 'SUSPENSO', 'CONCLUIDO', 'CANCELADO']).optional(),
});

function generateCode() {
    const year = new Date().getFullYear();
    const random = Math.floor(100 + Math.random() * 900);
    return `OBR-${year}-${random}`;
}

export class ProjectsController {
    static async list(req: Request, res: Response) {
        const { status, clientId, managerId } = req.query;

        const projects = await prisma.project.findMany({
            where: {
                ...(status && { status: status as any }),
                ...(clientId && { clientId: clientId as string }),
                ...(managerId && { managerId: managerId as string }),
            },
            include: {
                client: { select: { id: true, name: true } },
                manager: { select: { id: true, name: true, avatar: true } },
                _count: { select: { workOrders: true } },
            },
            orderBy: { createdAt: 'desc' },
        });
        res.json(projects);
    }

    static async getById(req: Request, res: Response) {
        const { id } = req.params;
        const project = await prisma.project.findUnique({
            where: { id: id as string },
            include: {
                client: true,
                manager: { select: { id: true, name: true, email: true, avatar: true } },
                proposal: true,
                workOrders: {
                    include: {
                        team: { select: { id: true, nome: true } },
                    },
                    orderBy: { createdAt: 'desc' },
                },
                invoices: { orderBy: { createdAt: 'desc' } },
            },
        });

        if (!project) throw new NotFoundError('Projeto não encontrado');

        res.json(project);
    }

    static async create(req: Request, res: Response) {
        const data = projectSchema.parse(req.body);
        const currentUserId = (req as any).user.id;

        const project = await prisma.project.create({
            data: {
                codigoObra: generateCode(),
                designacao: data.designacao,
                clientId: data.clientId,
                managerId: data.managerId || currentUserId,
                proposalId: data.proposalId,
                dataInicioPrevista: data.dataInicioPrevista ? new Date(data.dataInicioPrevista) : null,
                dataFimPrevista: data.dataFimPrevista ? new Date(data.dataFimPrevista) : null,
                orcamentoAprovado: data.orcamentoAprovado,
                status: data.status || 'PLANEAMENTO',
            },
            include: {
                client: { select: { id: true, name: true } },
                manager: { select: { id: true, name: true } },
            },
        });

        io.emit('project:created', project);
        res.status(201).json(project);
    }

    static async update(req: Request, res: Response) {
        const { id } = req.params;
        const data = projectSchema.partial().parse(req.body);

        const project = await prisma.project.update({
            where: { id: id as string },
            data: {
                ...data,
                dataInicioPrevista: data.dataInicioPrevista ? new Date(data.dataInicioPrevista) : undefined,
                dataFimPrevista: data.dataFimPrevista ? new Date(data.dataFimPrevista) : undefined,
            },
            include: {
                client: { select: { id: true, name: true } },
                manager: { select: { id: true, name: true } },
            },
        });

        io.emit('project:updated', project);
        res.json(project);
    }

    static async updateProgress(req: Request, res: Response) {
        const { id } = req.params;
        const { percentualProgresso } = req.body;

        const project = await prisma.project.update({
            where: { id: id as string },
            data: { percentualProgresso },
        });

        io.emit('project:progress', { id: project.id, percentualProgresso });
        res.json(project);
    }

    static async delete(req: Request, res: Response) {
        const { id } = req.params;
        await prisma.project.delete({ where: { id: id as string } });
        io.emit('project:deleted', { id });
        res.json({ message: 'Projeto eliminado com sucesso' });
    }
}
