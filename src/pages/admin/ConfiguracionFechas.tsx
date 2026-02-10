import { useState, useEffect } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '../../firebase/firebase';
import { useSession } from '../../hooks/useSession';
import { Calendar, AlertTriangle, Users, Trash2, Clock } from 'lucide-react';
import { Button } from '../../components/ui/Button';

export default function ConfiguracionFechas() {
  const { allUsers } = useSession();
  const [config, setConfig] = useState({ diasFestivos: [], excepcionGlobal: false, excepcionesUsuarios: [] });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [nuevaFecha, setNuevaFecha] = useState('');
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState('');
  const [fechaExcepcion, setFechaExcepcion] = useState('');

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'configuracion', 'reglas_envio'), (docSnap) => {
      if (docSnap.exists()) setConfig(docSnap.data() as any);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const guardarCambios = async (nuevaConfig: any) => {
    setSaving(true);
    try { await setDoc(doc(db, 'configuracion', 'reglas_envio'), nuevaConfig, { merge: true }); } 
    catch (error) { console.error("Error al guardar:", error); } 
    finally { setSaving(false); }
  };

  const agregarFecha = () => {
    if (!nuevaFecha || config.diasFestivos.includes(nuevaFecha as never)) return;
    guardarCambios({ ...config, diasFestivos: [...config.diasFestivos, nuevaFecha].sort() });
    setNuevaFecha('');
  };

  const eliminarFecha = (fecha: string) => {
    guardarCambios({ ...config, diasFestivos: config.diasFestivos.filter(f => f !== fecha) });
  };

  const toggleGlobal = () => {
    guardarCambios({ ...config, excepcionGlobal: !config.excepcionGlobal });
  };

  const agregarUsuario = () => {
    if (!usuarioSeleccionado || !fechaExcepcion) return;
    const filtrados = config.excepcionesUsuarios.filter((e: any) => (typeof e === 'string' ? e : e.uid) !== usuarioSeleccionado);
    guardarCambios({ ...config, excepcionesUsuarios: [...filtrados, { uid: usuarioSeleccionado, expira: fechaExcepcion }] });
    setUsuarioSeleccionado(''); setFechaExcepcion('');
  };

  const eliminarUsuario = (uidAEliminar: string) => {
    guardarCambios({ ...config, excepcionesUsuarios: config.excepcionesUsuarios.filter((e: any) => (typeof e === 'string' ? e : e.uid) !== uidAEliminar) });
  };

  if (loading) return <div className="p-8 text-center text-gray-500 animate-pulse">Cargando configuración...</div>;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2"><Calendar className="text-[var(--color-brand)]" />Configuración de Recepción</h1>
        <p className="text-sm text-gray-500 mt-1">Administra las reglas y excepciones para los 5 días hábiles de envío de requerimientos.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2 mb-4"><AlertTriangle size={18} className="text-amber-500" />Días Inhábiles Oficiales</h2>
          <div className="flex gap-2 mb-4">
            <input type="date" className="flex-1 p-2 border border-gray-200 rounded-lg outline-none" value={nuevaFecha} onChange={(e) => setNuevaFecha(e.target.value)} />
            <Button variant="secondary" onClick={agregarFecha} disabled={!nuevaFecha || saving}>Agregar</Button>
          </div>
          <ul className="space-y-2">
            {config.diasFestivos.map(fecha => (
              <li key={fecha} className="flex justify-between items-center p-2 bg-gray-50 rounded-lg text-sm text-gray-700">
                {new Date(fecha + 'T12:00:00').toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                <button onClick={() => eliminarFecha(fecha)} className="text-red-400 hover:text-red-600"><Trash2 size={16}/></button>
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-6">
          <div className={`p-6 rounded-xl border ${config.excepcionGlobal ? 'bg-red-50 border-red-200' : 'bg-white border-gray-100'}`}>
            <h2 className="text-lg font-bold text-gray-800 flex items-center justify-between mb-2">Apertura Global Extraordinaria
              <button onClick={toggleGlobal} disabled={saving} className={`w-12 h-6 rounded-full flex items-center px-1 ${config.excepcionGlobal ? 'bg-red-500 justify-end' : 'bg-gray-300 justify-start'}`}><div className="w-4 h-4 bg-white rounded-full"></div></button>
            </h2>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2 mb-4"><Users size={18} className="text-blue-500" />Permisos Temporales</h2>
            <div className="flex flex-col gap-2 mb-4">
              <select className="w-full p-2 border border-gray-200 rounded-lg text-sm" value={usuarioSeleccionado} onChange={(e) => setUsuarioSeleccionado(e.target.value)}>
                <option value="">1. Selecciona un usuario...</option>
                {allUsers.filter(u => u.role === 'solicitud').map(u => <option key={u.uid} value={u.uid}>{u.organo} - {u.email}</option>)}
              </select>
              <div className="flex gap-2">
                <input type="date" className="flex-1 p-2 border border-gray-200 rounded-lg text-sm" value={fechaExcepcion} min={new Date().toISOString().split('T')[0]} onChange={(e) => setFechaExcepcion(e.target.value)} />
                <Button variant="secondary" onClick={agregarUsuario} disabled={!usuarioSeleccionado || !fechaExcepcion || saving}>Conceder</Button>
              </div>
            </div>
            <ul className="space-y-2 mt-4">
              {config.excepcionesUsuarios.map((excepcion: any) => {
                const uid = typeof excepcion === 'string' ? excepcion : excepcion.uid;
                const expira = typeof excepcion === 'string' ? 'Indefinido' : excepcion.expira;
                const usr = allUsers.find(u => u.uid === uid);
                const estaVencido = expira !== 'Indefinido' && new Date(expira + 'T23:59:59').getTime() < new Date().getTime();
                return (
                  <li key={uid} className={`flex justify-between items-center p-3 rounded-lg border ${estaVencido ? 'bg-gray-50 border-gray-200 opacity-60' : 'bg-blue-50 border-blue-100'}`}>
                    <div>
                        <span className={`font-semibold text-sm ${estaVencido ? 'text-gray-500' : 'text-blue-800'}`}>{usr?.organo || 'Desconocido'}</span>
                        <div className={`text-xs flex items-center gap-1 mt-0.5 ${estaVencido ? 'text-red-500 font-bold' : 'text-blue-600'}`}><Clock size={12} />{estaVencido ? 'Vencido' : `Válido hasta: ${new Date(expira + 'T12:00:00').toLocaleDateString()}`}</div>
                    </div>
                    <button onClick={() => eliminarUsuario(uid)} className="text-gray-400 hover:text-red-600"><Trash2 size={16}/></button>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}