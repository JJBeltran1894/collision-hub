import { createContext, useCallback, useContext, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { PaymentCondition, PaymentMethod } from "@/data/billing";

/** Tipo de orden de compra: repuestos, insumos/materiales o pago de personal. */
export type POType = "repuesto" | "insumo" | "personal";
export type PayStatus = "pendiente" | "cancelado";

export type POLine = {
  id: string;
  description: string;
  category: "Repuesto" | "Insumo" | "Personal";
  quantity: number;
  unitPrice: number;
};

export type PurchaseOrder = {
  id: string;
  caseId: string;
  plate: string;
  type: POType;
  providerId: string;
  providerName: string;
  condition: PaymentCondition;
  method: PaymentMethod;
  reference: string;
  lines: POLine[];
  total: number;
  createdAt: string;
  status: "activa" | "anulada";
  paymentStatus: PayStatus;
};

export type Attachment = {
  id: string;
  caseId: string;
  name: string;
  kind: string;
  size: string;
  createdAt: string;
};

export type InvoiceLine = {
  label: string;
  subtotal: number;
  iva: number;
  incomeRetention: number;
  ivaRetention: number;
};

export type Invoice = {
  id: string;
  caseId: string;
  plate: string;
  recipient: "Propietario" | "Aseguradora";
  taxId: string;
  name: string;
  address: string;
  email: string;
  lines: InvoiceLine[];
  subtotal: number;
  iva: number;
  retentions: number;
  total: number;
  createdAt: string;
};

type OrderInput = {
  caseId: string;
  plate: string;
  type: POType;
  providerId: string;
  providerName: string;
  condition: PaymentCondition;
  method: PaymentMethod;
  reference: string;
  lines: Omit<POLine, "id">[];
};

type PurchasingValue = {
  orders: PurchaseOrder[];
  invoices: Invoice[];
  attachments: Attachment[];
  /** Descripciones de repuestos ya adquiridos en órdenes activas de la placa. */
  purchasedDescriptions: (caseId: string) => string[];
  addOrder: (order: OrderInput) => { ok: true; id: string } | { ok: false; duplicated: string[] };
  cancelOrder: (id: string) => void;
  setPaymentStatus: (id: string, status: PayStatus) => void;
  addInvoice: (invoice: Omit<Invoice, "id" | "createdAt">) => string;
  addAttachment: (caseId: string, data: { name: string; kind: string; size: string }) => void;
  removeAttachment: (caseId: string, id: string) => void;
};

const PurchasingContext = createContext<PurchasingValue | null>(null);

const uid = (prefix: string) =>
  `${prefix}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;

export function PurchasingProvider({ children }: { children: ReactNode }) {
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [attachments, setAttachments] = useState<Attachment[]>([]);

  const purchasedDescriptions = useCallback(
    (caseId: string) =>
      orders
        .filter((o) => o.caseId === caseId && o.type === "repuesto" && o.status === "activa")
        .flatMap((o) => o.lines.map((l) => l.description)),
    [orders],
  );

  const addOrder = useCallback<PurchasingValue["addOrder"]>(
    (order) => {
      const current = orders.filter(
        (o) => o.caseId === order.caseId && o.type === "repuesto" && o.status === "activa",
      );
      const already = current.flatMap((o) => o.lines.map((l) => l.description));
      const names = order.lines.map((l) => l.description);
      const duplicated = order.lines
        .filter((l) => l.category === "Repuesto" && already.includes(l.description))
        .map((l) => l.description);
      if (duplicated.length > 0) return { ok: false, duplicated };

      const id = uid("OC");
      const lines = order.lines.map((l) => ({ ...l, id: uid("L") }));
      const total = lines.reduce((s, l) => s + l.quantity * l.unitPrice, 0);
      setOrders((prev) => [
        {
          ...order,
          id,
          lines,
          total,
          createdAt: new Date().toISOString(),
          status: "activa",
          paymentStatus: "pendiente",
        },
        ...prev,
      ]);
      return { ok: true, id };
    },
    [orders],
  );

  const cancelOrder = useCallback((id: string) => {
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status: "anulada" } : o)));
  }, []);

  const setPaymentStatus = useCallback((id: string, status: PayStatus) => {
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, paymentStatus: status } : o)));
  }, []);

  const addInvoice = useCallback<PurchasingValue["addInvoice"]>((invoice) => {
    const id = uid("001-001");
    setInvoices((prev) => [{ ...invoice, id, createdAt: new Date().toISOString() }, ...prev]);
    return id;
  }, []);

  const addAttachment = useCallback<PurchasingValue["addAttachment"]>(
    (caseId, data) => {
      const id = uid("F");
      setAttachments((prev) => [
        {
          ...data,
          id,
          caseId,
          createdAt: new Date().toISOString(),
        },
        ...prev,
      ]);
    },
    [],
  );

  const removeAttachment = useCallback((caseId: string, id: string) => {
    setAttachments((prev) =>
      prev.filter((a) => !(a.caseId === caseId && a.id === id)),
    );
  }, []);

  const value = useMemo(
    () => ({
      orders,
      invoices,
      attachments,
      purchasedDescriptions,
      addOrder,
      cancelOrder,
      setPaymentStatus,
      addInvoice,
      addAttachment,
      removeAttachment,
    }),
    [
      orders,
      invoices,
      attachments,
      purchasedDescriptions,
      addOrder,
      cancelOrder,
      setPaymentStatus,
      addInvoice,
      addAttachment,
      removeAttachment,
    ],
  );

  return <PurchasingContext.Provider value={value}>{children}</PurchasingContext.Provider>;
}

export function usePurchasing() {
  const ctx = useContext(PurchasingContext);
  if (!ctx) throw new Error("usePurchasing debe usarse dentro de PurchasingProvider");
  return ctx;
}