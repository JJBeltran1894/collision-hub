import { Link, useRouterState } from "@tanstack/react-router";
import { ClipboardList, CarFront, CircleUser, PlusCircle } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

const TABS = [
  { to: "/app" as const, label: "Patio", icon: CarFront, exact: true },
  { to: "/app/kanban" as const, label: "Flujo", icon: ClipboardList, exact: false },
  { to: "/app/ingreso" as const, label: "Ingreso", icon: PlusCircle, exact: false },
  { to: "/app/perfil" as const, label: "Perfil", icon: CircleUser, exact: false },
];

export function MobileShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] justify-center bg-office-bg">
      <div className="flex w-full max-w-[430px] flex-col bg-yard-bg shadow-sm">
        <main className="flex-1 p-4 pb-24">{children}</main>

        <nav className="sticky bottom-0 grid grid-cols-4 border-t border-border bg-yard-bg">
          {TABS.map((tab) => {
            const active = tab.exact ? pathname === tab.to : pathname.startsWith(tab.to);
            return (
              <Link
                key={tab.to}
                to={tab.to}
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
