"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { fetchCurrentUser, logout as apiLogout, type CurrentUser } from "./api";

interface AuthContextValue {
  user: CurrentUser | null;
  loading: boolean;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const { user } = await fetchCurrentUser();
      setUser(user);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // AuthProvider lives above the route tree, so it doesn't remount (and this
  // effect won't re-run) on a client-side navigation — login/register call
  // refresh() directly after a successful auth call for that reason, rather
  // than relying on this initial mount fetch alone.
  useEffect(() => {
    refresh();
  }, [refresh]);

  async function logout() {
    await apiLogout();
    setUser(null);
    window.location.href = "/login";
  }

  return <AuthContext.Provider value={{ user, loading, refresh, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
