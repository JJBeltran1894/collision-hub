import { useState } from "react";
import { Camera, CloudUpload, RefreshCw, Trash2, Video, WifiOff, Wifi } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useSyncQueue } from "@/context/sync-queue";
import { cn } from "@/lib/utils";

export function SyncPanel() {
  const { items, pending, syncing, online, syncAll, toggleOnline, clearSynced } = useSyncQueue();
  const [open, setOpen] = useState(true);

  return (
    <section className="sticky bottom-20 z-20 rounded-lg border border-slate-deep/20 bg-slate-deep text-slate-deep-foreground shadow-lg">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex min-h-[48px] w-full items-center gap-2 px-3 text-left"
      >
        {online ? (
          <Wifi className="size-4 shrink-0 text-success" />
        ) : (
          <WifiOff className="size-4 shrink-0 text-warning" />
        )}
        <span className="min-w-0 flex-1 truncate text-[12px] font-bold">
          Cola de Sincronización Manual (iOS/Safari)
        </span>
        <Badge
          className={cn(
            "shrink-0 text-[11px] font-bold",
            pending > 0 ? "bg-warning text-warning-foreground" : "bg-success text-success-foreground",
          )}
        >
          {pending} pendiente{pending === 1 ? "" : "s"}
        </Badge>
      </button>

      {open && (
        <div className="space-y-3 border-t border-white/10 p-3">
          <p className="text-[11px] leading-4 text-slate-deep-foreground/70">
            Los ingresos se almacenan localmente en memoria del dispositivo. Safari no ejecuta
            Background Sync, por lo que el envío al servidor es manual.
          </p>

          <div className="max-h-40 space-y-2 overflow-y-auto">
            {items.length === 0 && (
              <p className="rounded-md bg-white/5 p-3 text-center text-[11px]">
                Sin registros en cola.
              </p>
            )}
            {items.map((item) => (
              <div
                key={item.id}
                className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 rounded-md bg-white/5 p-2"
              >
                <div className="min-w-0">
                  <p className="truncate text-[12px] font-bold">
                    {item.plate} · {item.client}
                  </p>
                  <p className="flex items-center gap-2 text-[11px] text-slate-deep-foreground/70">
                    <span className="flex items-center gap-1">
                      <Camera className="size-3" />
                      {item.photos}
                    </span>
                    <span className="flex items-center gap-1">
                      <Video className="size-3" />
                      {item.videos}
                    </span>
                    <span>{item.zones} zonas</span>
                    <span>{item.createdAt}</span>
                  </p>
                </div>
                <Badge
                  className={cn(
                    "shrink-0 text-[11px] font-bold",
                    item.status === "pendiente"
                      ? "bg-warning text-warning-foreground"
                      : "bg-success text-success-foreground",
                  )}
                >
                  {item.status === "pendiente" ? "En cola" : "Enviado"}
                </Badge>
              </div>
            ))}
          </div>

          <Button
            type="button"
            onClick={() => void syncAll()}
            disabled={pending === 0 || syncing}
            className="min-h-[48px] w-full bg-accent-blue text-[13px] font-bold text-accent-blue-foreground hover:bg-accent-blue/90"
          >
            {syncing ? (
              <RefreshCw className="size-4 animate-spin" />
            ) : (
              <CloudUpload className="size-4" />
            )}
            {syncing ? "Sincronizando..." : "Sincronizar Datos con Servidor"}
          </Button>

          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={toggleOnline}
              className="min-h-[44px] border-white/25 bg-transparent text-[12px] font-bold text-slate-deep-foreground hover:bg-white/10 hover:text-slate-deep-foreground"
            >
              {online ? "Simular sin señal" : "Simular con señal"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={clearSynced}
              className="min-h-[44px] border-white/25 bg-transparent text-[12px] font-bold text-slate-deep-foreground hover:bg-white/10 hover:text-slate-deep-foreground"
            >
              <Trash2 className="size-4" />
              Limpiar enviados
            </Button>
          </div>
        </div>
      )}
    </section>
  );
}
