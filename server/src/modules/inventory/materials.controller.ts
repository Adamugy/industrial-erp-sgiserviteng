import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma, io } from '../../index.js';
import { BadRequestError, NotFoundError } from '../../utils/errors.js';

const materialSchema = z.object({
    codigoInterno: z.string().min(1),
    nome: z.string().min(1),
    unidadeMedida: z.string().optional(),
    quantidadeAtual: z.number().optional(),
    stockMinimo: z.number().optional(),
    custoMedio: z.number().optional(),
    localizacaoArmazem: z.string().optional(),
});

export class MaterialsController {
    static async list(req: Request, res: Response) {
        const { lowStock, location } = req.query;

        const materials = await prisma.material.findMany({
            where: {
                ...(lowStock === 'true' && {
                    quantidadeAtual: { lte: prisma.material.fields.stockMinimo },
                }),
                ...(location && { localizacaoArmazem: location as string }),
            },
            orderBy: { nome: 'asc' },
        });

        // Add status field
        const withStatus = materials.map(m => ({
            ...m,
            status: m.quantidadeAtual <= m.stockMinimo ? 'CRITICO' : 'OK',
        }));

        res.json(withStatus);
    }

    static async listCritical(req: Request, res: Response) {
        try {
            const materials = await prisma.$queryRaw`
                SELECT * FROM materials 
                WHERE quantidade_atual <= stock_minimo
                ORDER BY (stock_minimo - quantidade_atual) DESC
            `;
            res.json(materials);
        } catch (error) {
            // Fallback for raw query issues
            const materials = await prisma.material.findMany();
            const critical = materials.filter(m => m.quantidadeAtual <= m.stockMinimo);
            res.json(critical);
        }
    }

    static async getById(req: Request, res: Response) {
        const { id } = req.params;
        const material = await prisma.material.findUnique({
            where: { id },
            include: {
                movements: {
                    orderBy: { createdAt: 'desc' },
                    take: 20,
                },
            },
        });

        if (!material) throw new NotFoundError('Material não encontrado');

        res.json(material);
    }

    static async create(req: Request, res: Response) {
        const data = materialSchema.parse(req.body);

        const material = await prisma.material.create({
            data: {
                codigoInterno: data.codigoInterno,
                nome: data.nome,
                unidadeMedida: data.unidadeMedida || 'UN',
                quantidadeAtual: data.quantidadeAtual || 0,
                stockMinimo: data.stockMinimo || 0,
                custoMedio: data.custoMedio,
                localizacaoArmazem: data.localizacaoArmazem,
            },
        });

        io.emit('material:created', material);
        res.status(201).json(material);
    }

    static async registerMovement(req: Request, res: Response) {
        const { id } = req.params;
        const {
            tipo,
            quantidade,
            documentoRef,
            observacao,
            localizacao,
            responsavelId,
            dataReferencia,
            documentacaoAdicional
        } = req.body;

        const material = await prisma.material.findUnique({ where: { id } });
        if (!material) throw new NotFoundError('Material não encontrado');

        const newQuantity = tipo === 'ENTRADA'
            ? material.quantidadeAtual + quantidade
            : material.quantidadeAtual - quantidade;

        if (newQuantity < 0) throw new BadRequestError('Stock insuficiente para esta operação');

        const [movement, updated] = await prisma.$transaction([
            prisma.stockMovement.create({
                data: {
                    materialId: id,
                    tipo,
                    quantidade,
                    documentoRef,
                    observacao,
                    localizacao: localizacao as string,
                    responsavelId: responsavelId as string,
                    dataReferencia: dataReferencia ? new Date(dataReferencia as string) : new Date(),
                    documentacaoAdicional: documentacaoAdicional as string,
                } as any,
            }),
            prisma.material.update({
                where: { id },
                data: { quantidadeAtual: newQuantity },
            }),
        ]);

        const status = newQuantity <= updated.stockMinimo ? 'CRITICO' : 'OK';

        io.emit('material:stockChanged', {
            id: updated.id,
            quantidadeAtual: newQuantity,
            status,
            movement,
        });

        if (status === 'CRITICO' && material.quantidadeAtual > material.stockMinimo) {
            io.emit('alert:stockCritical', {
                materialId: updated.id,
                nome: updated.nome,
                quantidade: newQuantity,
                minimo: updated.stockMinimo,
            });
        }

        res.status(201).json({ movement, material: { ...updated, status } });
    }

    static async registerBatchMovement(req: Request, res: Response) {
        const {
            tipo,
            items,
            documentoRef,
            observacao,
            localizacao,
            responsavelId,
            dataReferencia,
            documentacaoAdicional
        } = req.body;

        if (!items || !Array.isArray(items) || items.length === 0) {
            throw new BadRequestError('A lista de itens é obrigatória');
        }

        const batchResults = await prisma.$transaction(async (tx) => {
            const results = [];
            for (const item of items) {
                let materialId = item.materialId;
                let material;

                if (!materialId && item.nome) {
                    material = await tx.material.create({
                        data: {
                            nome: item.nome,
                            codigoInterno: item.codigoInterno || `REF-${Date.now()}`,
                            unidadeMedida: item.unidadeMedida || 'UN',
                            stockMinimo: item.stockMinimo || 0,
                            quantidadeAtual: 0,
                            localizacaoArmazem: (localizacao as string) || 'Armazém',
                        },
                    });
                    materialId = material.id;
                    io.emit('material:created', material);
                } else {
                    material = await tx.material.findUnique({ where: { id: materialId } });
                }

                if (!material) throw new NotFoundError(`Material ${materialId || item.nome} não encontrado`);

                const newQuantity = tipo === 'ENTRADA'
                    ? material.quantidadeAtual + item.quantidade
                    : material.quantidadeAtual - item.quantidade;

                if (newQuantity < 0) throw new BadRequestError(`Stock insuficiente para o material ${material.nome}`);

                const movement = await tx.stockMovement.create({
                    data: {
                        materialId: material.id,
                        tipo,
                        quantidade: item.quantidade,
                        documentoRef,
                        observacao,
                        localizacao: localizacao as string,
                        responsavelId: responsavelId as string,
                        dataReferencia: dataReferencia ? new Date(dataReferencia as string) : new Date(),
                        documentacaoAdicional: documentacaoAdicional as string,
                    } as any,
                });

                const updated = await tx.material.update({
                    where: { id: material.id },
                    data: { quantidadeAtual: newQuantity },
                });

                results.push({ movement, material: updated });
            }
            return results;
        });

        for (const resItem of batchResults) {
            const status = resItem.material.quantidadeAtual <= resItem.material.stockMinimo ? 'CRITICO' : 'OK';
            io.emit('material:stockChanged', {
                id: resItem.material.id,
                quantidadeAtual: resItem.material.quantidadeAtual,
                status,
                movement: resItem.movement,
            });
        }

        res.status(201).json(batchResults);
    }

    static async update(req: Request, res: Response) {
        const { id } = req.params;
        const data = materialSchema.partial().parse(req.body);

        const material = await prisma.material.update({
            where: { id },
            data: data as any,
        });

        io.emit('material:updated', material);
        res.json(material);
    }

    static async delete(req: Request, res: Response) {
        const { id } = req.params;
        await prisma.material.delete({ where: { id } });
        io.emit('material:deleted', { id });
        res.json({ message: 'Material eliminado com sucesso' });
    }
}
