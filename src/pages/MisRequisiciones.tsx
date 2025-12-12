// src/pages/MisRequisiciones.tsx
import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useRequisiciones } from "../hooks/useRequisiciones";
import { useSession } from "../hooks/useSession";

function estadoLabel(estado: string) {
  const map: Record<string, string> = {
    borrador: "Borrador",
    en_revision: "En revisión",
    cotizacion: "Cotización",
    suficiencia: "Suficiencia presupuestal",
    autorizada: "Autorizada (Lista para firma)",
    material_entregado: "Entregada / Finalizada",
    finalizada: "Finalizada",
    rechazada: "Rechazada",
  };
  return map[estado] || estado;
}

type TabType = "borradores" | "tramite" | "historial";

export default function MisRequisiciones() {
  const { requisiciones, eliminarBorrador } = useRequisiciones();
  const { user } = useSession();
  
  const [tab, setTab] = useState<TabType>("tramite"); // Iniciamos en 'tramite' que es lo más común
  const [busqueda, setBusqueda] = useState("");

  const lista = useMemo(() => {
    if (!user) return [];
    
    // 1. Filtrar las propias
    let data = requisiciones.filter((r) => r.creadoPor?.uid === user.uid);

    // 2. Filtrar por Pestaña
    data = data.filter(r => {
        if (tab === "borradores") {
            return r.estado === "borrador";
        }
        if (tab === "tramite") {
            // Incluye todo el ciclo activo hasta antes de la entrega física
            return ["en_revision", "cotizacion", "suficiencia", "autorizada"].includes(r.estado);
        }
        if (tab === "historial") {
            return ["material_entregado", "finalizada", "rechazada"].includes(r.estado);
        }
        return false;
    });

    // 3. Búsqueda
    if (busqueda.trim()) {
        const lower = busqueda.toLowerCase();
        data = data.filter(r => 
            r.folio.toLowerCase().includes(lower) || 
            r.tipoMaterial.toLowerCase().includes(lower)
        );
    }

    // 4. Ordenar por fecha desc (lo más nuevo arriba)
    return data.sort((a, b) => b.fecha.localeCompare(a.fecha));
  }, [requisiciones, user, busqueda, tab]);

  // Contadores para badges
  const getCount = (tipo: TabType) => {
      if (!user) return 0;
      const propias = requisiciones.filter((r) => r.creadoPor?.uid === user.uid);
      if (tipo === "borradores") return propias.filter(r => r.estado === "borrador").length;
      if (tipo === "tramite") return propias.filter(r => ["en_revision", "cotizacion", "suficiencia", "autorizada"].includes(r.estado)).length;
      if (tipo === "historial") return propias.filter(r => ["material_entregado", "finalizada", "rechazada"].includes(r.estado)).length;
      return 0;
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
            <h2 className="text-xl font-bold text-ink">Mis requisiciones</h2>
            <p className="text-sm text-ink/70">
            Seguimiento de tus solicitudes de material.
            </p>
        </div>
        
        {/* BUSCADOR */}
        <div className="relative w-full md:w-64">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
            <input 
                type="text" 
                placeholder="Buscar por folio..." 
                className="w-full pl-9 pr-4 py-2 rounded-lg border border-border text-sm focus:ring-2 focus:ring-brand focus:outline-none"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
            />
        </div>
      </header>

      {/* PESTAÑAS */}
      <div className="flex border-b border-border overflow-x-auto">
        <button
          onClick={() => setTab("borradores")}
          className={`px-6 py-3 text-xs font-bold uppercase tracking-wide border-b-2 transition-colors flex items-center gap-2 shrink-0 ${
            tab === "borradores" ? "border-gray-500 text-gray-700" : "border-transparent text-gray-400 hover:text-gray-600"
          }`}
        >
          <span>✏️ Borradores</span>
          {getCount("borradores") > 0 && <span className="bg-gray-200 text-gray-700 px-2 rounded-full text-[10px]">{getCount("borradores")}</span>}
        </button>

        <button
          onClick={() => setTab("tramite")}
          className={`px-6 py-3 text-xs font-bold uppercase tracking-wide border-b-2 transition-colors flex items-center gap-2 shrink-0 ${
            tab === "tramite" ? "border-blue-600 text-blue-700" : "border-transparent text-gray-400 hover:text-gray-600"
          }`}
        >
          <span>🔄 En Trámite</span>
          {getCount("tramite") > 0 && <span className="bg-blue-100 text-blue-700 px-2 rounded-full text-[10px]">{getCount("tramite")}</span>}
        </button>

        <button
          onClick={() => setTab("historial")}
          className={`px-6 py-3 text-xs font-bold uppercase tracking-wide border-b-2 transition-colors flex items-center gap-2 shrink-0 ${
            tab === "historial" ? "border-green-600 text-green-700" : "border-transparent text-gray-400 hover:text-gray-600"
          }`}
        >
          <span>📂 Historial</span>
          {getCount("historial") > 0 && <span className="bg-green-100 text-green-700 px-2 rounded-full text-[10px]">{getCount("historial")}</span>}
        </button>
      </div>

      {lista.length === 0 ? (
        <div className="bg-surface rounded-[--radius-xl] shadow-[--shadow-card] p-12 text-center text-sm text-ink/70">
          <div className="text-4xl mb-3 opacity-30">📭</div>
          {busqueda ? "No se encontraron resultados." : 
           tab === 'borradores' ? "No tienes borradores pendientes." :
           tab === 'tramite' ? "No tienes solicitudes en trámite actualmente." :
           "No tienes historial de solicitudes finalizadas."}
        </div>
      ) : (
        <section className="bg-surface rounded-[--radius-xl] shadow-[--shadow-card] overflow-hidden">
          <table className="w-full text-xs">
            <thead className="bg-bg border-b border-border">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Folio</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Fecha</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Tipo</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Estado</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Avisos</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {lista.map((r) => {
                const tieneObs = !!r.revisionNotas || r.lineas?.some((l) => l.observacionRevision);
                return (
                  <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-mono font-medium">{r.folio}</td>
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{r.fecha}</td>
                    <td className="px-4 py-3 capitalize">{r.tipoMaterial}</td>
                    <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-[10px] font-bold border ${
                             r.estado === 'borrador' ? 'bg-gray-100 text-gray-600 border-gray-200' :
                             r.estado === 'en_revision' ? 'bg-amber-50 text-amber-800 border-amber-200' :
                             r.estado === 'cotizacion' ? 'bg-blue-50 text-blue-800 border-blue-200' :
                             r.estado === 'suficiencia' ? 'bg-yellow-50 text-yellow-800 border-yellow-200' :
                             r.estado === 'autorizada' ? 'bg-green-50 text-green-800 border-green-200' :
                             r.estado === 'rechazada' ? 'bg-red-50 text-red-800 border-red-200' :
                             'bg-gray-200 text-gray-800 border-gray-300'
                        }`}>
                            {estadoLabel(r.estado)}
                        </span>
                    </td>
                    <td className="px-4 py-3">
                      {tieneObs && r.estado === 'borrador' && (
                        <span className="inline-flex items-center gap-1 bg-red-100 text-red-700 px-2 py-0.5 rounded text-[10px] font-bold">
                          ⚠️ Corregir
                        </span>
                      )}
                      {tieneObs && r.estado !== 'borrador' && r.estado !== 'autorizada' && r.estado !== 'material_entregado' && (
                         <span className="text-[10px] text-amber-600 font-medium">Observaciones activas</span>
                      )}
                    </td>
                    <td className="px-4 py-3 space-x-3">
                      {/* Lógica de botones según pestaña/estado */}
                      
                      {/* 1. Ver detalle (Siempre disponible) */}
                      <Link to={`/requisiciones/${r.id}`} className="text-brand hover:underline font-medium">
                        Ver detalle
                      </Link>

                      {/* 2. Editar/Borrar (Solo borradores) */}
                      {r.estado === "borrador" && (
                        <>
                          <Link to={`/nueva?id=${r.id}`} className="text-blue-600 hover:underline">
                            Editar
                          </Link>
                          <button
                            type="button"
                            onClick={() => {
                              if(window.confirm("¿Eliminar borrador permanentemente?")) eliminarBorrador(r.id);
                            }}
                            className="text-red-600 hover:underline"
                          >
                            Eliminar
                          </button>
                        </>
                      )}

                      {/* 3. Imprimir (Solo Autorizada o Entregada) */}
                      {(r.estado === "autorizada" || r.estado === "material_entregado") && (
                        <Link to={`/requisiciones/${r.id}/imprimir`} target="_blank" className="text-green-700 hover:underline flex items-center gap-1 inline-flex font-semibold">
                          🖨️ Formato
                        </Link>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>
      )}
    </div>
  );
}