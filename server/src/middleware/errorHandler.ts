import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';

export function errorHandler(
    err: any,
    req: Request,
    res: Response,
    next: NextFunction
) {
    // Log the error
    logger.error(`${req.method} ${req.originalUrl} - Error handled`, err, {
        ip: req.ip,
        userAgent: req.get('user-agent'),
        user: (req as any).user?.id
    });

    // If it's a known AppError
    if (err instanceof AppError) {
        return res.status(err.statusCode).json({
            status: 'error',
            code: err.code || 'APP_ERROR',
            message: err.message
        });
    }

    // Prisma errors
    if (err.code === 'P2002') {
        const target = (err.meta?.target as string[])?.join(', ') || 'field';
        return res.status(409).json({
            status: 'error',
            code: 'DUPLICATE_RECORD',
            message: `A record with this ${target} already exists`
        });
    }

    if (err.code === 'P2025') {
        return res.status(404).json({
            status: 'error',
            code: 'NOT_FOUND',
            message: 'Record not found in database'
        });
    }

    // JWT errors
    if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({
            status: 'error',
            code: 'AUTH_INVALID_TOKEN',
            message: 'A sua sessão é inválida ou expirou. Por favor, faça login novamente.'
        });
    }

    if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
            status: 'error',
            code: 'AUTH_TOKEN_EXPIRED',
            message: 'A sua sessão expirou. Por favor, autentique-se novamente.'
        });
    }

    // Validation errors (Zod, etc)
    if (err.name === 'ZodError') {
        return res.status(400).json({
            status: 'error',
            code: 'VALIDATION_ERROR',
            message: 'Dados de entrada inválidos',
            details: err.flatten?.() || err
        });
    }

    // Default error (Internal Server Error)
    const statusCode = err.statusCode || 500;
    const isProduction = process.env.NODE_ENV === 'production';

    res.status(statusCode).json({
        status: 'error',
        code: statusCode === 500 ? 'INTERNAL_SERVER_ERROR' : 'ERROR',
        message: statusCode === 500 ? 'Ocorreu um erro interno no servidor. Por favor, tente mais tarde.' : err.message,
        // Stack only in development
        ...(isProduction ? {} : { stack: err.stack, details: err })
    });
}
