import React, { useState } from 'react';
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-black text-white tracking-tighter">
            SGI<span className="text-emerald-400">MAN</span>
          </h1>
          <p className="text-slate-400 text-sm mt-2">Sistema de Gestão Industrial</p>
        </div>

        {/* Login Card */}
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/20 shadow-2xl">
          <h2 className="text-xl font-bold text-white mb-6">Entrar na Plataforma</h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-[10px] font-black text-slate-300 uppercase tracking-widest mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:border-emerald-400 transition-colors"
                placeholder="seu@email.pt"
                required
              />
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-300 uppercase tracking-widest mb-2">
                Palavra-Passe
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:border-emerald-400 transition-colors"
                placeholder="••••••"
                required
              />
            </div>

            {error && (
              <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-3 text-red-200 text-sm">
                <i className="fas fa-exclamation-circle mr-2"></i>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-emerald-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <span><i className="fas fa-spinner fa-spin mr-2"></i>A entrar...</span>
              ) : (
                <span><i className="fas fa-sign-in-alt mr-2"></i>Entrar</span>
              )}
            </button>
          </form>

          {/* Quick Login Buttons */}
          <div className="mt-6 pt-6 border-t border-white/10">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 text-center">
              Login Rápido (Demo)
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => quickLogin('admin@sgiman.pt')}
                className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg py-2 px-3 text-xs text-slate-300 transition-colors"
              >
                <i className="fas fa-user-shield text-emerald-400 mr-1"></i> Admin
              </button>
              <button
                onClick={() => quickLogin('gestor@sgiman.pt')}
                className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg py-2 px-3 text-xs text-slate-300 transition-colors"
              >
                <i className="fas fa-user-tie text-blue-400 mr-1"></i> Gestor
              </button>
              <button
                onClick={() => quickLogin('sst@sgiman.pt')}
                className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg py-2 px-3 text-xs text-slate-300 transition-colors"
              >
                <i className="fas fa-hard-hat text-amber-400 mr-1"></i> SST
              </button>
              <button
                onClick={() => quickLogin('tecnico1@sgiman.pt')}
                className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg py-2 px-3 text-xs text-slate-300 transition-colors"
              >
                <i className="fas fa-wrench text-slate-400 mr-1"></i> Técnico
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-slate-500 text-xs mt-6">
          © 2024 SGIServiteng. Todos os direitos reservados.
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
