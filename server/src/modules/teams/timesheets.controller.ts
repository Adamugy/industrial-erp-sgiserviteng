import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../../index.js';
import { BadRequestError, NotFoundError } from '../../utils/errors.js';

const timesheetSchema = z.object({
    workOrderId: z.string(),
    dataReferencia: z.string(), // YYYY-MM-DD
    horaInicio: z.string(), // HH:MM
    horaFim: z.string(), // HH:MM
    descricaoAtividades: z.string().optional(),
});

export class TimesheetsController {
    static async list(req: Request, res: Response) {
        const { userId, workOrderId, startDate, endDate } = req.query;

        const timesheets = await prisma.timesheet.findMany({
            where: {
                ...(userId && { userId: userId as string }),
                ...(workOrderId && { workOrderId: workOrderId as string }),
                ...(startDate && endDate && {
                    dataReferencia: {
                        gte: new Date(startDate as string),
                        lte: new Date(endDate as string),
                    },
                }),
            },
            include: {
                user: { select: { id: true, name: true, avatar: true } },
                workOrder: {
                    select: {
                        id: true,
                        codigo: true,
                        descricao: true,
                        project: { select: { id: true, designacao: true } },
                    },
                },
            },
            orderBy: [{ dataReferencia: 'desc' }, { horaInicio: 'desc' }],
        });
        res.json(timesheets);
    }

    static async listMy(req: Request, res: Response) {
        const { month, year } = req.query;
        const currentUserId = (req as any).user.id;

        let dateFilter = {};
        if (month && year) {
            const startDate = new Date(Number(year), Number(month) - 1, 1);
            const endDate = new Date(Number(year), Number(month), 0);
            dateFilter = {
                dataReferencia: {
                    gte: startDate,
                    lte: endDate,
                },
            };
        }

        const timesheets = await prisma.timesheet.findMany({
            where: {
                userId: currentUserId,
                ...dateFilter,
            },
            include: {
                workOrder: {
                    select: {
                        id: true,
                        codigo: true,
                        descricao: true,
                        project: { select: { id: true, designacao: true } },
                    },
                },
            },
            orderBy: [{ dataReferencia: 'desc' }, { horaInicio: 'desc' }],
        });

        // Calculate totals
        const totalHours = timesheets.reduce(
            (sum, ts) => sum + Number(ts.horasTotais),
            0
        );

        res.json({ timesheets, totalHours });
    }

    static async create(req: Request, res: Response) {
        const data = timesheetSchema.parse(req.body);
        const currentUserId = (req as any).user.id;

        // Calculate hours
        const [startH, startM] = data.horaInicio.split(':').map(Number);
        const [endH, endM] = data.horaFim.split(':').map(Number);

        if (endH < startH || (endH === startH && endM <= startM)) {
            throw new BadRequestError('A hora de fim deve ser posterior à hora de início');
        }

        const horasTotais = (endH * 60 + endM - (startH * 60 + startM)) / 60;

        const timesheet = await prisma.timesheet.create({
            data: {
                userId: currentUserId,
                workOrderId: data.workOrderId,
                dataReferencia: new Date(data.dataReferencia),
                horaInicio: new Date(`1970-01-01T${data.horaInicio}:00`),
                horaFim: new Date(`1970-01-01T${data.horaFim}:00`),
                horasTotais,
                descricaoAtividades: data.descricaoAtividades,
            },
            include: {
                workOrder: {
                    select: { id: true, codigo: true },
                },
            },
        });

        res.status(201).json(timesheet);
    }

    static async update(req: Request, res: Response) {
        const { id } = req.params;
        const data = timesheetSchema.partial().parse(req.body);

        let horasTotais;
        if (data.horaInicio && data.horaFim) {
            const [startH, startM] = data.horaInicio.split(':').map(Number);
            const [endH, endM] = data.horaFim.split(':').map(Number);
            horasTotais = (endH * 60 + endM - (startH * 60 + startM)) / 60;
        }

        const timesheet = await prisma.timesheet.update({
            where: { id: id as any },
            data: {
                ...(data.dataReferencia && { dataReferencia: new Date(data.dataReferencia) }),
                ...(data.horaInicio && { horaInicio: new Date(`1970-01-01T${data.horaInicio}:00`) }),
                ...(data.horaFim && { horaFim: new Date(`1970-01-01T${data.horaFim}:00`) }),
                ...(horasTotais !== undefined && { horasTotais }),
                ...(data.descricaoAtividades !== undefined && { descricaoAtividades: data.descricaoAtividades }),
            },
        });

        res.json(timesheet);
    }

    static async delete(req: Request, res: Response) {
        const { id } = req.params;
        await prisma.timesheet.delete({ where: { id: id as any } });
        res.json({ message: 'Folha de horas eliminada com sucesso' });
    }
}
