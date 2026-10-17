import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { onAuthStateChanged, signOut, type User } from "firebase/auth";
import { getFirebaseAuth } from "@/lib/firebase";
import { exchangeFirebaseToken, type AppRole } from "@/lib/auth-api";

type AuthContextValue = {
  user: User | null;
  role: AppRole | null;
  accessToken: string | null;
  sessionExpiresAt: number | null;
  loading: boolean;
  configError: string | null;
  authError: string | null;
  refreshRole: () => Promise<void>;
  signOutUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [sessionExpiresAt, setSessionExpiresAt] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [configError, setConfigError] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    let revision = 0;
    try {
      unsubscribe = onAuthStateChanged(getFirebaseAuth(), async (nextUser) => {
        const currentRevision = ++revision;
        setUser(nextUser);
        setAccessToken(null);
        setSessionExpiresAt(null);
        setRole(null);
        setAuthError(null);
        setLoading(true);
        if (!nextUser) {
          setLoading(false);
          return;
        }
        try {
          const firebaseToken = await nextUser.getIdToken();
          const session = await exchangeFirebaseToken(firebaseToken);
          if (currentRevision !== revision) return;
          setAccessToken(session.accessToken);
          setSessionExpiresAt(Date.now() + session.expiresIn * 1000);
          setRole(session.user.role);
        } catch (error) {
          if (currentRevision === revision) {
            setAuthError(error instanceof Error ? error.message : "Could not create a secure app session.");
          }
        } finally {
          if (currentRevision === revision) setLoading(false);
        }
      });
    } catch (error) {
      setConfigError(error instanceof Error ? error.message : "Firebase configuration is missing.");
      setLoading(false);
    }
    return () => unsubscribe?.();
  }, []);

  useEffect(() => {
    if (!user || !sessionExpiresAt) return;
    const delay = Math.max(sessionExpiresAt - Date.now() - 60_000, 0);
    const timeout = window.setTimeout(async () => {
      try {
        const firebaseToken = await user.getIdToken();
        const session = await exchangeFirebaseToken(firebaseToken);
        setAccessToken(session.accessToken);
        setSessionExpiresAt(Date.now() + session.expiresIn * 1000);
        setRole(session.user.role);
        setAuthError(null);
      } catch (error) {
        setAccessToken(null);
        setAuthError(error instanceof Error ? error.message : "Could not refresh your app session.");
      }
    }, delay);
    return () => window.clearTimeout(timeout);
  }, [user, sessionExpiresAt]);

  const refreshRole = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setAuthError(null);
    try {
      const firebaseToken = await user.getIdToken(true);
      const session = await exchangeFirebaseToken(firebaseToken);
      setAccessToken(session.accessToken);
      setSessionExpiresAt(Date.now() + session.expiresIn * 1000);
      setRole(session.user.role);
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : "Could not refresh your app session.");
      throw error;
    } finally {
      setLoading(false);
    }
  }, [user]);

  const value = useMemo<AuthContextValue>(() => ({
    user,
    role,
    accessToken,
    loading,
    configError,
    authError,
    refreshRole,
    signOutUser: async () => {
      await signOut(getFirebaseAuth());
      setAccessToken(null);
      setSessionExpiresAt(null);
      setRole(null);
    },
    sessionExpiresAt,
  }), [user, role, accessToken, sessionExpiresAt, loading, configError, authError, refreshRole]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside AuthProvider.");
  return value;
}
