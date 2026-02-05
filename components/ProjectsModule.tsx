import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { syncService } from '../api/sync';
import SSTFormsPreOS from './SSTFormsPreOS';

interface Project {
  id: string;
  codigoObra: string;
  designacao: string;
  client?: { name: string };
  percentualProgresso: number;
  status: string;
  tipoObra?: string;
}

const ProjectsModule: React.FC = () => {
  const [showModal, setShowModal] = useState(false);
  const [showSSTFlow, setShowSSTFlow] = useState(false);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSSTMinimized, setIsSSTMinimized] = useState(false);
  const [sstProgress, setSstProgress] = useState(65); // Mock progress for gamification

  const [formData, setFormData] = useState({
    designacao: '',
    clientId: '',
    type: 'Serralharia'
  });

  // Load projects from API
  useEffect(() => {
    const loadData = async () => {
      try {
        const [projectsData, clientsData] = await Promise.all([
          api.projects.list(),
          api.clients.list(),
        ]);
        setProjects(projectsData);
        setClients(clientsData);
      } catch (error) {
        console.error('Error loading projects:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();

    // Real-time updates
    const unsubCreate = syncService.on('project:created', (project) => {
      setProjects(prev => [project, ...prev]);
    });
    const unsubUpdate = syncService.on('project:updated', (project) => {
      setProjects(prev => prev.map(p => p.id === project.id ? project : p));
    });
    const unsubProgress = syncService.on('project:progress', ({ id, percentualProgresso }) => {
      setProjects(prev => prev.map(p => p.id === id ? { ...p, percentualProgresso } : p));
    });
    const unsubDelete = syncService.on('project:deleted', ({ id }) => {
      setProjects(prev => prev.filter(p => p.id !== id));
    });

    return () => {
      unsubCreate();
      unsubUpdate();
      unsubProgress();
      unsubDelete();
    };
  }, []);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.projects.create({
        designacao: formData.designacao,
        clientId: formData.clientId,
      });
      setShowModal(false);
      setFormData({ designacao: '', clientId: '', type: 'Serralharia' });
    } catch (error) {
      console.error('Error creating project:', error);
      alert('Erro ao criar projeto');
    }
  };

  const handleAction = async (id: string, action: string) => {
    setActiveProjectId(id);
    if (action === 'gerir-os') {
      setShowSSTFlow(true);
    } else if (action === 'edit') {
      const prog = prompt(`Atualizar progresso (0-100):`, "50");
      if (prog !== null) {
        const val = Math.min(100, Math.max(0, parseInt(prog) || 0));
        try {
          await api.projects.updateProgress(id, val);
        } catch (error) {
          console.error('Error updating progress:', error);
        }
      }
    } else if (action === 'docs') {
      alert(`Abrindo repositório documental para o projeto ${id}...`);
    }
  };

  // Map status to Portuguese display
  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'PLANEAMENTO': return 'Planeamento';
      case 'EM_EXECUCAO': return 'Execução';
      case 'CONCLUIDO': return 'Concluído';
      case 'SUSPENSO': return 'Suspenso';
      default: return status;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-slate-400 text-sm">A carregar projetos...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6 animate-in slide-in-from-bottom-2 duration-500">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Projetos & Obras</h2>
          <p className="text-slate-500 text-xs italic font-medium">Sincronizado com backend em tempo real.</p>
        </div>
        <div className="flex space-x-2">
          <button 
            onClick={() => alert("Gerando MS Project Sync...")}
            className="flex-1 sm:flex-none bg-white border border-slate-200 text-slate-600 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center hover:bg-slate-50 transition-colors"
          >
            <i className="fas fa-file-export lg:mr-2 text-blue-500"></i> <span className="hidden lg:inline">Exportar</span>
          </button>
          <button 
            onClick={() => setShowModal(true)}
            className="flex-[2] sm:flex-none bg-emerald-500 text-white px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 shadow-lg transition-all"
          >
            <i className="fas fa-plus mr-2"></i> Novo Projeto
          </button>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px] font-black tracking-wider">
              <tr>
                <th className="px-6 py-5">Projeto / Cliente</th>
                <th className="px-6 py-5 text-center">Progresso</th>
                <th className="px-6 py-5 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {projects.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-6 py-8 text-center text-slate-400">
                    <i className="fas fa-folder-open text-3xl mb-2"></i>
                    <p>Nenhum projeto encontrado</p>
                  </td>
                </tr>
              ) : (
                projects.map(p => (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-6">
                      <div className="flex items-center">
                        <div className={`w-2.5 h-2.5 rounded-full mr-4 shadow-sm ${
                          p.status === 'CONCLUIDO' ? 'bg-emerald-500 shadow-emerald-200' : 
                          p.status === 'EM_EXECUCAO' ? 'bg-blue-500 shadow-blue-200' : 
                          p.status === 'PLANEAMENTO' ? 'bg-amber-400 shadow-amber-100' : 'bg-slate-300'
                        }`}></div>
                        <div>
                          <p className="font-black text-slate-800 text-sm tracking-tight">{p.codigoObra} - {p.designacao}</p>
                          <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase flex items-center">
                            <i className="fas fa-building mr-1.5 opacity-60"></i> {p.client?.name || 'Sem cliente'} 
                            <span className="mx-2 opacity-30">•</span>
                            <span className={`px-1.5 py-0.5 rounded-md ${
                              p.status === 'CONCLUIDO' ? 'bg-emerald-50 text-emerald-600' : 
                              p.status === 'EM_EXECUCAO' ? 'bg-blue-50 text-blue-600' : 'bg-slate-50 text-slate-500'
                            }`}>
                              {getStatusDisplay(p.status)}
                            </span>
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-6">
                      <div className="flex items-center space-x-3 max-w-[200px] mx-auto">
                        <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden shadow-inner">
                          <div className={`h-full transition-all duration-1000 ${p.percentualProgresso === 100 ? 'bg-emerald-500' : 'bg-blue-500'}`} style={{ width: `${p.percentualProgresso}%` }}></div>
                        </div>
                        <span className="text-[11px] font-black text-slate-700 w-8 text-right">{p.percentualProgresso}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-6 text-right">
                      <div className="flex justify-end items-center gap-2">
                        <button 
                          onClick={() => handleAction(p.id, 'gerir-os')}
                          className="px-4 py-2 bg-slate-900 text-white text-[9px] font-black uppercase rounded-xl hover:bg-slate-800 transition-all shadow-md shadow-slate-100 active:scale-95"
                        >
                          Plano SST
                        </button>
                        <button 
                          onClick={() => handleAction(p.id, 'edit')}
                          className="w-9 h-9 flex items-center justify-center bg-white border border-slate-100 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 hover:border-emerald-100 rounded-xl transition-all"
                          title="Editar"
                        >
                          <i className="fas fa-edit text-xs"></i>
                        </button>
                        <button 
                          onClick={() => handleAction(p.id, 'docs')}
                          className="w-9 h-9 flex items-center justify-center bg-white border border-slate-100 text-slate-400 hover:text-blue-500 hover:bg-blue-50 hover:border-blue-100 rounded-xl transition-all"
                          title="Documentos"
                        >
                          <i className="fas fa-folder-open text-xs"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      </div>

      {/* Floating SST Reminder Widget (Gamified & Minimizable) */}
      <div className={`fixed bottom-8 right-8 z-[100] transition-all duration-500 transform ${isSSTMinimized ? 'translate-y-0' : 'translate-y-0'}`}>
        {isSSTMinimized ? (
          <button 
            onClick={() => setIsSSTMinimized(false)}
            className="w-14 h-14 bg-slate-900 border border-white/20 rounded-2xl flex items-center justify-center text-white shadow-2xl hover:scale-110 active:scale-95 transition-all animate-pulse relative"
          >
            <i className="fas fa-shield-heart text-emerald-400"></i>
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white animate-ping"></div>
          </button>
        ) : (
          <div className="bg-slate-900 text-white w-72 rounded-[2.5rem] shadow-2xl border border-white/10 overflow-hidden animate-in slide-in-from-right-4 duration-500">
            {/* Header / Gamification Badge */}
            <div className="p-6 pb-2 flex justify-between items-start">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-emerald-500/20 text-emerald-400 rounded-xl flex items-center justify-center border border-emerald-500/30">
                  <i className="fas fa-medal"></i>
                </div>
                <div>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Nível de Segurança</p>
                  <p className="text-xs font-black tracking-tight text-emerald-400">Bronze Expert <span className="text-slate-500 font-normal">Lvl 2</span></p>
                </div>
              </div>
              <button 
                onClick={() => setIsSSTMinimized(true)}
                className="text-slate-500 hover:text-white transition-colors p-1"
              >
                <i className="fas fa-minus text-[10px]"></i>
              </button>
            </div>

            {/* Content & Progress */}
            <div className="px-6 py-4 space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between items-end">
                  <p className="text-[10px] font-bold text-white uppercase tracking-wider">Onboarding Checklist</p>
                  <p className="text-[10px] font-black text-emerald-400">{sstProgress}%</p>
                </div>
                <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-1000 ease-out"
                    style={{ width: `${sstProgress}%` }}
                  ></div>
                </div>
              </div>

              <div className="bg-white/5 rounded-2xl p-3 border border-white/5">
                <p className="text-[9px] text-slate-400 font-medium leading-relaxed">
                  Faltam <span className="text-white font-bold">2 passos</span> para desbloquear o Certificado de Obra Segura.
                </p>
              </div>

              <button 
                onClick={() => setShowSSTFlow(true)}
                className="w-full py-3 bg-white text-slate-900 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all active:scale-95 flex items-center justify-center"
              >
                <i className="fas fa-rocket mr-2 text-emerald-500"></i> Concluir Agora
              </button>
            </div>
            
            {/* Decorative Pulse Line */}
            <div className="h-1 w-full bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent animate-pulse"></div>
          </div>
        )}
      </div>

      {showSSTFlow && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[200] grid place-items-center p-4 overflow-y-auto">
          <SSTFormsPreOS 
            osId={activeProjectId || 'OS-GERAL'} 
            onComplete={() => setShowSSTFlow(false)} 
            onCancel={() => setShowSSTFlow(false)}
          />
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[200] grid place-items-center p-4 overflow-y-auto">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in duration-300 my-auto">
            <div className="p-10 border-b border-slate-50 relative bg-slate-50/20 text-center">
              <button 
                onClick={() => setShowModal(false)} 
                className="absolute right-8 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-900 transition-colors"
              >
                <i className="fas fa-times text-sm"></i>
              </button>
              <h3 className="font-bold text-slate-900 tracking-tight text-xl font-display">Registar Novo Projeto</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Gestão de Obras & Engenharia Industrial</p>
            </div>

            <form onSubmit={handleCreateProject} className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="flex items-center text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                    <i className="fas fa-tag mr-2 text-slate-300"></i> Designação da Obra
                  </label>
                  <input 
                    required 
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-xs font-medium focus:outline-none focus:border-slate-900 transition-all font-display" 
                    placeholder="Ex: Central Termoelétrica - Fase 2" 
                    value={formData.designacao}
                    onChange={(e) => setFormData({...formData, designacao: e.target.value})}
                  />
                </div>
                <div className="space-y-1.5 font-display">
                  <label className="flex items-center text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                    <i className="fas fa-hard-hat mr-2 text-slate-300"></i> Tipo de Intervenção
                  </label>
                  <select 
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-xs font-medium focus:outline-none focus:border-slate-900 transition-all appearance-none"
                    value={formData.type}
                    onChange={(e) => setFormData({...formData, type: e.target.value})}
                  >
                    <option value="Serralharia">Serralharia Mecânica</option>
                    <option value="Tubagem">Tubagem Industrial</option>
                    <option value="Estruturas">Estruturas Metálicas</option>
                    <option value="Manutencao">Manutenção Preventiva</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="flex items-center text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                  <i className="fas fa-building mr-2 text-slate-300"></i> Cliente Associado
                </label>
                <div className="relative">
                  <select 
                    required
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-xs font-medium focus:outline-none focus:border-slate-900 transition-all appearance-none pr-10"
                    value={formData.clientId}
                    onChange={(e) => setFormData({...formData, clientId: e.target.value})}
                  >
                    <option value="">Selecionar cliente da base de dados...</option>
                    {clients.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                    <i className="fas fa-chevron-down text-[10px]"></i>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-slate-50 flex gap-4">
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)} 
                  className="flex-1 px-4 py-4 border border-slate-100 text-slate-400 rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:bg-slate-50 transition-all font-display"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="flex-[2] px-4 py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-bold uppercase tracking-widest shadow-xl shadow-slate-200 hover:bg-slate-800 transition-all active:scale-95 font-display"
                >
                  Confirmar e Iniciar Projeto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default ProjectsModule;
