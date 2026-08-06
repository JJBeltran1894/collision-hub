import { createFileRoute, Outlet, Link } from "@tanstack/react-router";
import { Monitor, Smartphone, LogOut, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useSimulation } from "@/context/simulation";
import { DesktopShell } from "@/components/desktop-shell";
import { MobileShell } from "@/components/mobile-shell";
import { SyncQueueProvider } from "@/context/sync-queue";
import { CasesProvider } from "@/context/cases";

export const Route = createFileRoute("/app")({
  head: () => ({
    meta: [
      { title: "Panel operativo | Centro de Colisiones" },
      {
        name: "description",
        content:
          "Panel híbrido del Centro de Colisiones: Kanban de reparaciones, proformas y ajustes de seguro por sucursal.",
      },
      { property: "og:title", content: "Panel operativo | Centro de Colisiones" },
      {
        property: "og:description",
        content: "Gestión de colisiones en escritorio y PWA de patio.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AppLayout,
});

function AppLayout() {
  const { session, viewMode, setViewMode, signOut, hydrated } = useSimulation();

  if (!hydrated) {
    return <div className="min-h-screen bg-office-bg" />;
  }

  if (!session) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-office-bg px-4 text-center">
        <p className="text-[14px] font-bold text-slate-deep">Sesión simulada no iniciada</p>
        <Button asChild>
          <Link to="/">Ir al acceso</Link>
        </Button>
      </div>
    );
  }

  return (
    <CasesProvider>
    <SyncQueueProvider>
    <div className="min-h-screen bg-office-bg">
      <header className="sticky top-0 z-30 flex h-14 items-center gap-3 bg-slate-deep px-3 text-slate-deep-foreground md:px-4">
        <span className="flex min-w-0 items-center gap-2">
          <span className="grid size-8 shrink-0 place-items-center rounded-md bg-accent-blue">
            <Wrench className="size-4 text-accent-blue-foreground" />
          </span>
          <span className="truncate text-[14px] font-bold">Centro de Colisiones</span>
        </span>

        <div className="ml-auto flex shrink-0 items-center gap-2">
          <div className="hidden items-center gap-2 sm:flex">
            <Badge variant="outline" className="border-current text-[11px] font-bold">
              {session.role}
            </Badge>
            <Badge className="bg-insurance text-[11px] font-bold text-insurance-foreground">
              {session.branch}
            </Badge>
          </div>

          <div
            className="flex items-center rounded-md bg-background/10 p-1"
            role="group"
            aria-label="Modo de simulación"
          >
            <button
              type="button"
              onClick={() => setViewMode("mobile")}
              aria-pressed={viewMode === "mobile"}
              className={cn(
                "flex items-center gap-1.5 rounded px-2 py-1.5 text-[12px] font-bold transition-colors",
                viewMode === "mobile"
                  ? "bg-accent-blue text-accent-blue-foreground"
                  : "text-slate-deep-foreground/80",
              )}
            >
              <Smartphone className="size-4" />
              <span className="hidden md:inline">Móvil (Asesor de Patio)</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("desktop")}
              aria-pressed={viewMode === "desktop"}
              className={cn(
                "flex items-center gap-1.5 rounded px-2 py-1.5 text-[12px] font-bold transition-colors",
                viewMode === "desktop"
                  ? "bg-accent-blue text-accent-blue-foreground"
                  : "text-slate-deep-foreground/80",
              )}
            >
              <Monitor className="size-4" />
              <span className="hidden md:inline">Escritorio (Administración)</span>
            </button>
          </div>

          <button
            type="button"
            onClick={signOut}
            aria-label="Cerrar sesión"
            className="grid size-9 place-items-center rounded-md hover:bg-background/10"
          >
            <LogOut className="size-4" />
          </button>
        </div>
      </header>

      {viewMode === "desktop" ? (
        <DesktopShell>
          <Outlet />
        </DesktopShell>
      ) : (
        <MobileShell>
          <Outlet />
        </MobileShell>
      )}
    </div>
    </SyncQueueProvider>
  );
}
