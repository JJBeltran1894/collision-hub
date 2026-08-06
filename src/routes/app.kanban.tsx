import { createFileRoute } from "@tanstack/react-router";
import { KanbanBoard, CaseCard } from "@/components/kanban";
import { useSimulation } from "@/context/simulation";
import { useCases } from "@/context/cases";
import { STAGES } from "@/data/cases";

export const Route = createFileRoute("/app/kanban")({
  head: () => ({
    meta: [
      { title: "Kanban de flujo | Centro de Colisiones" },
      {
        name: "description",
        content:
          "Tablero Kanban de reparación: recepción, proforma, ajuste de seguro, enderezado, repuestos y salida.",
      },
      { property: "og:title", content: "Kanban de flujo | Centro de Colisiones" },
      {
        property: "og:description",
        content: "Seguimiento visual del estado de cada vehículo en el taller.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: KanbanPage,
});

function KanbanPage() {
  const { session, viewMode } = useSimulation();
  const { cases } = useCases();
  if (!session) return null;
  const items = cases.filter((c) => c.branch === session.branch);

  if (viewMode === "mobile") {
    return (
      <div className="space-y-5">
        <header>
          <h1 className="text-[18px] font-bold text-slate-deep">Flujo de reparación</h1>
          <p className="text-[12px] leading-4 text-muted-grey">Sucursal {session.branch}</p>
        </header>
        {STAGES.map((stage) => {
          const column = items.filter((i) => i.stage === stage.key);
          if (column.length === 0) return null;
          return (
            <section key={stage.key} className="space-y-3">
              <h2 className="text-[14px] font-bold text-slate-deep">
                {stage.label} ({column.length})
              </h2>
              {column.map((item) => (
                <CaseCard key={item.id} item={item} />
              ))}
            </section>
          );
        })}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-[18px] font-bold text-slate-deep">Kanban de flujo</h1>
        <p className="text-[12px] leading-4 text-muted-grey">
          Alerta automática de vehículo estancado tras 15 días en la misma etapa.
        </p>
      </header>
      <KanbanBoard items={items} />
    </div>
  );
}
