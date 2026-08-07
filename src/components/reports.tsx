import { useMemo, useState } from "react";
import { Download, Filter } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useSimulation, useBranchScope, BRANCHES, type Branch } from "@/context/simulation";
import { useCases } from "@/context/cases";
import { entryFor, useProformas, type Adjustment, type ProformaItem } from "@/context/proformas";
import { usePurchasing } from "@/context/purchasing";
import { money, stageOf } from "@/data/cases";
import { cn } from "@/lib/utils";

type Breakdown = { labor: number; parts: number; external: number };
const emptyBreakdown = (): Breakdown => ({ labor: 0, parts: 0, external: 0 });

function buildBreakdown(
  ids: string[],
  items: Record<string, ProformaItem[]>,
  adjustments: Record<string, Adjustment>,
): Breakdown {
  return ids.reduce((acc, id) => {
    const list = items[id] ?? [];
    const adj = adjustments[id];
    for (const item of list) {
      const entry = entryFor(adj, item);
      if (entry.status === "rechazado") continue;
      const value = entry.approvedPrice * item.quantity;
      if (item.category === "Mano de Obra") acc.labor += value;
      else if (item.category === "Repuesto") acc.parts += value;
      else acc.external += value;
    }
    return acc;
  }, emptyBreakdown());
}

export function ReportsModule() {
  const { canScopeAny } = useSimulation();
  const { cases } = useCases();
  const { items, adjustments } = useProformas();
  const { orders } = usePurchasing();

  const scoped = useBranchScope(cases);

  const [q, setQ] = useState("");
  const [insurerFilter, setInsurerFilter] = useState("todas");
  const [branchFilter, setBranchFilter] = useState<Branch | "todas">("todas");

  const insurers = useMemo(() => {
    const set = new Set<string>();
    scoped.forEach((c) => set.add(c.insurer));
    return [...set];
  }, [scoped]);

  const rows = useMemo(() => {
    const filtered = scoped.filter((c) => {
      if (branchFilter !== "todas" && c.branch !== branchFilter) return false;
      if (insurerFilter !== "todas" && c.insurer !== insurerFilter) return false;
      if (q.trim()) {
        const needle = q.trim().toLowerCase();
        const hay =
          `${c.plate} ${c.vehicle} ${c.client} ${c.broker} ${c.color}`.toLowerCase();
        if (!hay.includes(needle)) return false;
      }
      return true;
    });

    return filtered.map((c) => {
      const breakdown = buildBreakdown([c.id], items, adjustments);
      const income = breakdown.labor + breakdown.parts + breakdown.external;
      const expenses = orders
        .filter((o) => o.caseId === c.id && o.status === "activa")
        .reduce((s, o) => s + o.total, 0);
      return {
        item: c,
        breakdown,
        income,
        expenses,
        margin: income - expenses,
      };
    });
  }, [scoped, branchFilter, insurerFilter, q, items, adjustments, orders]);

  const totIncome = rows.reduce((s, r) => s + r.income, 0);
  const totExpenses = rows.reduce((s, r) => s + r.expenses, 0);

  const exportCsv = () => {
    const header = [
      "OT",
      "Placa",
      "Color",
      "Vehículo",
      "Cliente",
      "Aseguradora",
      "Broker",
      "Sucursal",
      "Etapa",
      "Venta MO",
      "Venta Repuestos",
      "Venta TFT",
      "Ingreso aprobado",
      "Gastos (OC)",
      "Margen",
    ].join(";");

    const lines = rows.map((r) =>
      [
        r.item.id,
        r.item.plate,
        r.item.color,
        r.item.vehicle,
        r.item.client,
        r.item.insurer,
        r.item.broker,
        r.item.branch,
        stageOf(r.item.stage).label,
        r.breakdown.labor.toFixed(2),
        r.breakdown.parts.toFixed(2),
        r.breakdown.external.toFixed(2),
        r.income.toFixed(2),
        r.expenses.toFixed(2),
        r.margin.toFixed(2),
      ].join(";"),
    );

    const blob = new Blob(["\uFEFF" + [header, ...lines].join("\r\n")], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "reporte-colisiones.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-[18px] font-bold text-slate-deep">Reporte consolidado</h1>
          <p className="text-[12px] leading-4 text-muted-grey">
            Por sucursal y por vehículo: montos por categoría, ingresos vs gastos.
          </p>
        </div>
        <Button onClick={exportCsv} className="h-10 gap-2 text-[12px] font-bold">
          <Download className="size-4" />
          Descargar CSV
        </Button>
      </header>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-[14px] font-bold text-slate-deep">
            <Filter className="mr-1 inline size-4" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-1.5">
            <Label className="text-[12px]">Placa / cliente / broker</Label>
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Ej. PCV-4821 o María"
              className="h-10 text-[12px]"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[12px]">Aseguradora</Label>
            <Select value={insurerFilter} onValueChange={setInsurerFilter}>
              <SelectTrigger className="h-10 text-[12px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas" className="text-[12px]">
                  Todas
                </SelectItem>
                {insurers.map((ins) => (
                  <SelectItem key={ins} value={ins} className="text-[12px]">
                    {ins}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {canScopeAny && (
            <div className="space-y-1.5">
              <Label className="text-[12px]">Sucursal</Label>
              <Select value={branchFilter} onValueChange={(v) => setBranchFilter(v as Branch | "todas")}>
                <SelectTrigger className="h-10 text-[12px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas" className="text-[12px]">
                    Todas
                  </SelectItem>
                  {BRANCHES.map((b) => (
                    <SelectItem key={b} value={b} className="text-[12px]">
                      {b}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-3 sm:grid-cols-4">
        <Stat label="Vehículos" value={String(rows.length)} tone="text-slate-deep" />
        <Stat label="Ingreso total" value={money(totIncome)} tone="text-success" />
        <Stat label="Gastos totales" value={money(totExpenses)} tone="text-crimson" />
        <Stat label="Margen total" value={money(totIncome - totExpenses)} tone="text-accent-blue" />
      </div>

      <Card>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-[12px]">OT</TableHead>
                <TableHead className="text-[12px]">Placa / Color</TableHead>
                <TableHead className="text-[12px]">Vehículo</TableHead>
                <TableHead className="text-[12px]">Cliente</TableHead>
                <TableHead className="text-[12px]">Aseguradora</TableHead>
                <TableHead className="text-[12px]">Broker</TableHead>
                <TableHead className="text-[12px]">Sucursal</TableHead>
                <TableHead className="text-right text-[12px]">V.MO</TableHead>
                <TableHead className="text-right text-[12px]">V.Rep</TableHead>
                <TableHead className="text-right text-[12px]">V.TFT</TableHead>
                <TableHead className="text-right text-[12px]">Ingreso</TableHead>
                <TableHead className="text-right text-[12px]">Gastos</TableHead>
                <TableHead className="text-right text-[12px]">Margen</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={13} className="text-center text-[12px] text-muted-grey">
                    Sin resultados para los filtros aplicados.
                  </TableCell>
                </TableRow>
              )}
              {rows.map((r) => (
                <TableRow key={r.item.id}>
                  <TableCell className="text-[12px] font-bold">{r.item.id}</TableCell>
                  <TableCell className="text-[12px]">
                    {r.item.plate}
                    <span className="ml-1 text-muted-grey">· {r.item.color}</span>
                  </TableCell>
                  <TableCell className="text-[12px]">{r.item.vehicle}</TableCell>
                  <TableCell className="text-[12px]">{r.item.client}</TableCell>
                  <TableCell className="text-[12px]">{r.item.insurer}</TableCell>
                  <TableCell className="text-[12px]">{r.item.broker}</TableCell>
                  <TableCell className="text-[12px]">
                    <Badge variant="outline" className="text-[10px] font-bold">
                      {r.item.branch}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right text-[12px]">{money(r.breakdown.labor)}</TableCell>
                  <TableCell className="text-right text-[12px]">{money(r.breakdown.parts)}</TableCell>
                  <TableCell className="text-right text-[12px]">{money(r.breakdown.external)}</TableCell>
                  <TableCell className="text-right text-[12px] font-bold text-success">
                    {money(r.income)}
                  </TableCell>
                  <TableCell className="text-right text-[12px] font-bold text-crimson">
                    {money(r.expenses)}
                  </TableCell>
                  <TableCell
                    className={cn(
                      "text-right text-[12px] font-bold",
                      r.margin >= 0 ? "text-slate-deep" : "text-crimson",
                    )}
                  >
                    {money(r.margin)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-[11px] text-muted-grey">{label}</p>
        <p className={cn("text-[16px] font-bold", tone)}>{value}</p>
      </CardContent>
    </Card>
  );
}