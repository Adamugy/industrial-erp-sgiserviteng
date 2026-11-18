import { ApprovalStatus, UserRole } from '@prisma/client';
import { config } from '../../config.js';

/** Funções que o utilizador pode PEDIR no onboarding → papel no sistema. */
export const REQUESTABLE_ROLES = {
    CEO: UserRole.ADMIN,
    SECRETARIA: UserRole.SECRETARY,
    GESTOR_QA: UserRole.SAFETY,
    GESTOR_OBRAS: UserRole.MANAGER,
    FUNCIONARIO: UserRole.TECH,
} as const;
export type RequestableRole = keyof typeof REQUESTABLE_ROLES;

export function normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
}

/**
 * Estado inicial de uma conta nova. Regra de ouro: ninguém se dá privilégios a si próprio.
 * - ADMIN_EMAILS só se o email for verificado pelo fornecedor (Google).
 * - ALLOWED_EMAIL_DOMAINS dá acesso como Funcionário (TECH) só com email verificado.
 * - Tudo o resto fica PENDING até aprovação de um ADMIN.
 */
export function initialAccess(email: string, emailVerified: boolean): { role: UserRole; approvalStatus: ApprovalStatus } {
    const normalized = normalizeEmail(email);
    if (emailVerified && config.adminEmails.includes(normalized)) {
        return { role: UserRole.ADMIN, approvalStatus: ApprovalStatus.APPROVED };
    }
    const domain = normalized.split('@')[1] || '';
    if (emailVerified && config.allowedEmailDomains.includes(domain)) {
        return { role: UserRole.TECH, approvalStatus: ApprovalStatus.APPROVED };
    }
    return { role: UserRole.TECH, approvalStatus: ApprovalStatus.PENDING };
}

export function initialsOf(name: string): string {
    return name.split(/\s+/).filter(Boolean).map((n) => n[0]).join('').toUpperCase().slice(0, 2) || '?';
}

/** Campos do utilizador seguros para enviar ao frontend. */
export const publicUserSelect = {
    id: true,
    name: true,
    email: true,
    role: true,
    avatar: true,
    active: true,
    approvalStatus: true,
    requestedRole: true,
    onboardingCompleted: true,
    department: true,
    jobTitle: true,
    phone: true,
} as const;
