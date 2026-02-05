import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma, io } from '../../index.js';
import { NotFoundError } from '../../utils/errors.js';

const assetSchema = z.object({
    numeroSerie: z.string().min(1),
    designacao: z.string().min(1),
    marca: z.string().min(1),
    modelo: z.string().min(1),
    referenciaInterna: z.string().optional(),
    gama: z.string().optional(),
    entidadeCalibradora: z.string().optional(),
    numeroCertificado: z.string().optional(),
    dataCalibracao: z.string().datetime().nullable().optional(),
    validade: z.string().optional(),
    proximaCalibracao: z.string().datetime().nullable().optional(),
    observacoes: z.string().optional(),
    quantidade: z.number().int().optional(),
    categoria: z.enum(['VIATURA', 'MAQUINA', 'FERRAMENTA', 'EQUIPAMENTO_MEDICAO']),
    statusOperacional: z.enum(['OPERACIONAL', 'EM_MANUTENCAO', 'AVARIADO', 'ABATIDO']).optional(),
    dataUltimaManutencao: z.string().datetime().nullable().optional(),
    dataProximaRevisao: z.string().datetime().nullable().optional(),
    responsavelAtualId: z.string().nullable().optional(),
    localizacao: z.string().optional(),
});

export class AssetsController {
    static async list(req: Request, res: Response) {
        const { categoria, status, responsavelId, localizacao } = req.query;

        const assets = await prisma.asset.findMany({
            where: {
                ...(categoria && { categoria: categoria as any }),
                ...(status && { statusOperacional: status as any }),
                ...(responsavelId && { responsavelAtualId: responsavelId as string }),
                ...(localizacao && { localizacao: localizacao as string }),
            },
            include: {
                responsavelAtual: { select: { id: true, name: true, avatar: true } },
            },
            orderBy: { marca: 'asc' } as any,
        });
        res.json(assets);
    }

    static async listMaintenanceDue(req: Request, res: Response) {
        const inTwoWeeks = new Date();
        inTwoWeeks.setDate(inTwoWeeks.getDate() + 14);

        const assets = await prisma.asset.findMany({
            where: {
                dataProximaRevisao: { lte: inTwoWeeks },
                statusOperacional: { not: 'ABATIDO' },
            },
            include: {
                responsavelAtual: { select: { id: true, name: true } },
            },
            orderBy: { dataProximaRevisao: 'asc' },
        });
        res.json(assets);
    }

    static async getById(req: Request, res: Response) {
        const id = req.params.id as string;
        const asset = await prisma.asset.findUnique({
            where: { id },
            include: {
                responsavelAtual: { select: { id: true, name: true, email: true } },
            },
        });

        if (!asset) throw new NotFoundError('Ativo não encontrado');

        res.json(asset);
    }

    static async create(req: Request, res: Response) {
        const data = assetSchema.parse(req.body);

        const asset = await prisma.asset.create({
            data: {
                ...data,
                dataCalibracao: data.dataCalibracao ? new Date(data.dataCalibracao) : null,
                proximaCalibracao: data.proximaCalibracao ? new Date(data.proximaCalibracao) : null,
                dataUltimaManutencao: data.dataUltimaManutencao ? new Date(data.dataUltimaManutencao) : null,
                dataProximaRevisao: data.dataProximaRevisao ? new Date(data.dataProximaRevisao) : null,
                statusOperacional: data.statusOperacional || 'OPERACIONAL',
            } as any,
            include: {
                responsavelAtual: { select: { id: true, name: true } },
            },
        });

        io.emit('asset:created', asset);
        res.status(201).json(asset);
    }

    static async updateStatus(req: Request, res: Response) {
        const id = req.params.id as string;
        const { statusOperacional } = req.body;

        const updates: any = { statusOperacional };
        if (statusOperacional === 'EM_MANUTENCAO') {
            updates.dataUltimaManutencao = new Date();
        }

        const asset = await prisma.asset.update({
            where: { id },
            data: updates,
        });

        io.emit('asset:statusChanged', asset);
        res.json(asset);
    }

    static async assign(req: Request, res: Response) {
        const id = req.params.id as string;
        const { responsavelAtualId, localizacao } = req.body;

        const asset = await prisma.asset.update({
            where: { id },
            data: {
                responsavelAtualId: responsavelAtualId as string,
                ...(localizacao && { localizacao: localizacao as string }),
            },
            include: {
                responsavelAtual: { select: { id: true, name: true } },
            },
        });

        io.emit('asset:assigned', asset);
        res.json(asset);
    }

    static async update(req: Request, res: Response) {
        const id = req.params.id as string;
        const data = assetSchema.partial().parse(req.body);

        const asset = await prisma.asset.update({
            where: { id },
            data: {
                ...data,
                dataCalibracao: data.dataCalibracao ? new Date(data.dataCalibracao) : undefined,
                proximaCalibracao: data.proximaCalibracao ? new Date(data.proximaCalibracao) : undefined,
                dataUltimaManutencao: data.dataUltimaManutencao ? new Date(data.dataUltimaManutencao) : undefined,
                dataProximaRevisao: data.dataProximaRevisao ? new Date(data.dataProximaRevisao) : undefined,
            } as any,
        });

        io.emit('asset:updated', asset);
        res.json(asset);
    }

    static async delete(req: Request, res: Response) {
        const id = req.params.id as string;
        await prisma.asset.delete({ where: { id } });
        io.emit('asset:deleted', { id });
        res.json({ message: 'Ativo eliminado com sucesso' });
    }
}
