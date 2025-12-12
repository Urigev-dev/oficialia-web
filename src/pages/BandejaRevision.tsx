// src/pages/BandejaRevision.tsx
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useRequisiciones } from "../hooks/useRequisiciones";

type TabType = "revision" | "tramite" | "entrega" | "historial";

export default function BandejaRevision() {
  const { requisiciones } = useRequisiciones();
  const navigate = useNavigate();
  
  const [tab, setTab] = useState<TabType>("revision");
  const [busqueda, setBusqueda] = useState("");

  // Lógica de filtrado: Pestaña + Buscador + Ordenamiento
  const lista = useMemo(() => {
    // 1. Filtrar por Pestaña
    let filtradas = requisiciones.filter((r) => {
        if (tab === "revision") return r.estado === "en_revision";
        if (tab === "tramite") return r.estado === "cotizacion" || r.estado === "suficiencia";
        if (tab === "entrega") return r.estado === "autorizada";
        if (tab === "historial") return r.estado === "material_entregado" || r.estado === "finalizada" || r.estado === "rechazada";
        return false;
    });

    // 2. Filtrar por Buscador (Folio o Secretaría)
    if (busqueda.trim()) {
        const lower = busqueda.toLowerCase();
        filtradas = filtradas.filter(r => 
            r.folio.toLowerCase().includes(lower) || 
            r.secretariaNombre.toLowerCase().includes(lower)
        );
    }

    // 3. Ordenar por Fecha (Más reciente arriba)
    return filtradas.sort((a, b) => b.fecha.localeCompare(a.fecha));
  }, [requisiciones, tab, busqueda]);

  // Contadores (Badges) para las pestañas
  const cRevision = requisiciones.filter(r => r.estado === "en_revision").length;
  const cTramite = requisiciones.filter(r => r.estado === "cotizacion" || r.estado === "suficiencia").length;
  const cEntrega = requisiciones.filter(r => r.estado === "autorizada").length;

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
            <h2 className="text-xl font-bold text-ink">Gestión de Adquisiciones</h2>
            <p className="text-sm text-ink/70">
            Administración de flujo de compras y archivo.
            </p>
        </div>
        
        {/* BUSCADOR */}
        <div className="relative w-full md:w-64">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
            <input 
                type="text" 
                placeholder="Buscar folio o área..." 
                className="w-full pl-9 pr-4 py-2 rounded-lg border border-border text-sm focus:ring-2 focus:ring-brand focus:outline-none"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
            />
        </div>
      </header>

      {/* PESTAÑAS */}
      <div className="flex border-b border-border overflow-x-auto">
        <button
          onClick={() => setTab("revision")}
          className={`px-4 py-3 text-xs font-bold uppercase tracking-wide border-b-2 transition-colors flex items-center gap-2 shrink-0 ${
            tab === "revision" ? "border-brand text-brand" : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          <span>Por Revisar</span>
          {cRevision > 0 && <span className="bg-red-100 text-red-700 px-2 rounded-full text-[10px]">{cRevision}</span>}
        </button>
        
        <button
          onClick={() => setTab("tramite")}
          className={`px-4 py-3 text-xs font-bold uppercase tracking-wide border-b-2 transition-colors flex items-center gap-2 shrink-0 ${
            tab === "tramite" ? "border-blue-600 text-blue-700" : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          <span>En Trámite</span>
          {cTramite > 0 && <span className="bg-blue-100 text-blue-700 px-2 rounded-full text-[10px]">{cTramite}</span>}
        </button>

        <button
          onClick={() => setTab("entrega")}
          className={`px-4 py-3 text-xs font-bold uppercase tracking-wide border-b-2 transition-colors flex items-center gap-2 shrink-0 ${
            tab === "entrega" ? "border-green-600 text-green-700" : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          <span>Por Entregar</span>
          {cEntrega > 0 && <span className="bg-green-100 text-green-700 px-2 rounded-full text-[10px]">{cEntrega}</span>}
        </button>

        <button
          onClick={() => setTab("historial")}
          className={`px-4 py-3 text-xs font-bold uppercase tracking-wide border-b-2 transition-colors flex items-center gap-2 shrink-0 ${
            tab === "historial" ? "border-gray-500 text-gray-700" : "border-transparent text-gray-400 hover:text-gray-600"
          }`}
        >
          <span>Historial / Archivo</span>
        </button>
      </div>

      {/* LISTADO */}
      <section className="bg-surface rounded-[--radius-xl] shadow-[--shadow-card] overflow-hidden">
          {lista.length === 0 ? (
            <div className="p-12 text-center">
                <div className="text-4xl mb-3 opacity-30">🗂️</div>
                <p className="text-gray-500 text-sm">
                    {busqueda ? "No se encontraron resultados para tu búsqueda." : "No hay requisiciones en esta bandeja."}
                </p>
            </div>
          ) : (
            <table className="w-full text-xs">
                <thead className="bg-bg border-b border-border">
                <tr>
                    <th className="px-4 py-3 text-left font-semibold text-gray-600">Folio</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-600">Fecha</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-600">Área Solicitante</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-600">Estado</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-600">Acción</th>
                </tr>
                </thead>
                <tbody className="divide-y divide-border">
                {lista.map((r) => (
                    <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-mono font-medium text-ink">{r.folio}</td>
                    <td className="px-4 py-3 text-ink/70 whitespace-nowrap">{r.fecha}</td>
                    <td className="px-4 py-3 text-ink">{r.secretariaNombre}</td>
                    <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-[10px] font-bold border ${
                            r.estado === 'en_revision' ? 'bg-amber-50 text-amber-800 border-amber-200' :
                            r.estado === 'cotizacion' ? 'bg-blue-50 text-blue-800 border-blue-200' :
                            r.estado === 'suficiencia' ? 'bg-indigo-50 text-indigo-800 border-indigo-200' :
                            r.estado === 'autorizada' ? 'bg-green-50 text-green-800 border-green-200' :
                            r.estado === 'rechazada' ? 'bg-red-50 text-red-800 border-red-200' :
                            'bg-gray-100 text-gray-600 border-gray-200'
                        }`}>
                            {r.estado.replace('_', ' ').toUpperCase()}
                        </span>
                    </td>
                    <td className="px-4 py-3">
                        <button onClick={() => navigate(`/requisiciones/${r.id}`)} className="text-brand font-semibold hover:underline">
                            {tab === 'revision' ? '🔍 Revisar' : '👁️ Ver detalles'}
                        </button>
                    </td>
                    </tr>
                ))}
                </tbody>
            </table>
          )}
      </section>
    </div>
  );
}