"use client";

import React, { createContext, useContext, useState, useCallback } from "react";

type ToastType = "success" | "error" | "info" | "warning";

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: ToastType = "info") => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 5000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const typeStyles = {
    success: "bg-emerald-500/90 border-emerald-400",
    error: "bg-red-500/90 border-red-400",
    info: "bg-blue-500/90 border-blue-400",
    warning: "bg-amber-500/90 border-amber-400",
  };

  const typeIcons = {
    success: "✓",
    error: "✕",
    info: "ⓘ",
    warning: "⚠",
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`${typeStyles[toast.type]} border-2 text-white px-6 py-4 rounded-lg shadow-2xl pointer-events-auto animate-slide-up flex items-center gap-3 min-w-[300px] max-w-md`}
            role="alert"
            aria-live="assertive"
          >
            <span className="text-xl font-bold">{typeIcons[toast.type]}</span>
            <span className="flex-1 font-medium">{toast.message}</span>
            <button
              onClick={() => removeToast(toast.id)}
              className="hover:opacity-70 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white rounded"
              aria-label="Close notification"
            >
              <span className="text-xl">×</span>
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
