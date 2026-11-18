/**
 * Cria (ou promove) o primeiro administrador com palavra-passe forte.
 * Uso:  ADMIN_EMAIL=ceo@empresa.pt ADMIN_NAME="Nome" ADMIN_PASSWORD='...' npm run create-admin
 *       (sem ADMIN_PASSWORD é gerada uma palavra-passe aleatória e mostrada uma vez)
 */
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const email = (process.env.ADMIN_EMAIL || '').trim().toLowerCase();
    const name = (process.env.ADMIN_NAME || 'Administrador').trim();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw new Error('Defina ADMIN_EMAIL com um email válido.');

    const generated = !process.env.ADMIN_PASSWORD;
    const password = process.env.ADMIN_PASSWORD || crypto.randomBytes(18).toString('base64url');
    if (password.length < 12) throw new Error('ADMIN_PASSWORD deve ter pelo menos 12 caracteres.');

    const data = {
        name,
        passwordHash: await bcrypt.hash(password, 12),
        role: 'ADMIN' as const,
        active: true,
        approvalStatus: 'APPROVED' as const,
        onboardingCompleted: true,
        emailVerified: true, // criado pelo operador: o email é considerado confirmado
        requestedRole: null,
        approvedAt: new Date(),
    };
    await prisma.user.upsert({
        where: { email },
        update: data,
        create: { email, avatar: name.split(/\s+/).map((n) => n[0]).join('').slice(0, 2).toUpperCase(), ...data },
    });

    console.log(`✅ Administrador pronto: ${email}`);
    if (generated) console.log(`🔑 Palavra-passe gerada (guarde-a agora, não volta a ser mostrada): ${password}`);
}

main()
    .catch((e) => { console.error('❌', e.message); process.exit(1); })
    .finally(() => prisma.$disconnect());
