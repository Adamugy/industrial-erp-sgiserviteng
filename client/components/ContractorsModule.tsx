import React, { useState, useEffect } from 'react';
import { api } from '../../connectors/api/client';
import { syncService } from '../../connectors/api/sync';

interface Contractor {
  id: string;
  nome: string;
  empresa: string;
  nif?: string;
  email?: string;
  telefone?: string;
  inducaoSST: boolean;
  dataInducao?: string;
  validadeInducao?: string;
  epiEntregue: boolean;
  epiLista?: string;
  status: 'ATIVO' | 'PENDENTE' | 'BLOQUEADO';
}

const ContractorsModule: React.FC = () => {
  const [contractors, setContractors] = useState<Contractor[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showInductionModal, setShowInductionModal] = useState(false);
  const [activeContractor, setActiveContractor] = useState<Contractor | null>(null);

  const [newContractor, setNewContractor] = useState({
    nome: '',
    empresa: '',
    nif: '',
    email: '',
    telefone: ''
  });

  // Load data
  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await api.contractors.list();
        setContractors(data);
      } catch (error) {
        console.error('Error loading contractors:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();

    // Real-time sync
    const unsubCreate = syncService.on('contractor:created', (c) => {
      setContractors(prev => [...prev, c]);
    });
    const unsubUpdate = syncService.on('contractor:updated', (c) => {
      setContractors(prev => prev.map(item => item.id === c.id ? c : item));
    });
    const unsubDelete = syncService.on('contractor:deleted', ({ id }) => {
      setContractors(prev => prev.filter(c => c.id !== id));
    });

    return () => {
      unsubCreate();
      unsubUpdate();
      unsubDelete();
    };
  }, []);

  const handleAddContractor = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.contractors.create(newContractor);
      setShowAddModal(false);
      setNewContractor({ nome: '', empresa: '', nif: '', email: '', telefone: '' });
    } catch (error) {
      console.error('Error:', error);
      alert('Erro ao registar sub-contratado');
    }
  };

  const handleUpdateInduction = async (id: string, induction: boolean) => {
    try {
      await api.contractors.updateInduction(id, {
        inducaoSST: induction,
        dataInducao: induction ? new Date().toISOString() : null,
        validadeInducao: induction ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString() : null
      });
      setShowInductionModal(false);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const toggleEPI = async (c: Contractor) => {
    try {
      await api.contractors.updateEPI(c.id, {
        epiEntregue: !c.epiEntregue,
        epiLista: !c.epiEntregue ? 'Capacete, Botas, Colete, Óculos' : ''
      });
    } catch (error) {
      console.error('Error:', error);
    }
  };

  if (loading) {
     return (
       <div className="flex items-center justify-center h-64">
         <div className="text-center">
           <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
           <p className="text-slate-400 text-sm">A carregar sub-contratados...</p>
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
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Gestão de Sub-contratados</h2>
          <p className="text-slate-500 text-sm font-medium italic">Controlo de acessos, segurança e conformidade SST.</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="bg-slate-900 text-white px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 shadow-lg active:scale-95 transition-all flex items-center"
        >
          <i className="fas fa-user-plus mr-2 text-emerald-400"></i> Novo Contratado
        </button>
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Registados</p>
          <h4 className="text-2xl font-bold text-slate-800">{contractors.length}</h4>
        </div>
        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm">
          <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-1">Ativos</p>
          <h4 className="text-2xl font-bold text-emerald-600">{contractors.filter(c => c.status === 'ATIVO').length}</h4>
        </div>
        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm">
          <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-1">Indução Pendente</p>
          <h4 className="text-2xl font-bold text-amber-600">{contractors.filter(c => !c.inducaoSST).length}</h4>
        </div>
        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm">
          <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-1">EPI em Falta</p>
          <h4 className="text-2xl font-bold text-blue-600">{contractors.filter(c => !c.epiEntregue).length}</h4>
        </div>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {contractors.length === 0 ? (
          <div className="col-span-full py-16 text-center bg-white border border-dashed border-slate-200 rounded-2xl">
            <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-slate-200">
              <i className="fas fa-users-slash text-3xl"></i>
            </div>
            <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Nenhum contratado registado</p>
            <p className="text-slate-300 text-xs mt-1">Clique em "Novo Contratado" para adicionar</p>
          </div>
        ) : contractors.map((c) => (
          <div key={c.id} className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm hover:shadow-lg hover:border-slate-200 transition-all group">
            {/* Card Header */}
            <div className="flex justify-between items-start mb-4">
              <div className="w-11 h-11 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 text-lg group-hover:bg-slate-900 group-hover:text-emerald-400 transition-all">
                <i className="fas fa-user-hard-hat"></i>
              </div>
              <span className={`text-[8px] font-black px-2 py-1 rounded-lg border uppercase ${
                c.status === 'ATIVO' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                c.status === 'PENDENTE' ? 'bg-amber-50 text-amber-600 border-amber-100' : 
                'bg-red-50 text-red-600 border-red-100'
              }`}>
                {c.status}
              </span>
            </div>

            {/* Card Body */}
            <div className="mb-4">
              <p className="text-[9px] font-black text-blue-500 uppercase tracking-widest mb-0.5">{c.empresa}</p>
              <h3 className="text-sm font-bold text-slate-800 truncate">{c.nome}</h3>
              {c.telefone && <p className="text-[10px] text-slate-400 mt-1"><i className="fas fa-phone mr-1"></i>{c.telefone}</p>}
            </div>
            
            {/* Status Badges */}
            <div className="space-y-2 mb-4">
              <div className="flex items-center justify-between p-2.5 bg-slate-50/80 rounded-xl">
                <div className="flex items-center gap-2">
                  <i className={`fas fa-shield-halved text-xs ${c.inducaoSST ? 'text-emerald-500' : 'text-slate-300'}`}></i>
                  <span className="text-[9px] font-bold text-slate-500 uppercase">Indução SST</span>
                </div>
                <button 
                  onClick={() => { setActiveContractor(c); setShowInductionModal(true); }}
                  className={`text-[8px] font-black px-2 py-0.5 rounded-md border transition-colors ${
                    c.inducaoSST ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-white text-slate-400 border-slate-200 hover:border-slate-400'
                  }`}
                >
                  {c.inducaoSST ? 'VÁLIDA' : 'PENDENTE'}
                </button>
              </div>

              <div className="flex items-center justify-between p-2.5 bg-slate-50/80 rounded-xl">
                <div className="flex items-center gap-2">
                  <i className={`fas fa-vest text-xs ${c.epiEntregue ? 'text-blue-500' : 'text-slate-300'}`}></i>
                  <span className="text-[9px] font-bold text-slate-500 uppercase">Kit EPI</span>
                </div>
                <button 
                  onClick={() => toggleEPI(c)}
                  className={`text-[8px] font-black px-2 py-0.5 rounded-md border transition-colors ${
                    c.epiEntregue ? 'bg-blue-500 text-white border-blue-500' : 'bg-white text-slate-400 border-slate-200 hover:border-slate-400'
                  }`}
                >
                  {c.epiEntregue ? 'ENTREGUE' : 'EM FALTA'}
                </button>
              </div>
            </div>

            {/* Card Actions */}
            <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-50">
              <button className="py-2 bg-slate-900 text-white rounded-lg text-[9px] font-black uppercase hover:bg-slate-800 transition-all active:scale-95">
                <i className="fas fa-id-card mr-1"></i> Ficha
              </button>
              <button className="py-2 bg-slate-50 text-slate-500 rounded-lg text-[9px] font-black uppercase hover:bg-slate-100 transition-colors">
                <i className="fas fa-clock-rotate-left mr-1"></i> Histórico
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>

    {showAddModal && (
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[200] grid place-items-center p-4 overflow-y-auto">
        <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in duration-300 my-auto flex flex-col">
          {/* Header */}
          <div className="p-8 border-b border-slate-100 bg-slate-50/30 text-center relative">
            <button 
              onClick={() => setShowAddModal(false)}
              className="absolute right-8 top-1/2 -translate-y-1/2 text-slate-400 hover:text-red-500 transition-colors w-10 h-10 flex items-center justify-center rounded-full hover:bg-red-50"
            >
              <i className="fas fa-times text-lg"></i>
            </button>
            <h3 className="font-bold text-slate-900 tracking-tight text-xl font-display">Novo Contratado</h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Segurança & Conformidade SST — SERVITENG</p>
          </div>

          {/* Form */}
          <form onSubmit={handleAddContractor}>
            <div className="p-8 space-y-5">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                  <i className="fas fa-user text-[8px]"></i> Nome do Trabalhador
                </label>
                <input 
                  required 
                  type="text" 
                  value={newContractor.nome} 
                  onChange={e => setNewContractor({...newContractor, nome: e.target.value})} 
                  className="w-full bg-slate-50 border-transparent focus:bg-white focus:border-blue-500 rounded-2xl px-5 py-4 text-sm transition-all outline-none shadow-sm shadow-slate-100/50" 
                  placeholder="Nome completo do colaborador" 
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                  <i className="fas fa-building text-[8px]"></i> Entidade Patronal
                </label>
                <input 
                  required 
                  type="text" 
                  value={newContractor.empresa} 
                  onChange={e => setNewContractor({...newContractor, empresa: e.target.value})} 
                  className="w-full bg-slate-50 border-transparent focus:bg-white focus:border-blue-500 rounded-2xl px-5 py-4 text-sm transition-all outline-none shadow-sm shadow-slate-100/50" 
                  placeholder="Empresa / Companhia" 
                />
              </div>

              <div className="grid grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                    <i className="fas fa-hashtag text-[8px]"></i> NIF
                  </label>
                  <input 
                    type="text" 
                    value={newContractor.nif} 
                    onChange={e => setNewContractor({...newContractor, nif: e.target.value})} 
                    className="w-full bg-slate-50 border-transparent focus:bg-white focus:border-blue-500 rounded-2xl px-5 py-4 text-sm transition-all outline-none shadow-sm shadow-slate-100/50" 
                    placeholder="Contribuinte" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                    <i className="fas fa-phone text-[8px]"></i> Contacto Direto
                  </label>
                  <input 
                    type="text" 
                    value={newContractor.telefone} 
                    onChange={e => setNewContractor({...newContractor, telefone: e.target.value})} 
                    className="w-full bg-slate-50 border-transparent focus:bg-white focus:border-blue-500 rounded-2xl px-5 py-4 text-sm transition-all outline-none shadow-sm shadow-slate-100/50" 
                    placeholder="+351 xxx xxx xxx" 
                  />
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-8 border-t border-slate-100 bg-slate-50/20 flex gap-4">
              <button 
                type="button" 
                onClick={() => setShowAddModal(false)} 
                className="flex-1 py-4 border border-slate-200 text-slate-400 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white transition-all hover:text-slate-600"
              >
                Cancelar
              </button>
              <button 
                type="submit"
                className="flex-[2] py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-slate-200 hover:bg-slate-800 transition-all active:scale-95"
              >
                Salvar Registo e Iniciar Processo
              </button>
            </div>
          </form>
        </div>
      </div>
    )}

    {showInductionModal && activeContractor && (
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[200] grid place-items-center p-4 overflow-y-auto">
        <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-4xl overflow-hidden animate-in zoom-in duration-300 my-auto flex flex-col">
          {/* Header */}
          <div className="p-8 border-b border-slate-100 bg-slate-50/30 text-center relative">
            <button 
              onClick={() => setShowInductionModal(false)}
              className="absolute right-8 top-1/2 -translate-y-1/2 text-slate-400 hover:text-red-500 transition-colors w-10 h-10 flex items-center justify-center rounded-full hover:bg-red-50"
            >
              <i className="fas fa-times text-lg"></i>
            </button>
            <h3 className="font-bold text-slate-900 tracking-tight text-xl font-display">Formação de Acolhimento SST</h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Registo de Indução de Segurança — SERVITENG</p>
          </div>
          
          {/* Form Content */}
          <div className="p-8 overflow-y-auto flex-1 custom-scrollbar max-h-[75vh]">
            {/* Introduction */}
            <div className="bg-amber-50 border border-amber-100 rounded-2xl p-6 mb-8 flex items-start gap-4 shadow-sm shadow-amber-100/50">
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-amber-500 shadow-sm shrink-0">
                <i className="fas fa-triangle-exclamation"></i>
              </div>
              <p className="text-[11px] text-amber-800 leading-relaxed font-medium">
                É política da Companhia que todo o visitante, contratado ou empregados do contratado que não estejam sempre debaixo da supervisão dum empregado da SERVITENG, tenham de fazer uma <strong>formação completa</strong> e assinarem que foram treinados antes de serem autorizados a iniciarem as actividades laborais.
              </p>
            </div>

            {/* Form Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Nome do Trabalhador</label>
                <input 
                  type="text" 
                  value={activeContractor.nome}
                  readOnly
                  className="w-full bg-slate-100 border-transparent rounded-2xl px-5 py-4 text-sm font-bold text-slate-700 shadow-inner"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Data da Formação</label>
                <input 
                  type="date" 
                  defaultValue={new Date().toISOString().split('T')[0]}
                  className="w-full bg-slate-50 border-transparent focus:bg-white focus:border-blue-500 rounded-2xl px-5 py-4 text-sm transition-all outline-none shadow-sm"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Companhia / Empresa</label>
                <input 
                  type="text" 
                  value={activeContractor.empresa}
                  readOnly
                  className="w-full bg-slate-100 border-transparent rounded-2xl px-5 py-4 text-sm font-bold text-slate-700 shadow-inner"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Nome do Instrutor</label>
                <input 
                  type="text" 
                  placeholder="Responsável pela formação"
                  className="w-full bg-slate-50 border-transparent focus:bg-white focus:border-blue-500 rounded-2xl px-5 py-4 text-sm transition-all outline-none shadow-sm"
                />
              </div>
            </div>

            {/* Section: Regras de Segurança */}
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-5 pb-3 border-b border-slate-100">
                <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center text-blue-500 text-xs">
                  <i className="fas fa-shield-halved"></i>
                </div>
                <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest">Regras de Segurança</h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[
                  { label: 'Regras de Segurança', status: 'lido/explicado' },
                  { label: 'Acordo de Sigilo', status: 'lido/assinado' }
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-4 bg-slate-50/50 border border-slate-100/50 rounded-2xl hover:bg-white hover:shadow-md transition-all group">
                    <div className="flex items-center gap-4">
                      <input type="checkbox" className="w-5 h-5 rounded-lg border-slate-300 text-emerald-500 focus:ring-emerald-500 transition-all cursor-pointer" />
                      <div>
                        <p className="text-[11px] font-bold text-slate-700">{item.label}</p>
                        <p className="text-[9px] text-slate-400 font-medium uppercase tracking-tight">{item.status}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Section: Orientações Oficinais */}
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-5 pb-3 border-b border-slate-100">
                <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center text-emerald-500 text-xs">
                  <i className="fas fa-building"></i>
                </div>
                <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest">Orientações Oficinais</h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {[
                  { label: 'Plano de Evacuação', status: 'visto/explicado' },
                  { label: 'Procedimentos Emergência', status: 'visto/explicado' },
                  { label: 'Comunicação Acidentes', status: 'explicado' },
                  { label: 'Primeiros Socorros', status: 'explicado' },
                  { label: 'Comunicação Perigo', status: 'explicado' },
                  { label: 'Pessoal e Instalações', status: 'indicado' },
                  { label: 'Áreas Restritas', status: 'explicado' },
                  { label: 'Maquinaria Isolada', status: 'explicado' }
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-4 p-4 bg-slate-50/50 border border-slate-100/50 rounded-2xl hover:bg-white hover:shadow-md transition-all">
                    <input type="checkbox" className="w-5 h-5 rounded-lg border-slate-300 text-emerald-500 focus:ring-emerald-500 transition-all cursor-pointer" />
                    <div>
                      <p className="text-[10px] font-bold text-slate-700 leading-tight">{item.label}</p>
                      <p className="text-[8px] text-slate-400 font-medium uppercase tracking-tighter">{item.status}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Section: Maquinaria */}
            <div className="mb-10">
              <div className="flex items-center gap-3 mb-5 pb-3 border-b border-slate-100">
                <div className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center text-amber-500 text-xs">
                  <i className="fas fa-gears"></i>
                </div>
                <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest">Maquinaria do Contratado</h4>
              </div>
              <div className="space-y-3">
                {[
                  { label: 'Condições de contrato de trabalho', note: '' },
                  { label: 'Licença de trabalho SERVITENG', note: 'Ref AQS.026 / AQS.027' },
                  { label: 'Formação dos empregados', note: 'Verificação de competências' },
                  { label: 'Plano do trabalho', note: 'Task list & Risk control' },
                  { label: 'Espatços confinados', note: 'Certificação Nível 1/2' }
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-5 bg-slate-50/50 border border-slate-100/50 rounded-2xl hover:bg-white hover:shadow-md transition-all">
                    <div className="flex items-center gap-5">
                      <input type="checkbox" className="w-6 h-6 rounded-lg border-slate-300 text-emerald-500 focus:ring-emerald-500 transition-all cursor-pointer" />
                      <div>
                        <p className="text-[11px] font-extrabold text-slate-700 uppercase tracking-tight">{item.label}</p>
                        {item.note && <p className="text-[9px] text-blue-500 font-bold uppercase tracking-widest mt-0.5">{item.note}</p>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Validated Banner */}
            <div className="bg-emerald-900 rounded-[2rem] p-8 text-white relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl group-hover:bg-white/10 transition-all duration-700"></div>
              <div className="relative z-10 text-center">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-4 text-emerald-300">Declaração de Conformidade</p>
                <p className="text-sm font-medium leading-relaxed max-w-lg mx-auto mb-8 text-emerald-50/80">
                  Confirmo que as informações marcadas foram fornecidas e compreendidas, aceitando as normas de segurança vigentes na SERVITENG.
                </p>
                <div className="flex flex-col md:flex-row items-center justify-center gap-6">
                  <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl px-6 py-4 flex-1 w-full">
                    <p className="text-[8px] font-black uppercase tracking-widest text-emerald-300 mb-1 text-left">Trabalhador</p>
                    <p className="text-sm font-bold text-white text-left">{activeContractor.nome}</p>
                  </div>
                  <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl px-6 py-4 flex-1 w-full border-dashed">
                    <p className="text-[8px] font-black uppercase tracking-widest text-emerald-300 mb-1 text-left">Assinatura Digital</p>
                    <p className="text-[10px] italic text-emerald-100/50 text-left">Aguardando validação do instrutor...</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-8 border-t border-slate-100 bg-slate-50/30 flex gap-4">
            <button 
              onClick={() => setShowInductionModal(false)} 
              className="flex-1 py-4 border border-slate-200 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:bg-white hover:text-slate-600 transition-all"
            >
              Cancelar Processo
            </button>
            <button 
              onClick={() => handleUpdateInduction(activeContractor.id, true)}
              className="flex-[2] py-4 bg-emerald-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-emerald-200 hover:bg-emerald-700 transition-all active:scale-95 flex items-center justify-center gap-3"
            >
              <i className="fas fa-check-double text-xs"></i> Validar Indução e Ativar Acesso
            </button>
          </div>
        </div>
      </div>
    )}
  </>
    
  );
};

export default ContractorsModule;
