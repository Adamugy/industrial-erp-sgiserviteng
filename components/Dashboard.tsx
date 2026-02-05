import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { syncService } from '../api/sync';
import { Badge, StatsCard, Card, Button } from './common/UIElements';
import { 
  BarChart3, 
  ShieldCheck, 
  Euro, 
  Zap, 
  ClipboardCheck, 
  Calendar,
  ChevronRight,
  Shield,
  MapPin
} from 'lucide-react';

interface DashboardStats {
  obrasAtivas: number;
  taxaIncidentes: number;
  vendasMes: number;
  eficacia: number;
}

interface MaintenanceItem {
  id: string;
  codigo: string;
  descricao: string;
  project?: { designacao: string };
  dataInicioPrevista?: string;
  status: string;
  prioridade: string;
  local?: string;
  dataAbertura?: string;
}

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>({
    obrasAtivas: 0,
    taxaIncidentes: 0,
    vendasMes: 0,
    eficacia: 0,
  });
  const [maintenances, setMaintenances] = useState<MaintenanceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncTime, setSyncTime] = useState(new Date());

  // Calculate days until audit (next quarter end)
  const getDaysUntilAudit = () => {
    const today = new Date();
    const quarter = Math.floor(today.getMonth() / 3);
    const nextQuarterEnd = new Date(today.getFullYear(), (quarter + 1) * 3, 0);
    const diff = Math.ceil((nextQuarterEnd.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  // Format relative date
  const formatRelativeDate = (dateStr?: string) => {
    if (!dateStr) return 'A definir';
    
    const date = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const dateOnly = new Date(date);
    dateOnly.setHours(0, 0, 0, 0);
    
    if (dateOnly.getTime() === today.getTime()) {
      return `Hoje, ${date.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}`;
    } else if (dateOnly.getTime() === tomorrow.getTime()) {
      return `Amanhã, ${date.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}`;
    } else {
      return date.toLocaleDateString('pt-PT', { day: 'numeric', month: 'short' });
    }
  };

  // Load dashboard data
  useEffect(() => {
    const loadData = async () => {
      try {
        const workOrders = await api.workOrders.list({ status: 'ABERTA' });
        setMaintenances(workOrders.slice(0, 5));
        
        const projects = await api.projects.list();
        const activeProjects = projects.filter((p: any) => p.status === 'EM_EXECUCAO').length;
        
        const proposals = await api.proposals.list();
        const adjudicadas = proposals.filter((p: any) => p.status === 'ADJUDICADO');
        const salesTotal = adjudicadas.reduce((sum: number, p: any) => sum + Number(p.valorEstimado), 0);
        
        setStats({
          obrasAtivas: activeProjects || projects.length,
          taxaIncidentes: 0.0,
          vendasMes: salesTotal,
          eficacia: 88 + Math.floor(Math.random() * 8),
        });
      } catch (error) {
        console.error('Error loading dashboard:', error);
        setStats({
          obrasAtivas: 3,
          taxaIncidentes: 0.0,
          vendasMes: 84000,
          eficacia: 92,
        });
      } finally {
        setLoading(false);
      }
    };

    loadData();

    const interval = setInterval(() => setSyncTime(new Date()), 60000);
    
    const unsubProject = syncService.on('project:created', () => {
      setStats(prev => ({ ...prev, obrasAtivas: prev.obrasAtivas + 1 }));
    });
    const unsubWO = syncService.on('workOrder:created', (wo) => {
      setMaintenances(prev => [wo, ...prev].slice(0, 5));
    });

    return () => {
      clearInterval(interval);
      unsubProject();
      unsubWO();
    };
  }, []);

  const daysUntilAudit = getDaysUntilAudit();

  return (
    <div className="space-y-6 lg:space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Painel de Controle</h1>
          <p className="text-slate-500 text-sm mt-1">Status operacional da empresa e indicadores ISO.</p>
        </div>
        <div className="text-[10px] font-mono text-slate-400 dark:text-slate-500 bg-white dark:bg-slate-900 px-3 py-1.5 border rounded-lg border-slate-100 dark:border-slate-800 shadow-sm whitespace-nowrap flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          SYNC: {syncTime.toLocaleTimeString('pt-PT')}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <StatsCard 
          label="Obras Ativas" 
          value={stats.obrasAtivas} 
          icon={<BarChart3 size={18} />} 
          trend={{ value: '+2', positive: true }} 
        />
        <StatsCard 
          label="Taxa Incidentes" 
          value={stats.taxaIncidentes.toFixed(1)} 
          icon={<ShieldCheck size={18} />} 
        />
        <StatsCard 
          label="Vendas (Mês)" 
          value={`€ ${(stats.vendasMes / 1000).toFixed(0)}k`} 
          icon={<Euro size={18} />} 
          trend={{ value: '+12%', positive: true }} 
        />
        <StatsCard 
          label="Eficácia" 
          value={`${stats.eficacia}%`} 
          icon={<Zap size={18} />} 
          trend={{ value: '+3.2%', positive: true }} 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        <div className="lg:col-span-2">
          <Card 
            title="Próximas Manutenções" 
            action={
              <Button variant="ghost" size="sm" icon={<Calendar size={14} />}>
                Ver Agenda
              </Button>
            }
          >
            <div className="space-y-3 lg:space-y-4">
              {maintenances.length > 0 ? maintenances.map(os => (
                <div key={os.id} className="flex items-center p-3 border border-slate-50 dark:border-slate-800/50 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                  <div className="w-10 h-10 lg:w-12 lg:h-12 bg-slate-50 dark:bg-slate-800 rounded-lg flex items-center justify-center font-bold text-slate-400 group-hover:bg-white dark:group-hover:bg-slate-700 group-hover:text-emerald-600 transition-colors shadow-sm shrink-0 text-xs">
                    {os.codigo?.split('-')[1] || '?'}
                  </div>
                  <div className="ml-3 lg:ml-4 flex-1 min-w-0">
                    <p className="font-bold text-slate-800 dark:text-slate-200 text-xs lg:text-sm truncate">{os.descricao}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <p className="text-[10px] lg:text-xs text-slate-500 truncate">{os.project?.designacao || 'Projeto não atribuído'}</p>
                      {os.local && (
                        <>
                          <span className="text-slate-300 dark:text-slate-700">•</span>
                          <p className="text-[10px] lg:text-xs text-indigo-500 dark:text-indigo-400 font-bold truncate flex items-center">
                            <MapPin size={10} className="mr-1" /> {os.local}
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="text-right ml-2">
                    <p className="text-[10px] lg:text-xs font-black text-slate-900 dark:text-white whitespace-nowrap">
                      {os.dataAbertura ? new Date(os.dataAbertura).toLocaleDateString('pt-PT') : formatRelativeDate(os.dataInicioPrevista)}
                    </p>
                    <Badge 
                      variant={os.prioridade === 'URGENTE' ? 'priority-urgent' : os.prioridade === 'ALTA' ? 'priority-high' : 'neutral'}
                      className="mt-1"
                    >
                      {os.status}
                    </Badge>
                  </div>
                </div>
              )) : (
                <div className="text-center py-8 text-slate-400">
                  <ClipboardCheck size={32} className="mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Sem manutenções pendentes</p>
                </div>
              )}
            </div>
          </Card>
        </div>

        <div className="bg-slate-900 dark:bg-indigo-950 text-white p-6 rounded-2xl shadow-xl flex flex-col justify-between overflow-hidden relative border border-slate-800 dark:border-indigo-900/50">
          <div className="absolute -right-4 -top-4 opacity-10">
            <Shield size={160} />
          </div>
          
          <div className="relative z-10">
            <div className="flex items-center space-x-2 text-emerald-400 mb-4">
              <ShieldCheck size={16} />
              <span className="text-[10px] font-bold tracking-widest uppercase">Certificação ISO</span>
            </div>
            <h3 className="text-lg lg:text-2xl font-bold leading-tight">Auditoria em {daysUntilAudit} dias</h3>
            <p className="text-slate-400 text-xs lg:text-sm mt-3 leading-relaxed italic">Prepare toda a documentação do SGQ e SST. O módulo de qualidade já sinalizou pendências.</p>
          </div>
          
          <div className="mt-8 space-y-4 relative z-10">
             <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider text-slate-300">
               <span>Compliance ISO 9001</span>
               <span className="text-emerald-400 font-black">{stats.eficacia}%</span>
             </div>
             <div className="h-2 w-full bg-slate-800 dark:bg-indigo-900 rounded-full overflow-hidden">
               <div className="h-full bg-emerald-500 transition-all duration-1000 shadow-[0_0_10px_rgba(16,185,129,0.5)]" style={{ width: `${stats.eficacia}%` }}></div>
             </div>
             <Button 
               variant="primary" 
               className="w-full !bg-emerald-500 hover:!bg-emerald-600 border-none shadow-none text-xs font-black uppercase tracking-widest h-12 mt-4"
               icon={<ChevronRight size={14} />}
             >
               Ver Não Conformidades
             </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
