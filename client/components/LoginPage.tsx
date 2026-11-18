import React, { useEffect, useState } from 'react';
import { FaIcon } from './common/FaIcon';
import { useAuth } from './AuthContext';
import { api } from '../../connectors/api/client';

// Login de demonstração (campos pré-preenchidos + acessos rápidos): só em desenvolvimento
// ou quando VITE_DEMO_MODE=true. Nunca visível num deploy de produção normal.
const DEMO_MODE = import.meta.env.DEV || import.meta.env.VITE_DEMO_MODE === 'true';

type Mode = 'login' | 'register';

const inputClass =
  'w-full h-12 bg-white/10 border border-white/20 hover:border-white/30 rounded-control px-4 text-white placeholder-slate-400 focus:outline-none focus:border-emerald-400 focus:bg-white/[0.14] transition-colors';
const labelClass = 'block text-2xs font-black text-slate-300 uppercase tracking-widest mb-2';

const GoogleLogo = () => (
  <svg aria-hidden="true" viewBox="0 0 48 48" className="w-5 h-5 shrink-0">
    <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.2-.1-2.3-.4-3.5z"/>
    <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
    <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/>
    <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.2-.1-2.3-.4-3.5z"/>
  </svg>
);

const MicrosoftLogo = () => (
  <svg aria-hidden="true" viewBox="0 0 23 23" className="w-5 h-5 shrink-0">
    <path fill="#f35325" d="M1 1h10v10H1z"/><path fill="#81bc06" d="M12 1h10v10H12z"/>
    <path fill="#05a6f0" d="M1 12h10v10H1z"/><path fill="#ffba08" d="M12 12h10v10H12z"/>
  </svg>
);

const LoginPage: React.FC = () => {
  const { login, register, authError, clearAuthError } = useAuth();
  const [mode, setMode] = useState<Mode>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState(DEMO_MODE ? 'admin@sgiman.pt' : '');
  const [password, setPassword] = useState(DEMO_MODE ? '123456' : '');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [providers, setProviders] = useState({ google: false, microsoft: false });

  useEffect(() => {
    api.authProviders().then((p) => setProviders({ google: p.google, microsoft: p.microsoft })).catch(() => {});
  }, []);

  const shownError = error || authError || '';

  const switchMode = (next: Mode) => {
    setMode(next);
    setError('');
    clearAuthError();
    if (next === 'register') { setEmail(''); setPassword(''); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    clearAuthError();
    setIsLoading(true);
    try {
      if (mode === 'login') await login(email, password);
      else await register(name, email, password);
    } catch (err: any) {
      setError(err.message || 'Não foi possível concluir o pedido.');
    } finally {
      setIsLoading(false);
    }
  };

  const quickLogin = async (userEmail: string) => {
    setEmail(userEmail);
    setPassword('123456');
    setIsLoading(true);
    try {
      await login(userEmail, '123456');
    } catch (err: any) {
      setError(err.message || 'Erro ao fazer login');
    } finally {
      setIsLoading(false);
    }
  };

  const hasOAuth = providers.google || providers.microsoft;

  return (
    <div className="relative min-h-dvh overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900 flex items-center justify-center px-4 py-10">
      {/* Decorative engineering grid */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.07] [background-image:linear-gradient(to_right,white_1px,transparent_1px),linear-gradient(to_bottom,white_1px,transparent_1px)] [background-size:48px_48px] [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_75%)]"
      />
      <main className="relative w-full max-w-md stagger">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-black text-white tracking-tighter leading-none" translate="no">
            SGI<span className="text-emerald-400">MAN</span>
          </h1>
          <p className="text-slate-400 text-sm mt-3">Sistema de Gestão Industrial</p>
        </div>

        {/* Login Card */}
        <div className="bg-white/10 backdrop-blur-xl rounded-panel p-6 sm:p-8 border border-white/20 shadow-overlay">
          {/* Tabs */}
          <div role="tablist" aria-label="Acesso" className="grid grid-cols-2 gap-1 p-1 mb-6 bg-black/20 rounded-control">
            {(['login', 'register'] as Mode[]).map((m) => (
              <button
                key={m}
                type="button"
                role="tab"
                aria-selected={mode === m}
                onClick={() => switchMode(m)}
                className={`h-10 rounded-lg text-sm font-bold transition ${mode === m ? 'bg-white text-slate-900 shadow' : 'text-slate-300 hover:text-white hover:bg-white/5'}`}
              >
                {m === 'login' ? 'Entrar' : 'Criar conta'}
              </button>
            ))}
          </div>

          <h2 className="text-xl font-bold text-white mb-6">
            {mode === 'login' ? 'Entrar na Plataforma' : 'Criar a sua conta'}
          </h2>

          {hasOAuth && (
            <div className="space-y-2 mb-6">
              {providers.google && (
                <a
                  href={api.oauthStartUrl('google')}
                  className="h-12 w-full inline-flex items-center justify-center gap-3 bg-white hover:bg-slate-100 active:bg-slate-200 text-slate-800 font-semibold text-sm rounded-control transition"
                >
                  <GoogleLogo /> Continuar com Google
                </a>
              )}
              {providers.microsoft && (
                <a
                  href={api.oauthStartUrl('microsoft')}
                  className="h-12 w-full inline-flex items-center justify-center gap-3 bg-white hover:bg-slate-100 active:bg-slate-200 text-slate-800 font-semibold text-sm rounded-control transition"
                >
                  <MicrosoftLogo /> Continuar com Microsoft
                </a>
              )}
              <div className="flex items-center gap-3 pt-3" aria-hidden="true">
                <span className="h-px flex-1 bg-white/15" />
                <span className="text-2xs font-black text-slate-400 uppercase tracking-widest">ou com email</span>
                <span className="h-px flex-1 bg-white/15" />
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {mode === 'register' && (
              <div>
                <label htmlFor="auth-name" className={labelClass}>Nome completo</label>
                <input id="auth-name" type="text" name="name" autoComplete="name" required minLength={2} maxLength={100}
                  value={name} onChange={(e) => setName(e.target.value)} className={inputClass} placeholder="Nome e apelido" />
              </div>
            )}

            <div>
              <label htmlFor="loginpage-email" className={labelClass}>Email</label>
              <input id="loginpage-email" type="email" name="email" autoComplete={mode === 'login' ? 'username' : 'email'}
                inputMode="email" spellCheck={false} required maxLength={254}
                value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} placeholder="seu@email.pt" />
            </div>

            <div>
              <label htmlFor="loginpage-palavra-passe" className={labelClass}>Palavra-Passe</label>
              <input id="loginpage-palavra-passe" type="password" name="password"
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                required minLength={mode === 'register' ? 10 : 1} maxLength={128}
                aria-describedby={mode === 'register' ? 'auth-password-hint' : undefined}
                value={password} onChange={(e) => setPassword(e.target.value)} className={inputClass} placeholder="••••••••••" />
              {mode === 'register' && (
                <p id="auth-password-hint" className="text-2xs text-slate-400 mt-2">Mínimo 10 caracteres, com letras e números.</p>
              )}
            </div>

            <div aria-live="polite">
              {shownError && (
                <div role="alert" className="flex items-start gap-2 bg-red-500/20 border border-red-500/50 rounded-control p-3 text-red-200 text-sm animate-fade-in">
                  <FaIcon name="fa-exclamation-circle" className="mt-0.5" />
                  <span>{shownError}</span>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              aria-busy={isLoading}
              className="w-full h-14 inline-flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 active:scale-[0.99] text-white font-bold rounded-control transition shadow-lg shadow-emerald-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <><FaIcon name="fa-spinner fa-spin" />{mode === 'login' ? 'A entrar…' : 'A criar conta…'}</>
              ) : mode === 'login' ? (
                <><FaIcon name="fa-sign-in-alt" />Entrar</>
              ) : (
                <><FaIcon name="fa-user-plus" />Criar conta</>
              )}
            </button>

            {mode === 'register' && (
              <p className="text-2xs text-slate-400 text-center leading-relaxed">
                Depois de criar a conta, indique a sua função. O acesso aos dados da empresa é ativado por um administrador.
              </p>
            )}
          </form>

          {/* Quick Login Buttons (apenas demonstração) */}
          {DEMO_MODE && mode === 'login' && (
            <div className="mt-6 pt-6 border-t border-white/10">
              <p className="text-2xs font-black text-slate-400 uppercase tracking-widest mb-3 text-center">
                Login Rápido (Demo)
              </p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  ['admin@sgiman.pt', 'fa-user-shield', 'text-emerald-400', 'Admin'],
                  ['gestor@sgiman.pt', 'fa-user-tie', 'text-blue-400', 'Gestor'],
                  ['sst@sgiman.pt', 'fa-hard-hat', 'text-amber-400', 'SST'],
                  ['tecnico1@sgiman.pt', 'fa-wrench', 'text-slate-400', 'Técnico'],
                ].map(([e, icon, color, label]) => (
                  <button
                    key={e}
                    type="button"
                    onClick={() => quickLogin(e)}
                    disabled={isLoading}
                    className="h-10 inline-flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 active:bg-white/15 border border-white/10 hover:border-white/20 rounded-control px-3 text-xs font-medium text-slate-300 hover:text-white transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <FaIcon name={icon} className={color} /> {label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-slate-500 text-xs mt-6">
          © 2024 SGIServiteng. Todos os direitos reservados.
        </p>
      </main>
    </div>
  );
};

export default LoginPage;
