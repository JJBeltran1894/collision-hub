export type PlateRecord = {
  plate: string;
  brand: string;
  model: string;
  year: string;
  color: string;
};

/** Padrón simulado de vehículos para el autocompletado por placa. */
export const PLATE_REGISTRY: PlateRecord[] = [
  { plate: "PCV-4821", brand: "Chevrolet", model: "Sail", year: "2021", color: "Blanco" },
  { plate: "PBA-7745", brand: "Toyota", model: "Hilux", year: "2019", color: "Plata" },
  { plate: "PDF-5567", brand: "Renault", model: "Duster", year: "2021", color: "Gris" },
  { plate: "PDQ-3390", brand: "Mazda", model: "3", year: "2020", color: "Rojo" },
  { plate: "GSA-1120", brand: "Kia", model: "Sportage", year: "2022", color: "Negro" },
  { plate: "GBC-9012", brand: "Hyundai", model: "Tucson", year: "2023", color: "Azul" },
  { plate: "GAX-8834", brand: "Ford", model: "Ranger", year: "2020", color: "Blanco" },
  { plate: "PCX-2210", brand: "Nissan", model: "Versa", year: "2018", color: "Beige" },
];

export const findPlate = (raw: string) => {
  const key = raw.trim().toUpperCase();
  return PLATE_REGISTRY.find((p) => p.plate === key) ?? null;
};

export const CLIENTS = [
  "María Zambrano",
  "Andrés Vera",
  "Comercial Andina S.A.",
  "Jorge Salgado",
  "Patricia Ríos",
  "Silvia Cabrera",
  "Transporte Litoral Cía.",
];

export const INSURERS = [
  "Seguros Alianza",
  "Equinoccial",
  "Chubb Seguros",
  "Zurich Seguros",
  "Particular (sin seguro)",
];

export const BROKERS = [
  "Novaequity Brokers",
  "Tecniseguros",
  "Raúl Coka Barriga",
  "Ecuaprimas",
  "Sin broker",
];

export type AccessoryAnswer = "si" | "no" | null;

export type AccessoryRow = {
  key: string;
  label: string;
  answer: AccessoryAnswer;
  note: string;
};

export const ACCESSORIES: { key: string; label: string }[] = [
  { key: "radio", label: "Radio" },
  { key: "espejos", label: "Espejos" },
  { key: "llanta", label: "Llanta de refacción" },
  { key: "gato", label: "Gato" },
];

export type Severity = "leve" | "media" | "fuerte";

export const SEVERITIES: { key: Severity; label: string; fill: string; badge: string }[] = [
  { key: "leve", label: "Leve", fill: "fill-warning/35", badge: "bg-warning text-warning-foreground" },
  {
    key: "media",
    label: "Media",
    fill: "fill-insurance/45",
    badge: "bg-insurance text-insurance-foreground",
  },
  {
    key: "fuerte",
    label: "Fuerte",
    fill: "fill-destructive/55",
    badge: "bg-destructive text-destructive-foreground",
  },
];

export type ZoneKey = "frente" | "atras" | "izquierda" | "derecha" | "techo";

export const ZONE_LABELS: Record<ZoneKey, string> = {
  frente: "Frente",
  atras: "Posterior",
  izquierda: "Lateral izquierdo",
  derecha: "Lateral derecho",
  techo: "Techo / Capó",
};

export const MIN_PHOTOS = 10;
export const MAX_PHOTOS = 15;
export const MIN_VIDEOS = 2;
export const MAX_VIDEOS = 3;

/** Estado general de la carrocería e interior (ficha técnica de ingreso). */
export type BodyCondition = "Buena" | "Regular" | "Dañada";
export const BODY_CONDITIONS: BodyCondition[] = ["Buena", "Regular", "Dañada"];

/** Colores autorizados por la ANT (Agencia Nacional de Tránsito, Ecuador).
 * El registro de color del vehículo está restringido por disposición legal; por
 * eso el color debe seleccionarse de este catálogo y no escribirse libremente. */
export const ANT_COLORS: string[] = [
  "Blanco",
  "Plata",
  "Negro",
  "Gris",
  "Rojo",
  "Azul",
  "Celeste",
  "Verde",
  "Amarillo",
  "Naranja",
  "Rosado",
  "Morado",
  "Beige",
  "Crema",
  "Dorado",
  "Café",
  "Vino",
  "Turquesa",
  "Fucsia",
  "Bronce",
];
