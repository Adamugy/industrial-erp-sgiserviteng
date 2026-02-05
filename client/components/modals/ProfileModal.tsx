import React from 'react';
import { X, LogOut, User as UserIcon, Mail, ShieldCheck } from 'lucide-react';
import { Button } from '../common/UIElements';

interface ProfileModalProps {
  user: any;
  onClose: () => void;
  onLogout: () => void;
}

const ProfileModal: React.FC<ProfileModalProps> = ({ user, onClose, onLogout }) => {
  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[300] flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in duration-300 border border-slate-100 dark:border-slate-800">
        <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
          <h3 className="font-black text-slate-800 dark:text-white uppercase tracking-tight text-[10px] flex items-center gap-2">
            <UserIcon size={14} className="text-indigo-500" /> Perfil de Utilizador
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-red-500 p-2 transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-8 space-y-8">
          <div className="flex flex-col items-center">
            <div className="w-24 h-24 rounded-3xl bg-slate-900 dark:bg-indigo-600 text-white flex items-center justify-center text-4xl font-black shadow-2xl shadow-indigo-200 dark:shadow-none mb-4">
              {user.avatar || user.name.charAt(0)}
            </div>
            <h4 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight text-center">{user.name}</h4>
            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400 px-3 py-1 bg-emerald-50 dark:bg-emerald-900/20 rounded-full border border-emerald-100 dark:border-emerald-800/30 mt-2">
              {user.role}
            </span>
          </div>

          <div className="space-y-5">
            <div className="relative group">
              <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">Email Corporativo</label>
              <div className="relative">
                <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="email" 
                  readOnly 
                  value={user.email} 
                  className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl pl-12 pr-4 py-3.5 text-sm font-bold text-slate-700 dark:text-slate-300 outline-none" 
                />
              </div>
            </div>

            <div className="relative">
              <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">Nível de Acesso</label>
              <div className="relative">
                <ShieldCheck size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text" 
                  readOnly 
                  value={user.role} 
                  className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl pl-12 pr-4 py-3.5 text-sm font-bold text-slate-700 dark:text-slate-300 outline-none" 
                />
              </div>
            </div>
          </div>

          <div className="pt-4">
            <Button 
                variant="secondary"
                className="w-full py-4 text-[11px] h-14 !rounded-2xl shadow-xl hover:!bg-red-600"
                onClick={onLogout}
                icon={<LogOut size={16} />}
            >
                Terminar Sessão / Logout
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileModal;
