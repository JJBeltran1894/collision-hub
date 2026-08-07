/** Catálogos simulados para Compras y Facturación Electrónica (SRI). */

export type PaymentCondition = "Crédito" | "Contado";
export type PaymentMethod = "Cheque" | "Transferencia";

export const PAYMENT_CONDITIONS: PaymentCondition[] = ["Crédito", "Contado"];
export const PAYMENT_METHODS: PaymentMethod[] = ["Cheque", "Transferencia"];

export type Provider = {
  id: string;
  name: string;
  taxId: string;
  city: string;
};

export const PROVIDERS: Provider[] = [
  { id: "p1", name: "Importadora Andina de Repuestos", taxId: "1791234567001", city: "Quito" },
  { id: "p2", name: "Autopartes del Pacífico S.A.", taxId: "0992345678001", city: "Guayaquil" },
  { id: "p3", name: "Repuestos Originales Ecuador", taxId: "1793456789001", city: "Quito" },
  { id: "p4", name: "Distribuidora Litoral Motors", taxId: "0994567890001", city: "Guayaquil" },
];

/** Registro tributario simulado para autocompletado por RUC / Cédula. */
export type TaxEntity = {
  taxId: string;
  name: string;
  address: string;
  email: string;
  phone: string;
};

export const TAX_REGISTRY: TaxEntity[] = [
  {
    taxId: "1712345678",
    name: "María Zambrano",
    address: "Av. Amazonas N34-120, Quito",
    email: "maria.zambrano@correo.ec",
    phone: "0991234567",
  },
  {
    taxId: "0912345678",
    name: "Andrés Vera",
    address: "Cdla. Kennedy Norte, Guayaquil",
    email: "andres.vera@correo.ec",
    phone: "0987654321",
  },
  {
    taxId: "1790012345001",
    name: "Comercial Andina S.A.",
    address: "Av. República del Salvador 500, Quito",
    email: "facturacion@comercialandina.ec",
    phone: "023456789",
  },
  {
    taxId: "1791122334",
    name: "Jorge Salgado",
    address: "Valle de los Chillos, Quito",
    email: "jorge.salgado@correo.ec",
    phone: "0993344556",
  },
  {
    taxId: "0990011223001",
    name: "Transporte Litoral Cía. Ltda.",
    address: "Km 8.5 Vía Daule, Guayaquil",
    email: "pagos@translitoral.ec",
    phone: "042345678",
  },
  {
    taxId: "1790900112001",
    name: "Seguros Alianza",
    address: "Av. 12 de Octubre N24-660, Quito",
    email: "siniestros@segurosalianza.ec",
    phone: "023987654",
  },
  {
    taxId: "1790500334001",
    name: "Equinoccial",
    address: "Av. Naciones Unidas E2-30, Quito",
    email: "pagos@equinoccial.ec",
    phone: "023112233",
  },
  {
    taxId: "0991200556001",
    name: "Particular",
    address: "Sin aseguradora asignada",
    email: "cliente@correo.ec",
    phone: "0990000000",
  },
];

export const findTaxEntity = (taxId: string) =>
  TAX_REGISTRY.find((e) => e.taxId === taxId.trim());

export const findTaxEntityByName = (name: string) =>
  TAX_REGISTRY.find((e) => e.name.toLowerCase() === name.trim().toLowerCase());

export const IVA_RATE = 0.15;

/** Retenciones simuladas cuando el receptor actúa como agente de retención. */
export const RETENTION = {
  bienes: { income: 0.01, iva: 0.3 },
  servicios: { income: 0.02, iva: 0.7 },
} as const;

export type BillingGroupKey = "labor" | "parts" | "external";

export const BILLING_GROUPS: {
  key: BillingGroupKey;
  label: string;
  kind: "bienes" | "servicios";
}[] = [
  { key: "labor", label: "Servicios de Mano de Obra", kind: "servicios" },
  { key: "parts", label: "Adquisición de Repuestos de Colisión", kind: "bienes" },
  { key: "external", label: "Trabajos Externos y Materiales", kind: "servicios" },
];
