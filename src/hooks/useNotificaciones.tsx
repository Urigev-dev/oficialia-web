import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  doc, 
  serverTimestamp, 
  deleteDoc,
  writeBatch
} from "firebase/firestore";
import { db } from "../firebase/firebase";
import { useSession, type Role } from "./useSession";

export interface Notificacion {
  id: string;
  targetUid?: string;
  targetRole?: Role;
  reqId?: string;
  folio?: string;
  mensaje: string;
  // FIX: Agregamos 'success' y 'error' a los tipos permitidos
  tipo: 'estado' | 'accion' | 'info' | 'success' | 'error';
  leida: boolean;
  createdAt: any;
}

type NotificacionesContextValue = {
  notificaciones: Notificacion[];
  pendientes: number;
  agregarNotificacion: (data: Omit<Notificacion, "id" | "leida" | "createdAt">) => Promise<void>;
  marcarLeida: (id: string) => Promise<void>;
  eliminarNotificacion: (id: string) => Promise<void>;
  marcarTodasLeidas: () => Promise<void>;
  limpiarTodas: () => Promise<void>;
};

const NotificacionesContext = createContext<NotificacionesContextValue | null>(null);

export function NotificacionesProvider({ children }: { children: ReactNode }) {
  const { user } = useSession();
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
  
  // Filtramos notificaciones relevantes para el usuario actual
  useEffect(() => {
    if (!user) {
      setNotificaciones([]);
      return;
    }

    // Consulta base: Notificaciones dirigidas a mi UID
    const q1 = query(
      collection(db, "notificaciones"),
      where("targetUid", "==", user.uid),
      orderBy("createdAt", "desc")
    );

    // Consulta secundaria: Notificaciones dirigidas a mi ROL (si aplica)
    // Nota: Firestore no soporta "OR" en streams complejos fácilmente sin índices compuestos múltiples.
    // Para simplificar y ahorrar costos/índices, en este diseño priorizamos targetUid.
    // Si necesitas broadcast por rol, se puede agregar una lógica de fusión aquí o un segundo listener.
    
    // Por ahora usamos el listener principal por UID que es lo más seguro y directo.
    const unsubscribe = onSnapshot(q1, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Notificacion[];
      setNotificaciones(data);
    });

    return () => unsubscribe();
  }, [user]);

  const pendientes = notificaciones.filter(n => !n.leida).length;

  const agregarNotificacion = async (data: Omit<Notificacion, "id" | "leida" | "createdAt">) => {
    try {
      await addDoc(collection(db, "notificaciones"), {
        ...data,
        leida: false,
        createdAt: serverTimestamp()
      });
    } catch (e) {
      console.error("Error al enviar notificación:", e);
    }
  };

  const marcarLeida = async (id: string) => {
    try {
      await updateDoc(doc(db, "notificaciones", id), { leida: true });
    } catch (e) { console.error(e); }
  };

  const eliminarNotificacion = async (id: string) => {
    try {
      await deleteDoc(doc(db, "notificaciones", id));
    } catch (e) { console.error(e); }
  };

  const marcarTodasLeidas = async () => {
    if (notificaciones.length === 0) return;
    try {
      const batch = writeBatch(db);
      let updates = 0;
      notificaciones.forEach(n => {
        if (!n.leida) {
          batch.update(doc(db, "notificaciones", n.id), { leida: true });
          updates++;
        }
      });
      if (updates > 0) await batch.commit();
    } catch (e) { console.error(e); }
  };

  const limpiarTodas = async () => {
    if (notificaciones.length === 0) return;
    try {
      const batch = writeBatch(db);
      notificaciones.forEach(n => {
        batch.delete(doc(db, "notificaciones", n.id));
      });
      await batch.commit();
    } catch (e) { console.error(e); }
  };

  return (
    <NotificacionesContext.Provider value={{ 
      notificaciones, 
      pendientes, 
      agregarNotificacion, 
      marcarLeida, 
      eliminarNotificacion,
      marcarTodasLeidas,
      limpiarTodas
    }}>
      {children}
    </NotificacionesContext.Provider>
  );
}

export function useNotificaciones() {
  const context = useContext(NotificacionesContext);
  if (!context) throw new Error("useNotificaciones debe usarse dentro de NotificacionesProvider");
  return context;
}