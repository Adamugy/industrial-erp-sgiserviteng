import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma, io } from '../../index.js';
import { NotFoundError } from '../../utils/errors.js';

const proposalSchema = z.object({
    clientId: z.string(),
    descricaoEscopo: z.string(),
    valorEstimado: z.number(),
    moeda: z.string().optional(),
    dataValidade: z.string().datetime().optional(),
    ficheiroUrl: z.string().optional(),
});

function generateRef() {
    const year = new Date().getFullYear();
    const random = Math.floor(100 + Math.random() * 900);
    return `PROP-${year}-${random}`;
}

export class ProposalsController {
    static async list(req: Request, res: Response) {
        const { status, clientId } = req.query;

        const proposals = await prisma.proposal.findMany({
            where: {
                ...(status && { status: status as any }),
                ...(clientId && { clientId: clientId as string }),
            },
            include: {
                client: { select: { id: true, name: true } },
                seller: { select: { id: true, name: true, avatar: true } },
            },
            orderBy: { createdAt: 'desc' },
        });
        res.json(proposals);
    }

    static async getById(req: Request, res: Response) {
        const { id } = req.params;
        const proposal = await prisma.proposal.findUnique({
            where: { id: id as string },
            include: {
                client: true,
                seller: { select: { id: true, name: true, email: true } },
                project: true,
            },
        });

        if (!proposal) throw new NotFoundError('Proposta não encontrada');

        res.json(proposal);
    }

    static async create(req: Request, res: Response) {
        const data = proposalSchema.parse(req.body);
        const currentUserId = (req as any).user.id;

        const proposal = await prisma.proposal.create({
            data: {
                refComercial: generateRef(),
                clientId: data.clientId,
                sellerId: currentUserId,
                descricaoEscopo: data.descricaoEscopo,
                valorEstimado: data.valorEstimado,
                moeda: data.moeda || 'EUR',
                dataValidade: data.dataValidade ? new Date(data.dataValidade) : null,
                ficheiroUrl: data.ficheiroUrl,
            },
            include: {
                client: { select: { id: true, name: true } },
            },
        });

        io.emit('proposal:created', proposal);
        res.status(201).json(proposal);
    }

    static async update(req: Request, res: Response) {
        const { id } = req.params;
        const data = proposalSchema.partial().parse(req.body);

        const proposal = await prisma.proposal.update({
            where: { id: id as string },
            data: {
                ...data,
                dataValidade: data.dataValidade ? new Date(data.dataValidade) : undefined,
            },
            include: {
                client: { select: { id: true, name: true } },
            },
        });

        io.emit('proposal:updated', proposal);
        res.json(proposal);
    }

    static async adjudicate(req: Request, res: Response) {
        const { id } = req.params;
        const { numeroPO, condicoesPagamento } = req.body;

        const proposal = await prisma.proposal.update({
            where: { id: id as string },
            data: {
                status: 'ADJUDICADO',
                numeroPO,
                dataAdjudicacao: new Date(),
                condicoesPagamento,
            },
            include: {
                client: { select: { id: true, name: true } },
            },
        });

        io.emit('proposal:adjudicated', proposal);
        res.json(proposal);
    }

    static async delete(req: Request, res: Response) {
        const { id } = req.params;
        await prisma.proposal.delete({ where: { id: id as string } });
        io.emit('proposal:deleted', { id });
        res.json({ message: 'Proposta eliminada com sucesso' });
    }
}
