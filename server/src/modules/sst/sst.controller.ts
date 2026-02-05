import { Request, Response } from 'express';
import { prisma, io } from '../../index.js';
import { NotFoundError } from '../../utils/errors.js';

export class SSTController {
    // ==================== INCIDENTS ====================
    static async listIncidents(req: Request, res: Response) {
        const incidents = await prisma.incident.findMany({
            orderBy: { createdAt: 'desc' }
        });
        res.json(incidents);
    }

    static async createIncident(req: Request, res: Response) {
        const { tipo, severidade, descricao, dataOcorrencia, localOcorrencia } = req.body;

        const incident = await prisma.incident.create({
            data: {
                tipo,
                severidade,
                descricao,
                dataOcorrencia: dataOcorrencia ? new Date(dataOcorrencia) : new Date(),
                localOcorrencia,
                status: 'ABERTO'
            }
        });

        io.emit('incident:created', incident);
        res.status(201).json(incident);
    }

    static async updateIncidentStatus(req: Request, res: Response) {
        const { id } = req.params;
        const { status, planoAcaoCorretiva } = req.body;

        const incident = await prisma.incident.update({
            where: { id },
            data: {
                status,
                planoAcaoCorretiva,
                dataFecho: status === 'FECHADO' ? new Date() : undefined
            }
        });

        io.emit('incident:updated', incident);
        res.json(incident);
    }

    // ==================== APR (Análise Preliminar de Risco) ====================
    static async listAPRs(req: Request, res: Response) {
        const aprs = await prisma.aPR.findMany({
            include: { workOrder: { include: { project: true } } },
            orderBy: { createdAt: 'desc' }
        });
        res.json(aprs);
    }

    static async createAPR(req: Request, res: Response) {
        const { workOrderId, perigosIdentificados, medidasControlo } = req.body;

        const apr = await prisma.aPR.create({
            data: {
                workOrderId,
                perigosIdentificados,
                medidasControlo,
                aprovado: false
            }
        });

        io.emit('apr:created', apr);
        res.status(201).json(apr);
    }

    static async approveAPR(req: Request, res: Response) {
        const { id } = req.params;
        const apr = await prisma.aPR.update({
            where: { id },
            data: {
                aprovado: true,
                dataAprovacao: new Date()
            }
        });

        io.emit('apr:updated', apr);
        res.json(apr);
    }

    // ==================== WORK PERMITS ====================
    static async listWorkPermits(req: Request, res: Response) {
        const permits = await prisma.workPermit.findMany({
            include: { workOrder: { include: { project: true } } },
            orderBy: { createdAt: 'desc' }
        });
        res.json(permits);
    }

    static async createWorkPermit(req: Request, res: Response) {
        const { workOrderId, tipoTrabalho, validadeInicio, validadeFim, isolamentoEnergiasLoto } = req.body;

        const permit = await prisma.workPermit.create({
            data: {
                workOrderId,
                tipoTrabalho,
                validadeInicio: new Date(validadeInicio),
                validadeFim: new Date(validadeFim),
                isolamentoEnergiasLoto,
                aprovado: false
            }
        });

        io.emit('workPermit:created', permit);
        res.status(201).json(permit);
    }
}
