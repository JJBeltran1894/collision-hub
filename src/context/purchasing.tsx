import { createContext, useCallback, useContext, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { PaymentCondition, PaymentMethod } from "@/data/billing";

export type PurchaseOrder = {
  id: string;
  caseId: string;
  plate: string;
  providerId: string;
  providerName: string;
  condition: PaymentCondition;
  method: PaymentMethod;
  reference: string;
  itemIds: string[];
  total: number;
  createdAt: string;
  status: "activa" | "anulada";
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

type PurchasingValue = {
  orders: PurchaseOrder[];
  invoices: Invoice[];
  /** Ítems ya adquiridos en órdenes activas de esa placa. */
  purchasedItemIds: (caseId: string) => string[];
  addOrder: (
    order: Omit<PurchaseOrder, "id" | "createdAt" | "status">,
  ) => { ok: true; id: string } | { ok: false; duplicated: string[] };
  cancelOrder: (id: string) => void;
  addInvoice: (invoice: Omit<Invoice, "id" | "createdAt">) => string;
};

const PurchasingContext = createContext<PurchasingValue | null>(null);

const uid = (prefix: string) =>
  `${prefix}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;

export function PurchasingProvider({ children }: { children: ReactNode }) {
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);

  const purchasedItemIds = useCallback(
    (caseId: string) =>
      orders
        .filter((o) => o.caseId === caseId && o.status === "activa")
        .flatMap((o) => o.itemIds),
    [orders],
  );

  const addOrder = useCallback<PurchasingValue["addOrder"]>(
    (order) => {
      const already = orders
        .filter((o) => o.caseId === order.caseId && o.status === "activa")
        .flatMap((o) => o.itemIds);
      const duplicated = order.itemIds.filter((id) => already.includes(id));
      if (duplicated.length > 0) return { ok: false, duplicated };

      const id = uid("OC");
      setOrders((prev) => [
        { ...order, id, createdAt: new Date().toISOString(), status: "activa" },
        ...prev,
      ]);
      return { ok: true, id };
    },
    [orders],
  );

  const cancelOrder = useCallback((id: string) => {
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status: "anulada" } : o)));
  }, []);

  const addInvoice = useCallback<PurchasingValue["addInvoice"]>((invoice) => {
    const id = uid("001-001");
    setInvoices((prev) => [{ ...invoice, id, createdAt: new Date().toISOString() }, ...prev]);
    return id;
  }, []);

  const value = useMemo(
    () => ({ orders, invoices, purchasedItemIds, addOrder, cancelOrder, addInvoice }),
    [orders, invoices, purchasedItemIds, addOrder, cancelOrder, addInvoice],
  );

  return <PurchasingContext.Provider value={value}>{children}</PurchasingContext.Provider>;
}

export function usePurchasing() {
  const ctx = useContext(PurchasingContext);
  if (!ctx) throw new Error("usePurchasing debe usarse dentro de PurchasingProvider");
  return ctx;
}
