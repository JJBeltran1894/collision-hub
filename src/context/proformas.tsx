import { createContext, useCallback, useContext, useMemo, useState } from "react";
import type { ReactNode } from "react";

export type ItemCategory = "Mano de Obra" | "Repuesto" | "TFT";

export const CATEGORIES: { value: ItemCategory; label: string; tone: string }[] = [
  { value: "Mano de Obra", label: "Mano de Obra", tone: "text-accent-blue" },
  { value: "Repuesto", label: "Repuesto", tone: "text-slate-deep" },
  { value: "TFT", label: "Trabajos Fuera del Taller (TFT)", tone: "text-insurance" },
];

export type ProformaItem = {
  id: string;
  description: string;
  category: ItemCategory;
  quantity: number;
  unitPrice: number;
};

export type AdjustStatus = "pendiente" | "aprobado" | "modificado" | "rechazado";

export type AdjustEntry = {
  status: AdjustStatus;
  approvedPrice: number;
  note: string;
};

export type Adjustment = Record<string, AdjustEntry>;

type ProformaValue = {
  items: Record<string, ProformaItem[]>;
  adjustments: Record<string, Adjustment>;
  addItem: (caseId: string, item: Omit<ProformaItem, "id">) => void;
  removeItem: (caseId: string, itemId: string) => void;
  setAdjust: (caseId: string, itemId: string, patch: Partial<AdjustEntry>) => void;
};

const ProformaContext = createContext<ProformaValue | null>(null);

const uid = () => Math.random().toString(36).slice(2, 10);

const SEED_ITEMS: Record<string, ProformaItem[]> = {
  "OT-2420": [
    { id: "i1", description: "Enderezado de puerta delantera izquierda", category: "Mano de Obra", quantity: 1, unitPrice: 320 },
    { id: "i2", description: "Guardafango delantero izquierdo original", category: "Repuesto", quantity: 1, unitPrice: 890 },
    { id: "i3", description: "Pintura bicapa puerta y guardafango", category: "Mano de Obra", quantity: 1, unitPrice: 460 },
    { id: "i4", description: "Alineación y balanceo externo", category: "TFT", quantity: 1, unitPrice: 85 },
    { id: "i5", description: "Faro delantero izquierdo", category: "Repuesto", quantity: 1, unitPrice: 540 },
  ],
  "OT-2424": [
    { id: "j1", description: "Desmontaje y montaje de paragolpes trasero", category: "Mano de Obra", quantity: 1, unitPrice: 180 },
    { id: "j2", description: "Paragolpes trasero alterno", category: "Repuesto", quantity: 1, unitPrice: 430 },
    { id: "j3", description: "Rectificación de tapa de baúl (taller externo)", category: "TFT", quantity: 1, unitPrice: 150 },
  ],
};

const SEED_ADJUSTMENTS: Record<string, Adjustment> = {
  "OT-2420": {
    i1: { status: "aprobado", approvedPrice: 320, note: "" },
    i2: { status: "modificado", approvedPrice: 640, note: "Se autoriza repuesto alterno" },
    i3: { status: "modificado", approvedPrice: 410, note: "Ajuste de horas de pintura" },
    i4: { status: "rechazado", approvedPrice: 0, note: "No corresponde al siniestro" },
    i5: { status: "aprobado", approvedPrice: 540, note: "" },
  },
};

export function ProformaProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Record<string, ProformaItem[]>>(SEED_ITEMS);
  const [adjustments, setAdjustments] = useState<Record<string, Adjustment>>(SEED_ADJUSTMENTS);

  const addItem = useCallback((caseId: string, item: Omit<ProformaItem, "id">) => {
    setItems((prev) => ({ ...prev, [caseId]: [...(prev[caseId] ?? []), { ...item, id: uid() }] }));
  }, []);

  const removeItem = useCallback((caseId: string, itemId: string) => {
    setItems((prev) => ({ ...prev, [caseId]: (prev[caseId] ?? []).filter((i) => i.id !== itemId) }));
  }, []);

  const setAdjust = useCallback((caseId: string, itemId: string, patch: Partial<AdjustEntry>) => {
    setAdjustments((prev) => {
      const current = prev[caseId] ?? {};
      const entry = current[itemId] ?? { status: "pendiente" as AdjustStatus, approvedPrice: 0, note: "" };
      return { ...prev, [caseId]: { ...current, [itemId]: { ...entry, ...patch } } };
    });
  }, []);

  const value = useMemo(
    () => ({ items, adjustments, addItem, removeItem, setAdjust }),
    [items, adjustments, addItem, removeItem, setAdjust],
  );

  return <ProformaContext.Provider value={value}>{children}</ProformaContext.Provider>;
}

export function useProformas() {
  const ctx = useContext(ProformaContext);
  if (!ctx) throw new Error("useProformas debe usarse dentro de ProformaProvider");
  return ctx;
}

export const lineTotal = (item: ProformaItem) => item.quantity * item.unitPrice;

export const proformaTotal = (list: ProformaItem[]) =>
  list.reduce((sum, i) => sum + lineTotal(i), 0);

export const entryFor = (adjust: Adjustment | undefined, item: ProformaItem): AdjustEntry =>
  adjust?.[item.id] ?? { status: "pendiente", approvedPrice: item.unitPrice, note: "" };

export const approvedTotal = (list: ProformaItem[], adjust: Adjustment | undefined) =>
  list.reduce((sum, item) => {
    const entry = entryFor(adjust, item);
    if (entry.status === "rechazado") return sum;
    return sum + entry.approvedPrice * item.quantity;
  }, 0);

export const STATUS_STYLES: Record<AdjustStatus, { label: string; className: string }> = {
  pendiente: { label: "Pendiente", className: "bg-muted text-muted-grey" },
  aprobado: { label: "Aprobado", className: "bg-success text-success-foreground" },
  modificado: { label: "Modificado", className: "bg-warning text-warning-foreground" },
  rechazado: { label: "Rechazado", className: "bg-crimson text-crimson-foreground" },
};
