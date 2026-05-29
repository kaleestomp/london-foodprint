import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useIsAuthenticated, useMsal } from '@azure/msal-react';
import { InteractionStatus, type AccountInfo } from '@azure/msal-browser';
import { loginRequest } from './msalConfig';

const DEFAULT_ALLOWED_ROLES = ['Viewer', 'Admin'] as const;
const env = import.meta.env as Record<string, string | undefined>;
const authBypassEnabled = env.VITE_AUTH_BYPASS === 'true';
const devUserName = env.VITE_AUTH_BYPASS_NAME ?? 'Local Dev User';
const devUserEmail = env.VITE_AUTH_BYPASS_EMAIL ?? 'local.dev@company.local';
const devRoles = (env.VITE_AUTH_BYPASS_ROLES ?? 'Viewer')
  .split(',')
  .map((item) => item.trim())
  .filter(Boolean);

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  userName: string | null;
  userEmail: string | null;
  roles: string[];
  canAccessApp: boolean;
  hasRole: (...requiredRoles: string[]) => boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

const parseRoles = (account: AccountInfo | null): string[] => {
  const claims = account?.idTokenClaims as Record<string, unknown> | undefined;
  const tokenRoles = claims?.roles;
  if (!Array.isArray(tokenRoles)) return [];
  return tokenRoles.filter((item): item is string => typeof item === 'string');
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const { instance, accounts, inProgress } = useMsal();
  const isAuthenticated = useIsAuthenticated();
  const [activeAccount, setActiveAccount] = useState<AccountInfo | null>(
    accounts[0] ?? instance.getActiveAccount() ?? null,
  );

  useEffect(() => {
    const current = instance.getActiveAccount() ?? accounts[0] ?? null;
    if (current) {
      instance.setActiveAccount(current);
    }
    setActiveAccount(current);
  }, [accounts, instance]);

  const roles = useMemo(() => parseRoles(activeAccount), [activeAccount]);

  const hasRole = useCallback(
    (...requiredRoles: string[]): boolean => requiredRoles.some((role) => roles.includes(role)),
    [roles],
  );

  const canAccessApp = hasRole(...DEFAULT_ALLOWED_ROLES);

  const userName = activeAccount?.name ?? null;
  const userEmail = activeAccount?.username ?? null;

  const login = useCallback(async () => {
    const result = await instance.loginPopup(loginRequest);
    instance.setActiveAccount(result.account);
    setActiveAccount(result.account);
  }, [instance]);

  const logout = useCallback(async () => {
    await instance.logoutPopup({
      account: activeAccount ?? undefined,
      postLogoutRedirectUri: window.location.origin,
    });
    setActiveAccount(null);
  }, [activeAccount, instance]);

  const exposed = useMemo<AuthContextType>(
    () => ({
      isAuthenticated,
      isLoading: inProgress !== InteractionStatus.None,
      userName,
      userEmail,
      roles,
      canAccessApp,
      hasRole,
      login,
      logout,
    }),
    [canAccessApp, hasRole, inProgress, isAuthenticated, login, logout, roles, userEmail, userName],
  );

  if (authBypassEnabled) {
    const bypassHasRole = (...requiredRoles: string[]): boolean =>
      requiredRoles.some((role) => devRoles.includes(role));

    const bypassContext: AuthContextType = {
      isAuthenticated: true,
      isLoading: false,
      userName: devUserName,
      userEmail: devUserEmail,
      roles: devRoles,
      canAccessApp: bypassHasRole(...DEFAULT_ALLOWED_ROLES),
      hasRole: bypassHasRole,
      login: async () => undefined,
      logout: async () => undefined,
    };

    return <AuthContext.Provider value={bypassContext}>{children}</AuthContext.Provider>;
  }

  return <AuthContext.Provider value={exposed}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
