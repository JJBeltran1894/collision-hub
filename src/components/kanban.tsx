import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  STAGES,
  STAGE_STYLES,
  isStalled,
  money,
  stageOf,
  type VehicleCase,
} from "@/data/cases";

export function CaseCard({
  item,
  compact = false,
}: {
  item: VehicleCase;
  compact?: boolean;
}) {
  const stage = stageOf(item.stage);
  const styles = STAGE_STYLES[stage.tone];
  const stalled = isStalled(item);

  return (
    <article
      className={cn(
        "rounded-md border border-border border-l-4 bg-card p-3 shadow-sm",
        styles.border,
        stalled && "border-l-crimson stalled-pulse",
        compact ? "text-[12px] leading-4" : "text-[12px] leading-4",
      )}
    >
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-2">
        <div className="min-w-0">
          <h3 className="truncate text-[14px] font-bold text-slate-deep">{item.plate}</h3>
          <p className="truncate text-muted-grey">{item.vehicle}</p>
        </div>
        <span className="shrink-0 text-[12px] font-bold text-slate-deep">{item.id}</span>
      </div>

      <p className="mt-2 truncate text-muted-grey">
        {item.client} · {item.insurer}
      </p>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Badge
          variant="outline"
          className={cn("border-current text-[11px] font-bold", styles.text)}
        >
          <span className={cn("mr-1 inline-block size-2 rounded-full", styles.dot)} />
          {stage.label}
        </Badge>
        {stalled && (
          <Badge className="bg-crimson text-[11px] font-bold text-crimson-foreground">
            Estancado · {item.daysInStage} días
          </Badge>
        )}
        {!stalled && (
          <span className="text-[11px] text-muted-grey">{item.daysInStage} días en etapa</span>
        )}
      </div>

      <p className="mt-2 text-[12px] font-bold text-slate-deep">{money(item.amount)}</p>
    </article>
  );
}

export function KanbanBoard({ items }: { items: VehicleCase[] }) {
  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {STAGES.map((stage) => {
        const column = items.filter((i) => i.stage === stage.key);
        const styles = STAGE_STYLES[stage.tone];
        return (
          <section key={stage.key} className="w-72 shrink-0">
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
            <div className="space-y-3">
              {column.map((item) => (
                <CaseCard key={item.id} item={item} />
              ))}
              {column.length === 0 && (
                <p className="rounded-md border border-dashed border-border p-4 text-center text-[12px] text-muted-grey">
                  Sin vehículos
                </p>
              )}
            </div>
          </section>
        );
      })}
    </div>
  );
}
