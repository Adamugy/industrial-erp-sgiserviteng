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

  return (
    <aside className={`fixed inset-y-0 left-0 z-50 lg:relative bg-white dark:bg-slate-900 border-r border-slate-100 dark:border-slate-800 transition-all duration-300 flex flex-col ${isOpen ? 'w-64 translate-x-0' : 'w-20 lg:w-20 -translate-x-full lg:translate-x-0'}`}>
      <div className="p-6 flex items-center justify-between">
        <div className={`flex items-center gap-3 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 lg:opacity-100 flex justify-center w-full'}`}>
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-black text-xs shadow-lg shadow-indigo-200 dark:shadow-none">SGI</div>
          {isOpen && <span className="font-black text-slate-800 dark:text-white tracking-tighter text-sm">SERVITENG_ERP</span>}
        </div>
        <button onClick={() => setIsOpen(!isOpen)} className="lg:hidden text-slate-400 hover:text-slate-600">
          <X size={20} />
        </button>
      </div>

      <div className="flex-1 px-4 py-4 space-y-1 overflow-y-auto overflow-x-hidden custom-scrollbar">
        {visibleMenuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `
              flex items-center px-3 py-3 rounded-xl transition-all group relative
              ${isActive 
                ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-400' 
                : 'text-slate-500 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800/50'}
              ${!isOpen && 'justify-center'}
            `}
            title={!isOpen ? item.label : ''}
          >
            <span className={`transition-transform duration-200 group-hover:scale-110`}>{item.icon}</span>
            {isOpen && <span className="ml-3 text-xs font-bold tracking-tight">{item.label}</span>}
            {!isOpen && (
              <div className="absolute left-full ml-4 px-2 py-1 bg-slate-900 text-white text-[10px] rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-[100]">
                {item.label}
              </div>
            )}
          </NavLink>
        ))}
      </div>

      <div className="p-4 border-t border-slate-50 dark:border-slate-800">
        <NavLink
          to="/profile"
          className={({ isActive }) => `
            w-full flex items-center px-4 py-3 rounded-xl transition-all group relative
            ${isActive 
              ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-400' 
              : 'text-slate-500 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800/50'}
            ${!isOpen && 'justify-center'}
          `}
          title={!isOpen ? 'O meu Perfil' : ''}
        >
          <Settings size={20} className="transition-transform duration-200 group-hover:rotate-45" />
          {isOpen && <span className="ml-3 text-xs font-bold tracking-tight">O meu Perfil</span>}
        </NavLink>
      </div>
    </aside>
  );
};

export default Sidebar;
