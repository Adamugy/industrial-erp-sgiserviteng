/**
 * Login com Google e Microsoft (OAuth 2.0 Authorization Code + PKCE, OpenID Connect).
 *
 * Fluxo:
 *  1. GET  /api/auth/oauth/:provider/start     → guarda state+PKCE num cookie httpOnly e redireciona
 *  2. GET  /api/auth/oauth/:provider/callback  → valida state, troca o code, lê o ID token
 *  3. redireciona para o frontend com um código de uso único (60 s) — nunca o JWT na URL
 *  4. POST /api/auth/oauth/exchange {code}     → devolve a sessão
 */
import crypto from 'crypto';
import { Request, Response } from 'express';
import { z } from 'zod';
import { Google, MicrosoftEntraId, decodeIdToken, generateCodeVerifier, generateState } from 'arctic';
import { AuthProvider } from '@prisma/client';
import { prisma } from '../../index.js';
import { config } from '../../config.js';
import { logger } from '../../utils/logger.js';
import { UnauthorizedError } from '../../utils/errors.js';
import { signSession } from './tokens.js';
import { initialAccess, initialsOf, normalizeEmail, publicUserSelect } from './policy.js';

type ProviderKey = 'google' | 'microsoft';
const COOKIE = 'sgi_oauth';
const COOKIE_PATH = '/api/auth/oauth';
const STATE_TTL_MS = 10 * 60 * 1000;
const EXCHANGE_TTL_MS = 60 * 1000;

function redirectUri(provider: ProviderKey) {
    return `${config.publicApiUrl}/api/auth/oauth/${provider}/callback`;
}

function client(provider: ProviderKey) {
    if (provider === 'google' && config.oauth.google) {
        const g = config.oauth.google;
        return new Google(g.clientId, g.clientSecret, redirectUri('google'));
    }
    if (provider === 'microsoft' && config.oauth.microsoft) {
        const m = config.oauth.microsoft;
        return new MicrosoftEntraId(m.tenant, m.clientId, m.clientSecret, redirectUri('microsoft'));
    }
    return null;
}

function parseProvider(value: string): ProviderKey | null {
    return value === 'google' || value === 'microsoft' ? value : null;
}

function readCookie(req: Request, name: string): string | undefined {
    const header = req.headers.cookie;
    if (!header) return undefined;
    for (const part of header.split(';')) {
        const [k, ...v] = part.trim().split('=');
        if (k === name) return decodeURIComponent(v.join('='));
    }
    return undefined;
}

/** Redireciona para o frontend principal (nunca para um URL vindo do pedido → sem open redirect). */
function toFrontend(res: Response, params: Record<string, string>) {
    const url = new URL(config.primaryFrontendUrl + '/');
    for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
    res.redirect(302, url.toString());
}

// ---- Códigos de troca de uso único (memória; a API corre numa só instância) ----
const exchangeCodes = new Map<string, { userId: string; expires: number }>();
function hash(value: string) {
    return crypto.createHash('sha256').update(value).digest('hex');
}
function issueExchangeCode(userId: string): string {
    const now = Date.now();
    for (const [k, v] of exchangeCodes) if (v.expires < now) exchangeCodes.delete(k);
    const code = crypto.randomBytes(32).toString('base64url');
    exchangeCodes.set(hash(code), { userId, expires: now + EXCHANGE_TTL_MS });
    return code;
}

// ---- Identidade vinda do ID token ----
interface Identity {
    provider: AuthProvider;
    subject: string;
    email: string;
    emailVerified: boolean;
    name: string;
}

function identityFrom(provider: ProviderKey, idToken: string): Identity {
    const claims = decodeIdToken(idToken) as Record<string, unknown>;
    // O ID token chega diretamente do token endpoint por TLS (OIDC Core 3.1.3.7).
    const subject = typeof claims.sub === 'string' ? claims.sub : '';
    if (provider === 'google') {
        return {
            provider: AuthProvider.GOOGLE,
            subject,
            email: String(claims.email || ''),
            emailVerified: claims.email_verified === true,
            name: String(claims.name || claims.email || 'Utilizador'),
        };
    }
    // Microsoft: o claim "email" pode ser definido pelo próprio utilizador/tenant e não é
    // verificado (ataque "nOAuth") → tratamos SEMPRE como não verificado.
    const email = String(claims.email || claims.preferred_username || '');
    return {
        provider: AuthProvider.MICROSOFT,
        subject: typeof claims.oid === 'string' && typeof claims.tid === 'string' ? `${claims.tid}:${claims.oid}` : subject,
        email,
        emailVerified: false,
        name: String(claims.name || email || 'Utilizador'),
    };
}

class OAuthFlowError extends Error {
    constructor(public reason: string) {
        super(reason);
    }
}

async function resolveUser(identity: Identity) {
    if (!identity.subject) throw new OAuthFlowError('invalid_token');

    const linked = await prisma.oAuthAccount.findUnique({
        where: { provider_providerUserId: { provider: identity.provider, providerUserId: identity.subject } },
        select: { user: { select: { id: true, active: true, approvalStatus: true } } },
    });
    if (linked) {
        if (!linked.user.active || linked.user.approvalStatus === 'REJECTED') throw new OAuthFlowError('account_disabled');
        return linked.user.id;
    }

    const email = normalizeEmail(identity.email);
    if (!z.string().email().safeParse(email).success) throw new OAuthFlowError('email_missing');

    const existing = await prisma.user.findUnique({
        where: { email },
        select: { id: true, active: true, approvalStatus: true },
    });
    if (existing) {
        // Só ligamos automaticamente a uma conta existente quando o email é verificado (Google).
        if (!identity.emailVerified) throw new OAuthFlowError('account_exists');
        if (!existing.active || existing.approvalStatus === 'REJECTED') throw new OAuthFlowError('account_disabled');
        await prisma.oAuthAccount.create({
            data: { provider: identity.provider, providerUserId: identity.subject, userId: existing.id },
        });
        await prisma.user.update({ where: { id: existing.id }, data: { emailVerified: true } });
        return existing.id;
    }

    const access = initialAccess(email, identity.emailVerified);
    const name = identity.name.slice(0, 100);
    const user = await prisma.user.create({
        data: {
            email,
            name,
            avatar: initialsOf(name),
            passwordHash: null,
            emailVerified: identity.emailVerified,
            role: access.role,
            approvalStatus: access.approvalStatus,
            onboardingCompleted: false,
            oauthAccounts: { create: { provider: identity.provider, providerUserId: identity.subject } },
        },
        select: publicUserSelect,
    });
    logger.info(`Nova conta (${identity.provider}): ${user.email} → ${user.approvalStatus}`);
    return user.id;
}

export class OAuthController {
    static start(req: Request, res: Response) {
        const provider = parseProvider(String(req.params.provider));
        const c = provider && client(provider);
        if (!provider || !c) return toFrontend(res, { oauth_error: 'provider_unavailable' });

        const state = generateState();
        const verifier = generateCodeVerifier();
        const scopes = ['openid', 'profile', 'email'];
        const url = c.createAuthorizationURL(state, verifier, scopes);
        if (provider === 'google') url.searchParams.set('prompt', 'select_account');

        res.cookie(COOKIE, JSON.stringify({ state, verifier, provider }), {
            httpOnly: true,
            secure: config.isProduction,
            sameSite: 'lax', // o regresso do Google/Microsoft é uma navegação de topo
            path: COOKIE_PATH,
            maxAge: STATE_TTL_MS,
        });
        res.redirect(302, url.toString());
    }

    static async callback(req: Request, res: Response) {
        const provider = parseProvider(String(req.params.provider));
        const c = provider && client(provider);
        res.clearCookie(COOKIE, { path: COOKIE_PATH });
        if (!provider || !c) return toFrontend(res, { oauth_error: 'provider_unavailable' });

        if (typeof req.query.error === 'string') return toFrontend(res, { oauth_error: 'cancelled' });

        let stored: { state?: string; verifier?: string; provider?: string } = {};
        try {
            stored = JSON.parse(readCookie(req, COOKIE) || '{}');
        } catch {
            stored = {};
        }
        const code = typeof req.query.code === 'string' ? req.query.code : '';
        const state = typeof req.query.state === 'string' ? req.query.state : '';

        const stateOk =
            !!stored.state && !!state && stored.provider === provider &&
            stored.state.length === state.length &&
            crypto.timingSafeEqual(Buffer.from(stored.state), Buffer.from(state));
        if (!code || !stateOk || !stored.verifier) return toFrontend(res, { oauth_error: 'invalid_state' });

        try {
            const tokens = await c.validateAuthorizationCode(code, stored.verifier);
            const identity = identityFrom(provider, tokens.idToken());
            const userId = await resolveUser(identity);
            toFrontend(res, { oauth_code: issueExchangeCode(userId) });
        } catch (err) {
            const reason = err instanceof OAuthFlowError ? err.reason : 'provider_error';
            logger.warn(`OAuth ${provider} falhou: ${reason}`);
            toFrontend(res, { oauth_error: reason });
        }
    }

    static async exchange(req: Request, res: Response) {
        const { code } = z.object({ code: z.string().min(20).max(200) }).parse(req.body);
        const key = hash(code);
        const entry = exchangeCodes.get(key);
        exchangeCodes.delete(key); // uso único, mesmo que falhe
        if (!entry || entry.expires < Date.now()) throw new UnauthorizedError('Código de login inválido ou expirado.');

        const user = await prisma.user.findUnique({ where: { id: entry.userId }, select: publicUserSelect });
        if (!user || !user.active) throw new UnauthorizedError('Conta indisponível.');
        res.json({ token: signSession(user.id), user });
    }
}
