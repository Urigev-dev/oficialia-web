// src/hooks/useRequisiciones.tsx
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

export type EstadoRequisicion =
  | "borrador"
  | "en_revision"
  | "cotizacion"
  | "suficiencia"
  | "autorizada"
  | "material_entregado"
  | "finalizada"
  | "rechazada";

export type EstadoLinea = "pendiente" | "autorizada" | "rechazada";

export type Linea = {
  id: string;
  cantidad: number;
  unidad: string;
  concepto: string;
  descripcion: string;
  cantidadAutorizada?: number;
  unidadAutorizada?: string;
  observacionRevision?: string;
  estadoLinea?: EstadoLinea;
};

export type Requisicion = {
  id: string;
  folio: string;
  fecha: string;
  tipoMaterial: string;
  secretariaNombre: string;
  direccion: string;
  responsableNombre: string;
  responsableTelefono: string;
  justificacion: string;
  estado: EstadoRequisicion;
  lineas: Linea[];
  creadoPor: { uid: string; email: string };
  revisionNotas?: string;
  revisadaPor?: { uid: string; email: string };
};

export type RequisicionFormData = {
  fecha: string;
  tipoMaterial: string;
  secretariaNombre: string;
  direccion: string;
  responsableNombre: string;
  responsableTelefono: string;
  justificacion: string;
  lineas: Linea[];
};

type Ctx = {
  requisiciones: Requisicion[];
  crearRequisicion: (data: RequisicionFormData, creador: { uid: string; email: string }, opciones: { enviar: boolean }) => Requisicion;
  actualizarRequisicion: (id: string, data: Partial<RequisicionFormData>) => void;
  eliminarBorrador: (id: string) => void;
  actualizarEstado: (id: string, nuevoEstado: EstadoRequisicion, extras?: { revisionNotas?: string; revisadaPor?: { uid: string; email: string } }) => void;
  actualizarLineas: (id: string, nuevasLineas: Linea[]) => void;
};

const RequisicionesContext = createContext<Ctx | null>(null);
const STORAGE_KEY = "oficialia_requisiciones_v1";

export function RequisicionesProvider({ children }: { children: ReactNode }) {
  // FIREBASE_TODO: En el futuro, este state se reemplazará por un listener de onSnapshot
  const [requisiciones, setRequisiciones] = useState<Requisicion[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(requisiciones));
    } catch {}
  }, [requisiciones]);

  const crearRequisicion: Ctx["crearRequisicion"] = (data, creador, opciones) => {
    // FIREBASE_TODO: Reemplazar con addDoc(collection(db, 'requisiciones'), ...)
    const id = typeof crypto !== "undefined" && "randomUUID" in crypto 
       ? crypto.randomUUID() 
       : `req-${Date.now()}`;
       
    // Generador de folio simple (En Firebase usaríamos una Transaction o Cloud Function)
    const year = new Date().getFullYear();
    const prefix = `REQ-${year}-`;
    const correlativos = requisiciones
      .filter(r => r.folio.startsWith(prefix))
      .map(r => parseInt(r.folio.split('-')[2] || "0"));
    const next = (correlativos.length ? Math.max(...correlativos) : 0) + 1;
    const folio = `${prefix}${String(next).padStart(4, "0")}`;

    const nueva: Requisicion = {
      id,
      folio,
      fecha: data.fecha,
      tipoMaterial: data.tipoMaterial,
      secretariaNombre: data.secretariaNombre,
      direccion: data.direccion,
      responsableNombre: data.responsableNombre,
      responsableTelefono: data.responsableTelefono,
      justificacion: data.justificacion,
      estado: opciones.enviar ? "en_revision" : "borrador",
      lineas: data.lineas,
      creadoPor: creador,
    };

    setRequisiciones((prev) => [...prev, nueva]);
    return nueva;
  };

  const actualizarRequisicion: Ctx["actualizarRequisicion"] = (id, data) => {
    // FIREBASE_TODO: Reemplazar con updateDoc(doc(db, 'requisiciones', id), data)
    setRequisiciones((prev) => prev.map((r) => (r.id === id ? { ...r, ...data } : r)));
  };

  const eliminarBorrador: Ctx["eliminarBorrador"] = (id) => {
    // FIREBASE_TODO: Reemplazar con deleteDoc(...)
    setRequisiciones((prev) => prev.filter((r) => r.id !== id));
  };

  const actualizarEstado: Ctx["actualizarEstado"] = (id, nuevoEstado, extras) => {
    // FIREBASE_TODO: updateDoc con campos específicos
    setRequisiciones((prev) =>
      prev.map((r) =>
        r.id === id
          ? { ...r, estado: nuevoEstado, ...extras }
          : r
      )
    );
  };

  const actualizarLineas: Ctx["actualizarLineas"] = (id, nuevasLineas) => {
    setRequisiciones((prev) =>
      prev.map((r) => r.id === id ? { ...r, lineas: nuevasLineas } : r)
    );
  };

  return (
    <RequisicionesContext.Provider
      value={{
        requisiciones,
        crearRequisicion,
        actualizarRequisicion,
        eliminarBorrador,
        actualizarEstado,
        actualizarLineas,
      }}
    >
      {children}
    </RequisicionesContext.Provider>
  );
}

export function useRequisiciones() {
  const ctx = useContext(RequisicionesContext);
  if (!ctx) throw new Error("useRequisiciones debe usarse dentro de RequisicionesProvider");
  return ctx;
}