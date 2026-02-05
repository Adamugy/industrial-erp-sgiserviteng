import { Request, Response } from 'express';
import { prisma } from '../../index.js';
import { NotFoundError } from '../../utils/errors.js';

export class UsersController {
    static async list(req: Request, res: Response) {
        const users = await prisma.user.findMany({
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                avatar: true,
                active: true,
                createdAt: true,
            },
            orderBy: { name: 'asc' },
        });
        res.json(users);
    }

    static async getById(req: Request, res: Response) {
        const id = req.params.id as string;
        const user = await prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                avatar: true,
                active: true,
                createdAt: true,
            },
        });

        if (!user) throw new NotFoundError('Utilizador não encontrado');

        res.json(user);
    }

    static async update(req: Request, res: Response) {
        const id = req.params.id as string;
        const { name, email, role, active } = req.body;

        const user = await prisma.user.update({
            where: { id },
            data: {
                ...(name && { name }),
                ...(email && { email }),
                ...(role && { role }),
                ...(active !== undefined && { active }),
            },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                avatar: true,
                active: true,
            },
        });

        res.json(user);
    }
}
