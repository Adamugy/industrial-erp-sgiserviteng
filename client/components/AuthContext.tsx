import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api } from '../../connectors/api/client';
import { syncService } from '../../connectors/api/sync';

export enum UserRole {
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  SAFETY = 'SAFETY',
  TECH = 'TECH'
}

interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  setUserRole: (role: UserRole) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for existing session on mount
  useEffect(() => {
    const token = api.getToken();
    if (token) {
      api.me()
        .then(({ user }) => {
          setUser(user);
          syncService.connect();
        })
        .catch(() => {
          api.logout();
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    const { user } = await api.login(email, password);
    setUser(user);
    syncService.connect();
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
      login,
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
        <i className="fas fa-lock text-slate-300 text-4xl mb-4"></i>
        <h3 className="text-lg font-bold text-slate-800">Acesso Restrito</h3>
        <p className="text-sm text-slate-500">
          O seu perfil ({user?.role || 'N/A'}) não tem permissão para visualizar este módulo.
        </p>
      </div>
    );
  }

  return <>{children}</>;
};
