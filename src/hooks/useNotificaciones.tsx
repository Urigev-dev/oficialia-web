// src/hooks/useNotificaciones.tsx
import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";

const STORAGE_KEY = "ofm_notificaciones_v1";

export type TipoNotificacion = "estado" | "linea" | "general";

export type Notificacion = {
  id: string;
  reqId: string;
  folio: string;
  mensaje: string;
  fecha: string;
  tipo: TipoNotificacion;
  leida: boolean;
  targetRole?: "solicitud" | "revision" | "admin"; 
};

type Ctx = {
  notificaciones: Notificacion[];
  pendientes: number;
  agregarNotificacion: (payload: { reqId: string; folio: string; mensaje: string; tipo?: TipoNotificacion; targetRole?: "solicitud" | "revision" | "admin" }) => void;
  marcarLeida: (id: string) => void;
  marcarTodasLeidas: () => void;
  eliminarTodas: () => void;
  eliminarNotificacion: (id: string) => void;
};

const NotificacionesContext = createContext<Ctx | null>(null);

export function NotificacionesProvider({ children }: { children: ReactNode }) {
  // FIREBASE_TODO: Aquí usaremos un query: collection('notificaciones').where('targetRole', '==', userRole)
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
  });

  useEffect(() => {
    try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(notificaciones)); } catch {}
  }, [notificaciones]);

  const agregarNotificacion: Ctx["agregarNotificacion"] = useCallback(({ reqId, folio, mensaje, tipo = "general", targetRole }) => {
    // FIREBASE_TODO: addDoc(...)
    const nueva: Notificacion = {
      id: `n-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      reqId, folio, mensaje, fecha: new Date().toISOString(), tipo, leida: false, targetRole,
    };
    setNotificaciones((prev) => [nueva, ...prev]);
  }, []);

  const marcarLeida = useCallback((id: string) => {
    setNotificaciones((prev) => prev.map((n) => (n.id === id ? { ...n, leida: true } : n)));
  }, []);

  const marcarTodasLeidas = useCallback(() => {
    setNotificaciones((prev) => prev.map((n) => ({ ...n, leida: true })));
  }, []);

  const eliminarTodas = useCallback(() => {
    if (window.confirm("¿Vaciar bandeja?")) setNotificaciones([]);
  }, []);

  const eliminarNotificacion = useCallback((id: string) => {
    setNotificaciones((prev) => prev.filter((n) => n.id !== id));
  }, []);

  // Nota: Este conteo de pendientes actualmente es global local.
  // En Firebase se hará un count() query.
  const pendientes = notificaciones.filter((n) => !n.leida).length;

  return (
    <NotificacionesContext.Provider value={{ notificaciones, pendientes, agregarNotificacion, marcarLeida, marcarTodasLeidas, eliminarTodas, eliminarNotificacion }}>
      {children}
    </NotificacionesContext.Provider>
  );
}

export function useNotificaciones() {
  const ctx = useContext(NotificacionesContext);
  if (!ctx) throw new Error("Falta NotificacionesProvider");
  return ctx;
}