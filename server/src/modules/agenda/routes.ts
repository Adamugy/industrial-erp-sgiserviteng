import { Router } from 'express';
import { z } from 'zod';
import { prisma, io } from '../../index.js';
import { authenticate } from '../../middleware/auth.js';

const router = Router();

router.use(authenticate);

const eventSchema = z.object({
    titulo: z.string().min(1),
    descricao: z.string().optional(),
    tipo: z.enum(['REUNIAO', 'PRAZO', 'OS', 'AUDITORIA', 'MANUTENCAO', 'FORMACAO', 'OUTRO']).optional(),
    prioridade: z.enum(['BAIXA', 'NORMAL', 'ALTA', 'CRITICA']).optional(),
    dataInicio: z.string().datetime(),
    dataFim: z.string().datetime().optional(),
    diaInteiro: z.boolean().optional(),
    local: z.string().optional(),
    cor: z.string().optional(),
    projectId: z.string().optional(),
    workOrderId: z.string().optional(),
    attendeeIds: z.array(z.string()).optional(),
});

// GET /api/agenda - List events with filters
router.get('/', async (req, res, next) => {
    try {
        const { startDate, endDate, tipo, userId } = req.query;

        const where: any = {};

        if (startDate && endDate) {
            where.dataInicio = {
                gte: new Date(startDate as string),
                lte: new Date(endDate as string),
            };
        }

        if (tipo) {
            where.tipo = tipo;
        }

        if (userId) {
            where.OR = [
                { creatorId: userId },
                { attendees: { some: { userId: userId as string } } },
            ];
        }

        const events = await prisma.agendaEvent.findMany({
            where,
            include: {
                creator: {
                    select: { id: true, name: true, avatar: true },
                },
                project: {
                    select: { id: true, designacao: true, codigoObra: true },
                },
                workOrder: {
                    select: { id: true, codigo: true, descricao: true },
                },
                attendees: {
                    include: {
                        user: {
                            select: { id: true, name: true, avatar: true },
                        },
                    },
                },
            },
            orderBy: { dataInicio: 'asc' },
        });

        res.json(events);
    } catch (error) {
        next(error);
    }
});

// POST /api/agenda - Create event
router.post('/', async (req, res, next) => {
    try {
        const data = eventSchema.parse(req.body);
        const { attendeeIds, ...eventData } = data;

        const event = await prisma.agendaEvent.create({
            data: {
                ...eventData,
                dataInicio: new Date(eventData.dataInicio),
                dataFim: eventData.dataFim ? new Date(eventData.dataFim) : null,
                creatorId: req.user!.id,
                attendees: attendeeIds
                    ? {
                        create: attendeeIds.map((userId) => ({ userId })),
                    }
                    : undefined,
            },
            include: {
                creator: {
                    select: { id: true, name: true, avatar: true },
                },
                attendees: {
                    include: {
                        user: {
                            select: { id: true, name: true, avatar: true },
                        },
                    },
                },
            },
        });

        // Emit real-time event to all connected clients
        io.emit('agenda:created', event);

        // Create notifications for attendees
        if (attendeeIds && attendeeIds.length > 0) {
            await prisma.notification.createMany({
                data: attendeeIds.map((userId) => ({
                    userId,
                    tipo: 'INFO',
                    titulo: 'Novo Evento',
                    mensagem: `Você foi adicionado ao evento: ${event.titulo}`,
                    linkUrl: `/agenda?event=${event.id}`,
                })),
            });

            // Notify attendees in real-time
            attendeeIds.forEach((userId) => {
                io.to(`user:${userId}`).emit('notification:new', {
                    tipo: 'INFO',
                    titulo: 'Novo Evento',
                    mensagem: `Você foi adicionado ao evento: ${event.titulo}`,
                });
            });
        }

        res.status(201).json(event);
    } catch (error) {
        next(error);
    }
});

// GET /api/agenda/:id
router.get('/:id', async (req, res, next) => {
    try {
        const event = await prisma.agendaEvent.findUnique({
            where: { id: req.params.id as any },
            include: {
                creator: {
                    select: { id: true, name: true, avatar: true },
                },
                project: {
                    select: { id: true, designacao: true, codigoObra: true },
                },
                workOrder: {
                    select: { id: true, codigo: true, descricao: true },
                },
                attendees: {
                    include: {
                        user: {
                            select: { id: true, name: true, avatar: true },
                        },
                    },
                },
            },
        });

        if (!event) {
            return res.status(404).json({ error: 'Event not found' });
        }

        res.json(event);
    } catch (error) {
        next(error);
    }
});

// PUT /api/agenda/:id - Update event
router.put('/:id', async (req, res, next) => {
    try {
        const data = eventSchema.partial().parse(req.body);
        const { attendeeIds, ...eventData } = data;

        // Optimistic locking check
        const existing = await prisma.agendaEvent.findUnique({
            where: { id: req.params.id as any },
        });

        if (!existing) {
            return res.status(404).json({ error: 'Event not found' });
        }

        const event = await prisma.agendaEvent.update({
            where: { id: req.params.id as any },
            data: {
                ...eventData,
                dataInicio: eventData.dataInicio ? new Date(eventData.dataInicio) : undefined,
                dataFim: eventData.dataFim ? new Date(eventData.dataFim) : undefined,
                syncVersion: { increment: 1 },
                lastSyncAt: new Date(),
                attendees: attendeeIds
                    ? {
                        deleteMany: {},
                        create: attendeeIds.map((userId) => ({ userId })),
                    }
                    : undefined,
            },
            include: {
                creator: {
                    select: { id: true, name: true, avatar: true },
                },
                attendees: {
                    include: {
                        user: {
                            select: { id: true, name: true, avatar: true },
                        },
                    },
                },
            },
        });

        // Emit real-time update
        io.emit('agenda:updated', event);

        res.json(event);
    } catch (error) {
        next(error);
    }
});

// DELETE /api/agenda/:id
router.delete('/:id', async (req, res, next) => {
    try {
        const event = await prisma.agendaEvent.delete({
            where: { id: req.params.id as any },
        });

        // Emit real-time deletion
        io.emit('agenda:deleted', { id: req.params.id });

        res.json({ message: 'Event deleted', id: req.params.id });
    } catch (error) {
        next(error);
    }
});

// POST /api/agenda/:id/confirm - Confirm attendance
router.post('/:id/confirm', async (req, res, next) => {
    try {
        const attendee = await prisma.eventAttendee.updateMany({
            where: {
                eventId: req.params.id as any,
                userId: req.user!.id as any,
            },
            data: {
                confirmado: true,
            },
        });

        if (attendee.count === 0) {
            return res.status(404).json({ error: 'You are not an attendee of this event' });
        }

        io.emit('agenda:attendee-confirmed', {
            eventId: req.params.id,
            userId: req.user!.id,
        });

        res.json({ message: 'Attendance confirmed' });
    } catch (error) {
        next(error);
    }
});

// Sync endpoint for offline/online reconciliation
// GET /api/agenda/sync?since=<timestamp>
router.get('/sync/changes', async (req, res, next) => {
    try {
        const since = req.query.since
            ? new Date(req.query.since as string)
            : new Date(0);

        const events = await prisma.agendaEvent.findMany({
            where: {
                lastSyncAt: { gt: since },
            },
            include: {
                creator: {
                    select: { id: true, name: true, avatar: true },
                },
                attendees: {
                    include: {
                        user: {
                            select: { id: true, name: true, avatar: true },
                        },
                    },
                },
            },
            orderBy: { lastSyncAt: 'asc' },
        });

        res.json({
            events,
            syncTimestamp: new Date().toISOString(),
        });
    } catch (error) {
        next(error);
    }
});

export default router;
