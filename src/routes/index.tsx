import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Wrench, ShieldCheck, Monitor, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BRANCHES, ROLES, useSimulation, type Branch, type Role } from "@/context/simulation";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Centro de Colisiones | Acceso al sistema" },
      {
        name: "description",
        content:
          "Acceso simulado al sistema de control del Centro de Colisiones: elige rol y sucursal para entrar al panel de oficina o a la PWA de patio.",
      },
      { property: "og:title", content: "Centro de Colisiones | Acceso al sistema" },
      {
        property: "og:description",
        content: "Sistema de gestión de taller de colisiones con vista de oficina y de patio.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const { signIn } = useSimulation();
  const [name, setName] = useState("Luis Paredes");
  const [role, setRole] = useState<Role>("Gerente");
  const [branch, setBranch] = useState<Branch>("Quito Norte");

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    signIn({ name: name.trim() || "Usuario demo", role, branch });
    navigate({ to: "/app" });
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <section className="flex flex-col justify-between bg-slate-deep p-8 text-slate-deep-foreground lg:p-12">
        <div className="flex items-center gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-md bg-accent-blue">
            <Wrench className="size-5 text-accent-blue-foreground" />
          </span>
          <span className="text-[18px] font-bold">Centro de Colisiones</span>
        </div>

        <div className="my-10 max-w-md">
          <h1 className="text-[18px] font-bold lg:text-3xl">
            Control total del taller, del patio a la contabilidad
          </h1>
          <p className="mt-4 text-[12px] leading-5 text-slate-deep-foreground/80">
            Kanban de reparación, proformas, ajustes con aseguradoras y facturación consolidada,
            con aislamiento de información por sucursal.
          </p>

          <ul className="mt-8 space-y-4 text-[12px] leading-4">
            <li className="flex items-start gap-3">
              <Smartphone className="mt-0.5 size-4 shrink-0 text-accent-blue" />
              <span>
                <span className="font-bold">PWA de patio:</span> contraste extremo y botones
                amplios para asesores en galpón.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <Monitor className="mt-0.5 size-4 shrink-0 text-accent-blue" />
              <span>
                <span className="font-bold">Escritorio de oficina:</span> tablas densas e
                indicadores sintéticos para gerencia y contabilidad.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <ShieldCheck className="mt-0.5 size-4 shrink-0 text-insurance" />
              <span>
                <span className="font-bold">Ajustes de seguro:</span> seguimiento de negociación
                con aseguradoras como Seguros Alianza.
              </span>
            </li>
          </ul>
        </div>

        <p className="text-[12px] text-slate-deep-foreground/60">
          Entorno académico de simulación · Autenticación demostrativa
        </p>
      </section>

      <section className="flex items-center justify-center bg-office-bg p-6 lg:p-12">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-[18px] font-bold text-slate-deep">
              Acceso al sistema
            </CardTitle>
            <p className="text-[12px] leading-4 text-muted-grey">
              Selecciona rol y sucursal para iniciar la sesión simulada.
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-[12px] font-bold text-slate-deep">
                  Nombre del usuario
                </Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-12 text-[12px]"
                  placeholder="Nombre y apellido"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-[12px] font-bold text-slate-deep">Rol</Label>
                <Select value={role} onValueChange={(v) => setRole(v as Role)}>
                  <SelectTrigger className="h-12 w-full text-[12px]">
                    <SelectValue placeholder="Selecciona un rol" />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLES.map((r) => (
                      <SelectItem key={r} value={r} className="text-[12px]">
                        {r}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-[12px] font-bold text-slate-deep">Sucursal</Label>
                <Select value={branch} onValueChange={(v) => setBranch(v as Branch)}>
                  <SelectTrigger className="h-12 w-full text-[12px]">
                    <SelectValue placeholder="Selecciona una sucursal" />
                  </SelectTrigger>
                  <SelectContent>
                    {BRANCHES.map((b) => (
                      <SelectItem key={b} value={b} className="text-[12px]">
                        {b}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button type="submit" className="h-12 w-full text-[12px] font-bold">
                Ingresar al sistema
              </Button>

              <p className="text-center text-[12px] leading-4 text-muted-grey">
                El rol Asesor abre por defecto la vista móvil de patio; Gerente y Administrador
                abren el escritorio de oficina.
              </p>
            </form>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
