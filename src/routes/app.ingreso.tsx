import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Camera,
  CheckCircle2,
  ClipboardCheck,
  Fuel,
  Car,
  Video,
  Search,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { VehicleDiagram } from "@/components/intake/vehicle-diagram";
import type { ZoneDamage } from "@/components/intake/vehicle-diagram";
import { SyncPanel } from "@/components/intake/sync-panel";
import { useSyncQueue } from "@/context/sync-queue";
import { useSimulation } from "@/context/simulation";
import {
  ACCESSORIES,
  BROKERS,
  CLIENTS,
  INSURERS,
  MAX_PHOTOS,
  MAX_VIDEOS,
  MIN_PHOTOS,
  MIN_VIDEOS,
  SEVERITIES,
  ZONE_LABELS,
  findPlate,
} from "@/data/intake";
import type { AccessoryAnswer, Severity, ZoneKey } from "@/data/intake";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/app/ingreso")({
  head: () => ({
    meta: [
      { title: "Ingreso de vehículo | Centro de Colisiones" },
      {
        name: "description",
        content:
          "Registro móvil de ingreso a patio: autocompletado por placa, checklist de accesorios, diagrama de daños y cola de sincronización manual.",
      },
      { property: "og:title", content: "Ingreso de vehículo | Centro de Colisiones" },
      {
        property: "og:description",
        content: "Flujo PWA para asesores de patio del Centro de Colisiones.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: IngresoPage,
});

type AccessoryState = Record<string, { answer: AccessoryAnswer; note: string }>;

const initialAccessories: AccessoryState = Object.fromEntries(
  ACCESSORIES.map((a) => [a.key, { answer: null as AccessoryAnswer, note: "" }]),
);

function IngresoPage() {
  const { session } = useSimulation();
  const { enqueue } = useSyncQueue();

  const [plate, setPlate] = useState("");
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState("");
  const [color, setColor] = useState("");
  const [autofilled, setAutofilled] = useState(false);

  const [client, setClient] = useState("");
  const [insurer, setInsurer] = useState("");
  const [broker, setBroker] = useState("");

  const [accessories, setAccessories] = useState<AccessoryState>(initialAccessories);
  const [fuel, setFuel] = useState<number[]>([50]);

  const [damage, setDamage] = useState<ZoneDamage>({});
  const [selectedZone, setSelectedZone] = useState<ZoneKey | null>(null);

  const [photos, setPhotos] = useState(0);
  const [videos, setVideos] = useState(0);

  const lookupPlate = (value: string) => {
    const found = findPlate(value);
    if (found) {
      setBrand(found.brand);
      setModel(found.model);
      setYear(found.year);
      setColor(found.color);
      setAutofilled(true);
      toast.success(`Placa ${found.plate} encontrada en el padrón`);
    } else {
      setAutofilled(false);
      toast.warning("Placa no registrada: completa los datos manualmente");
    }
  };

  const setAnswer = (key: string, answer: AccessoryAnswer) =>
    setAccessories((prev) => ({ ...prev, [key]: { ...prev[key]!, answer } }));

  const setNote = (key: string, note: string) =>
    setAccessories((prev) => ({ ...prev, [key]: { ...prev[key]!, note } }));

  const setZoneSeverity = (severity: Severity) => {
    if (!selectedZone) return;
    setDamage((prev) => ({ ...prev, [selectedZone]: severity }));
    setSelectedZone(null);
  };

  const clearZone = () => {
    if (!selectedZone) return;
    setDamage((prev) => {
      const next = { ...prev };
      delete next[selectedZone];
      return next;
    });
    setSelectedZone(null);
  };

  const mediaOk = photos >= MIN_PHOTOS && videos >= MIN_VIDEOS;
  const zoneCount = Object.keys(damage).length;

  const errors = useMemo(() => {
    const list: string[] = [];
    if (!plate.trim()) list.push("Placa requerida");
    if (!brand || !model || !year) list.push("Datos del vehículo incompletos");
    if (!client) list.push("Cliente propietario requerido");
    if (!insurer) list.push("Aseguradora requerida");
    if (!broker) list.push("Broker requerido");
    if (ACCESSORIES.some((a) => accessories[a.key]?.answer === null))
      list.push("Checklist de accesorios incompleto");
    if (!mediaOk) list.push(`Mínimo ${MIN_PHOTOS} fotos y ${MIN_VIDEOS} videos`);
    return list;
  }, [plate, brand, model, year, client, insurer, broker, accessories, mediaOk]);

  const submit = () => {
    if (errors.length > 0) {
      toast.error(errors[0]!);
      return;
    }
    enqueue({
      plate: plate.trim().toUpperCase(),
      client,
      photos,
      videos,
      zones: zoneCount,
    });
    toast.success("Ingreso guardado en la cola local del dispositivo");
    setPlate("");
    setBrand("");
    setModel("");
    setYear("");
    setColor("");
    setAutofilled(false);
    setClient("");
    setInsurer("");
    setBroker("");
    setAccessories(initialAccessories);
    setFuel([50]);
    setDamage({});
    setPhotos(0);
    setVideos(0);
  };

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-[18px] font-bold text-slate-deep">Ingreso de vehículo</h1>
        <p className="text-[12px] leading-4 text-muted-grey">
          Asesor de patio · Sucursal {session?.branch}
        </p>
      </header>

      {/* 1. Registro */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-[14px] font-bold text-slate-deep">
            <Car className="size-4 text-accent-blue" />
            1. Registro de ingreso
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="plate" className="text-[12px] font-bold">
              Placa
            </Label>
            <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2">
              <Input
                id="plate"
                value={plate}
                placeholder="PCV-4821"
                autoCapitalize="characters"
                onChange={(e) => setPlate(e.target.value.toUpperCase())}
                onBlur={(e) => e.target.value.trim() && lookupPlate(e.target.value)}
                className="min-h-[48px] text-[14px] font-bold tracking-wide"
              />
              <Button
                type="button"
                onClick={() => lookupPlate(plate)}
                className="min-h-[48px] shrink-0 bg-accent-blue text-accent-blue-foreground hover:bg-accent-blue/90"
              >
                <Search className="size-4" />
                Buscar
              </Button>
            </div>
            {autofilled && (
              <p className="flex items-center gap-1 text-[11px] font-bold text-success">
                <CheckCircle2 className="size-3" /> Datos autocompletados desde el padrón
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Field label="Marca" value={brand} onChange={setBrand} />
            <Field label="Modelo" value={model} onChange={setModel} />
            <Field label="Año" value={year} onChange={setYear} />
            <Field label="Color" value={color} onChange={setColor} />
          </div>

          <PickField label="Cliente propietario" value={client} onChange={setClient} options={CLIENTS} />
          <PickField label="Aseguradora" value={insurer} onChange={setInsurer} options={INSURERS} />
          <PickField label="Broker" value={broker} onChange={setBroker} options={BROKERS} />
        </CardContent>
      </Card>

      {/* 2. Checklist */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-[14px] font-bold text-slate-deep">
            <ClipboardCheck className="size-4 text-insurance" />
            2. Checklist de accesorios
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-2 border-b border-border pb-1 text-[11px] font-bold text-muted-grey">
            <span>Accesorio</span>
            <span className="w-10 text-center">Sí</span>
            <span className="w-10 text-center">No</span>
          </div>

          {ACCESSORIES.map((a) => {
            const row = accessories[a.key]!;
            return (
              <div key={a.key} className="space-y-1.5 border-b border-border/60 pb-2 last:border-0">
                <div className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-2">
                  <span className="truncate text-[13px] font-bold text-slate-deep">{a.label}</span>
                  <AnswerButton
                    active={row.answer === "si"}
                    tone="success"
                    onClick={() => setAnswer(a.key, "si")}
                    label={`Sí para ${a.label}`}
                  >
                    Sí
                  </AnswerButton>
                  <AnswerButton
                    active={row.answer === "no"}
                    tone="destructive"
                    onClick={() => setAnswer(a.key, "no")}
                    label={`No para ${a.label}`}
                  >
                    No
                  </AnswerButton>
                </div>
                <Input
                  value={row.note}
                  onChange={(e) => setNote(a.key, e.target.value)}
                  placeholder="Observación"
                  className="min-h-[40px] text-[12px]"
                />
              </div>
            );
          })}

          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2 text-[12px] font-bold">
                <Fuel className="size-4 text-warning" /> Nivel de combustible
              </Label>
              <Badge className="bg-warning text-[12px] font-bold text-warning-foreground">
                {fuel[0]}%
              </Badge>
            </div>
            <Slider value={fuel} onValueChange={setFuel} max={100} step={5} className="py-2" />
          </div>
        </CardContent>
      </Card>

      {/* 3. Diagrama */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-[14px] font-bold text-slate-deep">
            3. Diagrama de daños
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-[11px] leading-4 text-muted-grey">
            Toca una zona del vehículo y selecciona la severidad del daño.
          </p>

          <VehicleDiagram damage={damage} onSelectZone={setSelectedZone} selected={selectedZone} />

          {selectedZone && (
            <div className="space-y-2 rounded-md border border-accent-blue/40 bg-accent-blue/5 p-3">
              <p className="text-[12px] font-bold text-slate-deep">
                Severidad en {ZONE_LABELS[selectedZone]}
              </p>
              <div className="grid grid-cols-3 gap-2">
                {SEVERITIES.map((s) => (
                  <Button
                    key={s.key}
                    type="button"
                    onClick={() => setZoneSeverity(s.key)}
                    className={cn("min-h-[48px] text-[12px] font-bold", s.badge)}
                  >
                    {s.label}
                  </Button>
                ))}
              </div>
              <Button
                type="button"
                variant="ghost"
                onClick={clearZone}
                className="min-h-[40px] w-full text-[12px] font-bold text-muted-grey"
              >
                <X className="size-4" /> Quitar marca de la zona
              </Button>
            </div>
          )}

          {zoneCount > 0 && (
            <ul className="space-y-1">
              {(Object.keys(damage) as ZoneKey[]).map((zone) => {
                const sev = SEVERITIES.find((s) => s.key === damage[zone])!;
                return (
                  <li
                    key={zone}
                    className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 text-[12px]"
                  >
                    <span className="truncate text-slate-deep">{ZONE_LABELS[zone]}</span>
                    <Badge className={cn("shrink-0 text-[11px] font-bold", sev.badge)}>
                      {sev.label}
                    </Badge>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* 4. Multimedia */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-[14px] font-bold text-slate-deep">
            4. Evidencia multimedia
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <MediaCounter
            icon={<Camera className="size-4 text-accent-blue" />}
            label="Fotografías"
            value={photos}
            min={MIN_PHOTOS}
            max={MAX_PHOTOS}
            onAdd={() => setPhotos((v) => Math.min(MAX_PHOTOS, v + 1))}
            onAddBatch={() => setPhotos(MIN_PHOTOS)}
            onReset={() => setPhotos(0)}
          />
          <MediaCounter
            icon={<Video className="size-4 text-insurance" />}
            label="Videos"
            value={videos}
            min={MIN_VIDEOS}
            max={MAX_VIDEOS}
            onAdd={() => setVideos((v) => Math.min(MAX_VIDEOS, v + 1))}
            onAddBatch={() => setVideos(MIN_VIDEOS)}
            onReset={() => setVideos(0)}
          />
          <p
            className={cn(
              "text-[11px] font-bold",
              mediaOk ? "text-success" : "text-destructive",
            )}
          >
            {mediaOk
              ? "Evidencia mínima cumplida"
              : `Obligatorio: ${MIN_PHOTOS}-${MAX_PHOTOS} fotos y ${MIN_VIDEOS}-${MAX_VIDEOS} videos`}
          </p>
        </CardContent>
      </Card>

      {errors.length > 0 && (
        <ul className="space-y-1 rounded-md border border-destructive/30 bg-destructive/5 p-3">
          {errors.map((e) => (
            <li key={e} className="text-[11px] font-bold text-destructive">
              · {e}
            </li>
          ))}
        </ul>
      )}

      <Button
        type="button"
        onClick={submit}
        className="min-h-[52px] w-full bg-slate-deep text-[14px] font-bold text-slate-deep-foreground hover:bg-slate-deep/90"
      >
        Guardar ingreso en cola local
      </Button>

      <SyncPanel />
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-[12px] font-bold">{label}</Label>
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="min-h-[48px] text-[13px]"
      />
    </div>
  );
}

function PickField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-[12px] font-bold">{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="min-h-[48px] text-[13px]">
          <SelectValue placeholder={`Seleccionar ${label.toLowerCase()}`} />
        </SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem key={o} value={o} className="text-[13px]">
              {o}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function AnswerButton({
  active,
  tone,
  onClick,
  children,
  label,
}: {
  active: boolean;
  tone: "success" | "destructive";
  onClick: () => void;
  children: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={active}
      className={cn(
        "size-12 rounded-md border text-[12px] font-bold transition-colors",
        active
          ? tone === "success"
            ? "border-success bg-success text-success-foreground"
            : "border-destructive bg-destructive text-destructive-foreground"
          : "border-border bg-background text-muted-grey",
      )}
    >
      {children}
    </button>
  );
}

function MediaCounter({
  icon,
  label,
  value,
  min,
  max,
  onAdd,
  onAddBatch,
  onReset,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  min: number;
  max: number;
  onAdd: () => void;
  onAddBatch: () => void;
  onReset: () => void;
}) {
  const ok = value >= min;
  return (
    <div className="space-y-2 rounded-md border border-border p-3">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
        <span className="flex min-w-0 items-center gap-2 text-[13px] font-bold text-slate-deep">
          {icon}
          <span className="truncate">{label}</span>
        </span>
        <Badge
          className={cn(
            "shrink-0 text-[11px] font-bold",
            ok ? "bg-success text-success-foreground" : "bg-warning text-warning-foreground",
          )}
        >
          {value}/{max}
        </Badge>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={onAdd}
          className="min-h-[44px] text-[12px] font-bold"
        >
          +1
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={onAddBatch}
          className="min-h-[44px] text-[12px] font-bold"
        >
          Cargar {min}
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={onReset}
          className="min-h-[44px] text-[12px] font-bold text-muted-grey"
        >
          Limpiar
        </Button>
      </div>
    </div>
  );
}
