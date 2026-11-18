import React, { useState } from 'react';
import { Crown, ClipboardList, ShieldCheck, HardHat, Wrench, ArrowLeft, ArrowRight, Check, Clock, LogOut, RefreshCw } from 'lucide-react';
import { useAuth, ROLE_LABELS, UserRole } from '../AuthContext';

/** Funções que o utilizador pode pedir (o servidor mapeia para papéis e exige aprovação). */
const FUNCTIONS = [
  { id: 'CEO', role: UserRole.ADMIN, icon: Crown, title: 'CEO / Direção', desc: 'Visão completa da empresa: finanças, obras, qualidade e equipas.' },
  { id: 'SECRETARIA', role: UserRole.SECRETARY, icon: ClipboardList, title: 'Secretária', desc: 'Agenda, propostas, clientes e documentação.' },
  { id: 'GESTOR_QA', role: UserRole.SAFETY, icon: ShieldCheck, title: 'Gestor de Qualidade / SST', desc: 'ISO 9001 e 45001, não conformidades, auditorias e segurança.' },
  { id: 'GESTOR_OBRAS', role: UserRole.MANAGER, icon: HardHat, title: 'Gestor de Obras', desc: 'Projetos, ordens de serviço, equipas e estoque.' },
  { id: 'FUNCIONARIO', role: UserRole.TECH, icon: Wrench, title: 'Funcionário / Técnico', desc: 'As suas ordens de serviço, diário e checklists de segurança.' },
] as const;

type FunctionId = typeof FUNCTIONS[number]['id'];

const shell = 'relative min-h-dvh overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900 flex items-center justify-center px-4 py-10';
const card = 'bg-white/10 backdrop-blur-xl rounded-panel p-6 sm:p-8 border border-white/20 shadow-overlay';
const inputClass = 'w-full h-12 bg-white/10 border border-white/20 hover:border-white/30 rounded-control px-4 text-white placeholder-slate-400 focus:outline-none focus:border-emerald-400 focus:bg-white/[0.14] transition-colors';
const labelClass = 'block text-2xs font-black text-slate-300 uppercase tracking-widest mb-2';

const Grid = () => (
  <div aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-[0.07] [background-image:linear-gradient(to_right,white_1px,transparent_1px),linear-gradient(to_bottom,white_1px,transparent_1px)] [background-size:48px_48px] [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_75%)]" />
);

export const OnboardingPage: React.FC = () => {
  const { user, completeOnboarding, logout } = useAuth();
  const [step, setStep] = useState<1 | 2>(1);
  const [fn, setFn] = useState<FunctionId | null>(null);
  const [name, setName] = useState(user?.name || '');
  const [department, setDepartment] = useState(user?.department || '');
  const [jobTitle, setJobTitle] = useState(user?.jobTitle || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fn) return;
    setSaving(true);
    setError('');
    try {
      await completeOnboarding({ requestedRole: fn, name, department, jobTitle, phone });
    } catch (err: any) {
      setError(err.message || 'Não foi possível guardar.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={shell}>
      <Grid />
      <main className="relative w-full max-w-2xl stagger">
        <div className="text-center mb-8">
          <p className="text-2xs font-black text-emerald-400 uppercase tracking-widest mb-3">Passo {step} de 2</p>
          <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
            {step === 1 ? `Bem-vindo${user?.name ? `, ${user.name.split(' ')[0]}` : ''}` : 'Os seus dados'}
          </h1>
          <p className="text-slate-400 text-sm mt-3">
            {step === 1 ? 'Qual é a sua função na empresa? Assim preparamos o painel certo para si.' : 'Ajuda a equipa a identificá-lo. Pode alterar depois no perfil.'}
          </p>
          <div className="flex justify-center gap-2 mt-5" aria-hidden="true">
            <span className={`h-1.5 w-10 rounded-full ${step >= 1 ? 'bg-emerald-400' : 'bg-white/20'}`} />
            <span className={`h-1.5 w-10 rounded-full ${step >= 2 ? 'bg-emerald-400' : 'bg-white/20'}`} />
          </div>
        </div>

        <div className={card}>
          {step === 1 ? (
            <fieldset>
              <legend className="sr-only">Função na empresa</legend>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {FUNCTIONS.map((f) => {
                  const Icon = f.icon;
                  const selected = fn === f.id;
                  return (
                    <label
                      key={f.id}
                      className={`relative flex gap-4 p-4 rounded-card border cursor-pointer transition ${selected ? 'border-emerald-400 bg-emerald-400/10' : 'border-white/15 bg-white/5 hover:bg-white/10 hover:border-white/30'} ${f.id === 'FUNCIONARIO' ? 'sm:col-span-2' : ''} focus-within:outline focus-within:outline-2 focus-within:outline-emerald-400`}
                    >
                      <input type="radio" name="funcao" value={f.id} checked={selected} onChange={() => setFn(f.id)} className="sr-only" />
                      <span className={`w-11 h-11 shrink-0 rounded-control flex items-center justify-center ${selected ? 'bg-emerald-400 text-slate-900' : 'bg-white/10 text-white'}`}>
                        <Icon size={20} aria-hidden="true" />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-sm font-bold text-white">{f.title}</span>
                        <span className="block text-xs text-slate-400 mt-1 leading-relaxed">{f.desc}</span>
                      </span>
                      {selected && <Check size={18} aria-hidden="true" className="absolute top-3 right-3 text-emerald-400" />}
                    </label>
                  );
                })}
              </div>
              <div className="flex items-center justify-between gap-3 mt-6">
                <button type="button" onClick={logout} className="h-11 px-4 text-sm font-semibold text-slate-300 hover:text-white rounded-control hover:bg-white/5 transition">
                  Sair
                </button>
                <button
                  type="button"
                  disabled={!fn}
                  onClick={() => setStep(2)}
                  className="h-12 px-6 inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 active:scale-[0.99] text-white font-bold rounded-control transition shadow-lg shadow-emerald-500/30 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Continuar <ArrowRight size={16} aria-hidden="true" />
                </button>
              </div>
            </fieldset>
          ) : (
            <form onSubmit={submit} className="space-y-5">
              <div>
                <label htmlFor="onb-name" className={labelClass}>Nome completo</label>
                <input id="onb-name" className={inputClass} value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" required minLength={2} maxLength={100} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label htmlFor="onb-dept" className={labelClass}>Departamento</label>
                  <input id="onb-dept" className={inputClass} value={department} onChange={(e) => setDepartment(e.target.value)} placeholder="Ex.: Manutenção…" maxLength={100} autoComplete="organization" />
                </div>
                <div>
                  <label htmlFor="onb-job" className={labelClass}>Cargo</label>
                  <input id="onb-job" className={inputClass} value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} placeholder="Ex.: Técnica de Qualidade…" maxLength={100} autoComplete="organization-title" />
                </div>
              </div>
              <div>
                <label htmlFor="onb-phone" className={labelClass}>Telefone (opcional)</label>
                <input id="onb-phone" type="tel" inputMode="tel" className={inputClass} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+351 9xx xxx xxx" maxLength={30} autoComplete="tel" />
              </div>

              <p className="text-xs text-slate-400 bg-white/5 border border-white/10 rounded-control p-3 leading-relaxed">
                Função pedida: <strong className="text-white">{FUNCTIONS.find((f) => f.id === fn)?.title}</strong>. Um administrador confirma o acesso antes de ficar ativo.
              </p>

              <div aria-live="polite">
                {error && <p role="alert" className="text-sm text-red-200 bg-red-500/20 border border-red-500/50 rounded-control p-3">{error}</p>}
              </div>

              <div className="flex items-center justify-between gap-3">
                <button type="button" onClick={() => setStep(1)} className="h-11 px-4 inline-flex items-center gap-2 text-sm font-semibold text-slate-300 hover:text-white rounded-control hover:bg-white/5 transition">
                  <ArrowLeft size={16} aria-hidden="true" /> Voltar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  aria-busy={saving}
                  className="h-12 px-6 inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 active:scale-[0.99] text-white font-bold rounded-control transition shadow-lg shadow-emerald-500/30 disabled:opacity-50"
                >
                  {saving ? 'A guardar…' : 'Concluir'} <Check size={16} aria-hidden="true" />
                </button>
              </div>
            </form>
          )}
        </div>
      </main>
    </div>
  );
};

export const PendingApprovalPage: React.FC = () => {
  const { user, refreshUser, logout } = useAuth();
  const [checking, setChecking] = useState(false);
  const [message, setMessage] = useState('');

  const check = async () => {
    setChecking(true);
    setMessage('');
    try {
      await refreshUser();
      setMessage('Ainda a aguardar aprovação.');
    } catch {
      setMessage('Não foi possível verificar agora.');
    } finally {
      setChecking(false);
    }
  };

  const requested = user?.requestedRole ?? user?.role;

  return (
    <div className={shell}>
      <Grid />
      <main className="relative w-full max-w-md stagger text-center">
        <div className={card}>
          <div className="w-14 h-14 mx-auto mb-5 rounded-full bg-amber-400/15 text-amber-300 flex items-center justify-center">
            <Clock size={26} aria-hidden="true" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Pedido enviado</h1>
          <p className="text-slate-300 text-sm mt-3 leading-relaxed">
            Obrigado, {user?.name?.split(' ')[0]}. Um administrador vai confirmar o seu acesso
            {requested ? <> como <strong className="text-white">{ROLE_LABELS[requested as UserRole] || requested}</strong></> : null}.
            Recebe uma notificação assim que for aprovado.
          </p>
          <p className="text-2xs text-slate-400 mt-4 break-all">{user?.email}</p>

          <div aria-live="polite" className="min-h-[1.5rem] mt-4 text-xs text-slate-400">{message}</div>

          <div className="flex flex-col sm:flex-row gap-2 mt-4">
            <button
              type="button"
              onClick={check}
              disabled={checking}
              className="flex-1 h-12 inline-flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-control transition disabled:opacity-50"
            >
              <RefreshCw size={16} aria-hidden="true" className={checking ? 'animate-spin' : ''} /> Verificar estado
            </button>
            <button
              type="button"
              onClick={logout}
              className="flex-1 h-12 inline-flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/15 text-slate-200 font-semibold rounded-control transition"
            >
              <LogOut size={16} aria-hidden="true" /> Sair
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};
