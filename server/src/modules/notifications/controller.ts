import { Request, Response } from 'express';
import { prisma } from '../../index.js';

export class NotificationsController {
    static async list(req: Request, res: Response) {
        const { limit = 20, unreadOnly } = req.query;
        const currentUserId = (req as any).user.id;

        const notifications = await prisma.notification.findMany({
            where: {
                userId: currentUserId,
                ...(unreadOnly === 'true' && { lido: false }),
            },
            orderBy: { createdAt: 'desc' },
            take: Number(limit),
        });

        res.json(notifications);
    }

    static async getUnreadCount(req: Request, res: Response) {
        const currentUserId = (req as any).user.id;
        const count = await prisma.notification.count({
            where: {
                userId: currentUserId,
                lido: false,
            },
        });

        res.json({ unreadCount: count });
    }

    static async markAsRead(req: Request, res: Response) {
        const { id } = req.params;
        const notification = await prisma.notification.update({
            where: { id },
            data: { lido: true },
        });

        res.json(notification);
    }

    static async markAllAsRead(req: Request, res: Response) {
        const currentUserId = (req as any).user.id;
        await prisma.notification.updateMany({
            where: {
                userId: currentUserId,
                lido: false,
            },
            data: { lido: true },
        });

        res.json({ message: 'Todas as notificações marcadas como lidas' });
    }
}
