/**
 * Configuração central e validada no arranque.
 * Em produção o servidor recusa arrancar sem um JWT_SECRET forte.
 */
import crypto from 'crypto';

const isProduction = process.env.NODE_ENV === 'production';

function list(value: string | undefined): string[] {
    return (value || '')
        .split(',')
        .map((v) => v.trim().toLowerCase())
        .filter(Boolean);
}

function resolveJwtSecret(): string {
    const secret = process.env.JWT_SECRET;
    if (secret && secret.length >= 32) return secret;
    if (isProduction) {
        throw new Error(
            'JWT_SECRET em falta ou demasiado curto (mínimo 32 caracteres). ' +
            'Gere um com: openssl rand -base64 48'
        );
    }
    // Desenvolvimento: segredo aleatório por processo (as sessões caem ao reiniciar).
    console.warn('⚠️  JWT_SECRET não definido: a usar um segredo temporário (apenas desenvolvimento).');
    return crypto.randomBytes(48).toString('base64');
}

const frontendOrigins = (process.env.FRONTEND_URL || 'http://localhost:3000')
    .split(',')
    .map((v) => v.trim().replace(/\/+$/, ''))
    .filter(Boolean);

export const config = {
    isProduction,
    port: Number(process.env.PORT) || 3001,
    jwt: {
        secret: resolveJwtSecret(),
        expiresIn: process.env.JWT_EXPIRES_IN || '7d',
        algorithm: 'HS256' as const,
        issuer: 'sgiserviteng-api',
    },
    /** Origens autorizadas (CORS e Socket.io). A primeira é a principal (redirects OAuth). */
    frontendOrigins,
    primaryFrontendUrl: frontendOrigins[0],
    /** URL pública desta API (para redirect_uri do OAuth). */
    publicApiUrl: (process.env.PUBLIC_API_URL || `http://localhost:${Number(process.env.PORT) || 3001}`).replace(/\/+$/, ''),
    /** Emails que entram como ADMIN aprovado (só com email verificado pelo Google). */
    adminEmails: list(process.env.ADMIN_EMAILS),
    /** Domínios cujos emails verificados ficam aprovados automaticamente como Funcionário. */
    allowedEmailDomains: list(process.env.ALLOWED_EMAIL_DOMAINS),
    oauth: {
        google: process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
            ? { clientId: process.env.GOOGLE_CLIENT_ID, clientSecret: process.env.GOOGLE_CLIENT_SECRET }
            : null,
        microsoft: process.env.MICROSOFT_CLIENT_ID && process.env.MICROSOFT_CLIENT_SECRET
            ? {
                clientId: process.env.MICROSOFT_CLIENT_ID,
                clientSecret: process.env.MICROSOFT_CLIENT_SECRET,
                tenant: process.env.MICROSOFT_TENANT_ID || 'common',
            }
            : null,
    },
};
