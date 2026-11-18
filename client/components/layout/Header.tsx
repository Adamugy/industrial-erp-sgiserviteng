import React, { useRef, useState, useEffect } from 'react';
import {
  Bell,
  Search,
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
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setShowNotifications(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  return (
    <header className="h-16 lg:h-20 shrink-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-100 dark:border-slate-800 px-4 lg:px-8 flex items-center justify-between gap-3 sticky top-0 z-40">
      <div className="flex items-center gap-2 sm:gap-3 lg:gap-4 min-w-0">
        <button
          type="button"
          aria-label="Alternar menu lateral"
          onClick={onToggleSidebar}
          className="w-10 h-10 shrink-0 inline-flex items-center justify-center bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-control hover:bg-slate-100 active:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
        >
          <Menu size={20} aria-hidden="true" />
        </button>

        <label className="hidden md:flex items-center bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-control px-4 h-10 w-64 xl:w-80 transition focus-within:ring-2 focus-within:ring-indigo-100 focus-within:border-indigo-300 hover:border-slate-200">
          <Search size={16} className="text-slate-400 shrink-0" aria-hidden="true" />
          <span className="sr-only">Procurar</span>
          <input
            type="search"
            name="q"
            autoComplete="off"
            placeholder="Procurar em obras, ativos…"
            className="bg-transparent border-none outline-none text-xs font-medium ml-3 w-full text-slate-700 dark:text-slate-200 placeholder:text-slate-400 focus-visible:outline-none"
          />
        </label>

        <button
          type="button"
          onClick={onNewOS}
          aria-label="Abrir OS"
          className="h-10 shrink-0 inline-flex items-center gap-2 px-3 sm:px-4 bg-slate-900 border border-slate-900 dark:border-slate-700 rounded-control text-white hover:bg-slate-800 active:scale-[0.98] transition shadow-sm"
        >
          <PlusCircle size={16} aria-hidden="true" />
          <span className="text-2xs font-black uppercase tracking-widest hidden sm:inline">Abrir OS</span>
        </button>
      </div>

      <div className="flex items-center gap-1 sm:gap-2 lg:gap-4 shrink-0">
        {/* Notifications */}
        <div className="relative" ref={notificationRef}>
          <button
            type="button"
            aria-label={unreadCount > 0 ? `Notificações (${unreadCount} novas)` : 'Notificações'}
            aria-expanded={showNotifications}
            aria-haspopup="true"
            onClick={() => setShowNotifications(!showNotifications)}
            className={`w-10 h-10 inline-flex items-center justify-center rounded-control transition relative ${showNotifications ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30' : 'text-slate-500 hover:bg-slate-50 active:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'}`}
          >
            <Bell size={20} aria-hidden="true" />
            {unreadCount > 0 && (
              <span aria-hidden="true" className="absolute top-1.5 right-1.5 min-w-4 h-4 px-0.5 bg-red-500 border-2 border-white dark:border-slate-900 rounded-full text-3xs leading-none font-black text-white flex items-center justify-center tabular-nums">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div
              role="dialog"
              aria-label="Notificações"
              className="fixed sm:absolute inset-x-3 sm:inset-x-auto top-[4.5rem] sm:top-auto sm:right-0 sm:mt-3 sm:w-96 bg-white dark:bg-slate-900 rounded-card shadow-overlay border border-slate-100 dark:border-slate-800 overflow-hidden animate-scale-in origin-top-right"
            >
              <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
                <h4 className="text-xs font-black uppercase tracking-widest text-slate-800 dark:text-white">Notificações</h4>
                <Badge variant="info">{unreadCount} Novas</Badge>
              </div>
              <div className="max-h-[400px] overflow-y-auto overscroll-contain custom-scrollbar" aria-live="polite">
                {notifications.length > 0 ? (
                  notifications.map((n, i) => (
                    <div key={i} className={`p-4 border-b border-slate-50 dark:border-slate-800 flex gap-3 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors ${!n.lido ? 'bg-indigo-50/30 dark:bg-indigo-900/10' : ''}`}>
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                        n.tipo === 'URGENTE' ? 'bg-red-100 text-red-600' :
                        n.tipo === 'ALERTA' ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-600'
                      }`}>
                        <Clock size={14} aria-hidden="true" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{n.titulo}</p>
                        <p className="text-2xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">{n.mensagem}</p>
                        <span className="text-3xs text-slate-400 mt-2 block">Há 5 minutos</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-12 text-center text-slate-400">
                    <p className="text-sm font-medium">Sem notificações novas</p>
                  </div>
                )}
              </div>
              <button type="button" className="w-full py-3 text-2xs font-black uppercase tracking-widest text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 bg-slate-50 dark:bg-slate-800/50 transition-colors">
                Ver Todas as Notificações
              </button>
            </div>
          )}
        </div>

        <div className="w-px h-6 bg-slate-200 dark:bg-slate-800 mx-1 hidden sm:block" aria-hidden="true"></div>

        {/* User Profile */}
        <button
          type="button"
          onClick={onOpenProfile}
          aria-label={`Perfil de ${user.name}`}
          className="flex items-center gap-3 pl-1 sm:pl-2 lg:pl-3 pr-1 py-1 rounded-control group hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-left"
        >
          <div className="hidden sm:block text-right">
            <p className="text-xs font-black text-slate-900 dark:text-white leading-none">{user.name}</p>
            <p className="text-3xs font-bold text-slate-400 dark:text-slate-500 mt-1 uppercase tracking-wide">{user.role}</p>
          </div>
          <div className="w-10 h-10 rounded-control bg-slate-900 dark:bg-slate-800 text-white flex items-center justify-center text-sm font-black border-2 border-white dark:border-slate-800 shadow-sm transition-transform group-hover:scale-105">
            {user.avatar || user.name.charAt(0)}
          </div>
          <ChevronDown size={14} aria-hidden="true" className="text-slate-400 hidden lg:block transition-transform group-hover:translate-y-0.5" />
        </button>
      </div>
    </header>
  );
};

export default Header;
