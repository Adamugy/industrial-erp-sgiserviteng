import React, { useState, useEffect, useRef } from 'react';
import { api } from '../../connectors/api/client';
import { syncService } from '../../connectors/api/sync';

interface Proposal {
  id: string;
  refComercial: string;
  client: { id: string; name: string };
  descricaoEscopo: string;
  valorEstimado: number;
  moeda: string;
  status: 'PENDENTE' | 'REVISAO' | 'ADJUDICADO' | 'RECUSADO';
  numeroPO?: string;
  createdAt: string;
}

const CRMModule: React.FC = () => {
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [clients, setClients] = useState<any[]>([]);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({ 
    clientName: '', 
    value: '', 
    currency: 'EUR', 
    description: '', 
    validity: '',
    attachment: null as File | null
  });

  // Load data from API
  useEffect(() => {
    const loadData = async () => {
      try {
        const [proposalsData, clientsData] = await Promise.all([
          api.proposals.list(),
          api.clients.list(),
        ]);
        setProposals(proposalsData);
        setClients(clientsData);
      } catch (error) {
        console.error('Error loading CRM data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();

    // Subscribe to real-time updates
    const unsubCreate = syncService.on('proposal:created', (proposal) => {
      setProposals(prev => [proposal, ...prev]);
    });
    const unsubUpdate = syncService.on('proposal:updated', (proposal) => {
      setProposals(prev => prev.map(p => p.id === proposal.id ? proposal : p));
    });
    const unsubAdjudicate = syncService.on('proposal:adjudicated', (proposal) => {
      setProposals(prev => prev.map(p => p.id === proposal.id ? proposal : p));
    });
    const unsubDelete = syncService.on('proposal:deleted', ({ id }) => {
      setProposals(prev => prev.filter(p => p.id !== id));
    });

    return () => {
      unsubCreate();
      unsubUpdate();
      unsubAdjudicate();
      unsubDelete();
    };
  }, []);

  const stats = [
    { label: 'Propostas Enviadas', val: proposals.length.toString(), icon: 'fa-paper-plane', color: 'blue' },
    { label: 'Valor Adjudicado', val: `€ ${(proposals.filter(p => p.status === 'ADJUDICADO').reduce((sum, p) => sum + Number(p.valorEstimado), 0) / 1000).toFixed(0)}k`, icon: 'fa-check-double', color: 'emerald' },
    { label: 'Aguardando PO', val: proposals.filter(p => p.status === 'ADJUDICADO' && !p.numeroPO).length.toString(), icon: 'fa-clock', color: 'amber' },
  ];

  const handleCreateProposal = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // In a real scenario, we would upload the file first or send as multipart
      await api.proposals.create({
        clientId: 'prospect-id', // Simulated for now since we're using free text
        descricaoEscopo: formData.description,
        valorEstimado: parseFloat(formData.value),
        moeda: formData.currency,
        dataValidade: formData.validity ? new Date(formData.validity).toISOString() : undefined,
      });
      setShowModal(false);
      setFormData({ 
        clientName: '', 
        value: '', 
        currency: 'EUR', 
        description: '', 
        validity: '',
        attachment: null
      });
    } catch (error) {
      console.error('Error creating proposal:', error);
      alert('Erro ao criar proposta');
    }
  };

  const handleImportExcel = () => {
    fileInputRef.current?.click();
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      alert(`Funcionalidade de importação será implementada na v2. Ficheiro: ${file.name}`);
    }
  };

  const toggleAdjudication = async (id: string, type: 'withPO' | 'noPO') => {
    try {
      await api.proposals.adjudicate(id, {
        numeroPO: type === 'withPO' ? `PO-${Date.now()}` : undefined,
        condicoesPagamento: '30 dias',
      });
    } catch (error) {
      console.error('Error adjudicating proposal:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-slate-400 text-sm">A carregar propostas...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6 animate-in slide-in-from-bottom-2 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">CRM: Propostas & Adjudicações</h2>
          <p className="text-slate-500 text-sm italic">Dados sincronizados com o servidor em tempo real.</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <input type="file" ref={fileInputRef} onChange={onFileChange} className="hidden" accept=".xlsx,.xls,.csv" />
          <button 
            onClick={handleImportExcel}
            className="flex-1 sm:flex-none bg-white border border-slate-200 text-slate-600 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center justify-center"
          >
            <i className="fas fa-file-import mr-2 text-blue-500"></i> Importar Excel
          </button>
          <button 
            onClick={() => setShowModal(true)}
            className="flex-1 sm:flex-none bg-emerald-500 text-white px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-emerald-600 shadow-lg shadow-emerald-500/20 transition-all active:scale-95"
          >
            <i className="fas fa-plus mr-2"></i> Nova Proposta
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {stats.map((s, i) => (
          <div key={i} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center">
            <div className={`w-12 h-12 bg-${s.color}-50 text-${s.color}-500 rounded-full flex items-center justify-center mr-4 text-xl`}>
              <i className={`fas ${s.icon}`}></i>
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{s.label}</p>
              <p className="text-xl font-black text-slate-900">{s.val}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px] font-bold tracking-wider">
              <tr>
                <th className="px-6 py-4">Ref / Cliente</th>
                <th className="px-6 py-4">Estado / PO</th>
                <th className="px-6 py-4">Valor</th>
                <th className="px-6 py-4 text-right">Adjudicação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {proposals.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-slate-400">
                    <i className="fas fa-inbox text-3xl mb-2"></i>
                    <p>Nenhuma proposta encontrada</p>
                  </td>
                </tr>
              ) : (
                proposals.map(p => (
                  <tr key={p.id} className="hover:bg-slate-50 group">
                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-800 text-sm">{p.refComercial}</p>
                      <p className="text-xs text-slate-500 font-medium truncate max-w-[150px]">{p.client?.name}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <span className={`self-start text-[9px] px-2 py-0.5 rounded-full font-black uppercase tracking-tighter border ${
                          p.status === 'ADJUDICADO' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                          'bg-slate-50 text-slate-500 border-slate-200'
                        }`}>
                          {p.status}
                        </span>
                        {p.status === 'ADJUDICADO' && (
                          <span className={`text-[8px] font-bold ${p.numeroPO ? 'text-blue-500' : 'text-amber-500'}`}>
                            <i className={`fas ${p.numeroPO ? 'fa-file-signature' : 'fa-exclamation-circle'} mr-1`}></i>
                            {p.numeroPO ? 'COM PO' : 'SEM PO (Pendente)'}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-black text-slate-900 tracking-tight">
                      € {Number(p.valorEstimado).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {p.status !== 'ADJUDICADO' ? (
                        <div className="flex justify-end gap-1">
                          <button 
                            onClick={() => toggleAdjudication(p.id, 'withPO')}
                            className="text-[9px] px-2 py-1.5 bg-blue-50 text-blue-600 rounded-lg font-black hover:bg-blue-100 border border-blue-100 transition-colors uppercase"
                          >
                            Adjudicar + PO
                          </button>
                          <button 
                            onClick={() => toggleAdjudication(p.id, 'noPO')}
                            className="text-[9px] px-2 py-1.5 bg-amber-50 text-amber-600 rounded-lg font-black hover:bg-amber-100 border border-amber-100 transition-colors uppercase"
                          >
                            S/ PO
                          </button>
                        </div>
                      ) : (
                        <div className="flex justify-end space-x-2">
                          <button className="text-slate-300 hover:text-emerald-500 p-2 transition-colors"><i className="fas fa-check-circle"></i></button>
                          {!p.numeroPO && (
                            <button 
                              onClick={() => toggleAdjudication(p.id, 'withPO')}
                              className="text-[8px] font-black text-blue-500 hover:underline"
                            >
                              Vincular PO
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>

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
              <h3 className="font-bold text-slate-900 tracking-tight text-xl font-display">Gerar Nova Proposta</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Gestão de Cotas & Orçamentos</p>
            </div>
            
            <form onSubmit={handleCreateProposal} className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-6">
                  <div className="space-y-1.5">
                    <label className="flex items-center text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                      <i className="fas fa-user-tie mr-2 text-slate-300"></i> Nome do Cliente / Entidade
                    </label>
                    <input 
                      required 
                      type="text"
                      value={formData.clientName} 
                      onChange={(e) => setFormData({...formData, clientName: e.target.value})} 
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3.5 text-xs font-medium focus:outline-none focus:border-slate-900 transition-all font-display"
                      placeholder="Ex: Empresa de Construção LDA"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="flex items-center text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                        <i className="fas fa-coins mr-2 text-slate-300"></i> Valor
                      </label>
                      <div className="relative">
                        <input required type="number" step="0.01" value={formData.value} onChange={(e) => setFormData({...formData, value: e.target.value})} className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-5 pr-12 py-3.5 text-xs font-medium focus:outline-none focus:border-slate-900 transition-all font-display" placeholder="0.00" />
                        <select 
                          value={formData.currency}
                          onChange={(e) => setFormData({...formData, currency: e.target.value})}
                          className="absolute right-2 top-1.5 bottom-1.5 bg-white border border-slate-100 rounded-xl px-2 text-[9px] font-bold focus:outline-none"
                        >
                          <option value="EUR">€</option>
                          <option value="USD">$</option>
                        </select>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="flex items-center text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                        <i className="fas fa-calendar-day mr-2 text-slate-300"></i> Validade
                      </label>
                      <input type="date" value={formData.validity} onChange={(e) => setFormData({...formData, validity: e.target.value})} className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3.5 text-xs font-medium focus:outline-none focus:border-slate-900 transition-all font-display" />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="flex items-center text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                      <i className="fas fa-file-excel mr-2 text-emerald-500"></i> Anexo de Cotação (.xlsx / .pdf)
                    </label>
                    <div 
                      onClick={() => document.getElementById('modal-file-input')?.click()}
                      className="w-full h-24 border-2 border-dashed border-slate-100 rounded-2xl flex flex-col items-center justify-center bg-slate-50/50 hover:bg-slate-50 hover:border-slate-200 transition-all cursor-pointer group"
                    >
                      <i className="fas fa-cloud-arrow-up text-slate-300 group-hover:text-slate-400 mb-2"></i>
                      <p className="text-[9px] font-bold text-slate-400 uppercase group-hover:text-slate-500">
                        {formData.attachment ? formData.attachment.name : 'Clique para selecionar ficheiro'}
                      </p>
                      <input 
                        id="modal-file-input"
                        type="file" 
                        className="hidden" 
                        onChange={(e) => setFormData({...formData, attachment: e.target.files?.[0] || null})}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="space-y-1.5 h-full flex flex-col">
                    <label className="flex items-center text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                      <i className="fas fa-align-left mr-2 text-slate-300"></i> Escopo Técnico & Observações
                    </label>
                    <textarea 
                      required 
                      value={formData.description} 
                      onChange={(e) => setFormData({...formData, description: e.target.value})} 
                      className="flex-1 w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-xs font-medium focus:outline-none focus:border-slate-900 transition-all resize-none font-display leading-relaxed" 
                      placeholder="Descreva detalhadamente o escopo dos serviços, prazos de execução e condições específicas..." 
                    />
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-slate-50 flex gap-3">
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
                  Salvar e Notificar Cliente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default CRMModule;
