"use client";

import { createContext, useCallback, useContext, useState } from "react";
import * as ToastPrimitive from "@radix-ui/react-toast";
import { AlertCircle, CheckCircle2, X } from "lucide-react";

type Variant = "error" | "success";
interface Toast { id: number; message: string; variant: Variant }

const ToastContext = createContext<{ notify: (message: string, variant?: Variant) => void } | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const notify = useCallback((message: string, variant: Variant = "error") => {
    setToasts((prev) => [...prev, { id: Date.now() + Math.random(), message, variant }]);
  }, []);

  return (
    <ToastContext.Provider value={{ notify }}>
      <ToastPrimitive.Provider swipeDirection="right" duration={6000}>
        {children}
        {toasts.map(({ id, message, variant }) => (
          <ToastPrimitive.Root
            key={id}
            onOpenChange={(open) => !open && setToasts((prev) => prev.filter((t) => t.id !== id))}
            className={`flex items-start gap-3 rounded-xl border px-4 py-3 shadow-2xl backdrop-blur
              data-[state=open]:animate-in data-[state=open]:slide-in-from-right-4
              data-[state=closed]:animate-out data-[state=closed]:fade-out ${
                variant === "error"
                  ? "border-destructive/30 bg-destructive/10 text-destructive"
                  : "border-primary/30 bg-primary/10 text-primary"
              }`}
          >
            {variant === "error"
              ? <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              : <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />}
            <ToastPrimitive.Description className="text-sm flex-1">{message}</ToastPrimitive.Description>
            <ToastPrimitive.Close className="opacity-60 hover:opacity-100 transition-opacity">
              <X className="h-3.5 w-3.5" />
            </ToastPrimitive.Close>
          </ToastPrimitive.Root>
        ))}
        <ToastPrimitive.Viewport className="fixed bottom-0 right-0 z-[100] flex w-96 max-w-[100vw] flex-col gap-2 p-4 outline-none" />
      </ToastPrimitive.Provider>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
}
