import { useState } from "react";
import { AlertTriangle, History } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useCases, stageDuration } from "@/context/cases";
import {
  STAGES,
  STAGE_STYLES,
  formatDate,
  isCommercialAlert,
  isStalled,
  money,
  stageOf,
  type StageKey,
  type VehicleCase,
} from "@/data/cases";

function StageLogDialog({ item }: { item: VehicleCase }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 gap-1 px-2 text-[11px] font-bold text-accent-blue"
        >
          <History className="size-3.5" />
          Bitácora
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-[16px] font-bold text-slate-deep">
            Bitácora de Tiempos · {item.plate}
          </DialogTitle>
          <DialogDescription className="text-[12px]">
            {item.id} · {item.vehicle} · {item.branch}
          </DialogDescription>
        </DialogHeader>
        <ol className="space-y-2">
          {item.history.map((entry, index) => {
            const stage = stageOf(entry.stage);
            const styles = STAGE_STYLES[stage.tone];
            return (
              <li
                key={`${entry.stage}-${index}`}
                className={cn(
                  "rounded-md border border-border border-l-4 bg-card p-3 text-[12px]",
                  styles.border,
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-slate-deep">{stage.label}</span>
                  <span className="font-bold text-muted-grey">
                    {stageDuration(entry)} días
                  </span>
                </div>
                <p className="mt-1 text-muted-grey">
                  Inicio: {formatDate(entry.startedAt)} · Fin:{" "}
                  {entry.endedAt ? formatDate(entry.endedAt) : "En curso"}
                </p>
              </li>
            );
          })}
        </ol>
      </DialogContent>
    </Dialog>
  );
}

export function CaseCard({
  item,
  draggable = false,
  showMoveSelect = false,
}: {
  item: VehicleCase;
  compact?: boolean;
  draggable?: boolean;
  showMoveSelect?: boolean;
}) {
  const stage = stageOf(item.stage);
  const styles = STAGE_STYLES[stage.tone];
  const stalled = isStalled(item);
  const commercial = isCommercialAlert(item);
  const { moveCase } = useCases();

  return (
    <article
      draggable={draggable}
      onDragStart={(e) => {
        e.dataTransfer.setData("text/plain", item.id);
        e.dataTransfer.effectAllowed = "move";
      }}
      className={cn(
        "rounded-md border border-border border-l-4 bg-card p-3 text-[12px] leading-4 shadow-sm",
        styles.border,
        draggable && "cursor-grab active:cursor-grabbing",
        (stalled || commercial) && "border-l-crimson stalled-pulse",
        commercial && "border-crimson",
      )}
    >
      {commercial && (
        <p className="mb-2 flex items-center gap-1.5 rounded bg-crimson px-2 py-1 text-[11px] font-bold text-crimson-foreground">
          <AlertTriangle className="size-3.5 shrink-0" />
          Vehículo Estancado - Alerta Comercial
        </p>
      )}

      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-2">
        <div className="min-w-0">
          <h3 className="truncate text-[14px] font-bold text-slate-deep">{item.plate}</h3>
          <p className="truncate text-muted-grey">{item.vehicle}</p>
        </div>
        <span className="shrink-0 text-[12px] font-bold text-slate-deep">{item.id}</span>
      </div>

      <dl className="mt-2 space-y-0.5 text-muted-grey">
        <div className="flex justify-between gap-2">
          <dt>Sucursal</dt>
          <dd className="truncate font-bold text-slate-deep">{item.branch}</dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt>Asesor</dt>
          <dd className="truncate font-bold text-slate-deep">{item.advisor}</dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt>Aseguradora</dt>
          <dd className="truncate font-bold text-slate-deep">{item.insurer}</dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt>Días transcurridos</dt>
          <dd className={cn("font-bold", commercial ? "text-crimson" : "text-slate-deep")}>
            {item.daysInStage}
          </dd>
        </div>
      </dl>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Badge
          variant="outline"
          className={cn("border-current text-[11px] font-bold", styles.text)}
        >
          <span className={cn("mr-1 inline-block size-2 rounded-full", styles.dot)} />
          {stage.label}
        </Badge>
        {stalled && !commercial && (
          <Badge className="bg-warning text-[11px] font-bold text-warning-foreground">
            Estancado · {item.daysInStage} días
          </Badge>
        )}
      </div>

      <div className="mt-2 flex items-center justify-between gap-2">
        <p className="text-[12px] font-bold text-slate-deep">{money(item.amount)}</p>
        <StageLogDialog item={item} />
      </div>

      {showMoveSelect && (
        <div className="mt-2">
          <Select value={item.stage} onValueChange={(v) => moveCase(item.id, v as StageKey)}>
            <SelectTrigger className="h-11 w-full text-[12px]" aria-label="Mover etapa">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STAGES.map((s) => (
                <SelectItem key={s.key} value={s.key} className="text-[12px]">
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </article>
  );
}

export function KanbanBoard({ items }: { items: VehicleCase[] }) {
  const { moveCase } = useCases();
  const [over, setOver] = useState<StageKey | null>(null);

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {STAGES.map((stage) => {
        const column = items.filter((i) => i.stage === stage.key);
        const styles = STAGE_STYLES[stage.tone];
        return (
          <section
            key={stage.key}
            className={cn(
              "w-72 shrink-0 rounded-md p-1 transition-colors",
              over === stage.key && "bg-accent-blue/10 ring-2 ring-accent-blue",
            )}
            onDragOver={(e) => {
              e.preventDefault();
              e.dataTransfer.dropEffect = "move";
              setOver(stage.key);
            }}
            onDragLeave={() => setOver((s) => (s === stage.key ? null : s))}
            onDrop={(e) => {
              e.preventDefault();
              const id = e.dataTransfer.getData("text/plain");
              setOver(null);
              if (id) moveCase(id, stage.key);
            }}
          >
            <header className="mb-3 flex items-center justify-between rounded-md border border-border bg-card px-3 py-2">
              <span className="flex min-w-0 items-center gap-2">
                <span className={cn("size-2.5 shrink-0 rounded-full", styles.dot)} />
                <span className="truncate text-[14px] font-bold text-slate-deep">
                  {stage.label}
                </span>
              </span>
              <span className="shrink-0 text-[12px] font-bold text-muted-grey">
                {column.length}
              </span>
            </header>
            <div className="min-h-24 space-y-3">
              {column.map((item) => (
                <CaseCard key={item.id} item={item} draggable />
              ))}
              {column.length === 0 && (
                <p className="rounded-md border border-dashed border-border p-4 text-center text-[12px] text-muted-grey">
                  Soltar vehículo aquí
                </p>
              )}
            </div>
          </section>
        );
      })}
    </div>
  );
}
