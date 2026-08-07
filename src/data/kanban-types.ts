// src/data/kanban-types.ts

export type Branch = "Quito Norte" | "Quito Sur" | "Guayaquil";

export type StageKey =
  | "recepcion"
  | "proforma"
  | "ajuste_seguro"
  | "orden_reparacion"
  | "enderezado"
  | "pintura"
  | "espera_repuestos"
  | "listo_salida";

export interface StageConfig {
  key: StageKey;
  label: string;
  tone: "muted" | "accent" | "insurance" | "deep" | "warning" | "success";
}

// Las 8 columnas obligatorias en el orden exacto especificado
export const KANBAN_STAGES: StageConfig[] = [
  { key: "recepcion", label: "Recepción", tone: "muted" },
  { key: "proforma", label: "Proforma", tone: "accent" },
  { key: "ajuste_seguro", label: "Ajuste del Seguro", tone: "insurance" },
  { key: "orden_reparacion", label: "Orden de Reparación", tone: "deep" },
  { key: "enderezado", label: "Enderezado", tone: "deep" },
  { key: "pintura", label: "Pintura", tone: "deep" },
  { key: "espera_repuestos", label: "Espera de Repuestos", tone: "warning" },
  { key: "listo_salida", label: "Listo/Salida", tone: "success" },
];

/**
 * Registro de Bitácora de Tiempos
 * Representa la entidad HISTORIAL_ESTADO del DER con fecha_inicio y fecha_fin
 */
export interface StageHistoryEntry {
  id: string;
  stageKey: StageKey;
  stageLabel: string;
  startDate: string; // ISO String
  endDate: string | null; // null si es la etapa activa actual
  updatedByRole?: string;
}

/**
 * Estructura de Tarjeta de Vehículo
 */
export interface VehicleCardData {
  id: string; // Orden de Trabajo (ej. OT-2418)
  plate: string; // Placa (ej. PCV-4821)
  branch: Branch; // Sucursal
  advisor: string; // Asesor
  insurer: string; // Aseguradora
  vehicleModel: string; // Marca / Modelo
  currentStage: StageKey;
  history: StageHistoryEntry[]; // Bitácora de Tiempos
}

/**
 * Helper para calcular días transcurridos en la etapa activa
 */
export function getDaysInCurrentStage(card: VehicleCardData): number {
  const currentEntry = card.history.find(
    (h) => h.stageKey === card.currentStage && h.endDate === null
  );
  if (!currentEntry) return 0;

  const start = new Date(currentEntry.startDate).getTime();
  const now = new Date().getTime();
  const diffDays = Math.floor((now - start) / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
}

/**
 * Evalúa la Alerta Comercial por estancamiento (> 30 días en Proforma o Ajuste del Seguro)
 */
export function isStuckAlert(card: VehicleCardData): boolean {
  const days = getDaysInCurrentStage(card);
  const isTargetStage =
    card.currentStage === "proforma" || card.currentStage === "ajuste_seguro";
  return days > 30 && isTargetStage;
}

// Datos de demostración iniciales
export const INITIAL_VEHICLES_MOCK: VehicleCardData[] = [
  {
    id: "OT-2418",
    plate: "PCV-4821",
    branch: "Quito Norte",
    advisor: "Luis Paredes",
    insurer: "Seguros Alianza",
    vehicleModel: "Chevrolet Sail 2021",
    currentStage: "proforma",
    history: [
      {
        id: "h1",
        stageKey: "recepcion",
        stageLabel: "Recepción",
        startDate: "2026-06-01T08:00:00.000Z",
        endDate: "2026-06-03T10:00:00.000Z",
      },
      {
        id: "h2",
        stageKey: "proforma",
        stageLabel: "Proforma",
        startDate: "2026-06-03T10:00:00.000Z", // Simula caso real de estancamiento (+60 días)
        endDate: null,
      },
    ],
  },
  {
    id: "OT-2420",
    plate: "PBA-7745",
    branch: "Quito Norte",
    advisor: "Karla Mendoza",
    insurer: "Seguros Alianza",
    vehicleModel: "Toyota Hilux 2019",
    currentStage: "ajuste_seguro",
    history: [
      {
        id: "h3",
        stageKey: "recepcion",
        stageLabel: "Recepción",
        startDate: "2026-05-10T09:00:00.000Z",
        endDate: "2026-05-12T11:00:00.000Z",
      },
      {
        id: "h4",
        stageKey: "proforma",
        stageLabel: "Proforma",
        startDate: "2026-05-12T11:00:00.000Z",
        endDate: "2026-05-20T16:00:00.000Z",
      },
      {
        id: "h5",
        stageKey: "ajuste_seguro",
        stageLabel: "Ajuste del Seguro",
        startDate: "2026-05-20T16:00:00.000Z", // Caso real de enero-mayo estancado (+75 días)
        endDate: null,
      },
    ],
  },
  {
    id: "OT-2422",
    plate: "GBC-9012",
    branch: "Guayaquil",
    advisor: "Diego Sánchez",
    insurer: "Equinoccial",
    vehicleModel: "Hyundai Tucson 2023",
    currentStage: "enderezado",
    history: [
      {
        id: "h6",
        stageKey: "recepcion",
        stageLabel: "Recepción",
        startDate: "2026-07-28T08:00:00.000Z",
        endDate: "2026-07-29T10:00:00.000Z",
      },
      {
        id: "h7",
        stageKey: "orden_reparacion",
        stageLabel: "Orden de Reparación",
        startDate: "2026-07-29T10:00:00.000Z",
        endDate: "2026-08-01T14:00:00.000Z",
      },
      {
        id: "h8",
        stageKey: "enderezado",
        stageLabel: "Enderezado",
        startDate: "2026-08-01T14:00:00.000Z",
        endDate: null,
      },
    ],
  },
];