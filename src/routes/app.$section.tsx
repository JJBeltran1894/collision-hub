import { createFileRoute } from "@tanstack/react-router";
import { Construction } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const TITLES: Record<string, string> = {
  proformas: "Proformas",
  seguros: "Ajustes de Seguro",
  repuestos: "Repuestos",
  facturacion: "Facturación",
  reportes: "Reportes",
  ingreso: "Ingreso de Vehículo",
  perfil: "Perfil del Asesor",
};

export const Route = createFileRoute("/app/$section")({
  head: () => ({
    meta: [
      { title: "Módulo del taller | Centro de Colisiones" },
      {
        name: "description",
        content:
          "Módulos administrativos del Centro de Colisiones: proformas, seguros, repuestos, facturación y reportes.",
      },
      { property: "og:title", content: "Módulo del taller | Centro de Colisiones" },
      {
        property: "og:description",
        content: "Secciones administrativas y operativas del taller de colisiones.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SectionPage,
});

function SectionPage() {
  const { section } = Route.useParams();
  const title = TITLES[section] ?? "Módulo";

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-[18px] font-bold text-slate-deep">{title}</h1>
        <p className="text-[12px] leading-4 text-muted-grey">
          Módulo reservado en la maqueta funcional.
        </p>
      </header>

      <Card>
        <CardContent className="flex flex-col items-center gap-3 p-10 text-center">
          <Construction className="size-8 text-warning" />
          <p className="text-[14px] font-bold text-slate-deep">{title} en construcción</p>
          <p className="max-w-md text-[12px] leading-4 text-muted-grey">
            Esta sección forma parte del alcance del sistema y se habilitará en la siguiente
            iteración, junto con la persistencia de datos por sucursal.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
