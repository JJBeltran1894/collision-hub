import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  KanbanSquare,
  FileSpreadsheet,
  ShieldCheck,
  PackageSearch,
  ReceiptText,
  BarChart3,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { useState } from "react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { useSimulation } from "@/context/simulation";

const NAV = [
  { to: "/app", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/app/kanban", label: "Kanban de Flujo", icon: KanbanSquare },
  { to: "/app/proformas", label: "Proformas", icon: FileSpreadsheet },
  { to: "/app/seguros", label: "Ajustes de Seguro", icon: ShieldCheck },
  { to: "/app/repuestos", label: "Repuestos", icon: PackageSearch },
  { to: "/app/facturacion", label: "Facturación", icon: ReceiptText },
  { to: "/app/reportes", label: "Reportes", icon: BarChart3 },
] as const;

export function DesktopShell({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const { session } = useSimulation();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] w-full bg-office-bg">
      <aside
        className={cn(
          "sticky top-14 hidden h-[calc(100vh-3.5rem)] shrink-0 flex-col bg-sidebar text-sidebar-foreground transition-[width] md:flex",
          collapsed ? "w-16" : "w-64",
        )}
      >
        <div className="flex h-14 items-center gap-2 border-b border-sidebar-border px-3">
          {!collapsed && (
            <span className="min-w-0 truncate text-[14px] font-bold">Panel Administrativo</span>
          )}
          <button
            type="button"
            onClick={() => setCollapsed((v) => !v)}
            aria-label={collapsed ? "Expandir menú" : "Colapsar menú"}
            className="ml-auto grid size-8 shrink-0 place-items-center rounded-md hover:bg-sidebar-accent"
          >
            {collapsed ? (
              <PanelLeftOpen className="size-4" />
            ) : (
              <PanelLeftClose className="size-4" />
            )}
          </button>
        </div>

        <nav className="flex-1 space-y-1 p-2">
          {NAV.map((item) => {
            const active = item.exact ? pathname === item.to : pathname.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                title={item.label}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-[12px] transition-colors",
                  active
                    ? "bg-sidebar-primary font-bold text-sidebar-primary-foreground"
                    : "hover:bg-sidebar-accent",
                )}
              >
                <item.icon className="size-4 shrink-0" />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {!collapsed && session && (
          <div className="border-t border-sidebar-border p-3 text-[12px] leading-4">
            <p className="font-bold">{session.role}</p>
            <p className="text-sidebar-foreground/70">Sucursal {session.branch}</p>
          </div>
        )}
      </aside>

      <main className="min-w-0 flex-1 p-4 md:p-6">{children}</main>
    </div>
  );
}
