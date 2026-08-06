import type { Branch } from "@/context/simulation";

export type StageKey =
  | "recepcion"
  | "proforma"
  | "ajuste"
  | "orden"
  | "enderezado"
  | "pintura"
  | "repuestos"
  | "salida";

export type Stage = {
  key: StageKey;
  label: string;
  tone: "muted-grey" | "accent-blue" | "insurance" | "slate-deep" | "warning" | "success";
};

export const STAGES: Stage[] = [
  { key: "recepcion", label: "Recepción", tone: "muted-grey" },
  { key: "proforma", label: "Proforma", tone: "accent-blue" },
  { key: "ajuste", label: "Ajuste del Seguro", tone: "insurance" },
  { key: "orden", label: "Orden de Reparación", tone: "accent-blue" },
  { key: "enderezado", label: "Enderezado", tone: "slate-deep" },
  { key: "pintura", label: "Pintura", tone: "slate-deep" },
  { key: "repuestos", label: "Espera de Repuestos", tone: "warning" },
  { key: "salida", label: "Listo / Salida", tone: "success" },
];

export const STAGE_STYLES: Record<Stage["tone"], { border: string; dot: string; text: string }> = {
  "muted-grey": {
    border: "border-l-muted-grey",
    dot: "bg-muted-grey",
    text: "text-muted-grey",
  },
  "accent-blue": {
    border: "border-l-accent-blue",
    dot: "bg-accent-blue",
    text: "text-accent-blue",
  },
  insurance: { border: "border-l-insurance", dot: "bg-insurance", text: "text-insurance" },
  "slate-deep": { border: "border-l-slate-deep", dot: "bg-slate-deep", text: "text-slate-deep" },
  warning: { border: "border-l-warning", dot: "bg-warning", text: "text-warning" },
  success: { border: "border-l-success", dot: "bg-success", text: "text-success" },
};

/** Bitácora de tiempos: una entrada por etapa recorrida. */
export type StageLogEntry = {
  stage: StageKey;
  startedAt: string;
  endedAt: string | null;
};

export type VehicleCase = {
  id: string;
  plate: string;
  vehicle: string;
  client: string;
  insurer: string;
  stage: StageKey;
  daysInStage: number;
  amount: number;
  advisor: string;
  branch: Branch;
  history: StageLogEntry[];
};

const DAY = 86_400_000;

export const daysAgo = (days: number) => new Date(Date.now() - days * DAY).toISOString();

export const daysBetween = (from: string, to: string | null) =>
  Math.max(0, Math.floor(((to ? new Date(to) : new Date()).getTime() - new Date(from).getTime()) / DAY));

/** Construye una bitácora sintética a partir de las etapas ya recorridas. */
function buildHistory(stage: StageKey, daysInStage: number, previous: number[] = []): StageLogEntry[] {
  const index = STAGES.findIndex((s) => s.key === stage);
  const past = STAGES.slice(0, index);
  const entries: StageLogEntry[] = [];
  let offset = daysInStage;
  for (let i = past.length - 1; i >= 0; i -= 1) {
    const duration = previous[i] ?? 3;
    const endedAt = daysAgo(offset);
    offset += duration;
    entries.unshift({ stage: past[i]!.key, startedAt: daysAgo(offset), endedAt });
  }
  entries.push({ stage, startedAt: daysAgo(daysInStage), endedAt: null });
  return entries;
}

type Seed = Omit<VehicleCase, "history"> & { previous?: number[] };

const SEEDS: Seed[] = [
  {
    id: "OT-2418",
    plate: "PCV-4821",
    vehicle: "Chevrolet Sail 2021",
    client: "María Zambrano",
    insurer: "Seguros Alianza",
    stage: "recepcion",
    daysInStage: 2,
    amount: 1240.5,
    advisor: "Luis Paredes",
    branch: "Quito Norte",
  },
  {
    id: "OT-2419",
    plate: "GSA-1120",
    vehicle: "Kia Sportage 2022",
    client: "Andrés Vera",
    insurer: "Particular",
    stage: "proforma",
    daysInStage: 4,
    amount: 3890.0,
    advisor: "Luis Paredes",
    branch: "Guayaquil",
  },
  {
    id: "OT-2420",
    plate: "PBA-7745",
    vehicle: "Toyota Hilux 2019",
    client: "Comercial Andina S.A.",
    insurer: "Seguros Alianza",
    stage: "ajuste",
    daysInStage: 118,
    amount: 7420.35,
    advisor: "Karla Mendoza",
    branch: "Quito Norte",
    previous: [3, 9],
  },
  {
    id: "OT-2421",
    plate: "PDQ-3390",
    vehicle: "Mazda 3 2020",
    client: "Jorge Salgado",
    insurer: "Equinoccial",
    stage: "enderezado",
    daysInStage: 6,
    amount: 2560.0,
    advisor: "Karla Mendoza",
    branch: "Quito Sur",
  },
  {
    id: "OT-2422",
    plate: "GBC-9012",
    vehicle: "Hyundai Tucson 2023",
    client: "Patricia Ríos",
    insurer: "Seguros Alianza",
    stage: "repuestos",
    daysInStage: 21,
    amount: 5130.9,
    advisor: "Diego Sánchez",
    branch: "Guayaquil",
  },
  {
    id: "OT-2423",
    plate: "PCX-2210",
    vehicle: "Nissan Versa 2018",
    client: "Fernando Ochoa",
    insurer: "Particular",
    stage: "salida",
    daysInStage: 1,
    amount: 980.75,
    advisor: "Diego Sánchez",
    branch: "Quito Sur",
  },
  {
    id: "OT-2424",
    plate: "PDF-5567",
    vehicle: "Renault Duster 2021",
    client: "Silvia Cabrera",
    insurer: "Equinoccial",
    stage: "proforma",
    daysInStage: 46,
    amount: 1710.2,
    advisor: "Luis Paredes",
    branch: "Quito Norte",
    previous: [4],
  },
  {
    id: "OT-2425",
    plate: "GAX-8834",
    vehicle: "Ford Ranger 2020",
    client: "Transporte Litoral Cía.",
    insurer: "Seguros Alianza",
    stage: "pintura",
    daysInStage: 16,
    amount: 8890.0,
    advisor: "Karla Mendoza",
    branch: "Guayaquil",
  },
  {
    id: "OT-2426",
    plate: "PGT-4409",
    vehicle: "Suzuki Vitara 2022",
    client: "Lucía Herrera",
    insurer: "Equinoccial",
    stage: "orden",
    daysInStage: 5,
    amount: 3320.4,
    advisor: "Luis Paredes",
    branch: "Quito Sur",
  },
];

export const CASES: VehicleCase[] = SEEDS.map(({ previous, ...seed }) => ({
  ...seed,
  history: buildHistory(seed.stage, seed.daysInStage, previous),
}));

export const STALLED_THRESHOLD_DAYS = 15;
/** Alerta comercial: más de 30 días en proforma o ajuste de seguro. */
export const COMMERCIAL_ALERT_DAYS = 30;
export const COMMERCIAL_ALERT_STAGES: StageKey[] = ["proforma", "ajuste"];

export const isStalled = (c: VehicleCase) => c.daysInStage > STALLED_THRESHOLD_DAYS;

export const isCommercialAlert = (c: VehicleCase) =>
  COMMERCIAL_ALERT_STAGES.includes(c.stage) && c.daysInStage > COMMERCIAL_ALERT_DAYS;

export const stageOf = (key: StageKey) => STAGES.find((s) => s.key === key) ?? STAGES[0]!;

export const casesForBranch = (branch: Branch) => CASES.filter((c) => c.branch === branch);

export const money = (value: number) =>
  new Intl.NumberFormat("es-EC", { style: "currency", currency: "USD" }).format(value);

export const formatDate = (iso: string) =>
  new Intl.DateTimeFormat("es-EC", { day: "2-digit", month: "short", year: "numeric" }).format(
    new Date(iso),
  );
