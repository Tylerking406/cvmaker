"use client";

import { createContext, useContext, useState, useCallback, useRef, useEffect } from "react";

export interface LogEntry {
  id: string;
  ts: string;
  method: string;
  url: string;
  status?: number;
  duration?: number;
  error?: string;
}

interface LogCtx {
  entries: LogEntry[];
  log: (entry: Omit<LogEntry, "id" | "ts">) => string;
  update: (id: string, patch: Partial<LogEntry>) => void;
  clear: () => void;
}

const Ctx = createContext<LogCtx | null>(null);

export function ActivityLogProvider({ children }: { children: React.ReactNode }) {
  const [entries, setEntries] = useState<LogEntry[]>([]);

  const log = useCallback((entry: Omit<LogEntry, "id" | "ts">) => {
    const id = Math.random().toString(36).slice(2);
    const ts = new Date().toLocaleTimeString("en-US", { hour12: false });
    setEntries(prev => [{ id, ts, ...entry }, ...prev].slice(0, 200));
    return id;
  }, []);

  const update = useCallback((id: string, patch: Partial<LogEntry>) => {
    setEntries(prev => prev.map(e => e.id === id ? { ...e, ...patch } : e));
  }, []);

  const clear = useCallback(() => setEntries([]), []);

  return <Ctx.Provider value={{ entries, log, update, clear }}>{children}</Ctx.Provider>;
}

export function useActivityLog() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useActivityLog must be inside ActivityLogProvider");
  return ctx;
}
