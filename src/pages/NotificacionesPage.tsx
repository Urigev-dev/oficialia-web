// src/pages/NotificacionesPage.tsx
import { Link } from "react-router-dom";
import { useSession } from "../hooks/useSession";
import { useNotificaciones } from "../hooks/useNotificaciones";
import { useRequisiciones } from "../hooks/useRequisiciones";

export default function NotificacionesPage() {
  const { user, role } = useSession();
  
  // AGREGAMOS 'marcarLeida' AQUÍ 👇
  const { 
    notificaciones, 
    eliminarTodas, 
    eliminarNotificacion, 
    marcarTodasLeidas, 
    marcarLeida 
  } = useNotificaciones();
  
  const { requisiciones } = useRequisiciones();

  if (!user) return <div className="text-sm p-4">Debes iniciar sesión.</div>;

  // Filtro de Roles (Optimizado)
  const lista = notificaciones.filter(n => {
      if (role === 'admin') return true;
      if (role === 'revision') return n.targetRole === 'revision';
      if (role === 'solicitud') return n.targetRole === 'solicitud' || !n.targetRole;
      return false;
  });

  const getAction = (n: any) => {
     const req = requisiciones.find(r => r.id === n.reqId);
     if (role === 'solicitud' && req?.estado === 'borrador') {
         return { label: "Corregir ahora", url: `/nueva?id=${n.reqId}`, priority: true };
     }
     if (role === 'revision') {
         return { label: "Revisar", url: `/requisiciones/${n.reqId}`, priority: true };
     }
     return { label: "Ver detalle", url: `/requisiciones/${n.reqId}`, priority: false };
  };

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between">
        <div>
            <h2 className="text-xl font-bold text-ink">Bandeja de Entrada</h2>
            <p className="text-sm text-ink/70">
                {role === 'revision' ? "Avisos de correcciones recibidas." : "Avisos sobre el estado de tus trámites."}
            </p>
        </div>
        {lista.length > 0 && (
            <div className="flex gap-2">
                <button onClick={marcarTodasLeidas} className="text-xs text-brand hover:bg-brand-50 px-3 py-1.5 rounded-full border border-brand/20 transition-colors">✓ Marcar leídas</button>
                <button onClick={eliminarTodas} className="text-xs flex items-center gap-1 text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-full border border-transparent hover:border-red-200 transition-colors">🗑️ Limpiar todo</button>
            </div>
        )}
      </header>

      {lista.length === 0 ? (
        <div className="bg-surface rounded-[--radius-xl] p-12 text-center shadow-sm">
           <div className="text-4xl mb-3">📭</div>
           <p className="text-ink font-medium">Bandeja vacía</p>
           <p className="text-sm text-ink/60">No tienes notificaciones pendientes.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {lista.map((n) => {
            const action = getAction(n);
            return (
              <li key={n.id} className={`group relative bg-surface rounded-[--radius-xl] shadow-sm p-4 border-l-4 pr-12 transition-all hover:shadow-md ${!n.leida ? "border-brand bg-red-50/10" : "border-gray-200"}`}>
                <button onClick={() => eliminarNotificacion(n.id)} className="absolute top-3 right-3 text-gray-400 hover:text-red-600 hover:bg-red-50 p-1.5 rounded-full transition-colors opacity-0 group-hover:opacity-100" title="Eliminar">✕</button>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="pr-4">
                    <div className="text-[10px] text-ink/50 mb-1 font-mono uppercase tracking-wider flex items-center gap-2">
                      <span>{n.folio}</span><span>•</span><span>{new Date(n.fecha).toLocaleDateString()}</span>
                      {!n.leida && <span className="bg-brand text-white px-1.5 rounded text-[9px]">NUEVA</span>}
                    </div>
                    <div className="font-bold text-ink text-sm mb-1">{n.mensaje}</div>
                  </div>
                  
                  {/* AQUÍ ESTÁ EL FIX: onClick para marcar como leída al navegar */}
                  <Link 
                    to={action.url} 
                    onClick={() => marcarLeida(n.id)}
                    className={`shrink-0 text-center px-4 py-2 rounded-lg text-xs font-semibold transition-all ${action.priority ? "bg-brand text-white hover:bg-brand-700 shadow-md" : "bg-white border border-gray-200 text-ink hover:bg-gray-50"}`}
                  >
                    {action.label}
                  </Link>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}