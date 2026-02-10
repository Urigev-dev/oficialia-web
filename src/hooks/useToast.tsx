import React, { createContext, useContext, useState, useCallback } from "react";
import { X, CheckCircle, AlertCircle, Info } from "lucide-react";

type ToastType = "success" | "error" | "info";

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  toast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((message: string, type: ToastType = "success") => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, message, type }]);
    
    // Auto-eliminar a los 4 segundos
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      {/* Contenedor de Toasts */}
      <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border animate-fade-in-up min-w-[300px] max-w-sm
              ${t.type === 'success' ? 'bg-white border-l-4 border-l-emerald-500 text-gray-800' : ''}
              ${t.type === 'error' ? 'bg-white border-l-4 border-l-red-500 text-gray-800' : ''}
              ${t.type === 'info' ? 'bg-gray-900 text-white' : ''}
            `}
          >
            {t.type === 'success' && <CheckCircle size={20} className="text-emerald-500" />}
            {t.type === 'error' && <AlertCircle size={20} className="text-red-500" />}
            {t.type === 'info' && <Info size={20} className="text-blue-400" />}
            
            <p className="text-sm font-medium flex-1">{t.message}</p>
            
            <button onClick={() => removeToast(t.id)} className="opacity-50 hover:opacity-100">
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast debe usarse dentro de ToastProvider");
  return context;
}