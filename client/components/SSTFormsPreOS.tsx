import React, { useState } from 'react';
import { FaIcon } from './common/FaIcon';
import { api } from '../../connectors/api/client';

interface SSTFormsProps {
  osId: string;
  onComplete: () => void;
  onCancel?: () => void;
  initialData?: {
    descricao: string;
    local?: string;
    dataAbertura?: string;
  };
}

const SSTFormsPreOS: React.FC<SSTFormsProps> = ({ osId, onComplete, onCancel, initialData }) => {
  const [step, setStep] = useState(0); // 0 = Get Started
  const [loading, setLoading] = useState(false);
  
  // APR State
  const [hazards, setHazards] = useState<string[]>([]);
  const [medidasControlo, setMedidasControlo] = useState('');

  // Work Permit State
  const [permitType, setPermitType] = useState('ALTURA');
  const [loto, setLoto] = useState(false);

  const toggleHazard = (h: string) => {
    setHazards(prev => prev.includes(h) ? prev.filter(x => x !== h) : [...prev, h]);
  };

  const handleCancel = () => {
    if (onCancel) onCancel();
    else onComplete();
  };

  const handleAPRSubmit = async () => {
    if (hazards.length === 0) {
      alert('Selecione pelo menos um perigo identificado.');
      return;
    }
    setStep(2);
  };

  const handleFinalSubmit = async () => {
    setLoading(true);
    try {
      // 1. Create APR
      await api.sst.aprs.create({
        workOrderId: osId === 'SST-MANUAL' ? undefined : osId,
        perigosIdentificados: hazards,
        medidasControlo
      });

      // 2. Create Work Permit
      await api.sst.workPermits.create({
        workOrderId: osId === 'SST-MANUAL' ? undefined : osId,
        tipoTrabalho: permitType,
        validadeInicio: new Date().toISOString(),
        validadeFim: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(), // +8h
        isolamentoEnergiasLoto: loto
      });

      // 3. Handle Work Order creation or validation
      if (osId === 'NEW' && initialData) {
        // Here we would normally create the Work Order or finalize it
        // For now, let's assume we create a pending one
        const newWO = await api.workOrders.create({
          projectId: 'PROJ-DEFAULT', // This would need to come from context or form
          descricao: initialData.descricao,
          local: initialData.local,
          dataAbertura: initialData.dataAbertura ? new Date(initialData.dataAbertura).toISOString() : new Date().toISOString(),
          tipoManutencao: 'PREVENTIVA',
          prioridade: 'MEDIA'
        });
        await api.workOrders.validateSST(newWO.id);
      } else if (osId !== 'SST-MANUAL') {
        try {
          await api.workOrders.validateSST(osId);
        } catch (e) {
          console.warn('Could not validate OS SST status, maybe already validated.');
        }
      }

      onComplete();
    } catch (error) {
      console.error('SST Flow error:', error);
      alert('Erro ao guardar conformidade SST');
    } finally {
      setLoading(false);
    }
  };

  const availableHazards = [
    'Queda em Altura', 'Eletrocussão', 'Projeção de Partículas', 
    'Ruído Excessivo', 'Atmosfera Explosiva', 'Cargas Suspensas',
    'Espaço Confinado', 'Radiação (Soldadura)'
  ];

  return (
    <div className="bg-white rounded-panel shadow-[0_30px_100px_-20px_rgba(0,0,0,0.3)] w-full max-w-4xl overflow-hidden flex flex-col md:flex-row h-[90vh] md:h-auto max-h-[90vh] animate-in zoom-in duration-500 relative">
      <button aria-label="Cancelar" 
        onClick={handleCancel}
        className="absolute right-8 top-8 z-50 w-10 h-10 bg-slate-100 hover:bg-slate-200 text-slate-400 hover:text-slate-900 rounded-full flex items-center justify-center transition active:scale-95"
      >
        <FaIcon name="fa-times" className="text-xs" />
      </button>

      {/* Sidebar Progress */}
      <div className="w-full md:w-80 bg-slate-900 p-10 text-white flex flex-col justify-between shrink-0">
        <div>
          <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center text-xl mb-8 shadow-xl shadow-emerald-500/20">
            <FaIcon name="fa-shield-heart" />
          </div>
          <h3 className="text-xl font-bold leading-tight mb-1 tracking-tight font-display">SGIServiteng</h3>
          <p className="text-slate-500 text-2xs font-black uppercase tracking-widest mb-12">Protocolo de Segurança</p>
          
          <div className="space-y-8 relative">
            <div className={`flex items-center space-x-5 transition duration-300 ${step === 1 ? 'translate-x-2' : ''} ${step < 1 ? 'opacity-30' : 'opacity-100'}`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-2xs font-black ${step >= 1 ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'bg-slate-800 text-slate-500'}`}>
                {step > 1 ? <FaIcon name="fa-check" /> : '1'}
              </div>
              <span className={`text-2xs font-black uppercase tracking-widest ${step === 1 ? 'text-white' : 'text-slate-500'}`}>Avaliação APR</span>
            </div>
            
            <div className={`flex items-center space-x-5 transition duration-300 ${step === 2 ? 'translate-x-2' : ''} ${step < 2 ? 'opacity-30' : 'opacity-100'}`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-2xs font-black ${step >= 2 ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'bg-slate-800 text-slate-500'}`}>
                {step > 2 ? <FaIcon name="fa-check" /> : '2'}
              </div>
              <span className={`text-2xs font-black uppercase tracking-widest ${step === 2 ? 'text-white' : 'text-slate-500'}`}>Permit to Work</span>
            </div>

            <div className={`flex items-center space-x-5 transition duration-300 ${step === 3 ? 'translate-x-2' : ''} ${step < 3 ? 'opacity-30' : 'opacity-100'}`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-2xs font-black ${step >= 3 ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'bg-slate-800 text-slate-500'}`}>3</div>
              <span className={`text-2xs font-black uppercase tracking-widest ${step === 3 ? 'text-white' : 'text-slate-500'}`}>Finalização</span>
            </div>
          </div>
        </div>
        
        <div className="p-5 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-sm">
           <p className="text-3xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 opacity-60">ID do Projeto / Obra</p>
           <p className="text-xs font-black text-emerald-400 tracking-wider flex items-center">
             <FaIcon name="fa-microchip" className="mr-2 opacity-50 text-2xs" />
             {osId}
           </p>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 p-10 lg:p-14 overflow-y-auto custom-scrollbar bg-white">
        {step === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
             <div className="w-24 h-24 bg-slate-50 rounded-panel flex items-center justify-center text-4xl text-slate-900 shadow-sm border border-slate-100 relative group">
                <FaIcon name="fa-file-signature" className="text-emerald-500 group-hover:scale-110 transition-transform duration-500" />
                <div className="absolute inset-0 bg-emerald-500/5 rounded-panel animate-pulse"></div>
             </div>
             <div>
                <h4 className="text-3xl font-black text-slate-900 tracking-tight font-display mb-4">Conformidade SST</h4>
                <p className="text-slate-500 text-sm font-medium max-w-sm mx-auto leading-relaxed">
                  Para garantir a segurança operacional e o cumprimento das normas ISO, é necessário validar o protocolo de segurança.
                </p>
             </div>
             <button 
                onClick={() => setStep(1)}
                className="w-full max-w-xs py-5 bg-slate-900 text-white rounded-2xl text-2xs font-bold uppercase tracking-widest shadow-2xl shadow-slate-200 hover:bg-black transition hover:scale-[1.02] active:scale-95 flex items-center justify-center space-x-3"
             >
                <span>Iniciar Checklist</span>
                <FaIcon name="fa-arrow-right" className="text-3xs opacity-60" />
             </button>
             <div className="flex items-center space-x-4">
               <div className="h-[1px] w-8 bg-slate-100"></div>
               <p className="text-2xs text-slate-300 font-bold uppercase tracking-widest">ISO 45001 & 9001</p>
               <div className="h-[1px] w-8 bg-slate-100"></div>
             </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-10 animate-in fade-in slide-in-from-right-8 duration-500">
            <div>
              <h4 className="text-2xl font-black text-slate-900 tracking-tight font-display mb-2">Análise de Risco (APR)</h4>
              <p className="text-slate-400 text-sm font-medium italic">Selecione todos os perigos que identificou no local de trabalho.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {availableHazards.map(h => (
                <button 
                  key={h}
                  onClick={() => toggleHazard(h)}
                  className={`p-4.5 rounded-2xl border text-left flex items-center space-x-4 transition group ${
                    hazards.includes(h) 
                    ? 'bg-slate-900 border-slate-900 text-white shadow-xl shadow-slate-200' 
                    : 'bg-slate-50/50 border-slate-100 text-slate-500 hover:border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className={`w-6 h-6 rounded-lg flex items-center justify-center transition ${
                    hazards.includes(h) ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-300 group-hover:bg-slate-200'
                  }`}>
                    {hazards.includes(h) ? <FaIcon name="fa-check" className="text-2xs" /> : <FaIcon name="fa-plus" className="text-3xs" />}
                  </div>
                  <span className="text-2xs font-bold tracking-tight">{h}</span>
                </button>
              ))}
            </div>

            <div className="space-y-3">
              <label htmlFor="sstformspreo-medidas-adicionais" className="flex items-center text-2xs font-black text-slate-400 uppercase tracking-widest ml-1">
                <FaIcon name="fa-comment-medical" className="mr-2 text-emerald-500/50" /> Medidas Adicionais
              </label>
              <textarea id="sstformspreo-medidas-adicionais" 
                rows={3}
                value={medidasControlo}
                onChange={(e) => setMedidasControlo(e.target.value)}
                placeholder="Ex: Utilização de detetores de gás, Ventilação forçada, Equipas de resgate..."
                className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-5 text-xs font-medium outline-none focus:border-slate-900 transition resize-none shadow-inner"
              />
            </div>

            <button 
              onClick={handleAPRSubmit}
              className="w-full py-5 bg-slate-900 text-white rounded-2xl text-2xs font-bold uppercase tracking-widest shadow-xl shadow-slate-200 hover:bg-black transition active:scale-[0.98] flex items-center justify-center"
            >
              Próximo Passo <FaIcon name="fa-chevron-right" className="ml-3 text-3xs opacity-40" />
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-10 animate-in fade-in slide-in-from-right-8 duration-500">
             <div>
              <h4 className="text-2xl font-black text-slate-900 tracking-tight font-display mb-2">Permissão de Trabalho</h4>
              <p className="text-slate-400 text-sm font-medium italic">Trabalhos especiais requerem uma PT válida e assinada.</p>
            </div>

            <div className="space-y-8">
              <div className="grid grid-cols-2 gap-3">
                {['ALTURA', 'QUENTE', 'CONFINADO', 'ELETRICO'].map(t => (
                  <button 
                    key={t}
                    onClick={() => setPermitType(t)}
                    className={`py-4.5 rounded-2xl border text-2xs font-black uppercase tracking-widest transition flex items-center justify-center space-x-2 ${
                      permitType === t 
                      ? 'bg-slate-900 border-slate-900 text-white shadow-xl shadow-slate-200' 
                      : 'bg-slate-50/50 border-slate-100 text-slate-400 hover:bg-slate-50 hover:border-slate-200'
                    }`}
                  >
                    <FaIcon name={
                      t === 'ALTURA' ? 'fa-mountain' : 
                      t === 'QUENTE' ? 'fa-fire' : 
                      t === 'CONFINADO' ? 'fa-dungeon' : 'fa-bolt'
                    } className="text-2xs opacity-40" />
                    <span>{t}</span>
                  </button>
                ))}
              </div>

              <div className="p-6 bg-slate-50 rounded-panel flex items-center justify-between border border-slate-100 shadow-inner">
                <div className="flex items-center space-x-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition ${loto ? 'bg-red-500 text-white shadow-lg shadow-red-200' : 'bg-slate-200 text-slate-400'}`}>
                    <FaIcon name="fa-lock" />
                  </div>
                  <div>
                    <h5 className="text-xs font-black text-slate-900 uppercase tracking-tight">Bloqueio LOTO</h5>
                    <p className="text-2xs text-slate-400 font-medium">Bloqueio de energias perigosas</p>
                  </div>
                </div>
                <button 
                  onClick={() => setLoto(!loto)}
                  className={`w-14 h-7 rounded-full transition relative outline-none ${loto ? 'bg-red-500' : 'bg-slate-300'}`}
                >
                  <div className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow-sm transition duration-300 ease-out ${loto ? 'left-8' : 'left-1'}`}></div>
                </button>
              </div>

              <div className="p-6 bg-slate-900 rounded-panel flex items-start space-x-4 relative overflow-hidden group">
                 <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full -mr-16 -mt-16 transition-transform duration-1000 group-hover:scale-110"></div>
                 <FaIcon name="fa-fingerprint" className="text-emerald-400 text-lg mt-1 relative z-10" />
                 <div className="relative z-10">
                   <p className="text-xs font-bold text-white mb-1">Declaração de Responsabilidade</p>
                   <p className="text-2xs text-slate-400 font-medium leading-relaxed">
                     Declaro que todas as medidas de segurança foram implementadas e inspecionadas localmente.
                   </p>
                 </div>
              </div>
            </div>

            <div className="flex gap-4">
              <button 
                onClick={() => setStep(1)} 
                className="flex-1 py-5 border border-slate-100 rounded-2xl text-2xs font-bold uppercase text-slate-400 hover:bg-slate-50 transition font-display"
              >
                Voltar
              </button>
              <button 
                onClick={() => setStep(3)}
                className="flex-[2] py-5 bg-slate-900 text-white rounded-2xl text-2xs font-bold uppercase tracking-widest shadow-xl shadow-slate-200 hover:bg-black transition active:scale-[0.98]"
              >
                Prosseguir <FaIcon name="fa-check-double" className="ml-3 text-3xs opacity-40" />
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-10 animate-in fade-in zoom-in duration-700 flex flex-col items-center justify-center h-full text-center py-10">
             <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-panel flex items-center justify-center text-3xl shadow-inner mb-6 relative group">
                <FaIcon name="fa-check-circle" className="group-hover:scale-110 transition-transform" />
                <div className="absolute inset-0 border-4 border-emerald-500/10 rounded-panel animate-ping opacity-20"></div>
             </div>
             <div>
                <h4 className="text-3xl font-black text-slate-900 tracking-tight font-display mb-4">Protocolo Concluído</h4>
                <p className="text-slate-500 text-sm font-medium max-w-sm mx-auto leading-relaxed">
                  Todos os requisitos de segurança foram validados. A obra está agora em conformidade <b>SGIS-ISO</b>.
                </p>
             </div>
             
             <button 
                disabled={loading}
                onClick={handleFinalSubmit}
                className="w-full max-w-sm py-6 bg-emerald-500 text-white rounded-panel text-2xs font-black uppercase tracking-widest shadow-[0_20px_40px_-10px_rgba(16,185,129,0.3)] hover:bg-emerald-600 transition hover:scale-[1.02] active:scale-95 flex items-center justify-center"
             >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>LIBERAR EQUIPA E MATERIAL <FaIcon name="fa-unlock" className="ml-3 opacity-40" /></>
                )}
             </button>
             
             <p className="text-2xs text-slate-300 font-bold uppercase tracking-widest mt-4">Autorização Gerada Digitalmente</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SSTFormsPreOS;
