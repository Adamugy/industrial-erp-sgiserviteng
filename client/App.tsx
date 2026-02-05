import React, { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import CRMModule from './components/CRMModule';
import ProjectsModule from './components/ProjectsModule';
import InventoryModule from './components/InventoryModule';
import SSTModule from './components/SSTModule';
import ReportsModule from './components/ReportsModule';
import AgendaNotificationsModule from './components/AgendaNotificationsModule';
import IntegrationsModule from './components/IntegrationsModule';
import ContractorsModule from './components/ContractorsModule';
import AssetsModule from './components/AssetsModule';
import TeamsModule from './components/TeamsModule';
import SSTFormsPreOS from './components/SSTFormsPreOS';
import LoginPage from './components/LoginPage';
import UserProfileModule from './components/UserProfileModule';
import { useAuth, RoleGuard } from './components/AuthContext';
import { api } from '../connectors/api/client';
import { syncService } from '../connectors/api/sync';

// Extracted Components
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import ProfileModal from './components/modals/ProfileModal';
import NewOSModal from './components/modals/NewOSModal';

const App: React.FC = () => {
  const { user, isLoading, isAuthenticated, logout } = useAuth();
  const [isSidebarOpen, setSidebarOpen] = useState(window.innerWidth > 1024);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showSSTFlow, setShowSSTFlow] = useState(false);
  const [showNewOSModal, setShowNewOSModal] = useState(false);
  const [newOSData, setNewOSData] = useState<any>(null);
  
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Load notifications
  useEffect(() => {
    if (isAuthenticated) {
      api.notifications.list().then(setNotifications).catch(console.error);
      api.notifications.count().then(({ unreadCount }) => setUnreadCount(unreadCount)).catch(console.error);
      
      const unsubscribe = syncService.on('notification:new', (notif: any) => {
        setNotifications(prev => [notif, ...prev]);
        setUnreadCount(prev => prev + 1);
      });
      
      return unsubscribe;
    }
  }, [isAuthenticated]);

  const handleCreateOS = (data: any) => {
    setNewOSData(data);
    setShowNewOSModal(false);
    setShowSSTFlow(true); 
  };

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 768) setSidebarOpen(false);
      else if (window.innerWidth > 1024) setSidebarOpen(true);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-400 font-bold tracking-tighter uppercase">SGI SERVITENG</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <LoginPage />;
  }

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100 overflow-hidden relative">
      <Sidebar 
        isOpen={isSidebarOpen} 
        setIsOpen={setSidebarOpen} 
        userRole={user.role} 
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <Header 
          user={user} 
          unreadCount={unreadCount} 
          notifications={notifications}
          onToggleSidebar={() => setSidebarOpen(!isSidebarOpen)}
          onOpenProfile={() => setShowProfileModal(true)}
          onLogout={logout}
          onNewOS={() => setShowNewOSModal(true)}
        />

        <main className="flex-1 overflow-y-auto p-4 lg:p-8 custom-scrollbar relative z-10 transition-all duration-300">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/crm" element={<RoleGuard roles={['ADMIN', 'MANAGER']}><CRMModule /></RoleGuard>} />
            <Route path="/projects" element={<ProjectsModule />} />
            <Route path="/inventory" element={<RoleGuard roles={['ADMIN', 'MANAGER', 'TECH']}><InventoryModule /></RoleGuard>} />
            <Route path="/assets" element={<AssetsModule />} />
            <Route path="/teams" element={<RoleGuard roles={['ADMIN', 'MANAGER', 'SAFETY']}><TeamsModule /></RoleGuard>} />
            <Route path="/contractors" element={<RoleGuard roles={['ADMIN', 'MANAGER', 'SAFETY']}><ContractorsModule /></RoleGuard>} />
            <Route path="/sst" element={<SSTModule />} />
            <Route path="/agenda" element={<AgendaNotificationsModule />} />
            <Route path="/integrations" element={<RoleGuard roles={['ADMIN', 'MANAGER']}><IntegrationsModule /></RoleGuard>} />
            <Route path="/reports" element={<RoleGuard roles={['ADMIN', 'SAFETY']}><ReportsModule /></RoleGuard>} />
            <Route path="/profile" element={<UserProfileModule />} />
          </Routes>
        </main>
      </div>

      {/* Overlays & Modals */}
      {showSSTFlow && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-xl z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <SSTFormsPreOS 
            osId={newOSData ? 'NEW' : '902-IND'} 
            initialData={newOSData}
            onComplete={() => {
              setShowSSTFlow(false);
              setNewOSData(null);
            }} 
          />
        </div>
      )}

      {showProfileModal && (
        <ProfileModal 
          user={user} 
          onClose={() => setShowProfileModal(false)} 
          onLogout={logout} 
        />
      )}

      {showNewOSModal && (
        <NewOSModal 
          onClose={() => setShowNewOSModal(false)} 
          onSubmit={handleCreateOS} 
        />
      )}
    </div>
  );
};

export default App;
