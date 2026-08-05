import type { Branch } from "@/context/simulation";

export type StageKey =
  | "recepcion"
  | "proforma"
  | "ajuste"
  | "reparacion"
  | "repuestos"
  | "salida";

export type Stage = {
  key: StageKey;
  label: string;
  tone: "muted-grey" | "accent-blue" | "insurance" | "slate-deep" | "warning" | "success";
};

export const STAGES: Stage[] = [
  { key: "recepcion", label: "Recepción / Ingreso", tone: "muted-grey" },
  { key: "proforma", label: "Proforma Libre", tone: "accent-blue" },
  { key: "ajuste", label: "Ajuste de Seguro", tone: "insurance" },
  { key: "reparacion", label: "Enderezado / Pintura", tone: "slate-deep" },
  { key: "repuestos", label: "Espera de Repuestos", tone: "warning" },
  { key: "salida", label: "Salida", tone: "success" },
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
};

export const CASES: VehicleCase[] = [
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
    daysInStage: 17,
    amount: 7420.35,
    advisor: "Karla Mendoza",
    branch: "Quito Norte",
  },
  {
    id: "OT-2421",
    plate: "PDQ-3390",
    vehicle: "Mazda 3 2020",
    client: "Jorge Salgado",
    insurer: "Equinoccial",
    stage: "reparacion",
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
    daysInStage: 3,
    amount: 1710.2,
    advisor: "Luis Paredes",
    branch: "Quito Norte",
  },
  {
    id: "OT-2425",
    plate: "GAX-8834",
    vehicle: "Ford Ranger 2020",
    client: "Transporte Litoral Cía.",
    insurer: "Seguros Alianza",
    stage: "reparacion",
    daysInStage: 16,
    amount: 8890.0,
    advisor: "Karla Mendoza",
    branch: "Guayaquil",
  },
];

export const STALLED_THRESHOLD_DAYS = 15;

export const isStalled = (c: VehicleCase) => c.daysInStage > STALLED_THRESHOLD_DAYS;

export const stageOf = (key: StageKey) => STAGES.find((s) => s.key === key) ?? STAGES[0]!;

export const casesForBranch = (branch: Branch) => CASES.filter((c) => c.branch === branch);

export const money = (value: number) =>
  new Intl.NumberFormat("es-EC", { style: "currency", currency: "USD" }).format(value);
