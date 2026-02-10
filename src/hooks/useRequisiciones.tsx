import { createContext, useContext, useEffect, useMemo, useState, useCallback } from "react";
import type { ReactNode } from "react";
import {
  collection,
  doc,
  deleteDoc,
  onSnapshot,
  orderBy,
  query,
  where,
  serverTimestamp,
  updateDoc,
  runTransaction,
  limit,
  getDoc
} from "firebase/firestore";
import { db } from "../firebase/firebase";
import { useSession } from "./useSession";
import type { Requisicion, LineaRequisicion, EstadoRequisicion, EventoHistorial, DatosRevisor } from "../types";

export type { Requisicion, LineaRequisicion, EstadoRequisicion, EventoHistorial };
export type Linea = LineaRequisicion; 

export type RequisicionFormData = {
  fechaSolicitud: string;
  area: string;
  tipoMaterial: string;
  subTipoMaterial: string;
  organoRequirente: string;
  titularNombre: string;
  responsableNombre: string;
  responsableTelefono: string;
  direccionEntrega: string;
  justificacion: string;
  lineas: LineaRequisicion[];
  
  adjuntos?: any[];

  folio?: string; 
  revisionNotas?: string;
  historialObservaciones?: EventoHistorial[];
  creadoPor?: { uid: string; email: string };
  estado?: EstadoRequisicion;
  revisandoPor?: DatosRevisor;
};

type CrearResponse = { id: string; folio: string };

type RequisicionesContextValue = {
  requisiciones: Requisicion[];
  loading: boolean;
  crearRequisicion: (data: RequisicionFormData, options?: { enviar: boolean }) => Promise<CrearResponse | undefined>;
  actualizarRequisicion: (id: string, data: Partial<Requisicion>) => Promise<void>;
  eliminarBorrador: (id: string) => Promise<void>;
  actualizarEstado: (id: string, estado: EstadoRequisicion, extras?: Partial<Requisicion>) => Promise<void>;
  actualizarLineas: (id: string, lineas: LineaRequisicion[], extras?: Partial<Requisicion>) => Promise<void>;
  obtenerRequisicion: (id: string) => Promise<Requisicion | null>; // NUEVO: Para cargar detalles individuales
};

const RequisicionesContext = createContext<RequisicionesContextValue | null>(null);

export function RequisicionesProvider({ children }: { children: ReactNode }) {
  const { user, loading: sessionLoading } = useSession();
  const [requisiciones, setRequisiciones] = useState<Requisicion[]>([]);
  const [loading, setLoading] = useState(true);

  // --- ESTRATEGIA DE LECTURA DE DATOS MULTI-CANAL ---
  useEffect(() => {
    if (sessionLoading) return;
    if (!user) {
      setRequisiciones([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubs: (() => void)[] = [];

    // Función auxiliar para procesar snapshots y evitar duplicados
    const handleSnapshots = (snapshots: any[]) => {
        const uniqueMap = new Map<string, Requisicion>();
        
        snapshots.forEach(snap => {
            snap.docs.forEach((doc: any) => {
                uniqueMap.set(doc.id, { id: doc.id, ...doc.data() } as Requisicion);
            });
        });

        // Convertimos a array y Ordenamos en Cliente (Seguridad por si falta índice)
        const sorted = Array.from(uniqueMap.values()).sort((a, b) => {
             // @ts-ignore
             return (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0);
        });

        setRequisiciones(sorted);
        setLoading(false);
    };

    // --- CONFIGURACIÓN DE LISTENERS POR ROL ---

    if (user.role === 'solicitud') {
       // 1. SOLICITANTE: Ve TODO lo suyo (sin limite estricto o limite alto)
       const q = query(
         collection(db, "requisiciones"), 
         where("creadoPor.uid", "==", user.uid),
         orderBy("createdAt", "desc")
       );
       unsubs.push(onSnapshot(q, (snap) => handleSnapshots([snap])));
    
    } else {
       // 2. ROLES DE GESTIÓN (Revisor, Admin, Almacén)
       // Usamos 3 canales para garantizar que NO se pierdan datos importantes.

       // A. CANAL ACTIVO: Trámites vivos (SIN LÍMITE)
       // Esto garantiza que los 42 "En revisión" se vean SIEMPRE.
       const estadosActivos = ['en_revision', 'cotizacion', 'suficiencia', 'autorizada', 'material_entregado'];
       const qActivos = query(
           collection(db, "requisiciones"),
           where("estado", "in", estadosActivos)
           // Nota: Quitamos orderBy aquí para evitar error de índice faltante inmediato.
           // El ordenamiento se hace en memoria en handleSnapshots.
       );

       // B. CANAL HISTÓRICO: Trámites cerrados (CON LÍMITE)
       const estadosInactivos = ['finalizada', 'rechazada'];
       const qHistorico = query(
           collection(db, "requisiciones"),
           where("estado", "in", estadosInactivos),
           orderBy("createdAt", "desc"),
           limit(50) // Solo las 50 ultimas finalizadas
       );

       // C. CANAL MIS BORRADORES: Si soy revisor y hago una requisición
       const qMisBorradores = query(
            collection(db, "requisiciones"),
            where("creadoPor.uid", "==", user.uid),
            where("estado", "==", "borrador")
       );

       // Suscripción unificada: Esperamos a que todos respondan
       // Nota: onSnapshot se dispara independientemente, gestionamos el merge en un estado local temporal si fuera necesario,
       // pero aquí React batching ayuda. Para mayor robustez, usamos listeners separados que actualizan el Map central.
       
       let cacheActivos: any = { docs: [] };
       let cacheHistorico: any = { docs: [] };
       let cachePropios: any = { docs: [] };

       const updateState = () => {
           handleSnapshots([cacheActivos, cacheHistorico, cachePropios]);
       };

       unsubs.push(onSnapshot(qActivos, (snap) => { cacheActivos = snap; updateState(); }));
       unsubs.push(onSnapshot(qHistorico, (snap) => { cacheHistorico = snap; updateState(); }));
       unsubs.push(onSnapshot(qMisBorradores, (snap) => { cachePropios = snap; updateState(); }));
    }

    return () => unsubs.forEach(u => u());
  }, [user, sessionLoading]);

  // --- FUNCIONES ---

  // NUEVO: Recuperación unitaria (para evitar pantalla blanca en F5)
  const obtenerRequisicion = useCallback(async (id: string): Promise<Requisicion | null> => {
      // 1. Buscar en caché local
      const existente = requisiciones.find(r => r.id === id);
      if (existente) return existente;

      // 2. Si no está, buscar en DB
      try {
          const docRef = doc(db, "requisiciones", id);
          const snap = await getDoc(docRef);
          if (snap.exists()) {
              return { id: snap.id, ...snap.data() } as Requisicion;
          }
          return null;
      } catch (e) {
          console.error("Error fetching single req:", e);
          return null;
      }
  }, [requisiciones]);

  const crearRequisicion = async (data: RequisicionFormData, _options?: { enviar: boolean }): Promise<CrearResponse | undefined> => {
    try {
      const result = await runTransaction(db, async (transaction) => {
        const year = new Date().getFullYear();
        const counterRef = doc(db, "counters", `folio_${year}`);
        const counterDoc = await transaction.get(counterRef);

        let newCount = 1;
        if (counterDoc.exists()) {
          newCount = counterDoc.data().count + 1;
        }

        const paddedCount = newCount.toString().padStart(5, '0');
        const nuevoFolio = `REQ-${year}-${paddedCount}`;
        const newReqRef = doc(collection(db, "requisiciones"));

        transaction.set(newReqRef, {
          ...data,
          folio: nuevoFolio,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });

        transaction.set(counterRef, { count: newCount }, { merge: true });
        return { id: newReqRef.id, folio: nuevoFolio };
      });
      return result;
    } catch (e) {
      console.error("Error generando folio:", e);
      throw e;
    }
  };

  const actualizarRequisicion: RequisicionesContextValue["actualizarRequisicion"] = async (id, data) => {
    try {
      await updateDoc(doc(db, "requisiciones", id), {
        ...data,
        updatedAt: serverTimestamp(),
      });
    } catch (e) { console.error(e); }
  };

  const eliminarBorrador: RequisicionesContextValue["eliminarBorrador"] = async (id) => {
    try {
      await deleteDoc(doc(db, "requisiciones", id));
    } catch (e) { console.error(e); }
  };

  const actualizarEstado: RequisicionesContextValue["actualizarEstado"] = async (id, estado, extras) => {
    try {
      await updateDoc(doc(db, "requisiciones", id), {
        estado,
        ...(extras || {}),
        updatedAt: serverTimestamp(),
      });
    } catch (e) { console.error(e); }
  };

  const actualizarLineas: RequisicionesContextValue["actualizarLineas"] = async (id, lineas, extras) => {
    try {
      await updateDoc(doc(db, "requisiciones", id), {
        lineas,
        ...(extras || {}),
        updatedAt: serverTimestamp(),
      });
    } catch (e) { console.error(e); }
  };

  const value = useMemo(() => ({
    requisiciones,
    loading,
    crearRequisicion,
    actualizarRequisicion,
    eliminarBorrador,
    actualizarEstado,
    actualizarLineas,
    obtenerRequisicion // Exportamos la nueva función
  }), [requisiciones, loading, obtenerRequisicion]);

  return (
    <RequisicionesContext.Provider value={value}>
      {children}
    </RequisicionesContext.Provider>
  );
}

export function useRequisiciones() {
  const context = useContext(RequisicionesContext);
  if (!context) throw new Error("useRequisiciones debe usarse dentro de RequisicionesProvider");
  return context;
}