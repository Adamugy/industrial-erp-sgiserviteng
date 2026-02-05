import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../../index.js';
import { NotFoundError } from '../../utils/errors.js';

const clientSchema = z.object({
    name: z.string().min(1),
    nif: z.string().optional(),
    address: z.string().optional(),
    city: z.string().optional(),
    country: z.string().optional(),
    phone: z.string().optional(),
    email: z.string().email().optional(),
    website: z.string().optional(),
    notes: z.string().optional(),
});

export class ClientsController {
    static async list(req: Request, res: Response) {
        const clients = await prisma.client.findMany({
            include: {
                _count: {
                    select: { proposals: true, projects: true },
                },
            },
            orderBy: { name: 'asc' },
        });
        res.json(clients);
    }

    static async getById(req: Request, res: Response) {
        const { id } = req.params;
        const client = await prisma.client.findUnique({
            where: { id: id as any },
            include: {
                proposals: { orderBy: { createdAt: 'desc' }, take: 10 },
                projects: { orderBy: { createdAt: 'desc' }, take: 10 },
            },
        });

        if (!client) throw new NotFoundError('Cliente não encontrado');

        res.json(client);
    }

    static async create(req: Request, res: Response) {
        const data = clientSchema.parse(req.body);
        const client = await prisma.client.create({ data });
        res.status(201).json(client);
    }

    static async update(req: Request, res: Response) {
        const { id } = req.params;
        const data = clientSchema.partial().parse(req.body);

        const client = await prisma.client.update({
            where: { id: id as any },
            data,
        });

        res.json(client);
    }

    static async delete(req: Request, res: Response) {
        const { id } = req.params;
        await prisma.client.delete({ where: { id: id as any } });
        res.json({ message: 'Cliente eliminado com sucesso' });
    }
}
