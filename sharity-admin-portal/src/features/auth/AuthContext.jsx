import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { authService } from '../../shared/api/authService.js';
import { tokenStore } from '../../shared/api/tokenStore.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [booting, setBooting] = useState(true);

  const loadUser = async () => {
    const profile = await authService.me();
    setUser(profile);
    return profile;
  };

  useEffect(() => {
    const boot = async () => {
      if (!tokenStore.getAccessToken()) {
        setBooting(false);
        return;
      }
      try {
        await loadUser();
      } catch {
        tokenStore.clear();
      } finally {
        setBooting(false);
      }
    };
    const expire = () => setUser(null);
    window.addEventListener('auth:expired', expire);
    boot();
    return () => window.removeEventListener('auth:expired', expire);
  }, []);

  const value = useMemo(
    () => ({
      user,
      booting,
      isAuthenticated: Boolean(user),
      roles: user?.roles || [],
      applications: user?.apps || user?.applications || user?.appAccess || [],
      login: async (credentials) => {
        await authService.login(credentials);
        return loadUser();
      },
      logout: async () => {
        try {
          await authService.logout();
        } finally {
          tokenStore.clear();
          setUser(null);
        }
      },
      reloadUser: loadUser,
      hasRole: (...roles) => roles.some((role) => user?.roles?.includes(role)),
    }),
    [user, booting],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
