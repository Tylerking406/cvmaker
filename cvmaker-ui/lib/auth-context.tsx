"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { api, setAccessToken, type AuthUser } from "@/lib/api";

interface AuthState {
  user: AuthUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (name: string, email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Rehydrate after a page refresh: the in-memory token is gone, but the httpOnly
  // cookie authenticates this call and /me hands the token back.
  useEffect(() => {
    let cancelled = false;
    api.auth
      .me()
      .then((res) => {
        if (cancelled) return;
        setAccessToken(res.accessToken);
        setUser(res.user);
      })
      .catch(() => {
        if (!cancelled) setUser(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const adopt = useCallback((res: { accessToken: string; user: AuthUser }) => {
    setAccessToken(res.accessToken);
    setUser(res.user);
    // Drop the pre-auth dev-user cache so a stale id can't confuse the dashboard.
    localStorage.removeItem("cvmaker_dev_user_id");
  }, []);

  const signIn = useCallback(
    async (email: string, password: string) => adopt(await api.auth.login(email, password)),
    [adopt],
  );

  const signUp = useCallback(
    async (name: string, email: string, password: string) =>
      adopt(await api.auth.register(name, email, password)),
    [adopt],
  );

  const signOut = useCallback(async () => {
    await api.auth.logout().catch(() => null);
    setAccessToken(null);
    setUser(null);
    router.replace("/login");
  }, [router]);

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
