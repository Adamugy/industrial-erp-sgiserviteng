import React, { useState, useEffect } from 'react';
import { api } from '../../connectors/api/client';
import { syncService } from '../../connectors/api/sync';
import SSTFormsPreOS from './SSTFormsPreOS';

interface Incident {
  id: string;
  tipo: 'ACIDENTE' | 'INCIDENTE' | 'NC' | 'CONDICAO_INSEGURA';
  severidade: 'LEVE' | 'MODERADO' | 'GRAVE' | 'FATAL';
  dataOcorrencia: string;
  descricao: string;
  status: 'ABERTO' | 'EM_INVESTIGACAO' | 'ACAO_CORRETIVA' | 'FECHADO';
  localOcorrencia?: string;
}

interface Project {
  id: string;
  codigoObra: string;
  designacao: string;
  status: string;
}

const aqsDocuments = [
  { code: 'AQS.025', title: 'Controle de Indução', icon: 'fa-user-check', color: 'bg-emerald-500' },
  { code: 'AQS.026', title: 'Planificação Trabalho', icon: 'fa-map-location-dot', color: 'bg-blue-500' },
  { code: 'AQS.027', title: 'Análise Segurança', icon: 'fa-magnifying-glass-chart', color: 'bg-amber-500' },
  { code: 'AQS.028', title: 'Notificação Acidentes', icon: 'fa-house-fire', color: 'bg-red-500' },
  { code: 'AQS.030', title: 'Trabalho em Altura', icon: 'fa-ladder-water', color: 'bg-sky-500' },
  { code: 'AQS.032', title: 'Manuseamento Perigoso', icon: 'fa-biohazard', color: 'bg-orange-500' },
  { code: 'AQS.037', title: 'Checklist EPI', icon: 'fa-vest', color: 'bg-emerald-600' },
  { code: 'AQS.038', title: 'Aprovação Materiais', icon: 'fa-vial-circle-check', color: 'bg-purple-500' },
  { code: 'AQS.057', title: 'Inspeção Diária', icon: 'fa-calendar-check', color: 'bg-slate-700' },
  { code: 'SMS', title: 'Safety Statement (SMS)', icon: 'fa-file-shield', color: 'bg-indigo-600' }
];

const SSTModule: React.FC = () => {
  const [showReportModal, setShowReportModal] = useState<boolean>(false);
  const [showSSTFlow, setShowSSTFlow] = useState<boolean>(false);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    tipo: 'NC',
    severidade: 'LEVE',
    descricao: '',
    localOcorrencia: ''
  });

  // Load incidents and projects from API
  useEffect(() => {
    const loadData = async () => {
      try {
        const [incidentsData, projectsData] = await Promise.all([
          api.sst.incidents.list(),
          api.projects.list()
        ]);
        setIncidents(incidentsData);
        setProjects(projectsData);
      } catch (error) {
        console.error('Error loading SST data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();

    // Real-time updates
    const unsubCreate = syncService.on('incident:created', (incident) => {
      setIncidents(prev => [incident, ...prev]);
    });
    const unsubUpdate = syncService.on('incident:updated', (incident) => {
      setIncidents(prev => prev.map(i => i.id === incident.id ? incident : i));
    });

    return () => {
      unsubCreate();
      unsubUpdate();
    };
  }, []);

  const handleReport = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.sst.incidents.create({
        ...formData,
        dataOcorrencia: new Date().toISOString()
      });
      setShowReportModal(false);
      setFormData({ tipo: 'NC', severidade: 'LEVE', descricao: '', localOcorrencia: '' });
    } catch (error) {
      console.error('Error creating incident:', error);
      alert('Erro ao submeter registo de SST');
    }
  };

  const getSeverityStyle = (severity: string) => {
    switch (severity) {
      case 'FATAL':
      case 'GRAVE': return 'bg-red-500 text-white';
      case 'MODERADO': return 'bg-amber-500 text-white';
      default: return 'bg-slate-200 text-slate-600';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'ABERTO': return 'Aberto';
      case 'EM_INVESTIGACAO': return 'Em Análise';
      case 'ACAO_CORRETIVA': return 'Ação Corretiva';
      case 'FECHADO': return 'Fechado';
      default: return status;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'NC': return 'Não Conformidade';
      case 'INCIDENTE': return 'Incidente';
      case 'ACIDENTE': return 'Acidente';
      case 'CONDICAO_INSEGURA': return 'Condição Insegura';
      default: return type;
    }
  };

  const sstForms = [
    { id: 'APR', title: 'APR - Riscos', icon: 'fa-triangle-exclamation', color: 'bg-amber-500' },
    { id: 'PT', title: 'Permissão de Trabalho', icon: 'fa-file-shield', color: 'bg-red-600' },
    { id: 'EPI', title: 'Checklist EPI', icon: 'fa-vest', color: 'bg-emerald-600' },
    { id: 'LOTO', title: 'Bloqueio LOTO', icon: 'fa-lock', color: 'bg-slate-800' }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-slate-400 text-sm">A carregar dados de SST...</p>
        </div>
      </div>
    );
  }

  return (
  <>
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Qualidade, Segurança e Saúde (SGI)</h2>
          <p className="text-slate-500 text-sm font-medium italic">Controlo ISO 9001 e ISO 45001 • Gestão Documental Normativa.</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <button 
            onClick={() => { setFormData({...formData, tipo: 'NC'}); setShowReportModal(true); }}
            className="flex-1 sm:flex-none bg-slate-100 text-slate-900 border border-slate-200 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white shadow-sm transition-all flex items-center justify-center"
          >
            <i className="fas fa-clipboard-check mr-2 text-slate-400"></i> Reportar NC
          </button>
          <button 
            onClick={() => { setFormData({...formData, tipo: 'INCIDENTE'}); setShowReportModal(true); }}
            className="flex-1 sm:flex-none bg-red-600 text-white px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-700 shadow-lg shadow-red-100 transition-all flex items-center justify-center"
          >
            <i className="fas fa-biohazard mr-2"></i> Reportar Incidente
          </button>
        </div>
      </div>

      {/* Top Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Dias sem Acidentes</p>
          <div className="flex items-center gap-3">
             <h4 className="text-2xl font-bold text-emerald-600">428</h4>
             <span className="text-[9px] font-black bg-emerald-50 text-emerald-500 px-2 py-0.5 rounded-lg border border-emerald-100">RECORDE</span>
          </div>
        </div>
        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">NCs Pendentes</p>
          <h4 className="text-2xl font-bold text-amber-600">{incidents.filter(i => i.status !== 'FECHADO').length}</h4>
        </div>
        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Auditorias Mês</p>
          <h4 className="text-2xl font-bold text-slate-800">12</h4>
        </div>
        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Conformidade ISO</p>
          <h4 className="text-2xl font-bold text-blue-600">98.2%</h4>
        </div>
      </div>

      {/* Digital Form Hub - Requested By User */}
      <div className="bg-white border border-slate-200 rounded-[2rem] shadow-sm overflow-hidden flex flex-col">
        <div className="p-8 border-b border-slate-100 bg-slate-50/30 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 bg-slate-900 rounded-2xl flex items-center justify-center text-emerald-400 text-xl shadow-xl shadow-slate-200">
              <i className="fas fa-folder-tree"></i>
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 tracking-tight">Hub de Formulários Digitais</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Associação de Documentação AQS por Obra</p>
            </div>
          </div>

          <div className="w-full md:w-auto">
             <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 block ml-1">Selecionar Obra para Registro</label>
             <select 
               className="w-full md:w-80 bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 focus:outline-none focus:border-emerald-500 shadow-sm transition-all"
               value={selectedProject?.id || ''}
               onChange={(e) => setSelectedProject(projects.find(p => p.id === e.target.value) || null)}
             >
               <option value="">-- Selecione uma Obra / Projeto --</option>
               {projects.map(p => (
                 <option key={p.id} value={p.id}>
                   {p.codigoObra} - {p.designacao}
                 </option>
               ))}
             </select>
          </div>
        </div>

        <div className="p-8">
          {!selectedProject ? (
            <div className="py-20 text-center border-2 border-dashed border-slate-100 rounded-3xl">
              <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-slate-200">
                <i className="fas fa-hand-pointer text-3xl"></i>
              </div>
              <p className="text-slate-400 font-bold uppercase text-[11px] tracking-widest">Nenhuma Obra Selecionada</p>
              <p className="text-slate-300 text-xs mt-1 italic">Selecione uma obra acima para associar os formulários AQS.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
               {aqsDocuments.map((doc) => (
                 <button 
                   key={doc.code}
                   onClick={() => setShowSSTFlow(true)}
                   className="flex flex-col items-center p-6 bg-slate-50/50 border border-slate-100 rounded-3xl hover:bg-white hover:border-emerald-500 hover:shadow-xl transition-all group relative border-b-4 hover:border-b-emerald-500"
                 >
                   <div className={`w-12 h-12 ${doc.color} text-white rounded-2xl flex items-center justify-center text-xl mb-4 shadow-lg group-hover:scale-110 transition-transform duration-500`}>
                     <i className={`fas ${doc.icon}`}></i>
                   </div>
                   <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.1em] mb-1">{doc.code}</p>
                   <span className="text-[10px] font-bold text-slate-800 uppercase tracking-tight text-center leading-tight group-hover:text-emerald-600 transition-colors">
                     {doc.title}
                   </span>
                   <div className="mt-4 w-full h-1 bg-slate-200 rounded-full overflow-hidden">
                      <div className="w-1/3 h-full bg-slate-300"></div>
                   </div>
                   <div className="absolute top-4 right-4 text-[8px] font-black text-slate-300 uppercase italic">OBRA: {selectedProject.codigoObra}</div>
                 </button>
               ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
            <div className="flex justify-between items-center mb-8">
              <h3 className="font-black text-slate-800 uppercase text-xs tracking-widest flex items-center">
                <i className="fas fa-list-check mr-3 text-red-500"></i> Gestão de Ocorrências e NCs
              </h3>
              <div className="flex items-center gap-3">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest border-r pr-3 border-slate-200">Filtro Rápido</span>
                <button className="text-[9px] font-black text-emerald-600 uppercase hover:underline">Todos os Registros</button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 gap-4">
              {incidents.length === 0 ? (
                <div className="py-20 text-center bg-slate-50 border border-dashed border-slate-200 rounded-3xl">
                  <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 text-emerald-100 shadow-sm">
                    <i className="fas fa-shield-check text-3xl"></i>
                  </div>
                  <p className="text-slate-400 font-bold uppercase text-[11px] tracking-widest italic">Conformidade Total Verificada</p>
                  <p className="text-slate-300 text-[10px] mt-1">Nenhuma ocorrência reportada no período selecionado.</p>
                </div>
              ) : incidents.map((inc) => (
                <div key={inc.id} className={`p-6 border rounded-[1.8rem] transition-all hover:shadow-lg group flex flex-col md:flex-row gap-6 ${
                  inc.tipo === 'NC' ? 'bg-slate-50/30 border-slate-100' : 'bg-red-50/20 border-red-100'
                }`}>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <span className={`text-[8px] font-black uppercase px-3 py-1 rounded-lg border shadow-sm ${getSeverityStyle(inc.severidade)}`}>
                        {inc.severidade}
                      </span>
                      <span className="text-[10px] font-black text-slate-300 tracking-widest uppercase">ID: {inc.id.slice(-6).toUpperCase()}</span>
                    </div>
                    <h4 className="text-sm font-bold text-slate-800 mb-2 font-display flex items-center">
                      {getTypeLabel(inc.tipo)}
                      <span className="mx-2 w-1 h-1 bg-slate-300 rounded-full"></span>
                      <span className="text-slate-400 font-medium text-[11px]">{new Date(inc.dataOcorrencia).toLocaleDateString()}</span>
                    </h4>
                    <p className="text-[11px] text-slate-600 leading-relaxed font-medium bg-white/50 p-4 rounded-xl border border-slate-100/50 shadow-inner">
                      "{inc.descricao}"
                    </p>
                    {inc.localOcorrencia && (
                      <div className="mt-4 flex items-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        <div className="w-6 h-6 bg-slate-100 rounded-lg flex items-center justify-center mr-2 text-slate-400">
                          <i className="fas fa-location-dot"></i>
                        </div>
                        {inc.localOcorrencia}
                      </div>
                    )}
                  </div>
                  
                  <div className="md:w-48 flex flex-col justify-between py-1">
                    <div className="bg-white border border-slate-100 rounded-xl p-3 shadow-sm text-center">
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Estado Atual</p>
                      <span className={`text-[9px] font-black uppercase inline-block w-full py-1.5 rounded-lg border ${
                        inc.status === 'FECHADO' 
                        ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                        : 'bg-amber-50 text-amber-600 border-amber-100'
                      }`}>
                        {getStatusLabel(inc.status)}
                      </span>
                    </div>
                    <div className="mt-4 flex flex-col gap-2">
                       <button className="w-full py-2.5 bg-slate-900 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all active:scale-95 shadow-lg shadow-slate-200">
                         Plano de Ação
                       </button>
                       <button className="w-full py-2.5 bg-white border border-slate-200 text-slate-400 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all">
                         Resolver
                       </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-slate-900 p-8 rounded-[2rem] text-white relative overflow-hidden group shadow-2xl shadow-slate-200">
            <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/10 rounded-full -mr-24 -mt-24 blur-3xl group-hover:bg-emerald-500/20 transition-all duration-1000"></div>
            <div className="relative z-10 flex items-center gap-4 mb-8">
               <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center text-xl shadow-xl shadow-emerald-500/20">
                 <i className="fas fa-chart-line"></i>
               </div>
               <div>
                 <h3 className="text-sm font-black uppercase tracking-[0.2em] text-emerald-400">KPI Segurança</h3>
                 <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Dashboard Mensal</p>
               </div>
            </div>
            <div className="space-y-4">
              <div className="p-5 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-sm group-hover:border-white/20 transition-all">
                <p className="text-[10px] text-slate-400 font-bold uppercase mb-2">Acidentes Registrados</p>
                <div className="flex items-end justify-between">
                   <p className="text-3xl font-black text-emerald-400">0</p>
                   <p className="text-[9px] font-bold text-emerald-400/50 uppercase italic tracking-widest">META ATINGIDA</p>
                </div>
              </div>
              <div className="p-5 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-sm group-hover:border-white/20 transition-all text-amber-500/80">
                <p className="text-[10px] text-slate-400 font-bold uppercase mb-2">Alertas de Auditoria</p>
                <div className="flex items-end justify-between">
                   <p className="text-3xl font-black text-amber-400">2</p>
                   <p className="text-[9px] font-bold text-amber-400/50 uppercase italic tracking-widest">REVISÃO PENDENTE</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden group">
            <div className="flex items-center justify-between mb-6">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Repositório ISO</h4>
              <i className="fas fa-shield-alt text-blue-500 group-hover:rotate-12 transition-transform duration-500"></i>
            </div>
            <div className="space-y-3">
              {[
                { name: 'Manual Qualidade v3', date: '2024-JAN' },
                { name: 'Plano Emergência (Oficina)', date: '2024-FEV' },
                { name: 'Mapa de Riscos (SGIS)', date: '2023-OUT' }
              ].map(doc => (
                <div key={doc.name} className="flex items-center justify-between p-4 bg-slate-50/50 border border-slate-100 rounded-2xl cursor-pointer hover:bg-white hover:border-blue-500 hover:shadow-md transition-all group/item">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center text-blue-500 text-xs shadow-sm">
                      <i className="fas fa-file-pdf"></i>
                    </div>
                    <div>
                      <p className="text-[11px] font-bold text-slate-700 tracking-tight">{doc.name}</p>
                      <p className="text-[8px] text-slate-400 font-black uppercase tracking-widest">{doc.date}</p>
                    </div>
                  </div>
                  <i className="fas fa-arrow-down-to-bracket text-[10px] text-slate-300 group-hover/item:text-blue-500 transition-colors"></i>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>

    {showSSTFlow && (
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[200] flex items-center justify-center p-4 overflow-y-auto">
        <SSTFormsPreOS osId={selectedProject?.codigoObra || "SST-EXTERNO"} onComplete={() => setShowSSTFlow(false)} />
      </div>
    )}

    {showReportModal && (
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[200] grid place-items-center p-4 overflow-y-auto">
        <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in duration-300 my-auto">
          <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/20 relative">
            <div>
              <h3 className="font-bold text-slate-900 tracking-tight text-xl font-display">
                {formData.tipo === 'NC' ? 'Reportar NC' : 'Reportar Incidente'}
              </h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1 italic">ISO 45001 • SEGURANÇA NO TRABALHO</p>
            </div>
            <button 
              onClick={() => setShowReportModal(false)} 
              className="absolute right-8 top-1/2 -translate-y-1/2 w-10 h-10 bg-slate-100 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full flex items-center justify-center transition-all"
            >
              <i className="fas fa-times text-sm"></i>
            </button>
          </div>
          <form onSubmit={handleReport} className="p-8 space-y-6">
            <div className="grid grid-cols-2 gap-5">
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tipo de Registro</label>
                <div className="relative">
                  <select 
                    value={formData.tipo}
                    onChange={(e) => setFormData({...formData, tipo: e.target.value})}
                    className="w-full bg-slate-50/50 border border-slate-200 rounded-2xl px-5 py-4 text-xs font-bold focus:outline-none focus:border-slate-900 transition-all appearance-none text-slate-900 shadow-sm"
                  >
                    <option value="NC">N.C. (Qualidade)</option>
                    <option value="INCIDENTE">Incidente (SST)</option>
                    <option value="ACIDENTE">Acidente (SST)</option>
                    <option value="CONDICAO_INSEGURA">Condição Insegura</option>
                  </select>
                  <i className="fas fa-chevron-down absolute right-5 top-1/2 -translate-y-1/2 text-slate-300 text-[10px] pointer-events-none"></i>
                </div>
              </div>
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Severidade (ISO)</label>
                <div className="relative">
                  <select 
                    value={formData.severidade}
                    onChange={(e) => setFormData({...formData, severidade: e.target.value})}
                    className="w-full bg-slate-50/50 border border-slate-200 rounded-2xl px-5 py-4 text-xs font-bold focus:outline-none focus:border-slate-900 transition-all appearance-none text-slate-900 shadow-sm"
                  >
                    <option value="LEVE">Leve</option>
                    <option value="MODERADO">Moderada</option>
                    <option value="GRAVE">Grave / Crítica</option>
                    <option value="FATAL">Emergência / Fatal</option>
                  </select>
                  <i className="fas fa-chevron-down absolute right-5 top-1/2 -translate-y-1/2 text-slate-300 text-[10px] pointer-events-none"></i>
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Local da Ocorrência</label>
              <div className="relative">
                <i className="fas fa-location-arrow absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 text-xs"></i>
                <input 
                  type="text" 
                  value={formData.localOcorrencia}
                  onChange={(e) => setFormData({...formData, localOcorrencia: e.target.value})}
                  className="w-full bg-slate-50/50 border border-slate-200 rounded-2xl pl-12 pr-5 py-4 text-xs font-bold focus:outline-none focus:border-slate-900 transition-all shadow-sm"
                  placeholder="Ex: Área de Produção, Estaleiro..."
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Relatórios / Descrição Detalhada</label>
              <textarea 
                required
                rows={4}
                value={formData.descricao}
                onChange={(e) => setFormData({...formData, descricao: e.target.value})}
                className="w-full bg-slate-50/50 border border-slate-200 rounded-2xl px-6 py-5 text-xs font-medium focus:outline-none focus:border-slate-900 transition-all resize-none shadow-sm placeholder:italic"
                placeholder="Descreva detalhadamente o ocorrido e causas imediatas..."
              />
            </div>

            <div className="pt-4 flex gap-4">
              <button 
                type="button"
                onClick={() => setShowReportModal(false)}
                className="flex-1 py-4 border border-slate-200 text-slate-400 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all"
              >
                Anular
              </button>
              <button 
                type="submit"
                className="flex-[2] py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-2xl shadow-slate-200 hover:bg-black transition-all active:scale-95"
              >
                Validar e Enviar
              </button>
            </div>
          </form>
        </div>
      </div>
    )}
  </>
  );
};

export default SSTModule;
