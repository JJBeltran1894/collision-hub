import { createContext, useCallback, useContext, useMemo, useState } from "react";
import type { ReactNode } from "react";

export type QueueStatus = "pendiente" | "sincronizado";

export type QueueItem = {
  id: string;
  plate: string;
  client: string;
  photos: number;
  videos: number;
  zones: number;
  createdAt: string;
  status: QueueStatus;
};

type SyncValue = {
  items: QueueItem[];
  pending: number;
  syncing: boolean;
  online: boolean;
  enqueue: (item: Omit<QueueItem, "id" | "createdAt" | "status">) => void;
  syncAll: () => Promise<void>;
  toggleOnline: () => void;
  clearSynced: () => void;
};

const SyncContext = createContext<SyncValue | null>(null);

/** Cola en memoria: simula resiliencia offline sin depender de Background Sync de Safari. */
export function SyncQueueProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<QueueItem[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [online, setOnline] = useState(false);

  const enqueue = useCallback((item: Omit<QueueItem, "id" | "createdAt" | "status">) => {
    setItems((prev) => [
      {
        ...item,
        id: `ING-${String(prev.length + 1).padStart(3, "0")}-${Date.now().toString().slice(-4)}`,
        createdAt: new Date().toLocaleTimeString("es-EC", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        status: "pendiente",
      },
      ...prev,
    ]);
  }, []);

  const syncAll = useCallback(async () => {
    setSyncing(true);
    await new Promise((resolve) => setTimeout(resolve, 1400));
    setItems((prev) => prev.map((i) => ({ ...i, status: "sincronizado" as const })));
    setSyncing(false);
  }, []);

  const toggleOnline = useCallback(() => setOnline((v) => !v), []);
  const clearSynced = useCallback(
    () => setItems((prev) => prev.filter((i) => i.status === "pendiente")),
    [],
  );

  const pending = items.filter((i) => i.status === "pendiente").length;

  const value = useMemo(
    () => ({ items, pending, syncing, online, enqueue, syncAll, toggleOnline, clearSynced }),
    [items, pending, syncing, online, enqueue, syncAll, toggleOnline, clearSynced],
  );

  return <SyncContext.Provider value={value}>{children}</SyncContext.Provider>;
}

export function useSyncQueue() {
  const ctx = useContext(SyncContext);
  if (!ctx) throw new Error("useSyncQueue debe usarse dentro de SyncQueueProvider");
  return ctx;
}
