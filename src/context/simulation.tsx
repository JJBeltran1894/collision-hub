import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";

export type Role = "Administrador" | "Gerente" | "Asesor";
export type Branch = "Quito Norte" | "Quito Sur" | "Guayaquil";
export type ViewMode = "mobile" | "desktop";
export type BranchScope = Branch | "todas";

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
  scopeBranch: BranchScope;
  setScopeBranch: (scope: BranchScope) => void;
  /** True cuando el rol puede ver más de su sucursal (Administrador/Gerente). */
  canScopeAny: boolean;
  signIn: (session: Session) => void;
  signOut: () => void;
  setViewMode: (mode: ViewMode) => void;
};

const STORAGE_KEY = "cc.simulation.v1";

const SimulationContext = createContext<SimulationValue | null>(null);

/** Devuelve los ítems restringidos según el rol y el filtro de sucursal activo. */
export function useBranchScope<T extends { branch: Branch }>(items: T[]): T[] {
  const { session, scopeBranch } = useSimulation();
  if (!session) return [];
  if (session.role === "Asesor") return items.filter((i) => i.branch === session.branch);
  return scopeBranch === "todas" ? items : items.filter((i) => i.branch === scopeBranch);
}

export function SimulationProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [viewMode, setViewModeState] = useState<ViewMode>("desktop");
  const [scopeBranch, setScopeBranchState] = useState<BranchScope>("todas");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as {
          session: Session | null;
          viewMode: ViewMode;
          scopeBranch: BranchScope;
        };
        if (parsed.session) setSession(parsed.session);
        if (parsed.viewMode) setViewModeState(parsed.viewMode);
        if (parsed.scopeBranch) setScopeBranchState(parsed.scopeBranch);
      }
    } catch {
      /* almacenamiento no disponible */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ session, viewMode, scopeBranch }),
      );
    } catch {
      /* almacenamiento no disponible */
    }
  }, [session, viewMode, scopeBranch, hydrated]);

  const signIn = useCallback((next: Session) => {
    setSession(next);
    setViewModeState(next.role === "Asesor" ? "mobile" : "desktop");
    // Al iniciar sesión, el alcance por defecto es la sucursal elegida.
    setScopeBranchState(next.branch);
  }, []);

  const signOut = useCallback(() => setSession(null), []);
  const setViewMode = useCallback((mode: ViewMode) => setViewModeState(mode), []);
  const setScopeBranch = useCallback((scope: BranchScope) => setScopeBranchState(scope), []);

  const canScopeAny = session ? session.role !== "Asesor" : false;

  const value = useMemo(
    () => ({
      session,
      viewMode,
      hydrated,
      scopeBranch,
      setScopeBranch,
      canScopeAny,
      signIn,
      signOut,
      setViewMode,
    }),
    [
      session,
      viewMode,
      hydrated,
      scopeBranch,
      setScopeBranch,
      canScopeAny,
      signIn,
      signOut,
      setViewMode,
    ],
  );

  return <SimulationContext.Provider value={value}>{children}</SimulationContext.Provider>;
}

export function useSimulation() {
  const ctx = useContext(SimulationContext);
  if (!ctx) throw new Error("useSimulation debe usarse dentro de SimulationProvider");
  return ctx;
}
