import { Link, useRouterState } from "@tanstack/react-router";
import { ClipboardList, CarFront, CircleUser, PlusCircle } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

const TABS = [
  { section: null, label: "Patio", icon: CarFront },
  { section: "kanban", label: "Flujo", icon: ClipboardList },
  { section: "ingreso", label: "Ingreso", icon: PlusCircle },
  { section: "perfil", label: "Perfil", icon: CircleUser },
];

export function MobileShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] justify-center bg-office-bg">
      <div className="flex w-full max-w-[430px] flex-col bg-yard-bg shadow-sm">
        <main className="flex-1 p-4 pb-24">{children}</main>

        <nav className="sticky bottom-0 grid grid-cols-4 border-t border-border bg-yard-bg">
          {TABS.map((tab) => {
            const href = tab.section ? `/app/${tab.section}` : "/app";
            const active = pathname === href;
            const linkProps = tab.section
              ? tab.section === "kanban"
                ? ({ to: "/app/kanban" } as const)
                : tab.section === "ingreso"
                  ? ({ to: "/app/ingreso" } as const)
                  : ({ to: "/app/$section", params: { section: tab.section } } as const)
              : ({ to: "/app" } as const);
            return (
              <Link
                key={tab.label}
                {...linkProps}
                className={cn(
                  "flex min-h-[56px] flex-col items-center justify-center gap-1 text-[12px] font-bold transition-colors",
                  active ? "text-accent-blue" : "text-muted-grey",
                )}
              >
                <tab.icon className="size-6" />
                {tab.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
