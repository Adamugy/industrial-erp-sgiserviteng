import React, { useState } from 'react';
import { FaIcon } from './common/FaIcon';
import { useAuth } from './AuthContext';

interface LoginPageProps {
  onLoginSuccess?: () => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const { login } = useAuth();
  const [email, setEmail] = useState('admin@sgiman.pt');
  const [password, setPassword] = useState('123456');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login(email, password);
      onLoginSuccess?.();
    } catch (err: any) {
      setError(err.message || 'Erro ao fazer login');
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
      onLoginSuccess?.();
    } catch (err: any) {
      setError(err.message || 'Erro ao fazer login');
    } finally {
      setIsLoading(false);
    }
  };

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
          <h2 className="text-xl font-bold text-white mb-6">Entrar na Plataforma</h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="loginpage-email" className="block text-2xs font-black text-slate-300 uppercase tracking-widest mb-2">
                Email
              </label>
              <input id="loginpage-email"
                type="email"
                name="email"
                autoComplete="username"
                inputMode="email"
                spellCheck={false}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-12 bg-white/10 border border-white/20 hover:border-white/30 rounded-control px-4 text-white placeholder-slate-400 focus:outline-none focus:border-emerald-400 focus:bg-white/[0.14] transition-colors"
                placeholder="seu@email.pt"
                required
              />
            </div>

            <div>
              <label htmlFor="loginpage-palavra-passe" className="block text-2xs font-black text-slate-300 uppercase tracking-widest mb-2">
                Palavra-Passe
              </label>
              <input id="loginpage-palavra-passe"
                type="password"
                name="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-12 bg-white/10 border border-white/20 hover:border-white/30 rounded-control px-4 text-white placeholder-slate-400 focus:outline-none focus:border-emerald-400 focus:bg-white/[0.14] transition-colors"
                placeholder="••••••"
                required
              />
            </div>

            <div aria-live="polite">
              {error && (
                <div role="alert" className="flex items-start gap-2 bg-red-500/20 border border-red-500/50 rounded-control p-3 text-red-200 text-sm animate-fade-in">
                  <FaIcon name="fa-exclamation-circle" className="mt-0.5" />
                  <span>{error}</span>
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
                <><FaIcon name="fa-spinner fa-spin" />A entrar…</>
              ) : (
                <><FaIcon name="fa-sign-in-alt" />Entrar</>
              )}
            </button>
          </form>

          {/* Quick Login Buttons */}
          <div className="mt-6 pt-6 border-t border-white/10">
            <p className="text-2xs font-black text-slate-400 uppercase tracking-widest mb-3 text-center">
              Login Rápido (Demo)
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => quickLogin('admin@sgiman.pt')}
                disabled={isLoading}
                className="h-10 inline-flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 active:bg-white/15 border border-white/10 hover:border-white/20 rounded-control px-3 text-xs font-medium text-slate-300 hover:text-white transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FaIcon name="fa-user-shield" className="text-emerald-400" /> Admin
              </button>
              <button
                type="button"
                onClick={() => quickLogin('gestor@sgiman.pt')}
                disabled={isLoading}
                className="h-10 inline-flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 active:bg-white/15 border border-white/10 hover:border-white/20 rounded-control px-3 text-xs font-medium text-slate-300 hover:text-white transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FaIcon name="fa-user-tie" className="text-blue-400" /> Gestor
              </button>
              <button
                type="button"
                onClick={() => quickLogin('sst@sgiman.pt')}
                disabled={isLoading}
                className="h-10 inline-flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 active:bg-white/15 border border-white/10 hover:border-white/20 rounded-control px-3 text-xs font-medium text-slate-300 hover:text-white transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FaIcon name="fa-hard-hat" className="text-amber-400" /> SST
              </button>
              <button
                type="button"
                onClick={() => quickLogin('tecnico1@sgiman.pt')}
                disabled={isLoading}
                className="h-10 inline-flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 active:bg-white/15 border border-white/10 hover:border-white/20 rounded-control px-3 text-xs font-medium text-slate-300 hover:text-white transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FaIcon name="fa-wrench" className="text-slate-400" /> Técnico
              </button>
            </div>
          </div>
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
