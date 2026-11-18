import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { api } from '../../connectors/api/client';
import { syncService } from '../../connectors/api/sync';
import { FaIcon } from './common/FaIcon';

export enum UserRole {
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  SAFETY = 'SAFETY',
  TECH = 'TECH',
  SECRETARY = 'SECRETARY'
}

export type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar: string;
  approvalStatus: ApprovalStatus;
  requestedRole: UserRole | null;
  onboardingCompleted: boolean;
  department?: string | null;
  jobTitle?: string | null;
  phone?: string | null;
}

/** Nome legível de cada papel (o valor técnico continua o mesmo). */
export const ROLE_LABELS: Record<UserRole, string> = {
  [UserRole.ADMIN]: 'CEO / Administração',
  [UserRole.MANAGER]: 'Gestor de Obras',
  [UserRole.SAFETY]: 'Gestor QA / SST',
  [UserRole.TECH]: 'Funcionário',
  [UserRole.SECRETARY]: 'Secretária',
};

const OAUTH_ERRORS: Record<string, string> = {
  cancelled: 'O início de sessão foi cancelado.',
  invalid_state: 'A sessão de login expirou. Tente novamente.',
  provider_unavailable: 'Este método de login não está disponível.',
  provider_error: 'Não foi possível validar a conta. Tente novamente.',
  account_exists: 'Já existe uma conta com este email. Entre com email e palavra-passe.',
  account_disabled: 'Esta conta está desativada. Contacte o administrador.',
  email_missing: 'A conta não partilhou um email válido.',
  invalid_token: 'Resposta inválida do fornecedor de identidade.',
};

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isApproved: boolean;
  authError: string | null;
  clearAuthError: () => void;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  completeOnboarding: (payload: { requestedRole: string; name?: string; department?: string; jobTitle?: string; phone?: string }) => Promise<void>;
  refreshUser: () => Promise<void>;
  logout: () => void;
  setUserRole: (role: UserRole) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/** Lê e remove da barra de endereço o resultado do login Google/Microsoft. */
function takeOAuthParams(): { code?: string; error?: string } {
  const params = new URLSearchParams(window.location.search);
  const code = params.get('oauth_code') || undefined;
  const error = params.get('oauth_error') || undefined;
  if (code || error) {
    params.delete('oauth_code');
    params.delete('oauth_error');
    const qs = params.toString();
    window.history.replaceState(null, '', window.location.pathname + (qs ? `?${qs}` : '') + window.location.hash);
  }
  return { code, error };
}

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  const applyUser = useCallback((u: User | null) => {
    setUser(u);
    // Só contas aprovadas recebem eventos em tempo real
    if (u && u.approvalStatus === 'APPROVED') syncService.connect();
    else syncService.disconnect();
  }, []);

  useEffect(() => {
    const { code, error } = takeOAuthParams();
    const boot = async () => {
      try {
        if (code) {
          const { user } = await api.oauthExchange(code);
          applyUser(user);
          return;
        }
        if (error) setAuthError(OAUTH_ERRORS[error] || 'Não foi possível iniciar sessão.');
        if (api.getToken()) {
          const { user } = await api.me();
          applyUser(user);
        }
      } catch (err: any) {
        api.logout();
        if (code) setAuthError(err?.message || OAUTH_ERRORS.provider_error);
      } finally {
        setIsLoading(false);
      }
    };
    boot();
  }, [applyUser]);

  const login = async (email: string, password: string) => {
    const { user } = await api.login(email, password);
    applyUser(user);
  };

  const register = async (name: string, email: string, password: string) => {
    const { user } = await api.register(name, email, password);
    applyUser(user);
  };

  const completeOnboarding: AuthContextType['completeOnboarding'] = async (payload) => {
    const { user } = await api.completeOnboarding(payload);
    applyUser(user);
  };

  const refreshUser = async () => {
    const { user } = await api.me();
    applyUser(user);
  };

  const logout = () => {
    api.logout();
    syncService.disconnect();
    setUser(null);
  };

  // For demo: allow switching roles without re-login
  const setUserRole = (role: UserRole) => {
    if (user) {
      setUser({ ...user, role });
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      isLoading,
      isAuthenticated: !!user,
      isApproved: !!user && user.approvalStatus === 'APPROVED',
      authError,
      clearAuthError: () => setAuthError(null),
      login,
      register,
      completeOnboarding,
      refreshUser,
      logout,
      setUserRole,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

// Role guard component
export const RoleGuard: React.FC<{ roles: UserRole[], children: ReactNode }> = ({ roles, children }) => {
  const { user } = useAuth();

  if (!user || !roles.includes(user.role)) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-slate-200">
        <FaIcon name="fas fa-lock" className="text-slate-300 text-4xl mb-4" />
        <h3 className="text-lg font-bold text-slate-800">Acesso Restrito</h3>
        <p className="text-sm text-slate-500">
          O seu perfil ({user?.role || 'N/A'}) não tem permissão para visualizar este módulo.
        </p>
      </div>
    );
  }

  return <>{children}</>;
};
