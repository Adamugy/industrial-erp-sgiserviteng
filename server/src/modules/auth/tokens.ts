import jwt from 'jsonwebtoken';
import { config } from '../../config.js';

export interface SessionPayload {
    userId: string;
    /** Emitido em (segundos epoch) */
    iat?: number;
}

/** Assina o token de sessão. O papel NÃO vai no token: é sempre lido da base de dados. */
export function signSession(userId: string): string {
    return jwt.sign({ userId } satisfies SessionPayload, config.jwt.secret, {
        algorithm: config.jwt.algorithm,
        issuer: config.jwt.issuer,
        expiresIn: config.jwt.expiresIn as jwt.SignOptions['expiresIn'],
    });
}

/** Verifica assinatura, algoritmo (evita "alg confusion"), emissor e expiração. */
export function verifySession(token: string): SessionPayload {
    const decoded = jwt.verify(token, config.jwt.secret, {
        algorithms: [config.jwt.algorithm],
        issuer: config.jwt.issuer,
    });
    if (typeof decoded !== 'object' || typeof (decoded as any).userId !== 'string') {
        throw new jwt.JsonWebTokenError('invalid payload');
    }
    return { userId: (decoded as any).userId, iat: (decoded as any).iat };
}

/** Uma sessão emitida antes de `sessionsValidAfter` foi revogada. */
export function isSessionRevoked(iat: number | undefined, sessionsValidAfter: Date | null | undefined): boolean {
    if (!sessionsValidAfter) return false;
    if (!iat) return true;
    return iat * 1000 < sessionsValidAfter.getTime();
}
