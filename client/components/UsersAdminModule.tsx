import React, { useEffect, useMemo, useState } from 'react';
import { Check, X, UserCheck, Users as UsersIcon, ShieldAlert, Power } from 'lucide-react';
import { api } from '../../connectors/api/client';
import { useAuth, ROLE_LABELS, UserRole } from './AuthContext';

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar: string | null;
  active: boolean;
  approvalStatus: 'PENDING' | 'APPROVED' | 'REJECTED';
  requestedRole: UserRole | null;
  onboardingCompleted: boolean;
  department: string | null;
  jobTitle: string | null;
  emailVerified: boolean;
  createdAt: string;
}

const STATUS_BADGE: Record<AdminUser['approvalStatus'], string> = {
  PENDING: 'bg-amber-50 text-amber-700 border-amber-200',
  APPROVED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  REJECTED: 'bg-red-50 text-red-700 border-red-200',
};
const STATUS_LABEL: Record<AdminUser['approvalStatus'], string> = {
  PENDING: 'Pendente', APPROVED: 'Aprovado', REJECTED: 'Recusado',
};

const roles = Object.values(UserRole);

const UsersAdminModule: React.FC = () => {
  const { user: me } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState<'requests' | 'all'>('requests');
  const [roleChoice, setRoleChoice] = useState<Record<string, UserRole>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState('');

  const load = async () => {
    try {
      setError('');
      setUsers(await api.users.list());
    } catch (err: any) {
      setError(err.message || 'Não foi possível carregar os utilizadores.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const requests = useMemo(
    () => users.filter((u) => u.approvalStatus === 'PENDING' || (u.requestedRole && u.requestedRole !== u.role)),
    [users]
  );
  const shown = tab === 'requests' ? requests : users;

  const run = async (id: string, action: () => Promise<any>, success: (u: AdminUser) => string) => {
    setBusy(id);
    setError('');
    setNotice('');
    try {
      const updated = await action();
      setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, ...updated } : u)));
      setNotice(success({ ...(users.find((u) => u.id === id) as AdminUser), ...updated }));
    } catch (err: any) {
      setError(err.message || 'A ação falhou.');
    } finally {
      setBusy(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div role="status" className="w-8 h-8 border-[3px] border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 stagger">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 tracking-tight">Utilizadores</h1>
          <p className="text-slate-500 text-sm mt-1">Aprovar pedidos de acesso e gerir perfis da equipa.</p>
        </div>
        <div role="tablist" aria-label="Filtro" className="inline-flex p-1 bg-white border border-slate-200 rounded-control shadow-card">
          {([['requests', `Pedidos (${requests.length})`], ['all', `Todos (${users.length})`]] as const).map(([k, label]) => (
            <button
              key={k}
              type="button"
              role="tab"
              aria-selected={tab === k}
              onClick={() => setTab(k)}
              className={`h-9 px-4 rounded-lg text-xs font-bold transition ${tab === k ? 'bg-slate-900 text-white' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div aria-live="polite">
        {error && <p role="alert" className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-control p-3">{error}</p>}
        {notice && !error && <p role="status" className="text-sm text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-control p-3 animate-fade-in">{notice}</p>}
      </div>

      {shown.length === 0 ? (
        <div className="py-16 text-center bg-white border border-dashed border-slate-200 rounded-panel">
          <UserCheck size={32} className="mx-auto mb-3 text-slate-300" aria-hidden="true" />
          <p className="text-sm font-semibold text-slate-500">{tab === 'requests' ? 'Sem pedidos pendentes.' : 'Sem utilizadores.'}</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {shown.map((u) => {
            const isMe = u.id === me?.id;
            const chosen = roleChoice[u.id] ?? u.requestedRole ?? u.role;
            const pendingRequest = u.approvalStatus === 'PENDING' || (u.requestedRole && u.requestedRole !== u.role);
            return (
              <li key={u.id} className="bg-white border border-slate-200/80 rounded-card shadow-card p-4 sm:p-5">
                <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-11 h-11 shrink-0 rounded-control bg-slate-900 text-white flex items-center justify-center text-sm font-black">
                      {u.avatar || u.name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-slate-900 truncate">{u.name}{isMe && <span className="text-slate-400 font-medium"> (você)</span>}</p>
                      <p className="text-xs text-slate-500 truncate">{u.email}{u.emailVerified && <span className="ml-1 text-emerald-600">· verificado</span>}</p>
                      <p className="text-2xs text-slate-500 mt-1 truncate">
                        {[u.jobTitle, u.department].filter(Boolean).join(' · ') || (u.onboardingCompleted ? '—' : 'Onboarding por concluir')}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-2xs">
                    <span className={`px-2 py-1 rounded-md border font-bold ${STATUS_BADGE[u.approvalStatus]}`}>{STATUS_LABEL[u.approvalStatus]}</span>
                    <span className="px-2 py-1 rounded-md border border-slate-200 bg-slate-50 text-slate-600 font-bold">{ROLE_LABELS[u.role]}</span>
                    {u.requestedRole && u.requestedRole !== u.role && (
                      <span className="px-2 py-1 rounded-md border border-indigo-200 bg-indigo-50 text-indigo-700 font-bold inline-flex items-center gap-1">
                        <ShieldAlert size={12} aria-hidden="true" /> Pede: {ROLE_LABELS[u.requestedRole]}
                      </span>
                    )}
                    {!u.active && <span className="px-2 py-1 rounded-md border border-slate-300 bg-slate-100 text-slate-600 font-bold">Inativo</span>}
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <label htmlFor={`role-${u.id}`} className="sr-only">Perfil a atribuir a {u.name}</label>
                    <select
                      id={`role-${u.id}`}
                      value={chosen}
                      disabled={isMe || busy === u.id}
                      onChange={(e) => setRoleChoice((p) => ({ ...p, [u.id]: e.target.value as UserRole }))}
                      className="h-10 px-3 bg-white border border-slate-200 rounded-control text-xs font-semibold text-slate-700 hover:border-slate-300"
                    >
                      {roles.map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
                    </select>

                    {pendingRequest || chosen !== u.role ? (
                      <button
                        type="button"
                        disabled={isMe || busy === u.id}
                        onClick={() => run(u.id, () => api.users.approve(u.id, chosen), (x) => `${x.name} aprovado(a) como ${ROLE_LABELS[x.role]}.`)}
                        className="h-10 px-4 inline-flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-control transition disabled:opacity-40"
                      >
                        <Check size={14} aria-hidden="true" /> Aprovar
                      </button>
                    ) : null}

                    {pendingRequest && (
                      <button
                        type="button"
                        disabled={isMe || busy === u.id}
                        onClick={() => run(u.id, () => api.users.reject(u.id), (x) => `Pedido de ${x.name} recusado.`)}
                        className="h-10 px-4 inline-flex items-center gap-1.5 bg-white border border-slate-200 hover:border-red-300 hover:bg-red-50 text-red-600 text-xs font-bold rounded-control transition disabled:opacity-40"
                      >
                        <X size={14} aria-hidden="true" /> Recusar
                      </button>
                    )}

                    {u.approvalStatus === 'APPROVED' && !isMe && (
                      <button
                        type="button"
                        disabled={busy === u.id}
                        aria-label={u.active ? `Desativar ${u.name}` : `Reativar ${u.name}`}
                        title={u.active ? 'Desativar' : 'Reativar'}
                        onClick={() => run(u.id, () => api.users.update(u.id, { active: !u.active }), (x) => `${x.name} ${x.active ? 'reativado(a)' : 'desativado(a)'}.`)}
                        className="w-10 h-10 inline-flex items-center justify-center bg-white border border-slate-200 hover:bg-slate-50 text-slate-500 rounded-control transition disabled:opacity-40"
                      >
                        <Power size={14} aria-hidden="true" />
                      </button>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <p className="text-2xs text-slate-500 flex items-center gap-1.5">
        <UsersIcon size={12} aria-hidden="true" /> As alterações de perfil têm efeito imediato e ficam registadas no histórico de auditoria.
      </p>
    </div>
  );
};

export default UsersAdminModule;
