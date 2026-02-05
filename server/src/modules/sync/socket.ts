import { Server as SocketIOServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { prisma } from '../../index.js';

interface AuthenticatedSocket extends Socket {
    userId?: string;
    userRole?: string;
}

export function setupSocketIO(io: SocketIOServer) {
    // Authentication middleware for Socket.IO
    io.use((socket: AuthenticatedSocket, next) => {
        const token = socket.handshake.auth.token;

        if (!token) {
            return next(new Error('Authentication required'));
        }

        try {
            const decoded = jwt.verify(
                token,
                process.env.JWT_SECRET || 'secret'
            ) as { userId: string; role: string };

            socket.userId = decoded.userId;
            socket.userRole = decoded.role;
            next();
        } catch (error) {
            next(new Error('Invalid token'));
        }
    });

    io.on('connection', (socket: AuthenticatedSocket) => {
        console.log(`📱 User connected: ${socket.userId}`);

        // Join user-specific room for targeted notifications
        socket.join(`user:${socket.userId}`);

        // Join role-specific room
        socket.join(`role:${socket.userRole}`);

        // Handle agenda subscription
        socket.on('agenda:subscribe', (data: { projectId?: string }) => {
            if (data.projectId) {
                socket.join(`project:${data.projectId}`);
                console.log(`User ${socket.userId} subscribed to project ${data.projectId}`);
            }
            socket.join('agenda:all');
        });

        // Handle real-time cursor/presence for collaborative editing
        socket.on('presence:update', (data: { view: string; entityId?: string }) => {
            socket.to('agenda:all').emit('presence:updated', {
                userId: socket.userId,
                view: data.view,
                entityId: data.entityId,
                timestamp: new Date().toISOString(),
            });
        });

        // Handle offline sync request
        socket.on('sync:request', async (data: { lastSyncAt: string }) => {
            try {
                const since = new Date(data.lastSyncAt);

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
                });

                const notifications = await prisma.notification.findMany({
                    where: {
                        userId: socket.userId,
                        createdAt: { gt: since },
                    },
                });

                socket.emit('sync:response', {
                    events,
                    notifications,
                    syncTimestamp: new Date().toISOString(),
                });
            } catch (error) {
                socket.emit('sync:error', { message: 'Sync failed' });
            }
        });

        // Handle client pushing offline changes
        socket.on('sync:push', async (data: { changes: any[] }) => {
            try {
                const results = [];

                for (const change of data.changes) {
                    if (change.entity === 'agenda') {
                        if (change.action === 'create') {
                            const event = await prisma.agendaEvent.create({
                                data: {
                                    ...change.data,
                                    creatorId: socket.userId,
                                    dataInicio: new Date(change.data.dataInicio),
                                    dataFim: change.data.dataFim ? new Date(change.data.dataFim) : null,
                                },
                            });
                            results.push({ tempId: change.tempId, serverId: event.id, success: true });
                            io.emit('agenda:created', event);
                        } else if (change.action === 'update') {
                            const event = await prisma.agendaEvent.update({
                                where: { id: change.id },
                                data: {
                                    ...change.data,
                                    syncVersion: { increment: 1 },
                                    lastSyncAt: new Date(),
                                },
                            });
                            results.push({ id: change.id, success: true });
                            io.emit('agenda:updated', event);
                        } else if (change.action === 'delete') {
                            await prisma.agendaEvent.delete({
                                where: { id: change.id },
                            });
                            results.push({ id: change.id, success: true });
                            io.emit('agenda:deleted', { id: change.id });
                        }
                    }
                }

                socket.emit('sync:push-result', { results, syncTimestamp: new Date().toISOString() });
            } catch (error) {
                socket.emit('sync:error', { message: 'Push failed' });
            }
        });

        socket.on('disconnect', () => {
            console.log(`📴 User disconnected: ${socket.userId}`);
            io.emit('presence:left', { userId: socket.userId });
        });
    });
}
