import React, { useState, useEffect } from 'react';
import { api } from '../../connectors/api/client';
import { syncService } from '../../connectors/api/sync';

interface User {
  id: string;
  name: string;
}

interface Asset {
  id: string;
  numeroSerie: string;
  designacao: string;
  marca: string;
  modelo: string;
  referenciaInterna?: string;
  gama?: string;
  entidadeCalibradora?: string;
  numeroCertificado?: string;
  dataCalibracao?: string;
  validade?: string;
  proximaCalibracao?: string;
  observacoes?: string;
  quantidade: number;
  
  categoria: 'VIATURA' | 'MAQUINA' | 'FERRAMENTA' | 'EQUIPAMENTO_MEDICAO';
  statusOperacional: 'OPERACIONAL' | 'EM_MANUTENCAO' | 'AVARIADO' | 'ABATIDO';
  dataUltimaManutencao?: string;
  dataProximaRevisao?: string;
  responsavelAtual?: User;
  localizacao?: string;
  dailyCheckDone?: boolean;
}

interface MaintenanceTask {
  id: string;
  codigo: string;
  descricao: string;
  project?: { designacao: string };
  prioridade: string;
  status: string;
  dataInicioPrevista?: string;
}

const AssetsModule: React.FC = () => {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [maintenanceTasks, setMaintenanceTasks] = useState<MaintenanceTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'CARDS' | 'TABLE'>('TABLE');
  const [filter, setFilter] = useState<string>('Todos');
  const [locationFilter, setLocationFilter] = useState<string>('Todos');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showChecklistModal, setShowChecklistModal] = useState(false);
  const [showWorkshopModal, setShowWorkshopModal] = useState(false);
  const [activeAsset, setActiveAsset] = useState<Asset | null>(null);

  const [newAsset, setNewAsset] = useState({
    numeroSerie: '',
    designacao: '',
    marca: '',
    modelo: '',
    referenciaInterna: '',
    gama: '',
    entidadeCalibradora: '',
    numeroCertificado: '',
    dataCalibracao: '',
    validade: '',
    proximaCalibracao: '',
    observacoes: '',
    quantidade: 1,
    categoria: 'FERRAMENTA' as Asset['categoria'],
    localizacao: 'Armazém',
    dataProximaRevisao: ''
  });

  // Load data from API
  useEffect(() => {
    const loadData = async () => {
      try {
        const [assetsData, workOrders] = await Promise.all([
          api.assets.list(),
          api.workOrders.list({ status: 'ABERTA' })
        ]);
        
        // Filter work orders to only show suspected maintenance ones (simplified for demo)
        const activeMaintenances = workOrders.filter((wo: any) => 
          wo.tipoManutencao === 'CORRETIVA' || wo.tipoManutencao === 'PREVENTIVA'
        );
        
        setAssets(assetsData);
        setMaintenanceTasks(activeMaintenances);
      } catch (error) {
        console.error('Error loading assets:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();

    // Real-time updates
    const unsubCreate = syncService.on('asset:created', (asset) => {
      setAssets(prev => [asset, ...prev]);
    });
    const unsubUpdate = syncService.on('asset:updated', (asset) => {
      setAssets(prev => prev.map(a => a.id === asset.id ? asset : a));
    });
    const unsubStatus = syncService.on('asset:status', ({ id, statusOperacional }) => {
      setAssets(prev => prev.map(a => a.id === id ? { ...a, statusOperacional } : a));
    });
    const unsubDelete = syncService.on('asset:deleted', ({ id }) => {
      setAssets(prev => prev.filter(a => a.id !== id));
    });

    return () => {
      unsubCreate();
      unsubUpdate();
      unsubStatus();
      unsubDelete();
    };
  }, []);

  const handleAddAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.assets.create(newAsset);
      setShowAddModal(false);
      setNewAsset({ 
        numeroSerie: '', designacao: '', marca: '', modelo: '', 
        referenciaInterna: '', gama: '', entidadeCalibradora: '', 
        numeroCertificado: '', dataCalibracao: '', validade: '', 
        proximaCalibracao: '', observacoes: '', quantidade: 1, 
        categoria: 'FERRAMENTA', localizacao: 'Armazém', dataProximaRevisao: '' 
      });
    } catch (error) {
      console.error('Error creating asset:', error);
      alert('Erro ao criar ativo');
    }
  };

  const handleCompleteChecklist = () => {
    if (activeAsset) {
      setAssets(assets.map(a => a.id === activeAsset.id ? { ...a, dailyCheckDone: true } : a));
    }
    setShowChecklistModal(false);
  };

  const getChecklistQuestions = (category: string) => {
    switch (category) {
      case 'VIATURA': return ['Nível de Óleo/Água', 'Pressão dos Pneus', 'Luzes e Sinalização', 'Estado dos Travões', 'Combustível'];
      case 'MAQUINA': return ['Fugas de Óleo/Ar', 'Ruídos Anormais', 'Proteções Ativas', 'Botão Emergência OK', 'Limpeza Geral'];
      case 'FERRAMENTA': return ['Estado do Cabo/Fio', 'Integridade do Disco/Broca', 'Gatilho de Segurança', 'Punho de Aperto', 'Carcaça sem Fissuras'];
      default: return ['Integridade Física', 'Calibração Válida', 'Proteção de Transporte', 'Acessórios Completos'];
    }
  };

  const getPriorityColor = (p: string) => {
    switch (p) {
      case 'URGENTE': return 'bg-red-500 text-white shadow-red-200';
      case 'ALTA': return 'bg-amber-500 text-white shadow-amber-200';
      default: return 'bg-blue-500 text-white shadow-blue-200';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'OPERACIONAL': return 'Operacional';
      case 'EM_MANUTENCAO': return 'Manutenção';
      case 'AVARIADO': return 'Avariado';
      case 'ABATIDO': return 'Abatido';
      default: return status;
    }
  };

  const filteredAssets = assets.filter(a => {
    const matchesCategory = filter === 'Todos' || a.categoria === filter;
    const matchesLocation = locationFilter === 'Todos' || a.localizacao === locationFilter;
    return matchesCategory && matchesLocation;
  });

  const stats = {
    total: assets.length,
    manutencao: assets.filter(a => a.statusOperacional === 'EM_MANUTENCAO').length,
    checklists: assets.filter(a => !a.dailyCheckDone).length,
    calibracoes: assets.filter(a => a.proximaCalibracao && new Date(a.proximaCalibracao) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)).length
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-slate-400 text-sm">A carregar ativos...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6 animate-in fade-in duration-500">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Gestão de Ativos & Metrologia</h2>
            <p className="text-slate-500 text-sm font-medium italic">Frota, máquinas e equipamentos calibrados (ISO 9001).</p>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <button 
              onClick={() => setViewMode(viewMode === 'CARDS' ? 'TABLE' : 'CARDS')}
              className="flex-1 sm:flex-none py-2.5 bg-white border border-slate-200 text-slate-600 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 flex items-center justify-center transition-all shadow-sm active:scale-95"
            >
              <i className={`fas ${viewMode === 'CARDS' ? 'fa-table' : 'fa-grid-2'} mr-2 text-blue-400`}></i> {viewMode === 'CARDS' ? 'Vista de Tabela' : 'Vista de Cartões'}
            </button>
            <button 
              onClick={() => setShowAddModal(true)}
              className="flex-1 sm:flex-none bg-slate-900 text-white px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 shadow-lg active:scale-95 transition-all flex items-center justify-center"
            >
              <i className="fas fa-plus mr-2 text-emerald-400"></i> Adicionar Ativo
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border border-slate-200 p-5 rounded-3xl shadow-sm">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Ativos</p>
            <h4 className="text-2xl font-bold text-slate-800">{stats.total}</h4>
          </div>
          <div className="bg-white border border-slate-200 p-5 rounded-3xl shadow-sm">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Em Manutenção</p>
            <h4 className="text-2xl font-bold text-amber-500">{stats.manutencao}</h4>
          </div>
          <div className="bg-white border border-slate-200 p-5 rounded-3xl shadow-sm">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Checklist Pendente</p>
            <h4 className="text-2xl font-bold text-amber-500">{stats.checklists}</h4>
          </div>
          <div className="bg-white border border-slate-200 p-5 rounded-3xl shadow-sm">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Calibração em Breve</p>
            <h4 className="text-2xl font-bold text-emerald-500">{stats.calibracoes}</h4>
          </div>
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex space-x-2 overflow-x-auto pb-2 custom-scrollbar no-scrollbar">
            {['Todos', 'VIATURA', 'MAQUINA', 'FERRAMENTA', 'EQUIPAMENTO_MEDICAO'].map((cat) => (
              <button
                key={cat}
                onClick={() => setFilter(cat)}
                className={`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all whitespace-nowrap ${
                  filter === cat ? 'bg-slate-900 text-white border-slate-900 shadow-md' : 'bg-white text-slate-400 border-slate-200 hover:border-slate-300'
                }`}
              >
                {cat === 'Todos' ? 'Todos' : cat.replace('_', ' ')}
              </button>
            ))}
          </div>
          <div className="flex space-x-2 overflow-x-auto pb-2 custom-scrollbar no-scrollbar">
            {['Todos', 'Oficina', 'Armazém', 'Escritório', 'Pátio'].map((loc) => (
              <button
                key={loc}
                onClick={() => setLocationFilter(loc)}
                className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all whitespace-nowrap ${
                  locationFilter === loc ? 'bg-blue-600 text-white border-blue-600 shadow-md' : 'bg-white text-slate-400 border-slate-200 hover:border-slate-300'
                }`}
              >
                <i className="fas fa-location-dot mr-1.5 opacity-50"></i> {loc}
              </button>
            ))}
          </div>
        </div>

        {viewMode === 'CARDS' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAssets.length === 0 ? (
              <div className="col-span-full py-12 text-center bg-white border border-dashed rounded-3xl">
                <i className="fas fa-box-open text-4xl text-slate-200 mb-4"></i>
                <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Nenhum ativo encontrado</p>
              </div>
            ) : filteredAssets.map((asset) => (
              <div key={asset.id} className="bg-white border border-slate-200 rounded-[2rem] p-6 hover:shadow-xl transition-all group relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-full -mr-16 -mt-16 group-hover:bg-blue-50 transition-colors"></div>
                
                <div className="relative z-10">
                  <div className="flex justify-between items-start mb-6">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl shadow-sm ${
                      asset.categoria === 'VIATURA' ? 'bg-blue-50 text-blue-500' :
                      asset.categoria === 'MAQUINA' ? 'bg-amber-50 text-amber-500' :
                      asset.categoria === 'FERRAMENTA' ? 'bg-emerald-50 text-emerald-500' :
                      'bg-purple-50 text-purple-500'
                    }`}>
                      <i className={`fas ${
                        asset.categoria === 'VIATURA' ? 'fa-car' :
                        asset.categoria === 'MAQUINA' ? 'fa-gears' :
                        asset.categoria === 'FERRAMENTA' ? 'fa-hammer' :
                        'fa-microscope'
                      }`}></i>
                    </div>
                    <div className="flex flex-col items-end gap-1.5">
                      <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border shadow-sm ${
                        asset.statusOperacional === 'OPERACIONAL' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                        asset.statusOperacional === 'EM_MANUTENCAO' ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-red-50 text-red-600 border-red-100'
                      }`}>
                        {getStatusLabel(asset.statusOperacional)}
                      </span>
                      {!asset.dailyCheckDone && (
                        <span className="text-[8px] font-black text-amber-500 uppercase tracking-widest animate-pulse"><i className="fas fa-triangle-exclamation mr-1"></i> Check Pendente</span>
                      )}
                    </div>
                  </div>

                  <div className="mb-6">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{asset.numeroSerie}</p>
                    <h3 className="text-sm font-bold text-slate-800 leading-tight group-hover:text-blue-600 transition-colors uppercase tracking-tight">
                      {asset.designacao || 'Sem nome'}
                    </h3>
                    <p className="text-[10px] text-slate-500 font-medium italic mt-1">{asset.marca} {asset.modelo}</p>
                  </div>
                  
                  <div className="space-y-2.5 border-t border-slate-50 pt-4">
                    <div className="flex justify-between text-[9px] font-bold">
                      <span className="text-slate-400 uppercase tracking-tighter">Próxima Revisão</span>
                      <span className={asset.dataProximaRevisao && new Date(asset.dataProximaRevisao) < new Date() ? 'text-red-500' : 'text-slate-700'}>
                        {asset.dataProximaRevisao ? new Date(asset.dataProximaRevisao).toLocaleDateString('pt-PT') : 'Não agendada'}
                      </span>
                    </div>
                    {asset.proximaCalibracao && (
                      <div className="flex justify-between text-[9px] font-bold">
                        <span className="text-emerald-500 uppercase tracking-tighter">Calibração</span>
                        <span className={new Date(asset.proximaCalibracao) < new Date() ? 'text-red-500' : 'text-slate-700'}>
                          {new Date(asset.proximaCalibracao).toLocaleDateString('pt-PT')}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between text-[9px] font-bold">
                      <span className="text-slate-400 uppercase tracking-tighter">Localização</span>
                      <span className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded-lg border border-blue-100 uppercase tracking-tighter text-[8px]">{asset.localizacao || 'N/A'}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mt-6 relative z-20">
                    <button 
                      onClick={() => { setActiveAsset(asset); setShowChecklistModal(true); }}
                      className={`py-2 rounded-xl text-[9px] font-black uppercase transition-all shadow-sm ${
                        asset.dailyCheckDone ? 'bg-slate-50 text-slate-400 hover:bg-slate-100' : 'bg-emerald-500 text-white hover:bg-emerald-600 active:scale-95'
                      }`}
                    >
                      <i className={`fas ${asset.dailyCheckDone ? 'fa-check' : 'fa-list-check'} mr-1`}></i> Checklist
                    </button>
                    <button className="py-2 bg-white border border-slate-200 text-slate-600 rounded-xl text-[9px] font-black uppercase hover:bg-slate-50 transition-all active:scale-95">
                      <i className="fas fa-triangle-exclamation mr-1 text-amber-500"></i> Avaria
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-[2rem] shadow-sm overflow-hidden">
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left border-collapse min-w-[2000px]">
                <thead>
                  <tr className="bg-slate-50/50">
                    <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 w-16">Qtd</th>
                    <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Designação</th>
                    <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 font-display">Marca</th>
                    <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 font-display">Modelo</th>
                    <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 font-display">N.º Série</th>
                    <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 font-display text-blue-500">Ref. Interna</th>
                    <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 font-display">Gama</th>
                    <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 font-display">Entidade Calibradora</th>
                    <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 font-display">N.º Certificado</th>
                    <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 font-display">Data Calibração</th>
                    <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 font-display">Validade</th>
                    <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 font-display">Próx. Calibração</th>
                    <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 font-display">Localização</th>
                    <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 font-display">Status</th>
                    <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 font-display">Observações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredAssets.map(asset => (
                    <tr key={asset.id} className="hover:bg-slate-50 transition-colors group">
                      <td className="px-6 py-4 text-[11px] font-bold text-slate-600">{asset.quantidade}</td>
                      <td className="px-6 py-4 text-[11px] font-black text-slate-800 uppercase tracking-tight">{asset.designacao}</td>
                      <td className="px-6 py-4 text-[11px] font-bold text-slate-600">{asset.marca}</td>
                      <td className="px-6 py-4 text-[11px] font-bold text-slate-600">{asset.modelo}</td>
                      <td className="px-6 py-4 text-[10px] font-mono font-bold text-blue-600">{asset.numeroSerie}</td>
                      <td className="px-6 py-4 text-[11px] font-bold text-slate-500">{asset.referenciaInterna || '-'}</td>
                      <td className="px-6 py-4 text-[11px] font-bold text-slate-600">{asset.gama || '-'}</td>
                      <td className="px-6 py-4 text-[11px] font-bold text-slate-600">{asset.entidadeCalibradora || '-'}</td>
                      <td className="px-6 py-4 text-[11px] font-bold text-emerald-600">{asset.numeroCertificado || '-'}</td>
                      <td className="px-6 py-4 text-[11px] font-bold text-slate-600">{asset.dataCalibracao ? new Date(asset.dataCalibracao).toLocaleDateString() : '-'}</td>
                      <td className="px-6 py-4 text-[11px] font-bold text-slate-600">{asset.validade || '-'}</td>
                      <td className="px-6 py-4 text-[11px] font-bold">
                        <span className={asset.proximaCalibracao && new Date(asset.proximaCalibracao) < new Date() ? 'text-red-500 underline' : 'text-slate-700'}>
                          {asset.proximaCalibracao ? new Date(asset.proximaCalibracao).toLocaleDateString() : '-'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-tighter border border-blue-100">{asset.localizacao || 'TBD'}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border ${
                          asset.statusOperacional === 'OPERACIONAL' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                          asset.statusOperacional === 'EM_MANUTENCAO' ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-red-50 text-red-600 border-red-100'
                        }`}>
                          {getStatusLabel(asset.statusOperacional)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-[10px] text-slate-400 italic max-w-xs truncate">{asset.observacoes || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Oficina Banner - Inside the main container */}
        <div className="mt-8 p-10 bg-gradient-to-br from-emerald-900 to-emerald-800 rounded-[3rem] text-white shadow-2xl shadow-emerald-200 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl group-hover:bg-white/10 transition-all duration-700"></div>
          <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl"></div>
          
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-10">
            <div className="flex items-center space-x-8">
              <div className="w-20 h-20 bg-emerald-500 rounded-[2rem] flex items-center justify-center text-3xl shadow-2xl shadow-emerald-500/20 group-hover:scale-110 transition-transform duration-500">
                <i className="fas fa-tools text-white"></i>
              </div>
              <div>
                <h4 className="font-black text-2xl tracking-tight mb-2 uppercase">Oficina & Manutenção</h4>
                <p className="text-emerald-100/70 text-xs font-bold uppercase tracking-widest italic flex items-center">
                  <span className="w-2 h-2 bg-emerald-400 rounded-full mr-2 animate-pulse"></span>
                  Existem {maintenanceTasks.length} intervenções registadas no ERP
                </p>
              </div>
            </div>
            <button 
              onClick={() => setShowWorkshopModal(true)}
              className="w-full md:w-auto px-12 py-5 bg-white text-emerald-900 rounded-[1.8rem] text-[11px] font-black uppercase tracking-[0.2em] shadow-2xl hover:bg-emerald-50 transition-all active:scale-95 group-hover:shadow-emerald-500/20"
            >
              Abrir Painel Técnico
            </button>
          </div>
        </div>
      </div>

  {/* MODAIS - Outside the main container */}
  {showWorkshopModal && (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[200] grid place-items-center p-4 overflow-y-auto">
      <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-5xl overflow-hidden animate-in zoom-in duration-300 my-auto flex flex-col">
        <div className="p-8 border-b border-slate-100 relative bg-slate-50/30 text-center">
          <button 
            onClick={() => setShowWorkshopModal(false)}
            className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 hover:text-red-500 transition-colors w-8 h-8 flex items-center justify-center rounded-full hover:bg-red-50"
          >
            <i className="fas fa-times text-lg"></i>
          </button>
          <h3 className="font-bold text-slate-900 tracking-tight text-xl">Painel da Oficina & Manutenção</h3>
          <p className="text-[10px] text-slate-400 font-medium uppercase tracking-widest mt-1">Gestão Técnica de Ativos</p>
        </div>
        
        <div className="p-6 overflow-y-auto flex-1 custom-scrollbar max-h-[70vh]">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest">Tarefas em Curso</h4>
                <span className="bg-blue-50 text-blue-600 px-2.5 py-1 rounded-full text-[9px] font-black">{maintenanceTasks.length} ATIVAS</span>
              </div>
              
              <div className="space-y-4">
                {maintenanceTasks.length > 0 ? maintenanceTasks.map(task => (
                  <div key={task.id} className="p-5 border border-slate-100 rounded-3xl bg-slate-50/50 hover:bg-white hover:shadow-lg hover:border-blue-100 transition-all group overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50/50 rounded-full -mr-12 -mt-12 group-hover:bg-blue-100/50 transition-colors"></div>
                    
                    <div className="relative z-10">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest">{task.codigo}</span>
                          <h5 className="text-sm font-bold text-slate-800 group-hover:text-blue-600 transition-colors">{task.descricao}</h5>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase shadow-sm border ${getPriorityColor(task.prioridade)}`}>
                          {task.prioridade}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 italic font-medium mb-4 flex items-center">
                        <i className="fas fa-project-diagram mr-2 opacity-50"></i>
                        {task.project?.designacao || 'Manutenção Geral Interna'}
                      </p>
                      <div className="flex justify-between items-center pt-4 border-t border-slate-200/50">
                        <div className="flex flex-col">
                          <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Início Previsto</span>
                          <span className="text-[10px] font-bold text-slate-700">{task.dataInicioPrevista ? new Date(task.dataInicioPrevista).toLocaleDateString() : 'A definir'}</span>
                        </div>
                        <div className="flex gap-2">
                          <button className="px-4 py-2 bg-white border border-slate-200 text-slate-600 text-[9px] font-black uppercase rounded-xl hover:bg-slate-50 transition-all active:scale-95 shadow-sm">Peças</button>
                          <button className="px-4 py-2 bg-emerald-500 text-white text-[9px] font-black uppercase rounded-xl hover:bg-emerald-600 transition-all active:scale-95 shadow-md shadow-emerald-100">Concluir</button>
                        </div>
                      </div>
                    </div>
                  </div>
                )) : (
                  <div className="text-center py-20 bg-slate-50/30 rounded-3xl border border-dashed border-slate-200">
                    <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 border border-slate-100 shadow-sm text-slate-200">
                      <i className="fas fa-clipboard-check text-2xl"></i>
                    </div>
                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Sem manutenções agendadas</p>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                  <i className="fas fa-box text-6xl -rotate-12"></i>
                </div>
                <div className="relative z-10">
                  <h5 className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-6">Stock de Peças Críticas</h5>
                  <div className="space-y-3">
                    {[
                      { name: 'Filtro Óleo Hilux', stock: '8 UN' },
                      { name: 'Escovas Gerador', stock: '12 UN' },
                      { name: 'Lubrificante HT-2', stock: '5 L' }
                    ].map(part => (
                      <div key={part.name} className="flex justify-between items-center p-3.5 bg-white/5 rounded-2xl border border-white/10 hover:bg-white/10 transition-colors">
                        <span className="text-[10px] font-bold">{part.name}</span>
                        <span className="text-[9px] font-black text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-lg border border-emerald-400/20">{part.stock}</span>
                      </div>
                    ))}
                  </div>
                  <button className="w-full mt-6 py-3 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-xl text-[9px] font-black uppercase transition-all">Ver Inventário Completo</button>
                </div>
              </div>

              <div className="p-8 bg-blue-50 border border-blue-100 rounded-[2.5rem] shadow-sm relative overflow-hidden group">
                <div className="absolute -bottom-6 -left-6 opacity-5 group-hover:opacity-10 transition-opacity">
                    <i className="fas fa-certificate text-8xl text-blue-900"></i>
                </div>
                <div className="relative z-10">
                  <h5 className="text-[10px] font-black text-blue-800 uppercase tracking-widest mb-3">Conformidade ISO</h5>
                  <p className="text-[11px] text-blue-700 leading-relaxed font-medium mb-6 italic">
                    O encerramento de manutenções emite automaticamente o certificado de prontidão e rastreabilidade metrológica.
                  </p>
                  <button className="w-full py-4 bg-blue-600 text-white rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 active:scale-95">Histórico de Manutenções</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )}

  {showAddModal && (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[200] grid place-items-center p-4 overflow-y-auto">
      <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-4xl overflow-hidden animate-in zoom-in duration-300 my-auto flex flex-col">
        <div className="p-6 border-b border-slate-100 relative bg-slate-50/30 text-center">
          <button 
            onClick={() => setShowAddModal(false)}
            className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 hover:text-red-500 transition-colors w-8 h-8 flex items-center justify-center rounded-full hover:bg-red-50"
          >
            <i className="fas fa-times text-lg"></i>
          </button>
          <h3 className="font-bold text-slate-900 tracking-tight text-lg">Novo Ativo / Equipamento</h3>
          <p className="text-[10px] text-slate-400 font-medium uppercase tracking-widest mt-1">Dossier Técnico & Metrologia</p>
        </div>
        
        <form onSubmit={handleAddAsset} className="p-6 overflow-y-auto flex-1 custom-scrollbar max-h-[65vh]">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Dados Gerais */}
            <div className="md:col-span-3 pb-2 border-b border-slate-100 mb-2">
              <h4 className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Informação Geral</h4>
            </div>
            
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Designação</label>
              <input
                type="text"
                required
                placeholder="Ex: Paquímetro Digital"
                className="w-full bg-slate-50 border-transparent focus:bg-white focus:border-blue-500 rounded-xl px-4 py-3 text-sm transition-all outline-none"
                value={newAsset.designacao}
                onChange={(e) => setNewAsset({ ...newAsset, designacao: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Marca</label>
              <input
                type="text"
                required
                placeholder="Ex: Mitutoyo"
                className="w-full bg-slate-50 border-transparent focus:bg-white focus:border-blue-500 rounded-xl px-4 py-3 text-sm transition-all outline-none"
                value={newAsset.marca}
                onChange={(e) => setNewAsset({ ...newAsset, marca: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Modelo</label>
              <input
                type="text"
                required
                placeholder="Ex: 500-196-30"
                className="w-full bg-slate-50 border-transparent focus:bg-white focus:border-blue-500 rounded-xl px-4 py-3 text-sm transition-all outline-none"
                value={newAsset.modelo}
                onChange={(e) => setNewAsset({ ...newAsset, modelo: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">N.º Série / Chassis</label>
              <input
                type="text"
                required
                placeholder="Identificador único"
                className="w-full bg-slate-50 border-transparent focus:bg-white focus:border-blue-500 rounded-xl px-4 py-3 text-sm transition-all outline-none"
                value={newAsset.numeroSerie}
                onChange={(e) => setNewAsset({ ...newAsset, numeroSerie: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Quantidade</label>
              <input
                type="number"
                className="w-full bg-slate-50 border-transparent focus:bg-white focus:border-blue-500 rounded-xl px-4 py-3 text-sm transition-all outline-none"
                value={newAsset.quantidade}
                onChange={(e) => setNewAsset({ ...newAsset, quantidade: parseInt(e.target.value) })}
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Categoria</label>
              <select
                className="w-full bg-slate-50 border-transparent focus:bg-white focus:border-blue-500 rounded-xl px-4 py-3 text-sm transition-all outline-none appearance-none"
                value={newAsset.categoria}
                onChange={(e) => setNewAsset({ ...newAsset, categoria: e.target.value as Asset['categoria'] })}
              >
                <option value="VIATURA">Viatura</option>
                <option value="MAQUINA">Máquina</option>
                <option value="FERRAMENTA">Ferramenta</option>
                <option value="EQUIPAMENTO_MEDICAO">Equipamento de Medição</option>
              </select>
            </div>

            {/* Metrologia & Rastreabilidade */}
            <div className="md:col-span-3 pb-2 border-b border-slate-100 mb-2 mt-4">
              <h4 className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Metrologia & Rastreabilidade</h4>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Ref. Interna</label>
              <input
                type="text"
                placeholder="Código de inventário"
                className="w-full bg-slate-50 border-transparent focus:bg-white focus:border-blue-500 rounded-xl px-4 py-3 text-sm transition-all outline-none"
                value={newAsset.referenciaInterna}
                onChange={(e) => setNewAsset({ ...newAsset, referenciaInterna: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Gama / Range</label>
              <input
                type="text"
                placeholder="Ex: 0-150mm"
                className="w-full bg-slate-50 border-transparent focus:bg-white focus:border-blue-500 rounded-xl px-4 py-3 text-sm transition-all outline-none"
                value={newAsset.gama}
                onChange={(e) => setNewAsset({ ...newAsset, gama: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Entidade Calibradora</label>
              <input
                type="text"
                placeholder="Laboratório / Empresa"
                className="w-full bg-slate-50 border-transparent focus:bg-white focus:border-blue-500 rounded-xl px-4 py-3 text-sm transition-all outline-none"
                value={newAsset.entidadeCalibradora}
                onChange={(e) => setNewAsset({ ...newAsset, entidadeCalibradora: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">N.º Certificado</label>
              <input
                type="text"
                placeholder="Certificado de calibração"
                className="w-full bg-slate-50 border-transparent focus:bg-white focus:border-blue-500 rounded-xl px-4 py-3 text-sm transition-all outline-none"
                value={newAsset.numeroCertificado}
                onChange={(e) => setNewAsset({ ...newAsset, numeroCertificado: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Data Calibração</label>
              <input
                type="date"
                className="w-full bg-slate-50 border-transparent focus:bg-white focus:border-blue-500 rounded-xl px-4 py-3 text-sm transition-all outline-none"
                value={newAsset.dataCalibracao}
                onChange={(e) => setNewAsset({ ...newAsset, dataCalibracao: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Validade</label>
              <input
                type="text"
                placeholder="Ex: 12 meses"
                className="w-full bg-slate-50 border-transparent focus:bg-white focus:border-blue-500 rounded-xl px-4 py-3 text-sm transition-all outline-none"
                value={newAsset.validade}
                onChange={(e) => setNewAsset({ ...newAsset, validade: e.target.value })}
              />
            </div>

            {/* Localização & Manutenção */}
            <div className="md:col-span-3 pb-2 border-b border-slate-100 mb-2 mt-4">
              <h4 className="text-[10px] font-black text-amber-500 uppercase tracking-widest">Localização & Manutenção</h4>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Localização</label>
              <select
                className="w-full bg-slate-50 border-transparent focus:bg-white focus:border-blue-500 rounded-xl px-4 py-3 text-sm transition-all outline-none appearance-none"
                value={newAsset.localizacao}
                onChange={(e) => setNewAsset({ ...newAsset, localizacao: e.target.value })}
              >
                <option value="Oficina">Oficina</option>
                <option value="Armazém">Armazém</option>
                <option value="Escritório">Escritório</option>
                <option value="Pátio">Pátio</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Próxima Revisão / Calibração</label>
              <input
                type="date"
                className="w-full bg-slate-50 border-transparent focus:bg-white focus:border-blue-500 rounded-xl px-4 py-3 text-sm transition-all outline-none"
                value={newAsset.dataProximaRevisao}
                onChange={(e) => setNewAsset({ ...newAsset, dataProximaRevisao: e.target.value })}
              />
            </div>

            <div className="md:col-span-3 space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Observações</label>
              <textarea
                rows={2}
                placeholder="Notas técnicas adicionais..."
                className="w-full bg-slate-50 border-transparent focus:bg-white focus:border-blue-500 rounded-xl px-4 py-3 text-sm transition-all outline-none resize-none"
                value={newAsset.observacoes}
                onChange={(e) => setNewAsset({ ...newAsset, observacoes: e.target.value })}
              />
            </div>
          </div>

          <div className="pt-6 border-t border-slate-50 flex gap-3 mt-6">
            <button
              type="button"
              onClick={() => setShowAddModal(false)}
              className="flex-1 px-4 py-4 border border-slate-100 text-slate-400 rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:bg-slate-50 transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-[2] bg-slate-900 text-white px-4 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 shadow-xl shadow-slate-200 active:scale-95 transition-all"
            >
              Gravar Ativo / Equipamento
            </button>
          </div>
        </form>
      </div>
    </div>
  )}

  {showChecklistModal && activeAsset && (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[210] grid place-items-center p-4 overflow-y-auto">
      <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in duration-300 my-auto flex flex-col">
        <div className="p-6 border-b border-slate-100 relative bg-slate-50/30 text-center">
          <button 
            onClick={() => setShowChecklistModal(false)}
            className="absolute right-8 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-900 transition-colors"
          >
            <i className="fas fa-times text-sm"></i>
          </button>
          <h3 className="font-bold text-slate-900 tracking-tight text-xl font-display">Inspeção Diária</h3>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">
            {activeAsset.numeroSerie} • {activeAsset.designacao}
          </p>
        </div>
        
        <div className="p-8 overflow-y-auto max-h-[60vh] custom-scrollbar">
          <div className="bg-emerald-50 p-6 rounded-[1.5rem] border border-emerald-100 flex items-start space-x-4 mb-8">
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-emerald-600 shadow-sm shrink-0">
              <i className="fas fa-shield-halved"></i>
            </div>
            <p className="text-[10px] text-emerald-700 font-bold leading-relaxed uppercase tracking-tight">
              A validação de todos os pontos é obrigatória para garantir a segurança operacional e conformidade normativa.
            </p>
          </div>
          
          <div className="space-y-3">
            {getChecklistQuestions(activeAsset.categoria).map((q, idx) => (
              <div key={idx} className="flex items-center justify-between p-4 bg-slate-50/50 border border-slate-100/50 rounded-2xl hover:bg-white hover:border-emerald-200 hover:shadow-md transition-all group">
                <span className="text-[11px] font-bold text-slate-700">{q}</span>
                <div className="flex gap-2">
                  <button className="w-9 h-9 rounded-xl border border-slate-200 bg-white text-slate-300 flex items-center justify-center hover:bg-emerald-500 hover:text-white hover:border-emerald-500 transition-all text-xs shadow-sm">
                    <i className="fas fa-check"></i>
                  </button>
                  <button className="w-9 h-9 rounded-xl border border-slate-200 bg-white text-slate-300 flex items-center justify-center hover:bg-red-500 hover:text-white hover:border-red-500 transition-all text-xs shadow-sm">
                    <i className="fas fa-xmark"></i>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="p-8 border-t border-slate-100 bg-slate-50/30">
          <button 
            onClick={handleCompleteChecklist}
            className="w-full py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-slate-200 hover:bg-slate-800 transition-all active:scale-95 flex items-center justify-center"
          >
            <i className="fas fa-check-double mr-2"></i> Liberar Equipamento para Uso
          </button>
        </div>
      </div>
    </div>
  )}
</>
);
};

export default AssetsModule;
