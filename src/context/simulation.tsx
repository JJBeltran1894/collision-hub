import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";

export type Role = "Administrador" | "Gerente" | "Asesor";
export type Branch = "Quito Norte" | "Quito Sur" | "Guayaquil";
export type ViewMode = "mobile" | "desktop";

export const ROLES: Role[] = ["Administrador", "Gerente", "Asesor"];
export const BRANCHES: Branch[] = ["Quito Norte", "Quito Sur", "Guayaquil"];

export type Session = {
  name: string;
  role: Role;
  branch: Branch;
};

type SimulationValue = {
  session: Session | null;
  viewMode: ViewMode;
  hydrated: boolean;
  signIn: (session: Session) => void;
  signOut: () => void;
  setViewMode: (mode: ViewMode) => void;
};

const STORAGE_KEY = "cc.simulation.v1";

const SimulationContext = createContext<SimulationValue | null>(null);

export function SimulationProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [viewMode, setViewModeState] = useState<ViewMode>("desktop");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as { session: Session | null; viewMode: ViewMode };
        if (parsed.session) setSession(parsed.session);
        if (parsed.viewMode) setViewModeState(parsed.viewMode);
      }
    } catch {
      /* almacenamiento no disponible */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ session, viewMode }));
    } catch {
      /* almacenamiento no disponible */
    }
  }, [session, viewMode, hydrated]);

  const signIn = useCallback((next: Session) => {
    setSession(next);
    setViewModeState(next.role === "Asesor" ? "mobile" : "desktop");
  }, []);

  const signOut = useCallback(() => setSession(null), []);
  const setViewMode = useCallback((mode: ViewMode) => setViewModeState(mode), []);

  const value = useMemo(
    () => ({ session, viewMode, hydrated, signIn, signOut, setViewMode }),
    [session, viewMode, hydrated, signIn, signOut, setViewMode],
  );

  return <SimulationContext.Provider value={value}>{children}</SimulationContext.Provider>;
}

export function useSimulation() {
  const ctx = useContext(SimulationContext);
  if (!ctx) throw new Error("useSimulation debe usarse dentro de SimulationProvider");
  return ctx;
}
