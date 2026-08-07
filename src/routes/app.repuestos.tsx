import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AlertTriangle, Ban, PackagePlus, ShoppingCart } from "lucide-react";
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
import { useSimulation } from "@/context/simulation";
import { useCases } from "@/context/cases";
import { entryFor, useProformas } from "@/context/proformas";
import { usePurchasing } from "@/context/purchasing";
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
      { title: "Órdenes de Compra de Repuestos | Centro de Colisiones" },
      {
        name: "description",
        content:
          "Registro de órdenes de compra por placa con proveedor, condición de pago y control de compras duplicadas.",
      },
      { property: "og:title", content: "Órdenes de Compra de Repuestos | Centro de Colisiones" },
      {
        property: "og:description",
        content: "Compras de repuestos aprobados con validación de duplicados por vehículo.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ComprasPage,
});

function ComprasPage() {
  const { session } = useSimulation();
  const { cases } = useCases();
  const { items, adjustments } = useProformas();
  const { orders, purchasedItemIds, addOrder, cancelOrder } = usePurchasing();

  const branchCases = session ? cases.filter((c) => c.branch === session.branch) : [];
  const [caseId, setCaseId] = useState(
    branchCases.find((c) => (items[c.id] ?? []).length > 0)?.id ?? branchCases[0]?.id ?? "",
  );
  const [providerId, setProviderId] = useState(PROVIDERS[0]!.id);
  const [condition, setCondition] = useState<PaymentCondition>("Crédito");
  const [method, setMethod] = useState<PaymentMethod>("Transferencia");
  const [reference, setReference] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
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
        .filter(({ entry }) => entry.status !== "rechazado"),
    [list, adjust],
  );

  const purchased = purchasedItemIds(activeId);
  const orderTotal = approvedParts
    .filter(({ item }) => selected.includes(item.id))
    .reduce((sum, { item, entry }) => sum + entry.approvedPrice * item.quantity, 0);

  const caseOrders = orders.filter((o) => o.caseId === activeId);

  if (!session || !current) return null;

  const toggle = (id: string) => {
    setError(null);
    setOk(null);
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const submit = () => {
    setOk(null);
    if (selected.length === 0) {
      setError("Selecciona al menos un repuesto aprobado para la orden.");
      return;
    }
    if (!reference.trim()) {
      setError("Registra el número de cheque o transacción.");
      return;
    }
    const provider = PROVIDERS.find((p) => p.id === providerId)!;
    const result = addOrder({
      caseId: activeId,
      plate: current.plate,
      providerId,
      providerName: provider.name,
      condition,
      method,
      reference: reference.trim(),
      itemIds: selected,
      total: orderTotal,
    });

    if (!result.ok) {
      const names = result.duplicated
        .map((id) => list.find((i) => i.id === id)?.description ?? id)
        .join(", ");
      setError(
        `Error: Compra Duplicada. Este repuesto ya fue adquirido para este vehículo. (${names})`,
      );
      return;
    }

    setError(null);
    setSelected([]);
    setReference("");
    setOk(`Orden ${result.id} registrada para la placa ${current.plate}.`);
  };

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-[18px] font-bold text-slate-deep">Panel de Órdenes de Compra</h1>
        <p className="text-[12px] leading-4 text-muted-grey">
          Compras ligadas a la placa, con control de repuestos ya adquiridos en órdenes activas.
        </p>
      </header>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-[14px]">Vehículo</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label className="text-[12px]">Orden de trabajo / Placa</Label>
            <Select
              value={activeId}
              onValueChange={(v) => {
                setCaseId(v);
                setSelected([]);
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
          </div>
          <div className="space-y-1 text-[12px] leading-5 text-muted-grey">
            <p>
              <span className="font-bold text-slate-deep">Cliente:</span> {current.client}
            </p>
            <p>
              <span className="font-bold text-slate-deep">Aseguradora:</span> {current.insurer}
            </p>
            <p>
              <span className="font-bold text-slate-deep">Asesor:</span> {current.advisor}
            </p>
          </div>
        </CardContent>
      </Card>

      {error && (
        <Alert className="border-crimson bg-crimson/10 text-crimson">
          <AlertTriangle className="size-4 text-crimson" />
          <AlertTitle className="text-[13px] font-bold">Compra no registrada</AlertTitle>
          <AlertDescription className="text-[12px] leading-4 text-crimson">
            {error}
          </AlertDescription>
        </Alert>
      )}

      {ok && (
        <Alert className="border-success bg-success/10">
          <ShoppingCart className="size-4 text-success" />
          <AlertTitle className="text-[13px] font-bold text-slate-deep">
            Orden registrada
          </AlertTitle>
          <AlertDescription className="text-[12px] text-muted-grey">{ok}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-[14px]">Repuestos aprobados por la aseguradora</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {approvedParts.length === 0 && (
              <p className="py-6 text-center text-[12px] text-muted-grey">
                No hay repuestos aprobados para esta placa.
              </p>
            )}
            {approvedParts.map(({ item, entry }) => {
              const isPurchased = purchased.includes(item.id);
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
                    onCheckedChange={() => toggle(item.id)}
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
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-[14px]">Datos de la orden</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-[12px]">Proveedor</Label>
              <Select value={providerId} onValueChange={setProviderId}>
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
                <Label className="text-[12px]">Condición de pago</Label>
                <Select
                  value={condition}
                  onValueChange={(v) => setCondition(v as PaymentCondition)}
                >
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
              <span className="text-[14px] font-bold text-slate-deep">{money(orderTotal)}</span>
            </div>

            <Button onClick={submit} className="h-11 w-full text-[13px] font-bold">
              <PackagePlus className="size-4" />
              Registrar orden de compra
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
              <span className="font-bold text-slate-deep">{o.id}</span>
              <span className="text-muted-grey">{o.providerName}</span>
              <Badge variant="outline" className="text-[10px] font-bold">
                {o.condition} · {o.method} #{o.reference}
              </Badge>
              <span className="text-muted-grey">{formatDate(o.createdAt)}</span>
              <span className="ml-auto font-bold text-slate-deep">{money(o.total)}</span>
              {o.status === "activa" ? (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 text-[11px] text-crimson"
                  onClick={() => cancelOrder(o.id)}
                >
                  <Ban className="size-3.5" />
                  Anular
                </Button>
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
