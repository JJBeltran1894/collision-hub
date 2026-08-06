import { createContext, useCallback, useContext, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { CASES, daysBetween, type StageKey, type VehicleCase } from "@/data/cases";

type CasesValue = {
  cases: VehicleCase[];
  moveCase: (id: string, stage: StageKey) => void;
};

const CasesContext = createContext<CasesValue | null>(null);

export function CasesProvider({ children }: { children: ReactNode }) {
  const [cases, setCases] = useState<VehicleCase[]>(CASES);

  const moveCase = useCallback((id: string, stage: StageKey) => {
    const now = new Date().toISOString();
    setCases((prev) =>
      prev.map((c) => {
        if (c.id !== id || c.stage === stage) return c;
        const history = c.history.map((entry, index) =>
          index === c.history.length - 1 && entry.endedAt === null
            ? { ...entry, endedAt: now }
            : entry,
        );
        history.push({ stage, startedAt: now, endedAt: null });
        return { ...c, stage, daysInStage: 0, history };
      }),
    );
  }, []);

  const value = useMemo(() => ({ cases, moveCase }), [cases, moveCase]);
  return <CasesContext.Provider value={value}>{children}</CasesContext.Provider>;
}

export function useCases() {
  const ctx = useContext(CasesContext);
  if (!ctx) throw new Error("useCases debe usarse dentro de CasesProvider");
  return ctx;
}

export const stageDuration = (entry: { startedAt: string; endedAt: string | null }) =>
  daysBetween(entry.startedAt, entry.endedAt);
