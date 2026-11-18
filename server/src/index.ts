import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './config.js';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { PrismaClient } from '@prisma/client';

// Routes
import authRoutes from './modules/auth/routes.js';
import usersRoutes from './modules/users/routes.js';
import clientsRoutes from './modules/crm/clients.routes.js';
import proposalsRoutes from './modules/crm/proposals.routes.js';
import projectsRoutes from './modules/projects/projects.routes.js';
import workOrdersRoutes from './modules/projects/workOrders.routes.js';
import teamsRoutes from './modules/teams/teams.routes.js';
import timesheetsRoutes from './modules/teams/timesheets.routes.js';
import materialsRoutes from './modules/inventory/materials.routes.js';
import assetsRoutes from './modules/inventory/assets.routes.js';
import agendaRoutes from './modules/agenda/routes.js';
import notificationsRoutes from './modules/notifications/routes.js';
import sstRoutes from './modules/sst/routes.js';
import contractorsRoutes from './modules/sst/contractors.routes.js';

// Middleware
import { errorHandler } from './middleware/errorHandler.js';
import { setupSocketIO } from './modules/sync/socket.js';

const app = express();
const httpServer = createServer(app);

// Prisma client
export const prisma = new PrismaClient();

// Origens autorizadas (FRONTEND_URL pode ter várias, separadas por vírgulas)
const corsOrigin = (origin: string | undefined, cb: (err: Error | null, allow?: boolean) => void) => {
    // Pedidos sem Origin (curl, health checks, redirects OAuth) não são pedidos CORS de browser.
    if (!origin || config.frontendOrigins.includes(origin)) return cb(null, true);
    cb(null, false);
};

// Socket.IO for real-time sync
const io = new SocketIOServer(httpServer, {
    cors: { origin: config.frontendOrigins, methods: ['GET', 'POST'], credentials: true },
});

// Atrás do proxy da Render: necessário para IPs corretos no rate limiting
if (config.isProduction || process.env.TRUST_PROXY) app.set('trust proxy', Number(process.env.TRUST_PROXY || 1));
app.disable('x-powered-by');

// Middleware
app.use(helmet());
app.use(cors({ origin: corsOrigin, credentials: true }));
app.use(express.json({ limit: '1mb' }));

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/clients', clientsRoutes);
app.use('/api/proposals', proposalsRoutes);
app.use('/api/projects', projectsRoutes);
app.use('/api/work-orders', workOrdersRoutes);
app.use('/api/teams', teamsRoutes);
app.use('/api/timesheets', timesheetsRoutes);
app.use('/api/materials', materialsRoutes);
app.use('/api/assets', assetsRoutes);
app.use('/api/agenda', agendaRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/sst', sstRoutes);
app.use('/api/contractors', contractorsRoutes);

// Error handler (must be last)
app.use(errorHandler);

// Setup Socket.IO handlers
setupSocketIO(io);

// Export for use in other modules
export { io };

// Start server
const PORT = config.port;

httpServer.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📡 Socket.IO ready for connections`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
    console.log('SIGTERM received, shutting down...');
    await prisma.$disconnect();
    httpServer.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
});
