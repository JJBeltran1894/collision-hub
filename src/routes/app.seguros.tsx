import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ArrowRight, FilePlus2, Paperclip, Trash2, TrendingDown } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { usePurchasing } from "@/context/purchasing";
import {
  approvedTotal,
  entryFor,
  lineTotal,
  proformaTotal,
  STATUS_STYLES,
  useProformas,
  type AdjustStatus,
} from "@/context/proformas";
import { money } from "@/data/cases";

export const Route = createFileRoute("/app/seguros")({
  head: () => ({
    meta: [
      { title: "Historial de Ajuste del Seguro | Centro de Colisiones" },
      {
        name: "description",
        content:
          "Vista comparativa entre la proforma original del taller y el ajuste independiente de la aseguradora.",
      },
      { property: "og:title", content: "Historial de Ajuste del Seguro | Centro de Colisiones" },
      {
        property: "og:description",
        content: "Ítems aprobados, modificados o rechazados y descuento global de la aseguradora.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SegurosPage,
});

const STATUSES: AdjustStatus[] = ["pendiente", "aprobado", "modificado", "rechazado"];

function SegurosPage() {
  const { session } = useSimulation();
  const { cases, moveCase } = useCases();
  const { items, adjustments, setAdjust } = useProformas();
  const { attachments, addAttachment, removeAttachment } = usePurchasing();

  const branchCases = useBranchScope(cases);
  const [caseId, setCaseId] = useState(
    branchCases.find((c) => (items[c.id] ?? []).length > 0)?.id ?? branchCases[0]?.id ?? "",
  );

  if (!session) return null;

  const current = branchCases.find((c) => c.id === caseId) ?? branchCases[0];
  const activeId = current?.id ?? "";
  const list = items[activeId] ?? [];
  const adjust = adjustments[activeId];

  const original = proformaTotal(list);
  const approved = approvedTotal(list, adjust);
  const discount = original > 0 ? ((original - approved) / original) * 100 : 0;

  const caseAttachments = attachments.filter((a) => a.caseId === activeId);
  const allSettled =
    list.length > 0 && list.every((i) => (adjust?.[i.id]?.status ?? "pendiente") !== "pendiente");
  const canGenerate = current?.stage === "ajuste" && allSettled;

  const generateOt = () => {
    if (!current) return;
    moveCase(current.id, "orden");
    toast.success(`Orden de Reparación generada para la placa ${current.plate}`);
  };

  const onAddFiles = (files: FileList | null) => {
    if (!files || files.length === 0 || !activeId) return;
    Array.from(files).forEach((f) => {
      const kind = f.name.split(".").pop()?.toUpperCase() ?? "ARCHIVO";
      const size =
        f.size >= 1024 * 1024
          ? `${(f.size / (1024 * 1024)).toFixed(1)} MB`
          : `${Math.round(f.size / 1024)} KB`;
      addAttachment(activeId, { name: f.name, kind, size });
    });
  };

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-[18px] font-bold text-slate-deep">Historial de Ajuste del Seguro</h1>
        <p className="text-[12px] leading-4 text-muted-grey">
          La proforma original permanece intacta; el ajuste es un documento independiente.
        </p>
      </header>

      {canGenerate && (
        <Card className="border-l-4 border-l-accent-blue">
          <CardContent className="flex flex-wrap items-center gap-3 p-4">
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-bold text-slate-deep">
                Ajuste completo: listo para generar la orden de reparación
              </p>
              <p className="text-[12px] text-muted-grey">
                Todos los ítems tienen estado definido. Al generar la OT se crea la orden
                aprobada y el caso avanza a la etapa Orden.
              </p>
            </div>
            <Button onClick={generateOt} className="h-11 gap-2 text-[12px] font-bold">
              <FilePlus2 className="size-4" />
              Generar Orden de Reparación
            </Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-[14px] font-bold text-slate-deep">
            <Paperclip className="size-4 text-insurance" />
            Archivos de respaldo de la OT
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <label className="flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed border-border text-[12px] font-bold text-muted-grey hover:bg-muted">
            <Paperclip className="size-4" />
            Adjuntar correos, PDF del seguro, Excel de respaldo (varios)
            <input
              type="file"
              multiple
              className="hidden"
              onChange={(e) => onAddFiles(e.target.files)}
            />
          </label>
          {caseAttachments.length === 0 && (
            <p className="py-3 text-center text-[12px] text-muted-grey">
              Sin archivos adjuntos. Sin límite de cantidad de respaldo por OT.
            </p>
          )}
          {caseAttachments.map((f) => (
            <div
              key={f.id}
              className="flex items-center gap-2 rounded-md border border-border p-2 text-[12px]"
            >
              <span className="min-w-0 flex-1 truncate font-bold text-slate-deep">{f.name}</span>
              <Badge variant="outline" className="text-[10px] font-bold">
                {f.kind}
              </Badge>
              <span className="text-muted-grey">{f.size}</span>
              <button
                type="button"
                aria-label={`Eliminar ${f.name}`}
                onClick={() => removeAttachment(activeId, f.id)}
                className="grid size-7 place-items-center rounded text-crimson hover:bg-muted"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex flex-wrap items-center gap-3 p-4">
          <Select value={activeId} onValueChange={setCaseId}>
            <SelectTrigger className="h-11 max-w-md text-[12px]" aria-label="Orden de trabajo">
              <SelectValue placeholder="Selecciona una OT" />
            </SelectTrigger>
            <SelectContent>
              {branchCases.map((c) => (
                <SelectItem key={c.id} value={c.id} className="text-[12px]">
                  {c.id} · {c.plate} · {c.insurer}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {current && (
            <p className="text-[12px] text-muted-grey">
              {current.vehicle} · {current.client} · Aseguradora {current.insurer}
            </p>
          )}
        </CardContent>
      </Card>

      {list.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center text-[12px] text-muted-grey">
            Esta orden no tiene proforma registrada todavía.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="border-l-4 border-l-accent-blue">
            <CardHeader className="pb-3">
              <CardTitle className="text-[14px] font-bold text-slate-deep">
                Proforma original del taller
              </CardTitle>
              <p className="text-[12px] text-muted-grey">Documento base · solo lectura</p>
            </CardHeader>
            <CardContent className="space-y-2">
              {list.map((item) => (
                <div key={item.id} className="rounded-md border border-border bg-card p-3">
                  <div className="flex items-start justify-between gap-2">
                    <p className="min-w-0 text-[12px] font-bold text-slate-deep">
                      {item.description}
                    </p>
                    <span className="shrink-0 text-[12px] font-bold text-slate-deep">
                      {money(lineTotal(item))}
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] text-muted-grey">
                    {item.category} · {item.quantity} × {money(item.unitPrice)}
                  </p>
                </div>
              ))}
              <div className="flex items-center justify-between border-t border-border pt-3">
                <span className="text-[12px] text-muted-grey">Total proforma</span>
                <span className="text-[18px] font-bold text-slate-deep">{money(original)}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-insurance">
            <CardHeader className="pb-3">
              <CardTitle className="text-[14px] font-bold text-slate-deep">
                Ajuste de la Aseguradora
              </CardTitle>
              <p className="text-[12px] text-muted-grey">
                Documento independiente · precios autorizados editables
              </p>
            </CardHeader>
            <CardContent className="space-y-2">
              {list.map((item) => {
                const entry = entryFor(adjust, item);
                const status = STATUS_STYLES[entry.status];
                const rejected = entry.status === "rechazado";
                return (
                  <div
                    key={item.id}
                    className={cn(
                      "rounded-md border border-border bg-card p-3",
                      rejected && "opacity-70",
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="min-w-0 text-[12px] font-bold text-slate-deep">
                        {item.description}
                      </p>
                      <Badge className={cn("shrink-0 text-[11px] font-bold", status.className)}>
                        {status.label}
                      </Badge>
                    </div>

                    <div className="mt-2 grid gap-2 sm:grid-cols-2">
                      <Select
                        value={entry.status}
                        onValueChange={(v) =>
                          setAdjust(activeId, item.id, {
                            status: v as AdjustStatus,
                            ...(v === "rechazado" ? { approvedPrice: 0 } : {}),
                            ...(v === "aprobado" ? { approvedPrice: item.unitPrice } : {}),
                          })
                        }
                      >
                        <SelectTrigger
                          className="h-11 text-[12px]"
                          aria-label={`Estado de ${item.description}`}
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {STATUSES.map((s) => (
                            <SelectItem key={s} value={s} className="text-[12px]">
                              {STATUS_STYLES[s].label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={String(entry.approvedPrice)}
                        onChange={(e) =>
                          setAdjust(activeId, item.id, {
                            approvedPrice: Number(e.target.value) || 0,
                            status: entry.status === "pendiente" ? "modificado" : entry.status,
                          })
                        }
                        aria-label={`Precio autorizado de ${item.description}`}
                        className="h-11 text-[12px]"
                      />
                    </div>

                    <p className="mt-2 flex flex-wrap items-center gap-1.5 text-[11px] text-muted-grey">
                      <span className="line-through">{money(item.unitPrice)}</span>
                      <ArrowRight className="size-3" />
                      <span className="font-bold text-insurance">
                        {money(rejected ? 0 : entry.approvedPrice)}
                      </span>
                      <span>· autorizado {money(rejected ? 0 : entry.approvedPrice * item.quantity)}</span>
                    </p>
                    {entry.note && (
                      <p className="mt-1 text-[11px] italic text-muted-grey">{entry.note}</p>
                    )}
                  </div>
                );
              })}

              <div className="space-y-2 border-t border-border pt-3">
                <div className="flex items-center justify-between">
                  <span className="text-[12px] text-muted-grey">Valor neto aprobado</span>
                  <span className="text-[18px] font-bold text-insurance">{money(approved)}</span>
                </div>
                <div
                  className={cn(
                    "flex items-center justify-between rounded-md px-3 py-2",
                    discount > 0 ? "bg-crimson text-crimson-foreground" : "bg-muted text-muted-grey",
                  )}
                >
                  <span className="flex items-center gap-1.5 text-[12px] font-bold">
                    <TrendingDown className="size-4" />
                    Descuento global impuesto
                  </span>
                  <span className="text-[18px] font-bold">
                    {discount.toFixed(1)}% · -{money(original - approved)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
