import React, { useState, useEffect } from 'react';
import { FaIcon } from './common/FaIcon';
import { api } from '../../connectors/api/client';
import { syncService } from '../../connectors/api/sync';

interface TeamMember {
  id: string;
  user: { id: string; name: string; avatar?: string };
}

interface Team {
  id: string;
  nome: string;
  leader?: { id: string; name: string; avatar?: string };
  members: TeamMember[];
  statusDisponibilidade: 'DISPONIVEL' | 'PARCIALMENTE' | 'INDISPONIVEL';
  especialidadePrincipal?: string;
  _count?: { workOrders: number };
}

const TeamsModule: React.FC = () => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTeam, setNewTeam] = useState({
    statusDisponibilidade: 'DISPONIVEL' as const
  });

  // Modal States
  const [showDailyReportModal, setShowDailyReportModal] = useState(false);
  const [showManageMembersModal, setShowManageMembersModal] = useState(false);
  const [activeTeam, setActiveTeam] = useState<Team | null>(null);
  const [workOrders, setWorkOrders] = useState<any[]>([]);
  const [reportData, setReportData] = useState({
    workOrderId: '',
    hours: 8,
    descricao: ''
  });

  // Load teams from API
  useEffect(() => {
    const loadData = async () => {
      try {
        const [teamsData, usersData] = await Promise.all([
          api.teams.list(),
          api.users.list(),
        ]);
        setTeams(teamsData);
        setUsers(usersData);
      } catch (error) {
        console.error('Error loading teams:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();

    // Load common work orders for reports
    api.workOrders.list().then(setWorkOrders).catch(console.error);

    // Real-time updates
    const unsubCreate = syncService.on('team:created', (team) => {
      setTeams(prev => [...prev, team]);
    });
    const unsubUpdate = syncService.on('team:updated', (team) => {
      setTeams(prev => prev.map(t => t.id === team.id ? team : t));
    });
    const unsubDelete = syncService.on('team:deleted', ({ id }) => {
      setTeams(prev => prev.filter(t => t.id !== id));
    });

    return () => {
      unsubCreate();
      unsubUpdate();
      unsubDelete();
    };
  }, []);

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.teams.create({
        nome: newTeam.nome,
        leaderId: newTeam.leaderId || undefined,
        especialidadePrincipal: newTeam.especialidadePrincipal,
        statusDisponibilidade: newTeam.statusDisponibilidade,
      });
      setShowAddModal(false);
      setNewTeam({ nome: '', leaderId: '', especialidadePrincipal: 'GERAL', statusDisponibilidade: 'DISPONIVEL' });
    } catch (error) {
      console.error('Error creating team:', error);
      alert('Erro ao criar equipa');
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'DISPONIVEL': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case 'PARCIALMENTE': return 'bg-amber-50 text-amber-600 border-amber-100';
      case 'INDISPONIVEL': return 'bg-red-50 text-red-600 border-red-100';
      default: return 'bg-slate-100 text-slate-500 border-slate-200';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'DISPONIVEL': return 'Disponível';
      case 'PARCIALMENTE': return 'Parcial';
      case 'INDISPONIVEL': return 'Em Obra';
      default: return status;
    }
  };

  const getSpecialtyLabel = (specialty?: string) => {
    const map: Record<string, string> = {
      'SERRALHARIA': 'Serralharia',
      'ELETRICIDADE': 'Eletricidade',
      'MECANICA': 'Mecânica',
      'SOLDADURA': 'Soldadura',
      'PINTURA': 'Pintura',
      'GERAL': 'Geral',
    };
    return map[specialty || 'GERAL'] || specialty;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-8 h-8 border-[3px] border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-slate-500 text-sm">A carregar equipas…</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6 stagger">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 tracking-tight">Gestão de Equipas</h1>
            <p className="text-slate-500 text-sm mt-1">Alocação de capital humano e especialidades técnicas.</p>
          </div>
          <button 
            onClick={() => setShowAddModal(true)}
            className="bg-slate-900 text-white px-5 py-3 rounded-xl text-2xs font-black uppercase tracking-widest hover:bg-slate-800 shadow-xl shadow-slate-200 active:scale-95 transition"
          >
            <FaIcon name="fa-users-viewfinder" className="mr-2 text-emerald-400" /> Criar Nova Equipa
          </button>
        </div>

      {teams.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center">
          <FaIcon name="fa-users" className="text-slate-200 text-5xl mb-4" />
          <h3 className="text-lg font-bold text-slate-400">Nenhuma equipa criada</h3>
          <p className="text-sm text-slate-400 mt-2">Clique em "Criar Nova Equipa" para começar.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {teams.map(team => (
            <div key={team.id} className="bg-white border border-slate-100 rounded-panel overflow-hidden shadow-card hover:shadow-raised transition duration-500 group">
              <div className="p-5 sm:p-6 lg:p-8 bg-slate-50/50 border-b border-slate-100 flex justify-between items-start">
                <div>
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="text-3xs font-black text-slate-400 uppercase tracking-widest bg-slate-100 px-2 py-0.5 rounded-md">Equipa</span>
                    <span className={`px-2 py-0.5 rounded-md text-3xs font-black uppercase border ${getStatusStyle(team.statusDisponibilidade)}`}>
                      {getStatusLabel(team.statusDisponibilidade)}
                    </span>
                  </div>
                  <h3 className="text-xl font-black text-slate-900 tracking-tight font-display">{team.nome}</h3>
                  <div className="flex items-center mt-2 space-x-3 text-2xs font-bold text-slate-500">
                    <span className="flex items-center">
                      <FaIcon name="fa-crown" className="text-amber-400 mr-1.5" /> {team.leader?.name || 'Sem líder'}
                    </span>
                    {team.especialidadePrincipal && (
                      <span className="flex items-center text-emerald-600">
                        <FaIcon name="fa-microchip" className="mr-1.5 opacity-60" /> {getSpecialtyLabel(team.especialidadePrincipal)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="p-5 sm:p-6 lg:p-8 space-y-6">
                {team._count && team._count.workOrders > 0 && (
                  <div className="flex items-center p-4 bg-emerald-500/5 rounded-2xl border border-emerald-500/10 mb-2">
                    <div className="w-8 h-8 bg-white rounded-xl flex items-center justify-center text-emerald-500 shadow-card mr-4">
                      <FaIcon name="fa-clipboard-check" className="text-xs" />
                    </div>
                    <div>
                      <p className="text-3xs font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Ordens Ativas</p>
                      <p className="text-xs font-bold text-slate-700">{team._count.workOrders} Projetos em curso</p>
                    </div>
                  </div>
                )}
                <div className="space-y-4">
                  <p className="text-3xs font-black text-slate-400 uppercase tracking-widest ml-1">Membros Ativos ({team.members?.length || 0})</p>
                  <div className="grid grid-cols-1 gap-2">
                    {team.members && team.members.length > 0 ? team.members.map(m => (
                      <div key={m.id} className="flex items-center justify-between p-3.5 bg-slate-50/50 hover:bg-slate-50 rounded-2xl border border-slate-100/50 transition-colors">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 rounded-xl bg-white shadow-card flex items-center justify-center text-2xs font-black text-slate-500 border border-slate-100 uppercase font-display">
                            {m.user?.avatar || m.user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2) || '?'}
                          </div>
                          <div>
                            <p className="text-2xs font-bold text-slate-700">{m.user?.name || 'Colaborador'}</p>
                            <p className="text-3xs font-medium text-slate-400">Técnico Operacional</p>
                          </div>
                        </div>
                        <FaIcon name="fa-circle-check" className="text-emerald-400 text-2xs opacity-20" />
                      </div>
                    )) : (
                      <div className="py-8 text-center border-2 border-dashed border-slate-100 rounded-panel bg-slate-50/20">
                        <FaIcon name="fa-user-plus" className="text-slate-200 text-xl mb-2 block" />
                        <p className="text-2xs text-slate-400 font-bold uppercase tracking-widest">Nenhum membro alocado</p>
                      </div>
                    )}
                  </div>
                </div>
                <div className="pt-4 flex gap-3">
                  <button 
                    onClick={() => {
                      setActiveTeam(team);
                      setShowDailyReportModal(true);
                    }}
                    className="flex-1 py-3.5 bg-slate-900 text-white rounded-2xl text-2xs font-black uppercase tracking-widest hover:bg-black transition shadow-xl shadow-slate-200 flex items-center justify-center active:scale-95"
                  >
                    <FaIcon name="fa-file-invoice" className="mr-2 text-emerald-400" /> Diário
                  </button>
                  <button 
                    onClick={() => {
                      setActiveTeam(team);
                      setShowManageMembersModal(true);
                    }}
                    className="flex-1 py-3.5 bg-white border border-slate-200 text-slate-600 rounded-2xl text-2xs font-black uppercase tracking-widest hover:bg-slate-50 transition flex items-center justify-center active:scale-95"
                  >
                    <FaIcon name="fa-user-gear" className="mr-2 text-slate-400" /> Membros
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      </div>

      {/* Modal: Relatório Diário */}
      {showDailyReportModal && activeTeam && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[200] grid place-items-center p-4 overflow-y-auto">
          <div className="bg-white rounded-panel shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in duration-300 my-auto">
            <div className="p-6 sm:p-8 lg:p-10 border-b border-slate-50 relative bg-slate-50/20 text-center">
              <button aria-label="Fechar" onClick={() => setShowDailyReportModal(false)} className="absolute right-8 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-900 transition-colors">
                <FaIcon name="fa-times" className="text-sm" />
              </button>
              <h3 className="font-bold text-slate-900 tracking-tight text-xl font-display">Relatório Diário</h3>
              <p className="text-2xs text-slate-400 font-bold uppercase tracking-widest mt-1">Registo de Atividade: {activeTeam.nome}</p>
            </div>
            
            <form className="p-6 sm:p-8 lg:p-10 space-y-6" onSubmit={async (e) => {
              e.preventDefault();
              setLoading(true);
              try {
                // Bulk create timesheets for all members
                const entries = activeTeam.members.map(m => api.timesheets.create({
                  userId: m.user.id,
                  workOrderId: reportData.workOrderId,
                  dataReferencia: new Date().toISOString().split('T')[0],
                  horaInicio: new Date(new Date().setHours(8, 0, 0)).toISOString(),
                  horaFim: new Date(new Date().setHours(8 + Number(reportData.hours), 0, 0)).toISOString(),
                  horasTotais: reportData.hours,
                  descricaoAtividades: reportData.descricao
                }));
                await Promise.all(entries);
                setShowDailyReportModal(false);
                setReportData({ workOrderId: '', hours: 8, descricao: '' });
                alert('Relatório diário submetido com sucesso!');
              } catch (error) {
                console.error('Error submitting daily report:', error);
                alert('Erro ao submeter relatório');
              } finally {
                setLoading(false);
              }
            }}>
              <div className="space-y-2">
                <label htmlFor="teamsmodule-ordem-de-servico-os" className="flex items-center text-2xs font-bold text-slate-400 uppercase tracking-widest ml-1">
                  <FaIcon name="fa-clipboard-list" className="mr-2 text-slate-300" /> Ordem de Serviço (OS)
                </label>
                <select id="teamsmodule-ordem-de-servico-os" 
                  required
                  value={reportData.workOrderId}
                  onChange={(e) => setReportData({...reportData, workOrderId: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-100 rounded-panel px-5 py-4 text-xs font-medium focus:outline-none focus:border-slate-900 transition appearance-none pr-10"
                >
                  <option value="">Selecionar OS…</option>
                  {workOrders.map(wo => (
                    <option key={wo.id} value={wo.id}>{wo.codigo} - {wo.descricao.slice(0, 30)}...</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label htmlFor="teamsmodule-horas-padrao-por-membro" className="flex items-center text-2xs font-bold text-slate-400 uppercase tracking-widest ml-1">
                  <FaIcon name="fa-clock" className="mr-2 text-slate-300" /> Horas Padrão (Por Membro)
                </label>
                <input id="teamsmodule-horas-padrao-por-membro" 
                  type="number"
                  step="0.5"
                  value={reportData.hours}
                  onChange={(e) => setReportData({...reportData, hours: Number(e.target.value)})}
                  className="w-full bg-slate-50 border border-slate-100 rounded-panel px-5 py-4 text-xs font-medium focus:outline-none"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="teamsmodule-descricao-dos-trabalhos" className="flex items-center text-2xs font-bold text-slate-400 uppercase tracking-widest ml-1">
                  <FaIcon name="fa-pen-nib" className="mr-2 text-slate-300" /> Descrição dos Trabalhos
                </label>
                <textarea id="teamsmodule-descricao-dos-trabalhos" 
                  required
                  value={reportData.descricao}
                  onChange={(e) => setReportData({...reportData, descricao: e.target.value})}
                  rows={3}
                  className="w-full bg-slate-50 border border-slate-100 rounded-panel px-5 py-4 text-xs font-medium focus:outline-none resize-none"
                  placeholder="Descreva o que foi realizado hoje…"
                />
              </div>

              <div className="pt-4 flex gap-4">
                <button type="button" onClick={() => setShowDailyReportModal(false)} className="flex-1 py-4 border border-slate-100 text-slate-400 rounded-2xl text-2xs font-black uppercase tracking-widest">Cancelar</button>
                <button type="submit" disabled={loading} className="flex-[2] h-11 bg-slate-900 text-white rounded-control text-2xs font-black uppercase tracking-widest shadow-xl flex items-center justify-center whitespace-nowrap">
                  {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : 'Submeter Relatório'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Gerir Membros */}
      {showManageMembersModal && activeTeam && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[200] grid place-items-center p-4 overflow-y-auto">
          <div className="bg-white rounded-panel shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in duration-300 my-auto">
            <div className="p-6 sm:p-8 lg:p-10 border-b border-slate-50 relative bg-slate-50/20 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-slate-900 tracking-tight text-xl font-display">Gerir Equipa</h3>
                <p className="text-2xs text-slate-400 font-bold uppercase tracking-widest mt-1">Alocação de Membros: {activeTeam.nome}</p>
              </div>
              <button aria-label="Fechar" onClick={() => setShowManageMembersModal(false)} className="text-slate-300 hover:text-slate-900 transition-colors">
                <FaIcon name="fa-times" className="text-sm" />
              </button>
            </div>

            <div className="p-6 sm:p-8 lg:p-10 grid grid-cols-1 md:grid-cols-2 gap-10">
              {/* Current Members */}
              <div className="space-y-4">
                <h4 className="text-2xs font-black text-slate-400 uppercase tracking-widest ml-1">Membros Atuais</h4>
                <div className="space-y-2 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                  {activeTeam.members?.map(m => (
                    <div key={m.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-100">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-xl bg-white shadow-card flex items-center justify-center text-2xs font-black text-slate-400 border border-slate-100 uppercase">
                          {m.user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </div>
                        <span className="text-xs font-bold text-slate-700">{m.user?.name}</span>
                      </div>
                      <button 
                        onClick={async () => {
                          try {
                            await api.teams.removeMember(activeTeam.id, m.user.id);
                            // sync handles the state update
                          } catch (e) { alert('Erro ao remover membro'); }
                        }}
                        className="text-red-300 hover:text-red-500 transition-colors p-2"
                      >
                        <FaIcon name="fa-user-minus" className="text-2xs" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Add Members */}
              <div className="space-y-4">
                <h4 className="text-2xs font-black text-slate-400 uppercase tracking-widest ml-1">Adicionar Colaborador</h4>
                <div className="space-y-2 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                  {users.filter(u => !activeTeam.members?.some(m => m.user.id === u.id)).map(u => (
                    <div key={u.id} className="flex items-center justify-between p-3 bg-white hover:bg-slate-50 rounded-2xl border border-slate-100 transition-colors">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center text-2xs font-black text-slate-300 border border-slate-100 uppercase">
                          {u.name?.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </div>
                        <span className="text-xs font-bold text-slate-600">{u.name}</span>
                      </div>
                      <button 
                        onClick={async () => {
                          try {
                            await api.teams.addMember(activeTeam.id, u.id);
                          } catch (e) { alert('Erro ao adicionar membro'); }
                        }}
                        className="text-emerald-400 hover:text-emerald-600 transition-colors p-2"
                      >
                        <FaIcon name="fa-user-plus" className="text-2xs" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-6 sm:p-8 lg:p-10 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button onClick={() => setShowManageMembersModal(false)} className="px-10 py-4 bg-slate-900 text-white rounded-2xl text-2xs font-black uppercase tracking-widest shadow-xl active:scale-95 transition">Concluir</button>
            </div>
          </div>
        </div>
      )}
      {/* Modal: Criar Nova Equipa */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[200] grid place-items-center p-4 overflow-y-auto">
          <div className="bg-white rounded-panel shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in duration-300 my-auto">
            <div className="p-6 sm:p-8 lg:p-10 border-b border-slate-50 relative bg-slate-50/20 text-center">
              <button aria-label="Fechar" 
                onClick={() => setShowAddModal(false)} 
                className="absolute right-8 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-900 transition-colors"
              >
                <FaIcon name="fa-times" className="text-sm" />
              </button>
              <h3 className="font-bold text-slate-900 tracking-tight text-xl font-display">Nova Equipa Operacional</h3>
              <p className="text-2xs text-slate-400 font-bold uppercase tracking-widest mt-1">Gestão de Recursos & Logística</p>
            </div>
            
            <form onSubmit={handleCreateTeam} className="p-6 sm:p-8 lg:p-10 space-y-6">
              <div className="space-y-2">
                <label htmlFor="teamsmodule-nome-da-equipa" className="flex items-center text-2xs font-bold text-slate-400 uppercase tracking-widest ml-1">
                  <FaIcon name="fa-tag" className="mr-2 text-slate-300" /> Nome da Equipa
                </label>
                <input id="teamsmodule-nome-da-equipa" 
                  required
                  type="text" 
                  value={newTeam.nome}
                  onChange={(e) => setNewTeam({...newTeam, nome: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-100 rounded-panel px-5 py-4 text-xs font-medium focus:outline-none focus:border-slate-900 transition font-display"
                  placeholder="Ex: Manutenção Mecânica - Bloco A"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label htmlFor="teamsmodule-lider-da-equipa" className="flex items-center text-2xs font-bold text-slate-400 uppercase tracking-widest ml-1">
                    <FaIcon name="fa-crown" className="mr-2 text-slate-300" /> Líder da Equipa
                  </label>
                  <div className="relative">
                    <select id="teamsmodule-lider-da-equipa" 
                      value={newTeam.leaderId}
                      onChange={(e) => setNewTeam({...newTeam, leaderId: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-100 rounded-panel px-5 py-4 text-xs font-medium focus:outline-none focus:border-slate-900 transition appearance-none pr-10 font-display"
                    >
                      <option value="">Não atribuído</option>
                      {users.map(u => (
                        <option key={u.id} value={u.id}>{u.name}</option>
                      ))}
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-300">
                      <FaIcon name="fa-chevron-down" className="text-2xs" />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="teamsmodule-especialidade" className="flex items-center text-2xs font-bold text-slate-400 uppercase tracking-widest ml-1">
                    <FaIcon name="fa-microchip" className="mr-2 text-slate-300" /> Especialidade
                  </label>
                  <div className="relative">
                    <select id="teamsmodule-especialidade" 
                      value={newTeam.especialidadePrincipal}
                      onChange={(e) => setNewTeam({...newTeam, especialidadePrincipal: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-100 rounded-panel px-5 py-4 text-xs font-medium focus:outline-none focus:border-slate-900 transition appearance-none pr-10 font-display"
                    >
                      <option value="GERAL">Geral</option>
                      <option value="SERRALHARIA">Serralharia</option>
                      <option value="ELETRICIDADE">Eletricidade</option>
                      <option value="MECANICA">Mecânica</option>
                      <option value="SOLDADURA">Soldadura</option>
                      <option value="PINTURA">Pintura</option>
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-300">
                      <FaIcon name="fa-chevron-down" className="text-2xs" />
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="p-5 bg-slate-900 rounded-panel flex items-start space-x-4 border border-white/5 shadow-xl">
                 <div className="w-10 h-10 bg-emerald-500/20 text-emerald-400 rounded-xl flex items-center justify-center shrink-0">
                    <FaIcon name="fa-info-circle" />
                 </div>
                 <p className="text-2xs text-slate-400 font-bold leading-relaxed uppercase tracking-widest mt-1">
                   A equipa será inicializada sem membros alocados. Poderá gerir o pessoal no painel de detalhes.
                 </p>
              </div>

              <div className="pt-4 flex gap-4">
                <button 
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-4 border border-slate-100 text-slate-400 rounded-2xl text-2xs font-black uppercase tracking-widest hover:bg-slate-50 transition font-display"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="flex-[2] px-4 h-11 bg-slate-900 text-white rounded-control text-2xs font-black uppercase tracking-widest shadow-2xl shadow-slate-200 hover:bg-black transition active:scale-[0.98] font-display inline-flex items-center justify-center whitespace-nowrap"
                >
                  Confirmar e Criar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default TeamsModule;
