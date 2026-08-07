import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { FileCheck2, ReceiptText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { entryFor, useProformas } from "@/context/proformas";
import { usePurchasing, type InvoiceLine } from "@/context/purchasing";
import {
  BILLING_GROUPS,
  IVA_RATE,
  RETENTION,
  findTaxEntity,
  findTaxEntityByName,
} from "@/data/billing";
import { formatDate, money } from "@/data/cases";

export const Route = createFileRoute("/app/facturacion")({
  head: () => ({
    meta: [
      { title: "Facturación Electrónica SRI | Centro de Colisiones" },
      {
        name: "description",
        content:
          "Emisión de facturas consolidadas en tres líneas con IVA y simulación de retenciones por categoría.",
      },
      { property: "og:title", content: "Facturación Electrónica SRI | Centro de Colisiones" },
      {
        property: "og:description",
        content: "Factura al propietario o a la aseguradora con autocompletado por RUC/Cédula.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: FacturacionPage,
});

const round2 = (n: number) => Math.round(n * 100) / 100;

function FacturacionPage() {
  const { session } = useSimulation();
  const { cases } = useCases();
  const { items, adjustments } = useProformas();
  const { invoices, addInvoice } = usePurchasing();

  const branchCases = useBranchScope(cases);
  const [caseId, setCaseId] = useState(
    branchCases.find((c) => (items[c.id] ?? []).length > 0)?.id ?? branchCases[0]?.id ?? "",
  );
  const [recipient, setRecipient] = useState<"Propietario" | "Aseguradora">("Propietario");
  const [taxId, setTaxId] = useState("");
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [email, setEmail] = useState("");
  const [issued, setIssued] = useState<string | null>(null);

  const current = branchCases.find((c) => c.id === caseId) ?? branchCases[0];
  const activeId = current?.id ?? "";
  const list = items[activeId] ?? [];
  const adjust = adjustments[activeId];

  // Autocompleta el destinatario sugerido según propietario o aseguradora.
  useEffect(() => {
    if (!current) return;
    const target = recipient === "Propietario" ? current.client : current.insurer;
    const entity = findTaxEntityByName(target);
    setTaxId(entity?.taxId ?? "");
    setName(entity?.name ?? target);
    setAddress(entity?.address ?? "");
    setEmail(entity?.email ?? "");
    setIssued(null);
  }, [recipient, current?.id]);

  const lines = useMemo<InvoiceLine[]>(() => {
    const isAgent = recipient === "Aseguradora";
    return BILLING_GROUPS.map((group) => {
      const subtotal = list
        .filter((i) =>
          group.key === "labor"
            ? i.category === "Mano de Obra"
            : group.key === "parts"
              ? i.category === "Repuesto"
              : i.category === "TFT",
        )
        .reduce((sum, item) => {
          const entry = entryFor(adjust, item);
          if (entry.status === "rechazado") return sum;
          return sum + entry.approvedPrice * item.quantity;
        }, 0);
      const iva = subtotal * IVA_RATE;
      const rates = RETENTION[group.kind];
      return {
        label: group.label,
        subtotal: round2(subtotal),
        iva: round2(iva),
        incomeRetention: round2(isAgent ? subtotal * rates.income : 0),
        ivaRetention: round2(isAgent ? iva * rates.iva : 0),
      };
    });
  }, [list, adjust, recipient]);

  const totals = lines.reduce(
    (acc, l) => ({
      subtotal: acc.subtotal + l.subtotal,
      iva: acc.iva + l.iva,
      retentions: acc.retentions + l.incomeRetention + l.ivaRetention,
    }),
    { subtotal: 0, iva: 0, retentions: 0 },
  );
  const gross = round2(totals.subtotal + totals.iva);
  const net = round2(gross - totals.retentions);

  if (!session || !current) return null;

  const lookup = (value: string) => {
    setTaxId(value);
    const entity = findTaxEntity(value);
    if (entity) {
      setName(entity.name);
      setAddress(entity.address);
      setEmail(entity.email);
    }
  };

  const emit = () => {
    const id = addInvoice({
      caseId: activeId,
      plate: current.plate,
      recipient,
      taxId,
      name,
      address,
      email,
      lines,
      subtotal: round2(totals.subtotal),
      iva: round2(totals.iva),
      retentions: round2(totals.retentions),
      total: net,
    });
    setIssued(id);
  };

  const caseInvoices = invoices.filter((i) => i.caseId === activeId);
  const readyToBill = current.stage === "salida";
  const canEmit =
    readyToBill &&
    totals.subtotal > 0 &&
    taxId.trim().length >= 10 &&
    name.trim().length > 0;

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-[18px] font-bold text-slate-deep">Facturación Electrónica SRI</h1>
        <p className="text-[12px] leading-4 text-muted-grey">
          La orden de trabajo final se consolida automáticamente en un máximo de tres líneas.
        </p>
      </header>

      <div className="grid gap-4 lg:grid-cols-[1fr_1.4fr]">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-[14px]">Datos del comprobante</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-[12px]">Orden de trabajo / Placa</Label>
              <Select value={activeId} onValueChange={(v) => setCaseId(v)}>
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

            <div className="space-y-1.5">
              <Label className="text-[12px]">Destinatario</Label>
              <div className="grid grid-cols-2 gap-2" role="group">
                {(["Propietario", "Aseguradora"] as const).map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setRecipient(option)}
                    aria-pressed={recipient === option}
                    className={cn(
                      "min-h-12 rounded-md border text-[12px] font-bold transition-colors",
                      recipient === option
                        ? "border-insurance bg-insurance text-insurance-foreground"
                        : "border-border bg-card text-muted-grey",
                    )}
                  >
                    {option}
                  </button>
                ))}
              </div>
              <p className="text-[11px] leading-4 text-muted-grey">
                {recipient === "Aseguradora"
                  ? "La aseguradora actúa como agente de retención."
                  : "Cliente final: no aplica retención en la fuente."}
              </p>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[12px]" htmlFor="ruc">
                RUC / Cédula
              </Label>
              <Input
                id="ruc"
                value={taxId}
                onChange={(e) => lookup(e.target.value.replace(/\D/g, "").slice(0, 13))}
                placeholder="1712345678"
                inputMode="numeric"
                className="h-10 text-[13px]"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[12px]" htmlFor="razon">
                Razón social / Nombre
              </Label>
              <Input
                id="razon"
                value={name}
                onChange={(e) => setName(e.target.value.slice(0, 120))}
                className="h-10 text-[13px]"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[12px]" htmlFor="dir">
                Dirección
              </Label>
              <Input
                id="dir"
                value={address}
                onChange={(e) => setAddress(e.target.value.slice(0, 160))}
                className="h-10 text-[13px]"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[12px]" htmlFor="mail">
                Correo electrónico
              </Label>
              <Input
                id="mail"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value.slice(0, 120))}
                className="h-10 text-[13px]"
              />
            </div>

            <Button
              onClick={emit}
              disabled={!canEmit}
              className="h-11 w-full text-[13px] font-bold"
            >
              <ReceiptText className="size-4" />
              Emitir factura electrónica
            </Button>
            <p className="text-[11px] leading-4 text-muted-grey">
              {totals.subtotal > 0 && !readyToBill
                ? `La OT debe estar en la etapa "Listo / Salida" para emitirse.`
                : "La factura se consolida sobre el valor neto aprobado y se autoriza tras la salida del vehículo."}
            </p>
          </CardContent>
        </Card>

        <div className="space-y-4">
          {issued && (
            <Alert className="border-success bg-success/10">
              <FileCheck2 className="size-4 text-success" />
              <AlertTitle className="text-[13px] font-bold text-slate-deep">
                Factura {issued} autorizada (simulación SRI)
              </AlertTitle>
              <AlertDescription className="text-[12px] text-muted-grey">
                Enviada a {email || "correo no registrado"} por la placa {current.plate}.
              </AlertDescription>
            </Alert>
          )}

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-[14px]">Consolidación en tres líneas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {lines.map((line) => (
                <div key={line.label} className="rounded-md border border-border p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[12px] font-bold text-slate-deep">{line.label}</span>
                    <span className="text-[13px] font-bold text-slate-deep">
                      {money(line.subtotal)}
                    </span>
                  </div>
                  <dl className="mt-2 grid grid-cols-3 gap-2 text-[11px] leading-4 text-muted-grey">
                    <div>
                      <dt>IVA {Math.round(IVA_RATE * 100)}%</dt>
                      <dd className="font-bold text-slate-deep">{money(line.iva)}</dd>
                    </div>
                    <div>
                      <dt>Ret. Renta</dt>
                      <dd className="font-bold text-crimson">-{money(line.incomeRetention)}</dd>
                    </div>
                    <div>
                      <dt>Ret. IVA</dt>
                      <dd className="font-bold text-crimson">-{money(line.ivaRetention)}</dd>
                    </div>
                  </dl>
                </div>
              ))}

              <div className="space-y-1 rounded-md bg-muted p-3 text-[12px]">
                <Row label="Subtotal" value={money(round2(totals.subtotal))} />
                <Row label={`IVA ${Math.round(IVA_RATE * 100)}%`} value={money(round2(totals.iva))} />
                <Row label="Total factura" value={money(gross)} />
                <Row
                  label="Retenciones simuladas"
                  value={`-${money(round2(totals.retentions))}`}
                  tone="crimson"
                />
                <div className="flex items-center justify-between border-t border-border pt-2">
                  <span className="font-bold text-slate-deep">Valor neto a recibir</span>
                  <span className="text-[15px] font-bold text-slate-deep">{money(net)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-[14px]">Comprobantes emitidos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {caseInvoices.length === 0 && (
                <p className="py-4 text-center text-[12px] text-muted-grey">
                  Sin facturas emitidas para esta placa.
                </p>
              )}
              {caseInvoices.map((inv) => (
                <div
                  key={inv.id}
                  className="flex flex-wrap items-center gap-2 rounded-md border border-border p-3 text-[12px]"
                >
                  <span className="font-bold text-slate-deep">{inv.id}</span>
                  <Badge variant="outline" className="text-[10px] font-bold">
                    {inv.recipient}
                  </Badge>
                  <span className="truncate text-muted-grey">{inv.name}</span>
                  <span className="text-muted-grey">{formatDate(inv.createdAt)}</span>
                  <span className="ml-auto font-bold text-slate-deep">{money(inv.total)}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "crimson";
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-grey">{label}</span>
      <span className={cn("font-bold", tone === "crimson" ? "text-crimson" : "text-slate-deep")}>
        {value}
      </span>
    </div>
  );
}
