// FILE: src/hooks/useRequisiciones.tsx
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
  subTipoMaterial?: string;
  organoRequirente: string; // RENOMBRADO (Antes secretariaNombre)
  titularNombre: string;    // NUEVO
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

// El formulario debe coincidir con estos nombres
export type RequisicionFormData = {
  fecha: string;
  tipoMaterial: string;
  subTipoMaterial: string;
  organoRequirente: string; // FIX
  titularNombre: string;    // FIX
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
const STORAGE_KEY = "oficialia_requisiciones_v3"; // Incrementamos versión para limpiar caché vieja

export function RequisicionesProvider({ children }: { children: ReactNode }) {
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
    const id = typeof crypto !== "undefined" && "randomUUID" in crypto 
       ? crypto.randomUUID() 
       : `req-${Date.now()}`;
       
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
      subTipoMaterial: data.subTipoMaterial,
      organoRequirente: data.organoRequirente, // Mapeo directo
      titularNombre: data.titularNombre,       // Mapeo directo
      direccion: data.direccion,
      responsableNombre: data.responsableNombre,
      responsableTelefono: data.responsableTelefono,
      justificacion: data.justificacion,
      estado: opciones.enviar ? "en_revision" : "borrador",
      lineas: data.lineas,
      creadoPor: creador,
    };

    setRequisiciones((prev) => [nueva, ...prev]);
    return nueva;
  };

  const actualizarRequisicion: Ctx["actualizarRequisicion"] = (id, data) => {
    setRequisiciones((prev) => prev.map((r) => (r.id === id ? { ...r, ...data } : r)));
  };

  const eliminarBorrador: Ctx["eliminarBorrador"] = (id) => {
    setRequisiciones((prev) => prev.filter((r) => r.id !== id));
  };

  const actualizarEstado: Ctx["actualizarEstado"] = (id, nuevoEstado, extras) => {
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