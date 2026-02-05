import { Request, Response, NextFunction } from 'express';

/**
 * Wraps an async express route handler to catch errors and pass them to the global error handler.
 * This eliminates the need for try/catch blocks in every route.
 */
export const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) => {
    return (req: Request, res: Response, next: NextFunction) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};
