import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { useSimulation, useBranchScope } from "@/context/simulation";
import { useCases } from "@/context/cases";
import {
  CATEGORIES,
  lineTotal,
  proformaTotal,
  useProformas,
  type ItemCategory,
} from "@/context/proformas";
import { money } from "@/data/cases";

export const Route = createFileRoute("/app/proformas")({
  head: () => ({
    meta: [
      { title: "Proforma de Libre Ingreso | Centro de Colisiones" },
      {
        name: "description",
        content:
          "Registra ítems libres de mano de obra, repuestos y trabajos fuera del taller para la proforma del siniestro.",
      },
      { property: "og:title", content: "Proforma de Libre Ingreso | Centro de Colisiones" },
      {
        property: "og:description",
        content: "Valoración de siniestros con ítems de texto libre y precios unitarios.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ProformasPage,
});

function ProformasPage() {
  const { session } = useSimulation();
  const { cases } = useCases();
  const { items, addItem, removeItem } = useProformas();

  const branchCases = useBranchScope(cases);
  const [caseId, setCaseId] = useState(branchCases[0]?.id ?? "");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<ItemCategory>("Mano de Obra");
  const [quantity, setQuantity] = useState("1");
  const [unitPrice, setUnitPrice] = useState("");

  if (!session) return null;

  const current = branchCases.find((c) => c.id === caseId) ?? branchCases[0];
  const activeId = current?.id ?? "";
  const list = items[activeId] ?? [];
  const total = proformaTotal(list);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const price = Number(unitPrice);
    const qty = Number(quantity);
    if (!activeId || !description.trim() || !Number.isFinite(price) || price <= 0 || qty <= 0) {
      toast.error("Completa descripción, cantidad y precio unitario válido.");
      return;
    }
    addItem(activeId, { description: description.trim(), category, quantity: qty, unitPrice: price });
    toast.success("Ítem agregado a la proforma");
    setDescription("");
    setUnitPrice("");
    setQuantity("1");
  };

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-[18px] font-bold text-slate-deep">Proforma de Libre Ingreso</h1>
        <p className="text-[12px] leading-4 text-muted-grey">
          Ingreso libre de ítems (sin catálogo fijo) · Sucursal {session.branch}
        </p>
      </header>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-[14px] font-bold text-slate-deep">Orden de trabajo</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={activeId} onValueChange={setCaseId}>
            <SelectTrigger className="h-11 max-w-md text-[12px]" aria-label="Orden de trabajo">
              <SelectValue placeholder="Selecciona una OT" />
            </SelectTrigger>
            <SelectContent>
              {branchCases.map((c) => (
                <SelectItem key={c.id} value={c.id} className="text-[12px]">
                  {c.id} · {c.plate} · {c.vehicle}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {current && (
            <p className="mt-2 text-[12px] text-muted-grey">
              {current.client} · {current.insurer} · Asesor {current.advisor}
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-[14px] font-bold text-slate-deep">Agregar ítem</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="grid gap-3 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_90px_130px_auto] md:items-end">
            <div className="space-y-1.5">
              <Label htmlFor="desc" className="text-[12px]">Descripción</Label>
              <Input
                id="desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ej. Cambio de paragolpes delantero"
                className="h-11 text-[12px]"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[12px]">Categoría</Label>
              <Select value={category} onValueChange={(v) => setCategory(v as ItemCategory)}>
                <SelectTrigger className="h-11 text-[12px]" aria-label="Categoría">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c.value} value={c.value} className="text-[12px]">
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="qty" className="text-[12px]">Cant.</Label>
              <Input
                id="qty"
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="h-11 text-[12px]"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="price" className="text-[12px]">Precio unitario</Label>
              <Input
                id="price"
                type="number"
                min="0"
                step="0.01"
                value={unitPrice}
                onChange={(e) => setUnitPrice(e.target.value)}
                placeholder="0.00"
                className="h-11 text-[12px]"
              />
            </div>
            <Button type="submit" className="h-11 gap-1.5 text-[12px] font-bold">
              <Plus className="size-4" /> Agregar
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-[14px] font-bold text-slate-deep">
            Ítems de la proforma ({list.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-[12px]">Descripción</TableHead>
                <TableHead className="text-[12px]">Categoría</TableHead>
                <TableHead className="text-[12px]">Cant.</TableHead>
                <TableHead className="text-right text-[12px]">P. unitario</TableHead>
                <TableHead className="text-right text-[12px]">Total</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="text-[12px]">{item.description}</TableCell>
                  <TableCell className="text-[12px]">
                    <Badge variant="outline" className="border-current text-[11px] font-bold">
                      {item.category}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-[12px]">{item.quantity}</TableCell>
                  <TableCell className="text-right text-[12px]">{money(item.unitPrice)}</TableCell>
                  <TableCell className="text-right text-[12px] font-bold">
                    {money(lineTotal(item))}
                  </TableCell>
                  <TableCell>
                    <button
                      type="button"
                      aria-label={`Eliminar ${item.description}`}
                      onClick={() => removeItem(activeId, item.id)}
                      className="grid size-8 place-items-center rounded-md text-crimson hover:bg-muted"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </TableCell>
                </TableRow>
              ))}
              {list.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-[12px] text-muted-grey">
                    Sin ítems registrados en esta proforma.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          <div className="mt-4 flex items-center justify-end gap-3 border-t border-border pt-3">
            <span className="text-[12px] text-muted-grey">Total proforma</span>
            <span className="text-[18px] font-bold text-slate-deep">{money(total)}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
