import { useNavigate } from "react-router-dom";
import { useSession } from "../hooks/useSession";
import { useNotificaciones } from "../hooks/useNotificaciones";
import { useRequisiciones } from "../hooks/useRequisiciones"; // Importamos para verificar estado real
import { CheckCheck, Trash2, Bell, FileText, AlertCircle, Eye } from "lucide-react";

export default function NotificacionesPage() {
  const { user, role } = useSession();
  const navigate = useNavigate();
  
  const { 
    notificaciones, 
    limpiarTodas, 
    eliminarNotificacion, 
    marcarTodasLeidas, 
    marcarLeida 
  } = useNotificaciones();

  // Obtenemos las requisiciones para consultar el estado en tiempo real
  const { requisiciones } = useRequisiciones();
  
  if (!user) return <div className="text-sm p-4">Debes iniciar sesión.</div>;

  const getAction = (n: any) => {
     // Buscamos la requisición real vinculada a esta notificación
     const reqReal = requisiciones.find(r => r.id === n.reqId);
     const estadoActual = reqReal?.estado;

     // Lógica para Solicitantes
     if (role === 'solicitud') {
         // CASO 1: BORRADOR -> Permite editar (Comportamiento existente)
         if (estadoActual === 'borrador') {
             return { label: "Corregir ahora", url: `/nueva?edit=${n.reqId}`, priority: true, icon: <AlertCircle size={14} /> };
         }

         // CASO 2: RECHAZADA -> Solo lectura (NUEVO COMPORTAMIENTO)
         // Redirige a la vista de detalle estándar, donde NO se permite edición.
         if (estadoActual === 'rechazada') {
             return { label: "Ver motivo", url: `/requisiciones/${n.reqId}`, priority: true, icon: <Eye size={14} /> };
         }

         // Resto de estados (en_revision, cotizacion, etc.) -> Ver estado
         return { label: "Ver estado", url: `/requisiciones/${n.reqId}`, priority: false, icon: <FileText size={14} /> };
     }

     // Lógica para Revisores
     if (role === 'revision') {
         return { label: "Gestionar", url: `/requisiciones/${n.reqId}`, priority: true, icon: <FileText size={14} /> };
     }

     return { label: "Ver detalle", url: `/requisiciones/${n.reqId}`, priority: false, icon: <FileText size={14} /> };
  };

  const handleLinkClick = async (e: any, id: string, url: string) => {
      e.preventDefault(); 
      await marcarLeida(id);
      navigate(url);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <header className="flex items-center justify-between pb-4 border-b border-gray-100">
        <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Bell className="text-[var(--color-brand)]" />
                Bandeja de Entrada
            </h2>
            <p className="text-sm text-gray-500 mt-1">Avisos y actualizaciones de tus trámites</p>
        </div>
        {notificaciones.length > 0 && (
            <div className="flex gap-2">
                <button 
                    onClick={() => marcarTodasLeidas()} 
                    className="flex items-center gap-1 text-xs font-medium text-[var(--color-brand)] hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-colors border border-transparent hover:border-blue-100"
                >
                    <CheckCheck size={14} /> Marcar leídas
                </button>
                <button 
                    onClick={() => limpiarTodas()} 
                    className="flex items-center gap-1 text-xs font-medium text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors border border-transparent hover:border-red-100"
                >
                    <Trash2 size={14} /> Limpiar todo
                </button>
            </div>
        )}
      </header>

      {notificaciones.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center border border-gray-200 shadow-sm">
           <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Bell className="text-gray-300" size={32} />
           </div>
           <p className="text-gray-900 font-medium">Estás al día</p>
           <p className="text-sm text-gray-500">No tienes notificaciones pendientes.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {notificaciones.map((n) => {
            const action = getAction(n);
            return (
              <li 
                key={n.id} 
                className={`group relative bg-white rounded-xl shadow-sm p-5 border transition-all duration-200 hover:shadow-md ${!n.leida ? "border-l-4 border-l-[var(--color-brand)] bg-blue-50/10" : "border-gray-200"}`}
              >
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                  
                  {/* Contenido Texto */}
                  <div className="flex-1 pr-0 sm:pr-8">
                    <div className="flex items-center gap-2 mb-2">
                        {n.folio && <span className="font-mono text-[10px] font-bold text-gray-600 bg-gray-100 px-1.5 py-0.5 rounded">{n.folio}</span>}
                        <span className="text-[10px] text-gray-400 uppercase tracking-wide">
                            {n.createdAt?.seconds ? new Date(n.createdAt.seconds * 1000).toLocaleDateString() : 'Hoy'}
                        </span>
                        {!n.leida && <span className="bg-blue-600 text-white px-1.5 py-0.5 rounded text-[9px] font-bold shadow-sm animate-pulse">NUEVA</span>}
                    </div>
                    <div className="font-medium text-gray-800 text-sm leading-relaxed">
                        {n.mensaje}
                    </div>
                  </div>
                  
                  {/* Acciones */}
                  <div className="flex items-center gap-2 w-full sm:w-auto mt-3 sm:mt-0 justify-end">
                      {n.reqId && (
                          <a 
                            href={action.url}
                            onClick={(e) => handleLinkClick(e, n.id, action.url)}
                            className={`flex items-center gap-1.5 shrink-0 text-center px-4 py-2 rounded-lg text-xs font-bold transition-all shadow-sm
                                ${action.priority 
                                    ? "bg-[var(--color-brand)] text-white hover:brightness-90 hover:shadow" 
                                    : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
                                }`}
                          >
                            {action.icon}
                            {action.label}
                          </a>
                      )}
                      
                      <button 
                          onClick={(e) => { e.stopPropagation(); eliminarNotificacion(n.id); }} 
                          className="text-gray-300 hover:text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors" 
                          title="Eliminar"
                      >
                          <Trash2 size={16} />
                      </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}