import { createFileRoute } from "@tanstack/react-router";
import { AlertTriangle, Car, DollarSign, ShieldCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useSimulation } from "@/context/simulation";
import { CaseCard } from "@/components/kanban";
import { isCommercialAlert, isStalled, money, stageOf } from "@/data/cases";
import { useCases } from "@/context/cases";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/app/")({
  head: () => ({
    meta: [
      { title: "Dashboard operativo | Centro de Colisiones" },
      {
        name: "description",
        content:
          "Indicadores de taller, vehículos en patio y casos estancados por sucursal del Centro de Colisiones.",
      },
      { property: "og:title", content: "Dashboard operativo | Centro de Colisiones" },
      {
        property: "og:description",
        content: "Resumen de casos, montos y alertas del taller de colisiones.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AppHome,
});

function AppHome() {
  const { session, viewMode } = useSimulation();
  const { cases } = useCases();
  if (!session) return null;

  const items = cases.filter((c) => c.branch === session.branch);
  const stalled = items.filter(isStalled);
  const insurance = items.filter((i) => i.stage === "ajuste");
  const total = items.reduce((sum, i) => sum + i.amount, 0);

  if (viewMode === "mobile") {
    return (
      <div className="space-y-4">
        <header>
          <h1 className="text-[18px] font-bold text-slate-deep">Patio · {session.branch}</h1>
          <p className="text-[12px] leading-4 text-muted-grey">
            {items.length} vehículos asignados · {stalled.length} con alerta
          </p>
        </header>

        <div className="grid grid-cols-2 gap-3">
          <MobileStat label="En patio" value={String(items.length)} tone="accent-blue" />
          <MobileStat label="Estancados" value={String(stalled.length)} tone="crimson" />
        </div>

        <div className="space-y-3">
          {items.map((item) => (
            <CaseCard key={item.id} item={item} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-[18px] font-bold text-slate-deep">Dashboard general</h1>
        <p className="text-[12px] leading-4 text-muted-grey">
          Sucursal {session.branch} · Sesión de {session.role}
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat
          title="Vehículos activos"
          value={String(items.length)}
          icon={Car}
          tone="text-accent-blue"
        />
        <Stat
          title="En ajuste de seguro"
          value={String(insurance.length)}
          icon={ShieldCheck}
          tone="text-insurance"
        />
        <Stat
          title="Casos estancados"
          value={String(stalled.length)}
          icon={AlertTriangle}
          tone="text-crimson"
        />
        <Stat
          title="Monto en proceso"
          value={money(total)}
          icon={DollarSign}
          tone="text-success"
        />
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-[14px] font-bold text-slate-deep">
            Órdenes de trabajo
          </CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-[12px]">OT</TableHead>
                <TableHead className="text-[12px]">Placa</TableHead>
                <TableHead className="text-[12px]">Vehículo</TableHead>
                <TableHead className="text-[12px]">Cliente</TableHead>
                <TableHead className="text-[12px]">Aseguradora</TableHead>
                <TableHead className="text-[12px]">Etapa</TableHead>
                <TableHead className="text-[12px]">Días</TableHead>
                <TableHead className="text-right text-[12px]">Monto</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => {
                const stage = stageOf(item.stage);
                return (
                  <TableRow key={item.id}>
                    <TableCell className="text-[12px] font-bold">{item.id}</TableCell>
                    <TableCell className="text-[12px]">{item.plate}</TableCell>
                    <TableCell className="text-[12px]">{item.vehicle}</TableCell>
                    <TableCell className="text-[12px]">{item.client}</TableCell>
                    <TableCell className="text-[12px]">{item.insurer}</TableCell>
                    <TableCell className="text-[12px]">{stage.label}</TableCell>
                    <TableCell className="text-[12px]">
                      {isStalled(item) ? (
                        <Badge
                          className={cn(
                            "text-[11px] font-bold",
                            isCommercialAlert(item)
                              ? "bg-crimson text-crimson-foreground"
                              : "bg-warning text-warning-foreground",
                          )}
                        >
                          {item.daysInStage}
                        </Badge>
                      ) : (
                        item.daysInStage
                      )}
                    </TableCell>
                    <TableCell className="text-right text-[12px] font-bold">
                      {money(item.amount)}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function Stat({
  title,
  value,
  icon: Icon,
  tone,
}: {
  title: string;
  value: string;
  icon: typeof Car;
  tone: string;
}) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between gap-3 p-4">
        <div className="min-w-0">
          <p className="truncate text-[12px] leading-4 text-muted-grey">{title}</p>
          <p className="mt-1 truncate text-[18px] font-bold text-slate-deep">{value}</p>
        </div>
        <Icon className={cn("size-6 shrink-0", tone)} />
      </CardContent>
    </Card>
  );
}

function MobileStat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "accent-blue" | "crimson";
}) {
  return (
    <div
      className={cn(
        "rounded-md border border-border border-l-4 bg-yard-bg p-3",
        tone === "accent-blue" ? "border-l-accent-blue" : "border-l-crimson",
      )}
    >
      <p className="text-[12px] leading-4 text-muted-grey">{label}</p>
      <p className="text-[18px] font-bold text-slate-deep">{value}</p>
    </div>
  );
}
