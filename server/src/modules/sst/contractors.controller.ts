import { Request, Response } from 'express';
import { prisma, io } from '../../index.js';
import { NotFoundError } from '../../utils/errors.js';

export class ContractorsController {
    static async list(req: Request, res: Response) {
        const contractors = await (prisma as any).contractor.findMany({
            orderBy: { nome: 'asc' }
        });
        res.json(contractors);
    }

    static async create(req: Request, res: Response) {
        const { nome, empresa, nif, email, telefone } = req.body;

        const contractor = await (prisma as any).contractor.create({
            data: {
                nome,
                empresa,
                nif,
                email,
                telefone,
                status: 'ATIVO'
            }
        });

        io.emit('contractor:created', contractor);
        res.status(201).json(contractor);
    }

    static async updateInduction(req: Request, res: Response) {
        const id = req.params.id as string;
        const { inducaoSST, dataInducao, validadeInducao } = req.body;

        const contractor = await (prisma as any).contractor.update({
            where: { id },
            data: {
                inducaoSST,
                dataInducao: dataInducao ? new Date(dataInducao) : undefined,
                validadeInducao: validadeInducao ? new Date(validadeInducao) : undefined,
            }
        });

        io.emit('contractor:updated', contractor);
        res.json(contractor);
    }

    static async updateEPI(req: Request, res: Response) {
        const id = req.params.id as string;
        const { epiEntregue, epiLista } = req.body;

        const contractor = await (prisma as any).contractor.update({
            where: { id },
            data: {
                epiEntregue,
                epiLista
            }
        });

        io.emit('contractor:updated', contractor);
        res.json(contractor);
    }

    static async delete(req: Request, res: Response) {
        const id = req.params.id as string;

        // Check if exists
        const exists = await (prisma as any).contractor.findUnique({ where: { id } });
        if (!exists) throw new NotFoundError('Contratado não encontrado');

        await (prisma as any).contractor.delete({ where: { id } });
        io.emit('contractor:deleted', { id });
        res.status(204).send();
    }
}
