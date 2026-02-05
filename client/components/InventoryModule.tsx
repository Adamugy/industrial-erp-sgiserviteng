import React, { useState, useEffect, useRef } from 'react';
import { api } from '../../connectors/api/client';
import { syncService } from '../../connectors/api/sync';

interface StockItem {
  id: string;
  codigoInterno: string;
  nome: string;
  quantidadeAtual: number;
  stockMinimo: number;
  unidadeMedida: string;
  status: 'OK' | 'CRITICO';
}

const InventoryModule: React.FC = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [items, setItems] = useState<StockItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState<'entrada' | 'saida' | 'novo' | null>(null);
  const [generatedCode, setGeneratedCode] = useState('');
  
  const [formData, setFormData] = useState({
    items: [{ materialId: '', quantity: 1, nome: '', codigoInterno: '', unidadeMedida: 'UN', isNew: false }],
    documentRef: '',
    qualityCheck: false,
    reason: 'Consumo Planeado (OS)',
    localizacao: 'Armazém',
    dataReferencia: new Date().toISOString().split('T')[0],
    responsavelId: '',
    documentacaoAdicional: '',
  });

  const [users, setUsers] = useState<any[]>([]);

  // Load materials from API
  useEffect(() => {
    const loadData = async () => {
      try {
        const [materials, usersData] = await Promise.all([
          api.materials.list(),
          api.users.list()
        ]);
        setItems(materials);
        setUsers(usersData);
      } catch (error) {
        console.error('Error loading inventory data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();

    // Real-time updates
    const unsubCreate = syncService.on('material:created', (material) => {
      setItems(prev => [material, ...prev]);
    });
    const unsubUpdate = syncService.on('material:stockChanged', (data) => {
      setItems(prev => prev.map(m => m.id === data.id ? { ...m, quantidadeAtual: data.quantidadeAtual, status: data.status } : m));
    });

    return () => {
      unsubCreate();
      unsubUpdate();
    };
  }, []);

  useEffect(() => {
    if (showModal) {
      const prefix = showModal === 'entrada' ? 'ENT' : 'SAI';
      const timestamp = new Date().getTime().toString().slice(-6);
      const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
      setGeneratedCode(`${prefix}-${timestamp}-${random}`);
    }
  }, [showModal]);

  const closeModal = () => {
    setShowModal(null);
    setFormData({ 
      items: [{ materialId: '', quantity: 0, nome: '', codigoInterno: '', unidadeMedida: 'UN', isNew: false }], 
      documentRef: '', 
      qualityCheck: false, 
      reason: 'Consumo Planeado (OS)',
      localizacao: 'Armazém',
      dataReferencia: new Date().toISOString().split('T')[0],
      responsavelId: '',
      documentacaoAdicional: '',
    });
  };

  const handleStockAction = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (formData.items.some(i => (!i.materialId && !i.nome) || i.quantity <= 0)) {
        throw new Error('Todos os itens devem ter material (selecionado ou novo nome) e quantidade superior a zero.');
      }

      await api.materials.batchMovement({
        tipo: showModal === 'entrada' ? 'ENTRADA' : 'SAIDA',
        items: formData.items.map(i => ({ 
          materialId: i.materialId, 
          quantidade: i.quantity,
          nome: i.nome,
          codigoInterno: i.codigoInterno,
          unidadeMedida: i.unidadeMedida
        })),
        documentoRef: formData.documentRef,
        localizacao: formData.localizacao,
        responsavelId: formData.responsavelId,
        dataReferencia: formData.dataReferencia,
        documentacaoAdicional: formData.documentacaoAdicional,
      });
      
      alert(`Movimentação Concluída: ${generatedCode}`);
      closeModal();
    } catch (error: any) {
      alert(error.message || 'Erro ao registar movimento');
    }
  };

  const openMovement = (item: StockItem, type: 'entrada' | 'saida') => {
    setFormData({
      ...formData,
      items: [{ materialId: item.id, quantity: 1, nome: item.nome, codigoInterno: item.codigoInterno, unidadeMedida: item.unidadeMedida, isNew: false }],
    });
    setShowModal(type);
  };

  const addItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { materialId: '', quantity: 1, nome: '', codigoInterno: '', unidadeMedida: 'UN', isNew: false }]
    });
  };

  const removeItem = (index: number) => {
    setFormData({
      ...formData,
      items: formData.items.filter((_, i) => i !== index)
    });
  };

  const updateItem = (index: number, field: string, value: any) => {
    const newItems = [...formData.items];
    (newItems[index] as any)[field] = value;
    
    if (field === 'materialId') {
      if (value === 'NEW') {
        newItems[index].materialId = '';
        newItems[index].isNew = true;
        newItems[index].nome = '';
        newItems[index].codigoInterno = `REF-${Date.now().toString().slice(-4)}`;
        newItems[index].unidadeMedida = 'UN';
      } else if (value) {
        const selected = items.find(i => i.id === value);
        if (selected) {
          newItems[index].nome = selected.nome;
          newItems[index].codigoInterno = selected.codigoInterno;
          newItems[index].unidadeMedida = selected.unidadeMedida;
          newItems[index].isNew = false;
        }
      } else {
        newItems[index].isNew = false;
      }
    }
    
    setFormData({ ...formData, items: newItems });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-slate-400 text-sm">A carregar materiais...</p>
        </div>
      </div>
    );
  }

  const criticalCount = items.filter(i => i.status === 'CRITICO').length;

  return (
    <>
      <div className="space-y-6 animate-in slide-in-from-bottom-2 duration-500 pb-20">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total Materials Card */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm group hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-500">
          <div className="flex items-center space-x-5">
            <div className="w-14 h-14 bg-slate-900 rounded-[1.25rem] flex items-center justify-center text-white shadow-lg shadow-slate-200 group-hover:scale-110 transition-transform duration-500">
              <i className="fas fa-boxes-stacked text-lg"></i>
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-2">Total Materiais</p>
              <h4 className="text-3xl font-bold text-slate-900 tracking-tight leading-none">{items.length}</h4>
            </div>
          </div>
        </div>

        {/* Critical Stock Card */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm group hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-500">
          <div className="flex items-center space-x-5">
            <div className={`w-14 h-14 ${criticalCount > 0 ? 'bg-red-500 shadow-red-200' : 'bg-emerald-500 shadow-emerald-200'} rounded-[1.25rem] flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform duration-500`}>
              <i className={`fas ${criticalCount > 0 ? 'fa-triangle-exclamation' : 'fa-check-circle'} text-lg`}></i>
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-2">Stock Crítico</p>
              <h4 className={`text-3xl font-bold tracking-tight leading-none ${criticalCount > 0 ? 'text-red-500' : 'text-emerald-500'}`}>{criticalCount}</h4>
            </div>
          </div>
        </div>

        {/* Warehouse Status Card */}
        <div className="bg-slate-900 p-8 rounded-[2.5rem] shadow-xl shadow-slate-200 group hover:shadow-2xl transition-all duration-500 relative overflow-hidden">
          <div className="absolute -right-4 -bottom-4 opacity-10 text-white text-8xl transform -rotate-12 group-hover:scale-110 transition-transform duration-700">
            <i className="fas fa-warehouse"></i>
          </div>
          <div className="flex items-center space-x-5 relative z-10">
            <div className="w-14 h-14 bg-white/10 rounded-[1.25rem] flex items-center justify-center text-white backdrop-blur-md">
              <i className="fas fa-chart-line text-lg"></i>
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-2">Eficiência Stock</p>
              <h4 className="text-3xl font-bold text-white tracking-tight leading-none">
                {items.length > 0 ? ((1 - criticalCount / items.length) * 100).toFixed(1) : 100}%
              </h4>
            </div>
          </div>
        </div>
      </div>

      {/* Main Actions Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
        <div className="flex items-center space-x-4">
          <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400">
            <i className="fas fa-layer-group"></i>
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">Gestão de Inventário</h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">ISO 9001: Fluxos & Rastreabilidade</p>
          </div>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <button 
            onClick={() => setShowModal('saida')}
            className="flex-1 sm:flex-none py-3.5 bg-white border border-slate-200 text-slate-600 px-6 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 flex items-center justify-center transition-all shadow-sm active:scale-95"
          >
            <i className="fas fa-arrow-up-from-bracket mr-2 text-red-400"></i> Guia de Saída
          </button>
          <button 
            onClick={() => setShowModal('entrada')}
            className="flex-1 sm:flex-none py-3.5 bg-slate-900 text-white px-6 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-black shadow-xl shadow-slate-200 flex items-center justify-center transition-all active:scale-95"
          >
            <i className="fas fa-arrow-down-to-bracket mr-2 text-emerald-400"></i> Guia de Entrada
          </button>
        </div>
      </div>

    </div>
    {/* Modals */}
    {showModal && showModal !== 'novo' && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[200] grid place-items-center p-4 overflow-y-auto">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in duration-300 my-auto">
            <div className="p-10 border-b border-slate-50 relative bg-slate-50/20 text-center">
              <button onClick={closeModal} className="absolute right-8 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-900 transition-colors">
                <i className="fas fa-times text-sm"></i>
              </button>
              <h3 className="font-bold text-slate-900 tracking-tight text-xl font-display">
                {showModal === 'entrada' ? 'Receção de Mercadoria' : 'Guia de Saída de Material'}
              </h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">ISO 9001: Gestão de Inventário & Conformidade</p>
            </div>
            
            <form onSubmit={handleStockAction} className="p-10 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Batch Items List */}
                <div className="md:col-span-2 space-y-4">
                  <div className="flex items-center justify-between ml-1">
                    <label className="flex items-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      <i className="fas fa-list-check mr-2 text-slate-300"></i> Listagem de Materiais
                    </label>
                    <button 
                      type="button" 
                      onClick={addItem}
                      className="text-[10px] font-black text-emerald-500 uppercase tracking-widest hover:text-emerald-600 transition-colors flex items-center"
                    >
                      <i className="fas fa-plus-circle mr-1.5"></i> Adicionar Item
                    </button>
                  </div>
                  
                  <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                    {formData.items.map((item, index) => (
                      <div key={index} className="space-y-4 p-6 bg-slate-50/50 border border-slate-100 rounded-[2rem] animate-in slide-in-from-left-2 duration-300 relative">
                        {formData.items.length > 1 && (
                          <button 
                            type="button" 
                            onClick={() => removeItem(index)}
                            className="absolute right-4 top-4 w-8 h-8 flex items-center justify-center text-slate-300 hover:text-red-500 transition-colors"
                          >
                            <i className="fas fa-times text-xs"></i>
                          </button>
                        )}
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className={`${item.isNew ? 'md:col-span-1' : 'md:col-span-2'} space-y-2`}>
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Material</label>
                            <select 
                              required
                              value={item.isNew ? 'NEW' : item.materialId}
                              onChange={(e) => updateItem(index, 'materialId', e.target.value)}
                              className="w-full bg-white border border-slate-100 rounded-xl px-4 py-3 text-xs font-medium focus:outline-none focus:border-slate-900 transition-all appearance-none"
                            >
                              <option value="">Selecionar material...</option>
                              {showModal === 'entrada' && <option value="NEW" className="font-bold text-emerald-600">+ NOVO MATERIAL...</option>}
                              {items.map(i => (
                                <option key={i.id} value={i.id}>{i.nome} ({i.codigoInterno})</option>
                              ))}
                            </select>
                          </div>

                          {item.isNew ? (
                            <div className="md:col-span-2 space-y-2">
                              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome do Novo Material</label>
                              <input 
                                required 
                                type="text" 
                                value={item.nome} 
                                onChange={(e) => updateItem(index, 'nome', e.target.value)} 
                                className="w-full bg-white border border-slate-100 rounded-xl px-4 py-3 text-xs font-medium focus:outline-none focus:border-slate-900 transition-all" 
                                placeholder="Ex: Eletrodo de Solda" 
                              />
                            </div>
                          ) : (
                            <div className="space-y-2">
                              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Quantidade</label>
                              <input 
                                required 
                                type="number" 
                                min="1" 
                                value={item.quantity || ''} 
                                onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 0)} 
                                className="w-full bg-white border border-slate-100 rounded-xl px-4 py-3 text-xs font-medium focus:outline-none focus:border-slate-900 transition-all font-mono" 
                                placeholder="0" 
                              />
                            </div>
                          )}

                          {item.isNew && (
                            <>
                              <div className="space-y-2">
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Ref / Cód</label>
                                <input 
                                  required 
                                  type="text" 
                                  value={item.codigoInterno} 
                                  onChange={(e) => updateItem(index, 'codigoInterno', e.target.value)} 
                                  className="w-full bg-white border border-slate-100 rounded-xl px-4 py-3 text-xs font-medium focus:outline-none focus:border-slate-900 transition-all font-mono" 
                                />
                              </div>
                              <div className="space-y-2">
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Unidade</label>
                                <select 
                                  value={item.unidadeMedida}
                                  onChange={(e) => updateItem(index, 'unidadeMedida', e.target.value)}
                                  className="w-full bg-white border border-slate-100 rounded-xl px-4 py-3 text-xs font-medium focus:outline-none focus:border-slate-900 transition-all"
                                >
                                  <option value="UN">UN</option>
                                  <option value="KG">KG</option>
                                  <option value="M">M</option>
                                  <option value="L">L</option>
                                  <option value="CX">CX</option>
                                </select>
                              </div>
                              <div className="space-y-2">
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Qtd Entrada</label>
                                <input 
                                  required 
                                  type="number" 
                                  min="1" 
                                  value={item.quantity || ''} 
                                  onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 0)} 
                                  className="w-full bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3 text-xs font-black text-emerald-700 focus:outline-none focus:border-emerald-500 transition-all font-mono" 
                                />
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="flex items-center text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                    <i className="fas fa-file-invoice mr-2 text-slate-300"></i> {showModal === 'entrada' ? 'Nº Fatura / Fornecedor' : 'Cód. Obra / OS'}
                  </label>
                  <input required type="text" value={formData.documentRef} onChange={(e) => setFormData({...formData, documentRef: e.target.value})} className="w-full bg-slate-50 border border-slate-100 rounded-[1.5rem] px-5 py-4 text-xs font-medium focus:outline-none focus:border-slate-900 transition-all" placeholder="Referência Documental" />
                </div>

                <div className="space-y-2">
                  <label className="flex items-center text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                    <i className="fas fa-calendar-day mr-2 text-slate-300"></i> {showModal === 'entrada' ? 'Data de Entrada' : 'Data de Saída'}
                  </label>
                  <input 
                    required 
                    type="date" 
                    value={formData.dataReferencia} 
                    onChange={(e) => setFormData({...formData, dataReferencia: e.target.value})} 
                    className="w-full bg-slate-50 border border-slate-100 rounded-[1.5rem] px-5 py-4 text-xs font-medium focus:outline-none focus:border-slate-900 transition-all" 
                  />
                </div>

                <div className="space-y-2">
                  <label className="flex items-center text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                    <i className="fas fa-location-dot mr-2 text-slate-300"></i> Localização
                  </label>
                  <select 
                    value={formData.localizacao}
                    onChange={(e) => setFormData({...formData, localizacao: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-100 rounded-[1.5rem] px-5 py-4 text-xs font-medium focus:outline-none focus:border-slate-900 transition-all appearance-none"
                  >
                    <option value="Armazém">Armazém</option>
                    <option value="Oficina">Oficina</option>
                    <option value="Escritório">Escritório</option>
                    <option value="Pátio">Pátio</option>
                  </select>
                </div>

                {showModal === 'saida' && (
                  <>
                    <div className="space-y-2">
                      <label className="flex items-center text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                        <i className="fas fa-user-check mr-2 text-slate-300"></i> Responsável
                      </label>
                      <select 
                        required
                        value={formData.responsavelId}
                        onChange={(e) => setFormData({...formData, responsavelId: e.target.value})}
                        className="w-full bg-slate-50 border border-slate-100 rounded-[1.5rem] px-5 py-4 text-xs font-medium focus:outline-none focus:border-slate-900 transition-all appearance-none"
                      >
                        <option value="">Selecionar...</option>
                        {users.map(u => (
                          <option key={u.id} value={u.id}>{u.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="flex items-center text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                        <i className="fas fa-shield-halved mr-2 text-slate-300"></i> Permissões / Docs
                      </label>
                      <input 
                        type="text" 
                        value={formData.documentacaoAdicional} 
                        onChange={(e) => setFormData({...formData, documentacaoAdicional: e.target.value})} 
                        className="w-full bg-slate-50 border border-slate-100 rounded-[1.5rem] px-5 py-4 text-xs font-medium focus:outline-none focus:border-slate-800 transition-all" 
                        placeholder="Ref. Permissão SST / Outros"
                      />
                    </div>
                  </>
                )}
              </div>

              <div className="p-6 bg-slate-50 rounded-[2rem] flex items-center justify-between border border-slate-100">
                <div className="flex items-center space-x-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm ${formData.qualityCheck ? 'bg-emerald-500/20 text-emerald-600' : 'bg-slate-200 text-slate-400'}`}>
                    <i className="fas fa-certificate"></i>
                  </div>
                  <div>
                    <h5 className="text-[11px] font-black text-slate-900 uppercase tracking-tight">Validação de Conformidade</h5>
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter">Material verificado e conforme ISO 9001</p>
                  </div>
                </div>
                <button type="button" onClick={() => setFormData({...formData, qualityCheck: !formData.qualityCheck})} className={`w-14 h-7 rounded-full transition-all relative shrink-0 ${formData.qualityCheck ? 'bg-emerald-500 shadow-lg shadow-emerald-500/20' : 'bg-slate-200'}`}>
                  <div className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow-sm transition-all ${formData.qualityCheck ? 'left-8' : 'left-1'}`} />
                </button>
              </div>

              <div className="pt-4 flex gap-4">
                <button type="button" onClick={closeModal} className="flex-1 py-4 border border-slate-100 text-slate-400 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all">Cancelar</button>
                <button type="submit" disabled={!formData.qualityCheck || formData.items.length === 0} className={`flex-[2] py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-2xl transition-all active:scale-95 ${!formData.qualityCheck || formData.items.length === 0 ? 'bg-slate-100 text-slate-300 shadow-none' : 'bg-slate-900 text-white shadow-slate-200'}`}>
                  Confirmar {showModal === 'entrada' ? 'Receção' : 'Saída'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Materials Table */}
      <div className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50/50 border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest">
              <tr>
                <th className="px-8 py-6">Item / Referência</th>
                <th className="px-8 py-6 text-center">Stock Físico</th>
                <th className="px-8 py-6">Estado Global</th>
                <th className="px-8 py-6 text-right">Acções</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-sm">
              {items.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-8 py-20 text-center text-slate-300">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                      <i className="fas fa-box-open text-xl opacity-20"></i>
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-widest">Nenhum material registado</p>
                  </td>
                </tr>
              ) : (
                items.map(item => (
                  <tr key={item.id} className="hover:bg-slate-50/50 transition-all group">
                    <td className="px-8 py-7">
                      <div className="flex items-center space-x-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm ${item.status === 'OK' ? 'bg-emerald-50 text-emerald-500' : 'bg-red-50 text-red-500'}`}>
                          <i className="fas fa-microchip"></i>
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 tracking-tight leading-none">{item.nome}</p>
                          <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mt-1">{item.codigoInterno}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-7 text-center">
                      <span className="text-sm font-black text-slate-700">{item.quantidadeAtual}</span>
                      <span className="text-[10px] font-black text-slate-300 uppercase ml-1.5">{item.unidadeMedida}</span>
                    </td>
                    <td className="px-8 py-7">
                      <div className="flex items-center">
                        <div className={`w-1.5 h-1.5 rounded-full mr-2.5 ${item.status === 'OK' ? 'bg-emerald-500' : 'bg-red-500 animate-pulse'}`}></div>
                        <span className={`text-[10px] font-black uppercase tracking-widest ${item.status === 'OK' ? 'text-emerald-600' : 'text-red-600'}`}>
                          {item.status === 'OK' ? 'Stock OK' : 'Stock Crítico'}
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-7 text-right">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => openMovement(item, 'entrada')} className="w-9 h-9 flex items-center justify-center bg-white border border-slate-100 text-emerald-500 hover:bg-emerald-500 hover:text-white rounded-xl transition-all shadow-sm">
                          <i className="fas fa-plus text-[10px]"></i>
                        </button>
                        <button onClick={() => openMovement(item, 'saida')} className="w-9 h-9 flex items-center justify-center bg-white border border-slate-100 text-red-500 hover:bg-red-500 hover:text-white rounded-xl transition-all shadow-sm">
                          <i className="fas fa-minus text-[10px]"></i>
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
    </>
  );
};

export default InventoryModule;
