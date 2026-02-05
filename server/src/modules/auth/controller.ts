import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { prisma } from '../../index.js';
import { UnauthorizedError, ConflictError } from '../../utils/errors.js';
import { logger } from '../../utils/logger.js';

const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
});

const registerSchema = z.object({
    name: z.string().min(2),
    email: z.string().email(),
    password: z.string().min(6),
    role: z.enum(['ADMIN', 'MANAGER', 'SAFETY', 'TECH']).optional(),
});

export class AuthController {
    static async login(req: Request, res: Response) {
        const { email, password } = loginSchema.parse(req.body);

        const user = await prisma.user.findUnique({
            where: { email },
        });

        if (!user || !user.active) {
            logger.warn(`Login attempt for inactive or non-existent user: ${email}`);
            throw new UnauthorizedError('Credenciais inválidas ou conta inativa');
        }

        const validPassword = await bcrypt.compare(password, user.passwordHash);
        if (!validPassword) {
            logger.warn(`Invalid password for user: ${email}`);
            throw new UnauthorizedError('Credenciais inválidas');
        }

        const token = jwt.sign(
            { userId: user.id, role: user.role },
            process.env.JWT_SECRET || 'secret',
            { expiresIn: (process.env.JWT_EXPIRES_IN || '7d') as any }
        );

        logger.info(`User logged in: ${user.email}`);

        res.json({
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                avatar: user.avatar,
            },
        });
    }

    static async register(req: Request, res: Response) {
        const data = registerSchema.parse(req.body);

        const existingUser = await prisma.user.findUnique({
            where: { email: data.email },
        });

        if (existingUser) {
            throw new ConflictError('E-mail já registado no sistema');
        }

        const passwordHash = await bcrypt.hash(data.password, 10);

        const user = await prisma.user.create({
            data: {
                name: data.name,
                email: data.email,
                passwordHash,
                role: data.role || 'TECH',
                avatar: data.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2),
            },
        });

        const token = jwt.sign(
            { userId: user.id, role: user.role },
            process.env.JWT_SECRET || 'secret',
            { expiresIn: (process.env.JWT_EXPIRES_IN || '7d') as any }
        );

        logger.info(`New user registered: ${user.email}`);

        res.status(201).json({
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                avatar: user.avatar,
            },
        });
    }

    static async me(req: Request, res: Response) {
        res.json({ user: (req as any).user });
    }

    static async refresh(req: Request, res: Response) {
        const user = (req as any).user;
        const token = jwt.sign(
            { userId: user.id, role: user.role },
            process.env.JWT_SECRET || 'secret',
            { expiresIn: (process.env.JWT_EXPIRES_IN || '7d') as any }
        );

        res.json({ token });
    }
}
