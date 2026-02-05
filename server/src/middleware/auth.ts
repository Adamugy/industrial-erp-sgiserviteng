import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../index.js';
import { UserRole } from '@prisma/client';

interface JWTPayload {
    userId: string;
    role: UserRole;
}

declare global {
    namespace Express {
        interface Request {
            user?: {
                id: string;
                email: string;
                name: string;
                role: UserRole;
            };
        }
    }
}

export function authenticate(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
            error: 'Unauthorized',
            message: 'No token provided',
        });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET || 'secret'
        ) as JWTPayload;

        // Fetch user from database
        prisma.user
            .findUnique({
                where: { id: decoded.userId },
                select: { id: true, email: true, name: true, role: true, active: true },
            })
            .then((user) => {
                if (!user || !user.active) {
                    return res.status(401).json({
                        error: 'Unauthorized',
                        message: 'User not found or inactive',
                    });
                }
                req.user = user;
                next();
            })
            .catch(next);
    } catch (error) {
        next(error);
    }
}

export function authorize(...roles: UserRole[]) {
    return (req: Request, res: Response, next: NextFunction) => {
        if (!req.user) {
            return res.status(401).json({
                error: 'Unauthorized',
                message: 'Not authenticated',
            });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                error: 'Forbidden',
                message: 'Insufficient permissions',
            });
        }

        next();
    };
}
