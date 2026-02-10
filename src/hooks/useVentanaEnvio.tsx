import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/firebase';
import { useSession } from './useSession';

interface ExcepcionUsuario {
  uid: string;
  expira: string; 
}

interface ConfigEnvio {
  diasFestivos: string[];
  excepcionGlobal: boolean;
  excepcionesUsuarios: ExcepcionUsuario[];
}

export function useVentanaEnvio() {
  const { user, role } = useSession();
  const [config, setConfig] = useState<ConfigEnvio | null>(null);
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [puedeEnviar, setPuedeEnviar] = useState(false);

  useEffect(() => {
    const unsub = onSnapshot(
      doc(db, 'configuracion', 'reglas_envio'), 
      (docSnap) => {
        if (docSnap.exists()) {
          setConfig(docSnap.data() as ConfigEnvio);
        } else {
          setConfig({ diasFestivos: [], excepcionGlobal: false, excepcionesUsuarios: [] });
        }
        setLoadingConfig(false);
      },
      (error) => {
        // SOLUCIÓN AL BANNER Y PANTALLA BLANCA: Manejamos el error de permisos aquí
        console.error("Error de Firebase (Seguramente faltan reglas):", error);
        setConfig({ diasFestivos: [], excepcionGlobal: false, excepcionesUsuarios: [] });
        setLoadingConfig(false); // Forzamos a que termine de cargar para que muestre el banner
      }
    );
    return () => unsub();
  }, []);

  useEffect(() => {
    // Si no hay usuario, retornamos inmediatamente para evitar errores al cerrar sesión
    if (!config || !user || loadingConfig) return;

    try {
      const hoy = new Date();
      let tienePermisoTemporal = false;
      
      // SOLUCIÓN PANTALLA BLANCA: Agregamos '?.' por si el array no existe en Firebase
      const excepcion = config.excepcionesUsuarios?.find((e: any) => 
        typeof e === 'string' ? e === user.uid : e.uid === user.uid
      );

      if (excepcion && typeof excepcion !== 'string') {
        const fechaExpira = new Date(excepcion.expira + 'T23:59:59');
        if (hoy.getTime() <= fechaExpira.getTime()) {
          tienePermisoTemporal = true;
        }
      }

      if (config.excepcionGlobal || tienePermisoTemporal || role === 'admin' || role === 'direccion') {
        setPuedeEnviar(true);
        return;
      }

      const año = hoy.getFullYear();
      const mes = hoy.getMonth();
      let diasHabilesContados = 0;
      let fechaIterativa = new Date(año, mes, 1);
      let fechaLimite = new Date(año, mes, 1);

      // Aseguramos que siempre sea un array válido
      const festivosSeguros = config.diasFestivos || [];

      while (diasHabilesContados < 5) {
        const diaSemana = fechaIterativa.getDay(); 
        const tzOffset = fechaIterativa.getTimezoneOffset() * 60000;
        const fechaString = (new Date(fechaIterativa.getTime() - tzOffset)).toISOString().split('T')[0];
        
        const esFestivo = festivosSeguros.includes(fechaString);

        if (diaSemana !== 0 && diaSemana !== 6 && !esFestivo) {
          diasHabilesContados++;
          fechaLimite = new Date(fechaIterativa);
        }
        if (diasHabilesContados < 5) {
          fechaIterativa.setDate(fechaIterativa.getDate() + 1);
        }
      }

      fechaLimite.setHours(23, 59, 59, 999);
      setPuedeEnviar(hoy.getTime() <= fechaLimite.getTime());

    } catch (err) {
      console.error("Error calculando fechas:", err);
      setPuedeEnviar(false);
    }

  }, [config, user, role, loadingConfig]);

  return { puedeEnviar, loadingConfig, config };
}