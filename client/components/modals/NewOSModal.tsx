import React from 'react';
import { X, Wrench, AlertTriangle, ChevronRight } from 'lucide-react';
import { Button } from '../common/UIElements';

interface NewOSModalProps {
  onClose: () => void;
  onSubmit: (data: any) => void;
}

const NewOSModal: React.FC<NewOSModalProps> = ({ onClose, onSubmit }) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget as HTMLFormElement);
    const data = {
      descricao: formData.get('descricao'),
      local: formData.get('local'),
      dataAbertura: formData.get('dataAbertura')
    };
    onSubmit(data);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[250] flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in duration-200 border border-slate-100 dark:border-slate-800">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
              <Wrench size={16} />
            </div>
            <h3 className="font-black text-slate-800 dark:text-white uppercase tracking-tight text-xs">Abertura de OS Industrial</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-red-500 p-2 transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase mb-2 tracking-widest lg:text-left">Designação da Tarefa</label>
              <input 
                required 
                type="text" 
                name="descricao"
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-5 py-4 text-sm font-bold text-slate-700 dark:text-white focus:border-indigo-500 dark:focus:border-indigo-400 outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600 shadow-inner" 
                placeholder="Ex: Reparação Motor Principal" 
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase mb-2 tracking-widest lg:text-left">Local / Instalação</label>
                <input 
                  type="text" 
                  name="local"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-5 py-3 text-sm font-bold text-slate-700 dark:text-white focus:border-indigo-500 dark:focus:border-indigo-400 outline-none transition-all shadow-inner" 
                  placeholder="Ex: Piso 2 - Área Técnica" 
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase mb-2 tracking-widest lg:text-left">Data de Abertura</label>
                <input 
                  type="date" 
                  name="dataAbertura"
                  defaultValue={new Date().toISOString().split('T')[0]}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-5 py-3 text-sm font-bold text-slate-700 dark:text-white focus:border-indigo-500 dark:focus:border-indigo-400 outline-none transition-all shadow-inner" 
                />
              </div>
            </div>
          </div>

          <div className="bg-amber-50 dark:bg-amber-900/10 p-5 rounded-2xl border border-amber-100 dark:border-amber-900/20 flex gap-4">
            <AlertTriangle className="text-amber-500 shrink-0" size={20} />
            <p className="text-[10px] text-amber-800 dark:text-amber-400 font-black leading-relaxed uppercase tracking-tighter">
              Nota: A Ordem de Serviço será aberta no estado <span className="text-amber-600 dark:text-amber-300 underline decoration-2 underline-offset-2 italic">PENDENTE</span> aguardando validação do checklist de segurança SST obrigatório.
            </p>
          </div>

          <div className="pt-2 flex gap-3">
            <Button variant="outline" className="flex-1 py-4 h-14" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" className="flex-[2] py-4 h-14 shadow-lg" icon={<ChevronRight size={16} />}>
              Criar Ordem de Serviço
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewOSModal;
