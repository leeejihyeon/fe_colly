import React, { createContext, PropsWithChildren, useContext, useEffect, useMemo, useState } from 'react';
import { LoginResult } from '../../../features/auth/api/authApi';
import { refreshMagicToken, signOutAllMagic, signOutMagic } from '../../../features/auth/api/authApi';
import { clearSession, hydrateSession, persistSession } from './sessionStore';

type AuthGateContextValue = {
  session: LoginResult | null;
  isHydrating: boolean;
  loginOpen: boolean;
  openLogin: () => void;
  closeLogin: () => void;
  completeLogin: (session: LoginResult) => void;
  logout: () => Promise<void>;
  logoutAll: () => Promise<void>;
};

const AuthGateContext = createContext<AuthGateContextValue | null>(null);

export function AuthGateProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<LoginResult | null>(null);
  const [isHydrating, setIsHydrating] = useState(true);
  const [loginOpen, setLoginOpen] = useState(false);

  useEffect(() => {
    const run = async () => {
      const restored = await hydrateSession();
      const storedRefreshToken = restored?.refreshToken;

      if (!storedRefreshToken) {
        setSession(restored);
        setIsHydrating(false);
        return;
      }

      try {
        const refreshed = await refreshMagicToken(storedRefreshToken);
        setSession(refreshed);
        await persistSession(refreshed);
      } catch {
        await clearSession();
        setSession(null);
      } finally {
        setIsHydrating(false);
      }
    };

    run();
  }, []);

  const value = useMemo<AuthGateContextValue>(
    () => ({
      session,
      isHydrating,
      loginOpen,
      openLogin: () => setLoginOpen(true),
      closeLogin: () => setLoginOpen(false),
      completeLogin: (nextSession: LoginResult) => {
        setSession(nextSession);
        setLoginOpen(false);
        persistSession(nextSession).catch(() => {});
      },
      logout: async () => {
        const refreshToken = session?.refreshToken ?? null;

        try {
          if (refreshToken) {
            await signOutMagic(refreshToken);
          }
        } finally {
          setSession(null);
          setLoginOpen(false);
          await clearSession();
        }
      },
      logoutAll: async () => {
        try {
          await signOutAllMagic();
        } finally {
          setSession(null);
          setLoginOpen(false);
          await clearSession();
        }
      },
    }),
    [session, isHydrating, loginOpen],
  );

  return <AuthGateContext.Provider value={value}>{children}</AuthGateContext.Provider>;
}

export function useAuthGate() {
  const context = useContext(AuthGateContext);

  if (!context) {
    throw new Error('useAuthGate must be used within AuthGateProvider');
  }

  return context;
}
