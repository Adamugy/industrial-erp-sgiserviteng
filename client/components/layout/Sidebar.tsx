import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Calendar, 
  FileText, 
  HardHat, 
  Users, 
  Package, 
  Truck, 
  IdCard, 
  ShieldCheck, 
  Link, 
  FileBarChart,
  PlusCircle,
  Menu,
  X,
  Settings
} from 'lucide-react';
import { UserRole } from '../AuthContext';

interface MenuItem {
  path: string;
  icon: React.ReactNode;
  label: string;
  roles: UserRole[];
}

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  userRole: UserRole;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, setIsOpen, userRole }) => {
  const menuItems: MenuItem[] = [
    { path: '/', icon: <LayoutDashboard size={20} />, label: 'Dashboard', roles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.TECH, UserRole.SAFETY] },
    { path: '/agenda', icon: <Calendar size={20} />, label: 'Agenda & Alertas', roles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.TECH, UserRole.SAFETY] },
    { path: '/crm', icon: <FileText size={20} />, label: 'Contratos & Propostas', roles: [UserRole.ADMIN, UserRole.MANAGER] },
    { path: '/projects', icon: <HardHat size={20} />, label: 'Obras & OS', roles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.TECH, UserRole.SAFETY] },
    { path: '/teams', icon: <Users size={20} />, label: 'Equipas', roles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.SAFETY] },
    { path: '/inventory', icon: <Package size={20} />, label: 'Estoque', roles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.TECH] },
    { path: '/assets', icon: <Truck size={20} />, label: 'Ativos & Frota', roles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.TECH, UserRole.SAFETY] },
    { path: '/contractors', icon: <IdCard size={20} />, label: 'Contratantes', roles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.SAFETY] },
    { path: '/sst', icon: <ShieldCheck size={20} />, label: 'Qualidade/SST', roles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.TECH, UserRole.SAFETY] },
    { path: '/integrations', icon: <Link size={20} />, label: 'Integrações', roles: [UserRole.ADMIN, UserRole.MANAGER] },
    { path: '/reports', icon: <FileBarChart size={20} />, label: 'Relatórios', roles: [UserRole.ADMIN, UserRole.SAFETY] },
  ];

  const visibleMenuItems = menuItems.filter(item => item.roles.includes(userRole));

  const closeOnMobile = () => {
    if (window.innerWidth < 1024) setIsOpen(false);
  };

  const linkClass = (isActive: boolean) => `
    flex items-center h-11 px-3 rounded-control transition-colors group relative
    ${isActive
      ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-400'
      : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800/50'}
    ${!isOpen ? 'lg:justify-center' : ''}
  `;

  return (
    <>
      {/* Mobile backdrop */}
      <div
        aria-hidden="true"
        onClick={() => setIsOpen(false)}
        className={`fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm lg:hidden transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
      />
      <aside
        aria-label="Navegação principal"
        className={`fixed inset-y-0 left-0 z-50 lg:relative bg-white dark:bg-slate-900 border-r border-slate-100 dark:border-slate-800 transition-[width,transform] duration-300 ease-out-expo flex flex-col shrink-0 ${isOpen ? 'w-64 translate-x-0 shadow-overlay lg:shadow-none' : 'w-64 lg:w-20 -translate-x-full lg:translate-x-0'}`}
      >
        <div className={`h-16 lg:h-20 px-5 flex items-center justify-between shrink-0 ${!isOpen ? 'lg:justify-center lg:px-0' : ''}`}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-indigo-600 rounded-control flex items-center justify-center text-white font-black text-xs shadow-lg shadow-indigo-200 dark:shadow-none">SGI</div>
            <span className={`font-black text-slate-800 dark:text-white tracking-tight text-sm ${!isOpen ? 'lg:hidden' : ''}`} translate="no">SERVITENG_ERP</span>
          </div>
          <button
            type="button"
            aria-label="Fechar menu"
            onClick={() => setIsOpen(false)}
            className="lg:hidden w-9 h-9 inline-flex items-center justify-center rounded-control text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <X size={20} aria-hidden="true" />
          </button>
        </div>

        <nav className="flex-1 px-3 lg:px-4 py-3 space-y-1 overflow-y-auto overflow-x-hidden custom-scrollbar">
          {visibleMenuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              onClick={closeOnMobile}
              aria-label={!isOpen ? item.label : undefined}
              className={({ isActive }) => linkClass(isActive)}
            >
              <span aria-hidden="true" className="transition-transform duration-200 group-hover:scale-110 shrink-0">{item.icon}</span>
              <span className={`ml-3 text-xs font-bold tracking-tight truncate ${!isOpen ? 'lg:hidden' : ''}`}>{item.label}</span>
              {!isOpen && (
                <span role="tooltip" className="hidden lg:block absolute left-full ml-3 px-2.5 py-1.5 bg-slate-900 text-white text-2xs font-semibold rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible group-focus-visible:opacity-100 group-focus-visible:visible transition whitespace-nowrap z-[100] shadow-raised">
                  {item.label}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="p-3 lg:p-4 border-t border-slate-100 dark:border-slate-800">
          <NavLink
            to="/profile"
            onClick={closeOnMobile}
            aria-label={!isOpen ? 'O meu Perfil' : undefined}
            className={({ isActive }) => linkClass(isActive)}
          >
            <Settings size={20} aria-hidden="true" className="shrink-0 transition-transform duration-200 group-hover:rotate-45" />
            <span className={`ml-3 text-xs font-bold tracking-tight ${!isOpen ? 'lg:hidden' : ''}`}>O meu Perfil</span>
          </NavLink>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
