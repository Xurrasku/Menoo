"use client";

import { createContext, useContext, useMemo } from "react";
import type { User } from "@supabase/supabase-js";

type AuthContextValue = {
  user: User | null;
};

const AuthContext = createContext<AuthContextValue>({
  user: null,
});

type AuthProviderProps = {
  user: User | null;
  children: React.ReactNode;
};

export function AuthProvider({ user, children }: AuthProviderProps) {
  const value = useMemo<AuthContextValue>(() => ({ user }), [user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}









