import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding database...');

    // Clean existing data
    await prisma.auditLog.deleteMany();
    await prisma.notification.deleteMany();
    await prisma.eventAttendee.deleteMany();
    await prisma.agendaEvent.deleteMany();
    await prisma.stockMovement.deleteMany();
    await prisma.material.deleteMany();
    await prisma.asset.deleteMany();
    await prisma.timesheet.deleteMany();
    await prisma.workPermit.deleteMany();
    await prisma.aPR.deleteMany();
    await prisma.incident.deleteMany();
    await prisma.workOrder.deleteMany();
    await prisma.invoice.deleteMany();
    await prisma.project.deleteMany();
    await prisma.proposal.deleteMany();
    await prisma.client.deleteMany();
    await prisma.teamMember.deleteMany();
    await prisma.team.deleteMany();
    await prisma.user.deleteMany();

    // Create users
    const passwordHash = await bcrypt.hash('123456', 10);

    const admin = await prisma.user.create({
        data: {
            email: 'admin@sgiman.pt',
            passwordHash,
            name: 'Eng. Ricardo Santos',
            avatar: 'RS',
            role: 'ADMIN',
        },
    });

    const manager = await prisma.user.create({
        data: {
            email: 'gestor@sgiman.pt',
            passwordHash,
            name: 'Ana Costa',
            avatar: 'AC',
            role: 'MANAGER',
        },
    });

    const safety = await prisma.user.create({
        data: {
            email: 'sst@sgiman.pt',
            passwordHash,
            name: 'Pedro Silva',
            avatar: 'PS',
            role: 'SAFETY',
        },
    });

    const tech1 = await prisma.user.create({
        data: {
            email: 'tecnico1@sgiman.pt',
            passwordHash,
            name: 'João Ferreira',
            avatar: 'JF',
            role: 'TECH',
        },
    });

    const tech2 = await prisma.user.create({
        data: {
            email: 'tecnico2@sgiman.pt',
            passwordHash,
            name: 'Miguel Oliveira',
            avatar: 'MO',
            role: 'TECH',
        },
    });

    console.log('✅ Users created');

    // Create teams
    const teamSerralharia = await prisma.team.create({
        data: {
            nome: 'Equipa Serralharia A',
            leaderId: tech1.id,
            especialidadePrincipal: 'SERRALHARIA',
            statusDisponibilidade: 'DISPONIVEL',
            members: {
                create: [
                    { userId: tech1.id },
                    { userId: tech2.id },
                ],
            },
        },
    });

    const teamEletricidade = await prisma.team.create({
        data: {
            nome: 'Equipa Eletricidade',
            leaderId: tech2.id,
            especialidadePrincipal: 'ELETRICIDADE',
            statusDisponibilidade: 'DISPONIVEL',
        },
    });

    console.log('✅ Teams created');

    // Create clients
    const client1 = await prisma.client.create({
        data: {
            name: 'Siderurgia Nacional S.A.',
            nif: '500123456',
            address: 'Zona Industrial de Sines',
            city: 'Sines',
            phone: '+351 269 123 456',
            email: 'geral@siderurgia.pt',
        },
    });

    const client2 = await prisma.client.create({
        data: {
            name: 'LogistiX S.A.',
            nif: '500789012',
            address: 'Parque Empresarial do Porto',
            city: 'Porto',
            phone: '+351 222 456 789',
            email: 'compras@logistix.pt',
        },
    });

    const client3 = await prisma.client.create({
        data: {
            name: 'AutoEuropa',
            nif: '500345678',
            address: 'Quinta da Marquesa',
            city: 'Palmela',
            phone: '+351 212 789 000',
            email: 'manutencao@autoeuropa.pt',
        },
    });

    console.log('✅ Clients created');

    // Create proposals
    const proposal1 = await prisma.proposal.create({
        data: {
            refComercial: 'PROP-2024-001',
            clientId: client1.id,
            sellerId: manager.id,
            descricaoEscopo: 'Manutenção Estrutural Forno 3 - Reparação de estrutura metálica e substituição de refratários',
            valorEstimado: 84000,
            status: 'ADJUDICADO',
            numeroPO: 'PO-2024-0456',
            dataAdjudicacao: new Date('2024-05-15'),
            condicoesPagamento: '30 dias após fatura',
        },
    });

    const proposal2 = await prisma.proposal.create({
        data: {
            refComercial: 'PROP-2024-002',
            clientId: client2.id,
            sellerId: manager.id,
            descricaoEscopo: 'Instalação de Tapetes Rolantes - Sistema completo de transporte de mercadorias',
            valorEstimado: 112500,
            status: 'PENDENTE',
            dataValidade: new Date('2024-07-01'),
        },
    });

    console.log('✅ Proposals created');

    // Create projects
    const project1 = await prisma.project.create({
        data: {
            codigoObra: 'OBR-2024-001',
            designacao: 'Manutenção Forno 3 - Siderurgia',
            clientId: client1.id,
            managerId: manager.id,
            proposalId: proposal1.id,
            dataInicioPrevista: new Date('2024-06-01'),
            dataFimPrevista: new Date('2024-08-30'),
            orcamentoAprovado: 84000,
            percentualProgresso: 35,
            status: 'EM_EXECUCAO',
        },
    });

    console.log('✅ Projects created');

    // Create work orders
    const os1 = await prisma.workOrder.create({
        data: {
            codigo: 'OS-2024-001',
            projectId: project1.id,
            teamId: teamSerralharia.id,
            descricao: 'Desmontagem estrutura lateral do forno',
            tipoManutencao: 'CORRETIVA',
            prioridade: 'ALTA',
            status: 'CONCLUIDA',
            sstValidado: true,
            dataInicioPrevista: new Date('2024-06-01'),
            dataFimPrevista: new Date('2024-06-10'),
            dataInicioReal: new Date('2024-06-01'),
            dataFimReal: new Date('2024-06-09'),
        },
    });

    const os2 = await prisma.workOrder.create({
        data: {
            codigo: 'OS-2024-002',
            projectId: project1.id,
            teamId: teamSerralharia.id,
            descricao: 'Reparação estrutura metálica principal',
            tipoManutencao: 'CORRETIVA',
            prioridade: 'ALTA',
            status: 'EM_EXECUCAO',
            sstValidado: true,
            dataInicioPrevista: new Date('2024-06-10'),
            dataFimPrevista: new Date('2024-06-25'),
            dataInicioReal: new Date('2024-06-10'),
        },
    });

    const os3 = await prisma.workOrder.create({
        data: {
            codigo: 'OS-2024-003',
            projectId: project1.id,
            descricao: 'Instalação de novos refratários',
            tipoManutencao: 'INSTALACAO',
            prioridade: 'MEDIA',
            status: 'ABERTA',
            sstValidado: false,
            dataInicioPrevista: new Date('2024-06-25'),
            dataFimPrevista: new Date('2024-07-15'),
        },
    });

    console.log('✅ Work Orders created');

    // Create materials
    const mat1 = await prisma.material.create({
        data: {
            codigoInterno: 'VLV-02',
            nome: 'Válvula Esfera 2"',
            unidadeMedida: 'UN',
            quantidadeAtual: 45,
            stockMinimo: 10,
            custoMedio: 85.50,
            localizacaoArmazem: 'A1-02',
        },
    });

    const mat2 = await prisma.material.create({
        data: {
            codigoInterno: 'TBO-45',
            nome: 'Tubo Aço Inox 45mm',
            unidadeMedida: 'MT',
            quantidadeAtual: 5,
            stockMinimo: 20,
            custoMedio: 45.00,
            localizacaoArmazem: 'B2-01',
        },
    });

    const mat3 = await prisma.material.create({
        data: {
            codigoInterno: 'JUN-01',
            nome: 'Junta EPDM 1/2"',
            unidadeMedida: 'UN',
            quantidadeAtual: 120,
            stockMinimo: 50,
            custoMedio: 3.20,
            localizacaoArmazem: 'A1-05',
        },
    });

    console.log('✅ Materials created');

    // Create assets
    await prisma.asset.create({
        data: {
            numeroSerie: 'VH-2022-001',
            marca: 'Ford',
            modelo: 'Transit Connect',
            categoria: 'VIATURA',
            statusOperacional: 'OPERACIONAL',
            dataUltimaManutencao: new Date('2024-03-15'),
            dataProximaRevisao: new Date('2024-09-15'),
            responsavelAtualId: tech1.id,
            localizacao: 'Garagem Central',
        },
    });

    await prisma.asset.create({
        data: {
            numeroSerie: 'MQ-2021-005',
            marca: 'Miller',
            modelo: 'Dynasty 350',
            categoria: 'MAQUINA',
            statusOperacional: 'OPERACIONAL',
            dataUltimaManutencao: new Date('2024-01-10'),
            dataProximaRevisao: new Date('2024-07-10'),
            localizacao: 'Oficina Principal',
        },
    });

    console.log('✅ Assets created');

    // Create agenda events
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(9, 0, 0, 0);

    const tomorrowEnd = new Date(tomorrow);
    tomorrowEnd.setHours(10, 0, 0, 0);

    await prisma.agendaEvent.create({
        data: {
            titulo: 'Reunião SST - Revisão de Procedimentos',
            descricao: 'Revisão mensal dos procedimentos de segurança',
            tipo: 'REUNIAO',
            prioridade: 'ALTA',
            dataInicio: tomorrow,
            dataFim: tomorrowEnd,
            local: 'Sala de Reuniões',
            cor: '#ef4444',
            creatorId: safety.id,
            attendees: {
                create: [
                    { userId: admin.id },
                    { userId: manager.id },
                ],
            },
        },
    });

    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);

    await prisma.agendaEvent.create({
        data: {
            titulo: 'Prazo Entrega - Proposta LogistiX',
            descricao: 'Data limite para envio da proposta revista',
            tipo: 'PRAZO',
            prioridade: 'CRITICA',
            dataInicio: nextWeek,
            diaInteiro: true,
            cor: '#f59e0b',
            creatorId: manager.id,
        },
    });

    await prisma.agendaEvent.create({
        data: {
            titulo: 'Auditoria Interna ISO 9001',
            descricao: 'Auditoria trimestral ao sistema de gestão da qualidade',
            tipo: 'AUDITORIA',
            prioridade: 'ALTA',
            dataInicio: new Date(nextWeek.getTime() + 3 * 24 * 60 * 60 * 1000),
            diaInteiro: true,
            cor: '#8b5cf6',
            creatorId: admin.id,
            attendees: {
                create: [
                    { userId: safety.id },
                    { userId: manager.id },
                ],
            },
        },
    });

    console.log('✅ Agenda events created');

    // Create notifications
    await prisma.notification.createMany({
        data: [
            {
                userId: admin.id,
                tipo: 'SST',
                titulo: 'Nova OS aguardando aprovação SST',
                mensagem: 'OS-2024-003: Instalação de novos refratários',
                linkUrl: '/projects?os=OS-2024-003',
            },
            {
                userId: admin.id,
                tipo: 'ALERTA',
                titulo: 'Stock crítico',
                mensagem: 'Tubo Aço Inox 45mm abaixo do mínimo',
                linkUrl: '/inventory',
            },
            {
                userId: manager.id,
                tipo: 'INFO',
                titulo: 'Proposta Adjudicada',
                mensagem: 'SuperBock confirmou adjudicação',
                lido: true,
            },
        ],
    });

    console.log('✅ Notifications created');

    console.log('🎉 Seed completed successfully!');
    console.log('\n📋 Login credentials (password: 123456):');
    console.log('   Admin: admin@sgiman.pt');
    console.log('   Manager: gestor@sgiman.pt');
    console.log('   Safety: sst@sgiman.pt');
    console.log('   Tech 1: tecnico1@sgiman.pt');
    console.log('   Tech 2: tecnico2@sgiman.pt');
}

main()
    .catch((e) => {
        console.error('❌ Seed failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
