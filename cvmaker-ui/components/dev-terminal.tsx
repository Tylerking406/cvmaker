"use client";

import { useEffect, useRef, useState } from "react";
import { useActivityLog } from "@/lib/activity-log";
import { setApiInterceptor } from "@/lib/api";
import { X, Minus, Square, Terminal, Trash2 } from "lucide-react";

const METHOD_COLOR: Record<string, string> = {
  GET:    "text-sky-400",
  POST:   "text-emerald-400",
  PUT:    "text-amber-400",
  PATCH:  "text-amber-400",
  DELETE: "text-rose-400",
};

function statusColor(s?: number) {
  if (!s) return "text-zinc-500";
  if (s < 300) return "text-emerald-400";
  if (s < 400) return "text-amber-400";
  return "text-rose-400";
}

export function DevTerminal() {
  const { entries, log, update, clear } = useActivityLog();
  const [open, setOpen] = useState(true);
  const [minimised, setMinimised] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const pendingRef = useRef<Map<string, string>>(new Map()); // url+method -> log id

  // Wire up the API interceptor
  useEffect(() => {
    setApiInterceptor((method, url, status, duration, error) => {
      const key = `${method}:${url}`;
      if (status === undefined && duration === undefined) {
        // Request starting
        const id = log({ method, url });
        pendingRef.current.set(key, id);
      } else {
        // Request finished
        const id = pendingRef.current.get(key);
        if (id) {
          update(id, { status, duration, error });
          pendingRef.current.delete(key);
        }
      }
    });
    return () => setApiInterceptor(null);
  }, [log, update]);

  // Auto-scroll to latest entry
  useEffect(() => {
    if (!minimised) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [entries, minimised]);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs text-zinc-300 shadow-xl hover:border-zinc-500 transition-colors"
      >
        <Terminal className="h-3.5 w-3.5 text-primary" />
        API Log
        {entries.length > 0 && (
          <span className="rounded-full bg-primary/20 px-1.5 py-0.5 text-primary text-[10px]">
            {entries.length}
          </span>
        )}
      </button>
    );
  }

  return (
    <div
      className={`fixed bottom-4 right-4 z-50 w-[520px] rounded-xl border border-zinc-700/80 bg-zinc-950 shadow-2xl shadow-black/50 flex flex-col transition-all ${
        minimised ? "h-9" : "h-72"
      }`}
    >
      {/* Title bar */}
      <div className="flex items-center gap-2 px-3 h-9 border-b border-zinc-800 shrink-0 select-none">
        {/* Traffic lights */}
        <button onClick={() => setOpen(false)} className="h-3 w-3 rounded-full bg-rose-500 hover:bg-rose-400 transition-colors" title="Close" />
        <button onClick={() => setMinimised(v => !v)} className="h-3 w-3 rounded-full bg-amber-500 hover:bg-amber-400 transition-colors" title="Minimise" />
        <div className="h-3 w-3 rounded-full bg-zinc-600" />

        <Terminal className="h-3.5 w-3.5 text-zinc-400 ml-2" />
        <span className="text-xs text-zinc-400 font-mono flex-1">API log</span>

        <button onClick={clear} className="text-zinc-600 hover:text-zinc-400 transition-colors" title="Clear">
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Log body */}
      {!minimised && (
        <div className="flex-1 overflow-y-auto font-mono text-[11px] leading-5 p-3 space-y-0.5">
          {entries.length === 0 && (
            <p className="text-zinc-600 italic">Waiting for API calls...</p>
          )}
          {[...entries].reverse().map((e) => (
            <div key={e.id} className="flex items-baseline gap-2 group">
              <span className="text-zinc-600 shrink-0">{e.ts}</span>
              <span className={`font-semibold w-14 shrink-0 ${METHOD_COLOR[e.method] ?? "text-zinc-400"}`}>
                {e.method}
              </span>
              <span className="text-zinc-300 truncate flex-1" title={e.url}>
                {e.url.replace("/api", "")}
              </span>
              {e.error ? (
                <span className="text-rose-400 shrink-0">ERR</span>
              ) : e.status !== undefined ? (
                <span className={`shrink-0 ${statusColor(e.status)}`}>{e.status}</span>
              ) : (
                <span className="text-zinc-600 shrink-0 animate-pulse">···</span>
              )}
              {e.duration !== undefined && (
                <span className="text-zinc-600 shrink-0">{e.duration}ms</span>
              )}
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
      )}
    </div>
  );
}
