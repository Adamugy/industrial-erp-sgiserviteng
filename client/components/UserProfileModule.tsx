import React, { useState } from 'react';
import { FaIcon } from './common/FaIcon';
import { useAuth, UserRole } from './AuthContext';

const UserProfileModule: React.FC = () => {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  
  if (!user) return null;

  // Simulação de estados para formulário
  const [profileData, setProfileData] = useState({
    fullName: user.name,
    username: 'ricardo_sgi_admin',
    email: 'ricardo.santos@sgiman.pt',
    role: user.role,
    department: 'Manutenção Industrial / Projetos',
    location: 'Sede Central - Porto',
    notifications: true,
    twoFactor: false
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsEditing(false);
    alert("Perfil atualizado com sucesso no servidor SGI.");
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header do Módulo */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight italic">O meu Perfil</h2>
          <p className="text-slate-500 text-sm font-medium">Gestão de identidade, segurança e preferências de acesso.</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setIsEditing(!isEditing)}
            className={`px-6 py-2.5 rounded-xl text-2xs font-black uppercase tracking-widest transition ${
              isEditing ? 'bg-slate-200 text-slate-600' : 'bg-slate-900 text-white shadow-xl shadow-slate-200'
            }`}
          >
            {isEditing ? 'Cancelar Edição' : 'Editar Perfil'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Coluna de Identidade */}
        <div className="lg:col-span-1 space-y-8">
          <div className="bg-white rounded-panel border border-slate-200 shadow-sm overflow-hidden text-center p-8 relative">
            <div className="absolute top-0 inset-x-0 h-32 bg-slate-900 z-0"></div>
            <div className="relative z-10 flex flex-col items-center">
              <div className="w-32 h-32 rounded-panel bg-emerald-500 border-8 border-white text-white flex items-center justify-center text-5xl font-black shadow-2xl mb-4 group cursor-pointer overflow-hidden">
                {user.avatar}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                  <FaIcon name="fa-camera" className="text-xl" />
                </div>
              </div>
              <h3 className="text-xl font-black text-slate-900 tracking-tight">{profileData.fullName}</h3>
              <p className="text-2xs font-black uppercase tracking-widest text-emerald-500 mb-6">{profileData.role}</p>
              
              <div className="w-full flex justify-between items-center py-4 border-t border-slate-50">
                <span className="text-2xs font-black text-slate-400 uppercase">Estado</span>
                <span className="text-2xs font-black text-emerald-600 px-3 py-1 bg-emerald-50 rounded-full border border-emerald-100 uppercase">Online</span>
              </div>
              <div className="w-full flex justify-between items-center py-4 border-t border-slate-50">
                <span className="text-2xs font-black text-slate-400 uppercase">Nível Acesso</span>
                <span className="text-2xs font-black text-slate-700">Administrador SGI</span>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 rounded-panel p-8 text-white shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
               <FaIcon name="fa-shield-halved" className="text-8xl" />
            </div>
            <h4 className="text-2xs font-black text-emerald-400 uppercase tracking-widest mb-6">Segurança da Conta</h4>
            <div className="space-y-4">
              <button className="w-full py-4 bg-white/5 border border-white/10 rounded-2xl text-2xs font-black uppercase tracking-widest hover:bg-white/10 transition-colors flex items-center justify-center">
                <FaIcon name="fa-lock" className="mr-2 text-emerald-400" /> Alterar Password
              </button>
              <button className="w-full py-4 bg-white/5 border border-white/10 rounded-2xl text-2xs font-black uppercase tracking-widest hover:bg-white/10 transition-colors flex items-center justify-center">
                <FaIcon name="fa-mobile-screen" className="mr-2 text-emerald-400" /> Ativar 2FA (SMS/App)
              </button>
            </div>
          </div>
        </div>

        {/* Coluna de Dados e Configurações */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white rounded-panel border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-8 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <h3 className="font-black text-slate-800 uppercase tracking-tight text-xs flex items-center">
                <FaIcon name="fa-id-card" className="mr-2 text-blue-500" /> Informação Detalhada
              </h3>
              {!isEditing && <span className="text-3xs font-bold text-slate-400 uppercase">Modo de Visualização</span>}
            </div>
            
            <form onSubmit={handleSave} className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <label htmlFor="userprofilem-nome-completo" className="block text-2xs font-black text-slate-400 uppercase mb-2 tracking-widest">Nome Completo</label>
                  <input id="userprofilem-nome-completo" 
                    type="text" 
                    readOnly={!isEditing}
                    value={profileData.fullName}
                    onChange={(e) => setProfileData({...profileData, fullName: e.target.value})}
                    className={`w-full rounded-2xl px-5 py-4 text-sm font-bold outline-none transition ${
                      isEditing ? 'bg-slate-50 border border-slate-200 focus:border-blue-500' : 'bg-transparent text-slate-700'
                    }`}
                  />
                </div>
                <div>
                  <label htmlFor="userprofilem-nome-de-utilizador" className="block text-2xs font-black text-slate-400 uppercase mb-2 tracking-widest">Nome de Utilizador</label>
                  <input id="userprofilem-nome-de-utilizador" 
                    type="text" 
                    readOnly={!isEditing}
                    value={profileData.username}
                    onChange={(e) => setProfileData({...profileData, username: e.target.value})}
                    className={`w-full rounded-2xl px-5 py-4 text-sm font-bold outline-none transition ${
                      isEditing ? 'bg-slate-50 border border-slate-200 focus:border-blue-500' : 'bg-transparent text-slate-700'
                    }`}
                  />
                </div>
                <div className="md:col-span-2">
                  <label htmlFor="userprofilem-email-corporativo" className="block text-2xs font-black text-slate-400 uppercase mb-2 tracking-widest">Email Corporativo</label>
                  <input id="userprofilem-email-corporativo" 
                    type="email" 
                    readOnly={!isEditing}
                    value={profileData.email}
                    onChange={(e) => setProfileData({...profileData, email: e.target.value})}
                    className={`w-full rounded-2xl px-5 py-4 text-sm font-bold outline-none transition ${
                      isEditing ? 'bg-slate-50 border border-slate-200 focus:border-blue-500' : 'bg-transparent text-slate-700'
                    }`}
                  />
                </div>
                <div>
                  <p className="block text-2xs font-black text-slate-400 uppercase mb-2 tracking-widest">Departamento</p>
                  <p className="px-5 py-4 text-sm font-bold text-slate-700 bg-slate-50 rounded-2xl border border-slate-100">{profileData.department}</p>
                </div>
                <div>
                  <p className="block text-2xs font-black text-slate-400 uppercase mb-2 tracking-widest">Localização Padrão</p>
                  <p className="px-5 py-4 text-sm font-bold text-slate-700 bg-slate-50 rounded-2xl border border-slate-100">{profileData.location}</p>
                </div>
              </div>

              {isEditing && (
                <div className="mt-10 pt-8 border-t border-slate-100 flex justify-end gap-3">
                  <button type="button" onClick={() => setIsEditing(false)} className="px-8 py-4 border border-slate-200 rounded-2xl text-2xs font-black uppercase tracking-widest">Cancelar</button>
                  <button type="submit" className="px-10 py-4 bg-emerald-500 text-white rounded-2xl text-2xs font-black uppercase tracking-widest shadow-xl shadow-emerald-100 hover:bg-emerald-600">Guardar Alterações</button>
                </div>
              )}
            </form>
          </div>

          <div className="bg-white rounded-panel border border-slate-200 shadow-sm p-8">
            <h3 className="font-black text-slate-800 uppercase tracking-tight text-xs mb-6 flex items-center">
              <FaIcon name="fa-sliders" className="mr-2 text-blue-500" /> Preferências do Sistema
            </h3>
            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div>
                  <p className="text-xs font-black text-slate-800">Notificações Push / Email</p>
                  <p className="text-2xs text-slate-500 font-medium">Alertas de novas OS, SST e Auditorias.</p>
                </div>
                <button 
                  onClick={() => setProfileData({...profileData, notifications: !profileData.notifications})}
                  className={`w-12 h-6 rounded-full transition relative ${profileData.notifications ? 'bg-emerald-500' : 'bg-slate-300'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition ${profileData.notifications ? 'right-1' : 'left-1'}`} />
                </button>
              </div>
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div>
                  <p className="text-xs font-black text-slate-800">Relatórios Automáticos Semanais</p>
                  <p className="text-2xs text-slate-500 font-medium">Receber resumo de KPIs toda segunda-feira.</p>
                </div>
                <button className="w-12 h-6 rounded-full bg-slate-200 relative">
                  <div className="absolute top-1 left-1 w-4 h-4 bg-white rounded-full" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfileModule;
