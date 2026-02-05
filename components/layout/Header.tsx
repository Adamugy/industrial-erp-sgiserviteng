import React, { useRef, useState, useEffect } from 'react';
import { 
  Bell, 
  Search, 
  Settings, 
  LogOut, 
  User as UserIcon,
  Menu,
  ChevronDown,
  Clock,
  PlusCircle
} from 'lucide-react';
import { Badge } from '../common/UIElements';

interface HeaderProps {
  user: any;
  unreadCount: number;
  notifications: any[];
  onToggleSidebar: () => void;
  onOpenProfile: () => void;
  onLogout: () => void;
  onNewOS: () => void;
}

const Header: React.FC<HeaderProps> = ({ 
  user, 
  unreadCount, 
  notifications, 
  onToggleSidebar, 
  onOpenProfile,
  onLogout,
  onNewOS 
}) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="h-20 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-100 dark:border-slate-800 px-4 lg:px-8 flex items-center justify-between sticky top-0 z-40">
      <div className="flex items-center gap-4">
        <button 
          onClick={onToggleSidebar}
          className="p-2.5 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
        >
          <Menu size={20} />
        </button>
        
        <div className="hidden md:flex items-center bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl px-4 py-2 w-72 transition-all focus-within:ring-2 focus-within:ring-indigo-100 focus-within:border-indigo-300">
          <Search size={16} className="text-slate-400" />
          <input 
            type="text" 
            placeholder="Procurar em obras, ativos..." 
            className="bg-transparent border-none outline-none text-xs font-medium ml-3 w-full text-slate-700 dark:text-slate-200 placeholder:text-slate-400"
          />
        </div>

        <button 
          onClick={onNewOS}
          className="flex items-center gap-2 px-4 py-2 bg-slate-900 border border-slate-900 dark:border-slate-700 rounded-xl text-white hover:bg-slate-800 transition-all shadow-sm"
        >
          <PlusCircle size={16} />
          <span className="text-[10px] font-black uppercase tracking-widest hidden sm:inline">Abrir OS</span>
        </button>
      </div>

      <div className="flex items-center gap-2 lg:gap-4">
        {/* Notifications */}
        <div className="relative" ref={notificationRef}>
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className={`p-2.5 rounded-xl transition-all relative ${showNotifications ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30' : 'text-slate-500 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800'}`}
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute top-2 right-2 w-4 h-4 bg-red-500 border-2 border-white dark:border-slate-900 rounded-full text-[8px] font-black text-white flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-3 w-80 lg:w-96 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden animate-in fade-in slide-in-from-top-4 duration-200">
              <div className="p-5 border-b border-slate-50 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
                <h4 className="text-xs font-black uppercase tracking-widest text-slate-800 dark:text-white">Notificações</h4>
                <Badge variant="info">{unreadCount} Novas</Badge>
              </div>
              <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                {notifications.length > 0 ? (
                  notifications.map((n, i) => (
                    <div key={i} className={`p-4 border-b border-slate-50 dark:border-slate-800 flex gap-3 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer ${!n.lido ? 'bg-indigo-50/30 dark:bg-indigo-900/10' : ''}`}>
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                        n.tipo === 'URGENTE' ? 'bg-red-100 text-red-600' : 
                        n.tipo === 'ALERTA' ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-600'
                      }`}>
                        <Clock size={14} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{n.titulo}</p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">{n.mensagem}</p>
                        <span className="text-[9px] text-slate-400 mt-2 block">Há 5 minutos</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-12 text-center text-slate-400">
                    <p className="text-sm font-medium">Sem notificações novas</p>
                  </div>
                )}
              </div>
              <button className="w-full py-3 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 bg-slate-50 dark:bg-slate-800/50 transition-colors">
                Ver Todas as Notificações
              </button>
            </div>
          )}
        </div>

        <div className="w-px h-6 bg-slate-200 dark:bg-slate-800 mx-1 hidden sm:block"></div>

        {/* User Profile */}
        <div className="flex items-center gap-3 pl-2 lg:pl-4 group cursor-pointer" onClick={onOpenProfile}>
          <div className="hidden sm:block text-right">
            <p className="text-xs font-black text-slate-900 dark:text-white leading-none">{user.name}</p>
            <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 mt-1 uppercase tracking-tighter">{user.role}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-900 dark:bg-slate-800 text-white flex items-center justify-center text-sm font-black border-2 border-white dark:border-slate-800 shadow-sm transition-transform group-hover:scale-105">
            {user.avatar || user.name.charAt(0)}
          </div>
          <ChevronDown size={14} className="text-slate-400 hidden lg:block transition-transform group-hover:translate-y-0.5" />
        </div>
      </div>
    </header>
  );
};

export default Header;
