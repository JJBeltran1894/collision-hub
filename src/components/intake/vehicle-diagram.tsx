import { SEVERITIES, ZONE_LABELS } from "@/data/intake";
import type { Severity, ZoneKey } from "@/data/intake";
import { cn } from "@/lib/utils";

export type ZoneDamage = Partial<Record<ZoneKey, Severity>>;

const ZONE_PATHS: { key: ZoneKey; d: string; label: { x: number; y: number } }[] = [
  { key: "frente", d: "M60 20 h120 l22 46 h-164 z", label: { x: 120, y: 48 } },
  { key: "techo", d: "M38 70 h164 v70 h-164 z", label: { x: 120, y: 108 } },
  { key: "izquierda", d: "M14 70 h20 v130 h-20 z", label: { x: 24, y: 138 } },
  { key: "derecha", d: "M206 70 h20 v130 h-20 z", label: { x: 216, y: 138 } },
  { key: "atras", d: "M38 144 h164 v76 h-164 z", label: { x: 120, y: 186 } },
];

export function VehicleDiagram({
  damage,
  onSelectZone,
  selected,
}: {
  damage: ZoneDamage;
  onSelectZone: (zone: ZoneKey) => void;
  selected: ZoneKey | null;
}) {
  return (
    <div className="space-y-3">
      <svg viewBox="0 0 240 240" className="mx-auto w-full max-w-[280px]" role="group">
        {ZONE_PATHS.map((zone) => {
          const severity = damage[zone.key];
          const tone = SEVERITIES.find((s) => s.key === severity);
          return (
            <g key={zone.key}>
              <path
                d={zone.d}
                onClick={() => onSelectZone(zone.key)}
                className={cn(
                  "cursor-pointer stroke-slate-deep/50 [stroke-width:2] transition-colors",
                  tone ? tone.fill : "fill-muted",
                  selected === zone.key && "stroke-accent-blue [stroke-width:3]",
                )}
                role="button"
                tabIndex={0}
                aria-label={`Zona ${ZONE_LABELS[zone.key]}${severity ? `, daño ${severity}` : ""}`}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") onSelectZone(zone.key);
                }}
              />
              <text
                x={zone.label.x}
                y={zone.label.y}
                textAnchor="middle"
                className="pointer-events-none fill-slate-deep text-[9px] font-bold"
              >
                {ZONE_LABELS[zone.key].split(" ")[0]}
              </text>
            </g>
          );
        })}
      </svg>

      <div className="flex flex-wrap justify-center gap-2">
        {SEVERITIES.map((s) => (
          <span
            key={s.key}
            className={cn("rounded-full px-2 py-0.5 text-[11px] font-bold", s.badge)}
          >
            {s.label}
          </span>
        ))}
      </div>
    </div>
  );
}
