import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AlertTriangle, Ban, ShoppingCart, Wrench, Boxes, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useSimulation, useBranchScope } from "@/context/simulation";
import { useCases } from "@/context/cases";
import { approvedTotal, entryFor, useProformas } from "@/context/proformas";
import { usePurchasing, type POType } from "@/context/purchasing";
import {
  PAYMENT_CONDITIONS,
  PAYMENT_METHODS,
  PROVIDERS,
  type PaymentCondition,
  type PaymentMethod,
} from "@/data/billing";
import { formatDate, money } from "@/data/cases";

export const Route = createFileRoute("/app/repuestos")({
  head: () => ({
    meta: [
      { title: "Órdenes de Compra | Centro de Colisiones" },
      {
        name: "description",
        content:
          "Órdenes de compra por placa: repuestos, insumos/materiales y pago de personal, con control de duplicados y estado de pago.",
      },
      {
        property: "og:description",
        content:
          "Gestión de compras y gastos del taller con diagnóstico por placa y trazabilidad.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ComprasPage,
});

const OC_TYPE_OPTIONS: { value: POType; label: string; icon: typeof Wrench }[] = [
  { value: "repuesto", label: "Repuestos", icon: Boxes },
  { value: "insumo", label: "Insumos / Materiales", icon: Wrench },
  { value: "personal", label: "Pago de Personal", icon: Users },
];
const OC_TYPE_LABEL: Record<POType, string> = {
  repuesto: "Repuestos",
  insumo: "Insumos / Materiales",
  personal: "Pago de Personal",
};

type Row = { description: string; quantity: string; unitPrice: string };

const emptyRow = (): Row => ({ description: "", quantity: "1", unitPrice: "" });

function ComprasPage() {
  const { session } = useSimulation();
  const { cases } = useCases();
  const { items, adjustments } = useProformas();
  const { orders, purchasedDescriptions, addOrder, cancelOrder, setPaymentStatus } =
    usePurchasing();

  const branchCases = useBranchScope(cases);
  const [caseId, setCaseId] = useState(
    branchCases.find((c) => (items[c.id] ?? []).length > 0)?.id ?? branchCases[0]?.id ?? "",
  );
  const [ocType, setOcType] = useState<POType>("repuesto");
  const [providerId, setProviderId] = useState(PROVIDERS[0]!.id);
  const [condition, setCondition] = useState<PaymentCondition>("Crédito");
  const [method, setMethod] = useState<PaymentMethod>("Transferencia");
  const [reference, setReference] = useState("");

  const [selected, setSelected] = useState<string[]>([]);
  const [rows, setRows] = useState<Row[]>([emptyRow()]);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  const current = branchCases.find((c) => c.id === caseId) ?? branchCases[0];
  const activeId = current?.id ?? "";
  const list = items[activeId] ?? [];
  const adjust = adjustments[activeId];

  const approvedParts = useMemo(
    () =>
      list
        .filter((i) => i.category === "Repuesto")
        .map((i) => ({ item: i, entry: entryFor(adjust, i) }))
        .filter(
          ({ entry }) => entry.status === "aprobado" || entry.status === "modificado",
        ),
    [list, adjust],
  );

  const purchased = purchasedDescriptions(activeId);
  const caseOrders = orders.filter((o) => o.caseId === activeId);

  // Diagnóstico por placa: ingresos aprobados (seguro) vs gastos (OC activas).
  const income = approvedTotal(list, adjust);
  const expenses = caseOrders
    .filter((o) => o.status === "activa")
    .reduce((s, o) => s + o.total, 0);
  const margin = income - expenses;

  if (!session || !current) return null;

  const togglePart = (id: string) => {
    setError(null);
    setOk(null);
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const updateRow = (index: number, patch: Partial<Row>) =>
    setRows((prev) => prev.map((r, i) => (i === index ? { ...r, ...patch } : r)));

  const submit = () => {
    setOk(null);
    // Construir líneas según el tipo de OC.
    const lines =
      ocType === "repuesto"
        ? selected.map((id) => {
            const { item, entry } = approvedParts.find((p) => p.item.id === id)!;
            return {
              description: item.description,
              category: "Repuesto" as const,
              quantity: item.quantity,
              unitPrice: entry.approvedPrice,
            };
          })
        : rows
            .filter((r) => r.description.trim())
            .map((r) => ({
              description: r.description.trim(),
              category: (ocType === "personal" ? "Personal" : "Insumo") as const,
              quantity: Number(r.quantity) || 0,
              unitPrice: Number(r.unitPrice) || 0,
            }))
            .filter((l) => l.quantity > 0 && l.unitPrice > 0);

    if (lines.length === 0) {
      setError(
        ocType === "repuesto"
          ? "Selecciona al menos un repuesto aprobado para la orden."
          : "Agrega al menos una línea con descripción, cantidad y precio.",
      );
      return;
    }
    if (!reference.trim()) {
      setError("Registra el número de cheque o transacción.");
      return;
    }

    const provider = PROVIDERS.find((p) => p.id === providerId);
    const result = addOrder({
      caseId: activeId,
      plate: current.plate,
      type: ocType,
      providerId: ocType === "repuesto" ? providerId : "",
      providerName:
        ocType === "repuesto" ? provider?.name ?? "—" : ocType === "insumo" ? "Insumos / Materiales" : "Trabajo de personal",
      condition,
      method,
      reference: reference.trim(),
      lines,
    });

    if (!result.ok) {
      setError(`Error: Compra Duplicada. Ya adquirido para este vehículo: (${result.duplicated.join(", ")})`);
      return;
    }

    setError(null);
    setOk(`Orden ${result.id} registrada para la placa ${current.plate}.`);
    setSelected([]);
    setRows([emptyRow()]);
    setReference("");
  };

  const totalLines =
    ocType === "repuesto"
      ? selected.reduce((s, id) => {
          const p = approvedParts.find((p) => p.item.id === id);
          return p ? s + p.entry.approvedPrice * p.item.quantity : s;
        }, 0)
      : rows.reduce(
          (s, r) => s + (Number(r.quantity) || 0) * (Number(r.unitPrice) || 0),
          0,
        );

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-[18px] font-bold text-slate-deep">Panel de Órdenes de Compra</h1>
        <p className="text-[12px] leading-4 text-muted-grey">
          Órdenes digitales por placa: repuestos, insumos y personal, con control de duplicados
          y estado de pago.
        </p>
      </header>

      {/* Diagnóstico por placa */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-[14px]">Diagnóstico por placa · {current.plate}</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-3 gap-3">
          <div className="rounded-md border border-border p-3">
            <p className="text-[11px] text-muted-grey">Ingreso aprobado (seguro)</p>
            <p className="text-[16px] font-bold text-success">{money(income)}</p>
          </div>
          <div className="rounded-md border border-border p-3">
            <p className="text-[11px] text-muted-grey">Gastos en compras</p>
            <p className="text-[16px] font-bold text-crimson">{money(expenses)}</p>
          </div>
          <div className="rounded-md border border-border p-3">
            <p className="text-[11px] text-muted-grey">Margen</p>
            <p
              className={cn(
                "text-[16px] font-bold",
                margin >= 0 ? "text-success" : "text-crimson",
              )}
            >
              {money(margin)}
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-2">
        {OC_TYPE_OPTIONS.map((o) => (
          <button
            key={o.value}
            type="button"
            onClick={() => {
              setOcType(o.value);
              setOk(null);
              setError(null);
            }}
            className={cn(
              "flex min-h-10 items-center gap-2 rounded-md border px-3 text-[12px] font-bold transition-colors",
              ocType === o.value
                ? "border-accent-blue bg-accent-blue text-accent-blue-foreground"
                : "border-border bg-card text-muted-grey",
            )}
          >
            <o.icon className="size-4" />
            {o.label}
          </button>
        ))}
      </div>

      {error && (
        <Alert className="border-crimson bg-crimson/10 text-crimson">
          <AlertTriangle className="size-4 text-crimson" />
          <AlertTitle className="text-[13px] font-bold">Compra no registrada</AlertTitle>
          <AlertDescription className="text-[12px] leading-4 text-crimson">{error}</AlertDescription>
        </Alert>
      )}
      {ok && (
        <Alert className="border-success bg-success/10">
          <ShoppingCart className="size-4 text-success" />
          <AlertTitle className="text-[13px] font-bold text-slate-deep">Orden registrada</AlertTitle>
          <AlertDescription className="text-[12px] text-muted-grey">{ok}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-[14px]">Vehículo y partidas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Select
              value={activeId}
              onValueChange={(v) => {
                setCaseId(v);
                setSelected([]);
                setRows([emptyRow()]);
                setError(null);
                setOk(null);
              }}
            >
              <SelectTrigger className="h-10 text-[13px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {branchCases.map((c) => (
                  <SelectItem key={c.id} value={c.id} className="text-[13px]">
                    {c.plate} · {c.id} · {c.vehicle}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {ocType === "repuesto" ? (
              <div className="space-y-2">
                {approvedParts.length === 0 && (
                  <p className="py-6 text-center text-[12px] text-muted-grey">
                    No hay repuestos aprobados. Marca cada repuesto como "Aprobado" o
                    "Modificado" en el módulo de Seguros.
                  </p>
                )}
                {approvedParts.map(({ item, entry }) => {
                  const isPurchased = purchased.includes(item.description);
                  return (
                    <label
                      key={item.id}
                      className={cn(
                        "flex min-h-12 items-center gap-3 rounded-md border p-3 text-[12px]",
                        isPurchased ? "border-crimson/40 bg-crimson/5" : "border-border bg-card",
                      )}
                    >
                      <Checkbox
                        checked={selected.includes(item.id)}
                        onCheckedChange={() => togglePart(item.id)}
                        aria-label={item.description}
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-bold text-slate-deep">
                          {item.description}
                        </span>
                        <span className="text-muted-grey">
                          Cant. {item.quantity} · Autorizado {money(entry.approvedPrice)}
                        </span>
                      </span>
                      {isPurchased && (
                        <Badge className="bg-crimson text-[10px] font-bold text-crimson-foreground">
                          Ya comprado
                        </Badge>
                      )}
                      <span className="font-bold text-slate-deep">
                        {money(entry.approvedPrice * item.quantity)}
                      </span>
                    </label>
                  );
                })}
              </div>
            ) : (
              <div className="space-y-2">
                {rows.map((row, index) => (
                  <div key={index} className="grid grid-cols-[minmax(0,1fr)_70px_110px] gap-2">
                    <Input
                      value={row.description}
                      onChange={(e) => updateRow(index, { description: e.target.value })}
                      placeholder={
                        ocType === "personal"
                          ? "Concepto (ej. jornal pintor, enderezado por pieza)"
                          : "Insumo / material (ej. masilla, thinner, lijas)"
                      }
                      className="h-10 text-[12px]"
                    />
                    <Input
                      type="number"
                      min="0"
                      value={row.quantity}
                      onChange={(e) => updateRow(index, { quantity: e.target.value })}
                      placeholder="Cant."
                      className="h-10 text-[12px]"
                    />
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={row.unitPrice}
                      onChange={(e) => updateRow(index, { unitPrice: e.target.value })}
                      placeholder="Precio"
                      className="h-10 text-[12px]"
                    />
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  className="h-10 w-full text-[12px] font-bold"
                  onClick={() => setRows((prev) => [...prev, emptyRow()])}
                >
                  + Agregar línea
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-[14px]">Datos de la orden</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-[12px]">Cliente y aseguradora</Label>
              <p className="text-[12px] leading-4 text-muted-grey">
                {current.client} · {current.insurer}
              </p>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[12px]">Proveedor / concepto</Label>
              <Select
                value={providerId}
                onValueChange={setProviderId}
                disabled={ocType !== "repuesto"}
              >
                <SelectTrigger className="h-10 text-[13px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PROVIDERS.map((p) => (
                    <SelectItem key={p.id} value={p.id} className="text-[13px]">
                      {p.name} · {p.taxId}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-[12px]">Condición</Label>
                <Select value={condition} onValueChange={(v) => setCondition(v as PaymentCondition)}>
                  <SelectTrigger className="h-10 text-[13px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PAYMENT_CONDITIONS.map((c) => (
                      <SelectItem key={c} value={c} className="text-[13px]">
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[12px]">Método</Label>
                <Select value={method} onValueChange={(v) => setMethod(v as PaymentMethod)}>
                  <SelectTrigger className="h-10 text-[13px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PAYMENT_METHODS.map((m) => (
                      <SelectItem key={m} value={m} className="text-[13px]">
                        {m}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[12px]" htmlFor="ref">
                N° de {method === "Cheque" ? "cheque" : "transacción"}
              </Label>
              <Input
                id="ref"
                value={reference}
                onChange={(e) => setReference(e.target.value.slice(0, 40))}
                placeholder={method === "Cheque" ? "0001234" : "TRX-889201"}
                className="h-10 text-[13px]"
              />
            </div>

            <div className="flex items-center justify-between rounded-md bg-muted px-3 py-2 text-[12px]">
              <span className="text-muted-grey">Total de la orden</span>
              <span className="text-[14px] font-bold text-slate-deep">{money(totalLines)}</span>
            </div>

            <Button onClick={submit} className="h-11 w-full text-[13px] font-bold">
              <ShoppingCart className="size-4" />
              Registrar orden de {OC_TYPE_LABEL[ocType].toLowerCase()}
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-[14px]">Órdenes de la placa {current.plate}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {caseOrders.length === 0 && (
            <p className="py-6 text-center text-[12px] text-muted-grey">
              Aún no hay órdenes registradas para este vehículo.
            </p>
          )}
          {caseOrders.map((o) => (
            <div
              key={o.id}
              className="flex flex-wrap items-center gap-2 rounded-md border border-border p-3 text-[12px]"
            >
              <Badge variant="outline" className="text-[10px] font-bold">
                {OC_TYPE_LABEL[o.type]}
              </Badge>
              <span className="font-bold text-slate-deep">{o.id}</span>
              <span className="text-muted-grey">{o.providerName}</span>
              <Badge
                variant="outline"
                className={cn(
                  "text-[10px] font-bold",
                  o.paymentStatus === "cancelado" ? "text-success" : "text-warning",
                )}
              >
                {o.paymentStatus === "cancelado" ? "Cancelado" : "Pendiente"} ·{" "}
                {o.paymentStatus}
              </Badge>
              <span className="text-muted-grey">{formatDate(o.createdAt)}</span>
              <span className="ml-auto font-bold text-slate-deep">{money(o.total)}</span>
              {o.status === "activa" ? (
                <div className="flex items-center gap-1">
                  {o.paymentStatus === "pendiente" ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 text-[11px] text-success"
                      onClick={() => setPaymentStatus(o.id, "cancelado")}
                    >
                      Marcar pagada
                    </Button>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 text-[11px] text-warning"
                      onClick={() => setPaymentStatus(o.id, "pendiente")}
                    >
                      Marcar pendiente
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 text-[11px] text-crimson"
                    onClick={() => cancelOrder(o.id)}
                  >
                    <Ban className="size-3.5" />
                    Anular
                  </Button>
                </div>
              ) : (
                <Badge className="bg-muted text-[10px] font-bold text-muted-grey">Anulada</Badge>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}