import { createContext, useCallback, useContext, useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  CASES,
  daysBetween,
  STAGES,
  type Branch,
  type StageKey,
  type VehicleCase,
} from "@/data/cases";

/** Datos mínimos para dar de alta una orden de trabajo desde el ingreso a patio. */
export type NewCaseData = {
  plate: string;
  vehicle: string;
  client: string;
  insurer: string;
  color: string;
  broker: string;
  advisor: string;
  branch: Branch;
};

type CasesValue = {
  cases: VehicleCase[];
  moveCase: (id: string, stage: StageKey) => void;
  addCase: (data: NewCaseData) => string;
};

const CasesContext = createContext<CasesValue | null>(null);

/** Identificador secuencial OT-XXXX basado en el mayor número de OT existente. */
const nextCaseId = (cases: VehicleCase[]) => {
  const max = cases.reduce((acc, c) => {
    const n = Number(c.id.replace(/\D/g, ""));
    return Number.isFinite(n) && n > acc ? n : acc;
  }, 2417);
  return `OT-${String(max + 1).padStart(4, "0")}`;
};

export function CasesProvider({ children }: { children: ReactNode }) {
  const [cases, setCases] = useState<VehicleCase[]>(CASES);

  const moveCase = useCallback((id: string, stage: StageKey) => {
    const now = new Date().toISOString();
    setCases((prev) =>
      prev.map((c) => {
        if (c.id !== id || c.stage === stage) return c;
        const from = STAGES.findIndex((s) => s.key === c.stage);
        const to = STAGES.findIndex((s) => s.key === stage);
        // El flujo de reparación solo avanza: no se permiten retrocesos.
        if (to < from) return c;
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

  const addCase = useCallback((data: NewCaseData) => {
    const id = nextCaseId(cases);
    const now = new Date().toISOString();
    setCases((prev) => [
      ...prev,
      {
        id,
        plate: data.plate,
        vehicle: data.vehicle,
        client: data.client,
        insurer: data.insurer,
        color: data.color,
        broker: data.broker,
        stage: "recepcion",
        daysInStage: 0,
        amount: 0,
        advisor: data.advisor,
        branch: data.branch,
        history: [{ stage: "recepcion", startedAt: now, endedAt: null }],
      },
    ]);
    return id;
  }, [cases]);

  const value = useMemo(
    () => ({ cases, moveCase, addCase }),
    [cases, moveCase, addCase],
  );
  return <CasesContext.Provider value={value}>{children}</CasesContext.Provider>;
}

export function useCases() {
  const ctx = useContext(CasesContext);
  if (!ctx) throw new Error("useCases debe usarse dentro de CasesProvider");
  return ctx;
}

export const stageDuration = (entry: { startedAt: string; endedAt: string | null }) =>
  daysBetween(entry.startedAt, entry.endedAt);
