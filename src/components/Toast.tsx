"use client";

import { useEffect, useState, useCallback } from "react";

type ToastType = "success" | "error" | "info";

type Toast = {
  id: string;
  message: string;
  type: ToastType;
  exiting?: boolean;
};

let toastListeners: ((t: Toast) => void)[] = [];

export function showToast(message: string, type: ToastType = "success") {
  const toast: Toast = { id: Date.now().toString(), message, type };
  toastListeners.forEach((fn) => fn(toast));
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((t: Toast) => {
    setToasts((prev) => [...prev, t]);
    setTimeout(() => {
      setToasts((prev) =>
        prev.map((x) => (x.id === t.id ? { ...x, exiting: true } : x))
      );
      setTimeout(() => {
        setToasts((prev) => prev.filter((x) => x.id !== t.id));
      }, 300);
    }, 3000);
  }, []);

  useEffect(() => {
    toastListeners.push(addToast);
    return () => {
      toastListeners = toastListeners.filter((fn) => fn !== addToast);
    };
  }, [addToast]);

  const bgMap: Record<ToastType, string> = {
    success: "border-neon-green/40 bg-neon-green/10",
    error: "border-neon-rose/40 bg-neon-rose/10",
    info: "border-neon-cyan/40 bg-neon-cyan/10",
  };

  const dotMap: Record<ToastType, string> = {
    success: "bg-neon-green",
    error: "bg-neon-rose",
    info: "bg-neon-cyan",
  };

  return (
    <div className="fixed top-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`${t.exiting ? "toast-exit" : "toast-enter"} ${bgMap[t.type]} border rounded-xl px-5 py-3.5 glass-strong pointer-events-auto flex items-center gap-3 min-w-[280px] max-w-[420px]`}
        >
          <div className={`w-2 h-2 rounded-full ${dotMap[t.type]} pulse-dot`} />
          <span className="text-sm text-white/90">{t.message}</span>
        </div>
      ))}
    </div>
  );
}
