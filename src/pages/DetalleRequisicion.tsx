// src/pages/DetalleRequisicion.tsx
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import type { Linea, EstadoRequisicion } from "../hooks/useRequisiciones";
import { useRequisiciones } from "../hooks/useRequisiciones";
import { useSession } from "../hooks/useSession";
import { useNotificaciones } from "../hooks/useNotificaciones";

function estadoLabel(estado: string) {
  const map: Record<string, string> = {
    borrador: "Borrador",
    en_revision: "En revisión",
    cotizacion: "Cotización de material",
    suficiencia: "Suficiencia presupuestal",
    autorizada: "Autorizada (Por comprar/entregar)",
    material_entregado: "Finalizada / Entregada",
    finalizada: "Finalizada",
    rechazada: "Rechazada",
  };
  return map[estado] || estado;
}

export default function DetalleRequisicion() {
  const { id } = useParams<{ id: string }>();
  const { requisiciones, actualizarEstado, actualizarLineas } = useRequisiciones();
  const { user, role } = useSession();
  const { agregarNotificacion } = useNotificaciones();
  const navigate = useNavigate();

  const req = requisiciones.find((r) => r.id === id);

  const [notas, setNotas] = useState("");
  const [lineasTrabajo, setLineasTrabajo] = useState<Linea[]>([]);
  const [filasEditando, setFilasEditando] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (req?.revisionNotas) setNotas(req.revisionNotas);
    if (req?.lineas) {
      setLineasTrabajo(
        req.lineas.map((l) => ({
          estadoLinea: l.estadoLinea ?? "pendiente",
          ...l,
        }))
      );
      
      const mapaEdicion: Record<string, boolean> = {};
      req.lineas.forEach((l) => {
        if (l.observacionRevision || (l.cantidadAutorizada !== undefined && l.cantidadAutorizada !== l.cantidad)) {
          mapaEdicion[l.id] = true;
        }
      });
      setFilasEditando(mapaEdicion);
    }
  }, [req]);

  if (!req) return <div className="p-4">Requisición no encontrada.</div>;

  const canReview = (role === "revision" || role === "admin") && (req.estado === "en_revision");
  const isGestor = role === "revision" || role === "admin";

  const handleToggleEdicion = (lineaId: string, activo: boolean) => {
    setFilasEditando((prev) => ({ ...prev, [lineaId]: activo }));
    
    if (!activo) {
      setLineasTrabajo((prev) =>
        prev.map((l) =>
          l.id === lineaId
            ? {
                ...l,
                cantidadAutorizada: undefined,
                unidadAutorizada: undefined,
                observacionRevision: "",
                estadoLinea: "autorizada", 
              }
            : l
        )
      );
    }
  };

  const actualizarCampoLinea = (lineaId: string, campo: keyof Linea, valor: string | number) => {
    setLineasTrabajo((prev) =>
      prev.map((l) => (l.id === lineaId ? { ...l, [campo]: valor } : l))
    );
  };

  const guardarRevisionLineas = () => {
    const lineasFinales = lineasTrabajo.map(l => {
      if (!filasEditando[l.id]) {
        return {
           ...l,
           cantidadAutorizada: undefined,
           unidadAutorizada: undefined,
           observacionRevision: "",
           estadoLinea: "autorizada" as const 
        };
      }
      return l;
    });

    actualizarLineas(req.id, lineasFinales);
    
    const huboCambios = lineasFinales.some(l => l.observacionRevision || l.cantidadAutorizada);
    if (huboCambios) {
        // ENVIAR SOLO AL SOLICITANTE
        agregarNotificacion({
            reqId: req.id,
            folio: req.folio,
            mensaje: "Adquisiciones realizó observaciones en tu requisición.",
            tipo: "linea",
            targetRole: "solicitud" // <--- CLAVE
        });
    }
    window.alert("Cambios guardados correctamente.");
  };

  const handleDecision = (nuevoEstado: EstadoRequisicion) => {
    let confirmMsg = `¿Cambiar estado a: ${estadoLabel(nuevoEstado)}?`;
    
    if (nuevoEstado === 'suficiencia') confirmMsg = "Se enviará a Tesorería para validar suficiencia presupuestal. ¿Continuar?";
    if (nuevoEstado === 'autorizada') confirmMsg = "¡Atención! Al autorizar, confirmas que Tesorería aprobó el presupuesto. El solicitante podrá imprimir el formato.";
    if (nuevoEstado === 'material_entregado') confirmMsg = "Se marcará como finalizada/entregada. Esto cierra el ciclo.";

    if (!window.confirm(confirmMsg)) return;
    
    actualizarEstado(req.id, nuevoEstado, {
      revisionNotas: notas,
      revisadaPor: { uid: user?.uid || "sys", email: user?.email || "sys" },
    });

    let msg = `Nuevo estado: ${estadoLabel(nuevoEstado)}`;
    if(nuevoEstado === 'autorizada') msg = "¡Tu requisición fue AUTORIZADA! Ya puedes imprimir el formato.";
    if(nuevoEstado === 'material_entregado') msg = "Tu material ha sido marcado como entregado. Proceso finalizado.";
    if(nuevoEstado === 'borrador') msg = "Tu requisición fue devuelta para correcciones.";

    // ENVIAR SOLO AL SOLICITANTE
    agregarNotificacion({
      reqId: req.id,
      folio: req.folio,
      mensaje: msg,
      tipo: "estado",
      targetRole: "solicitud" // <--- CLAVE
    });

    navigate("/revision/requisiciones");
  };

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-start">
        <div>
           <h2 className="text-xl font-bold text-ink">Gestión de Requisición</h2>
           <p className="text-sm text-ink/70">Folio: <strong>{req.folio}</strong> · {estadoLabel(req.estado)}</p>
        </div>
        <button onClick={() => navigate(-1)} className="text-xs border px-3 py-1 rounded-full hover:bg-gray-100">Volver</button>
      </header>

      {/* DATOS GENERALES */}
      <section className="bg-surface p-4 rounded-[--radius-xl] shadow-sm text-sm border border-border">
        <h3 className="font-bold text-ink mb-3 border-b pb-2">Información del Solicitante</h3>
        <div className="grid md:grid-cols-2 gap-y-4 gap-x-8">
            <div>
                <div className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Secretaría / Instituto</div>
                <div className="text-ink font-medium">{req.secretariaNombre}</div>
            </div>
            <div>
                <div className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Dirección / Área</div>
                <div className="text-ink font-medium">{req.direccion}</div>
            </div>
            <div>
                <div className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Responsable</div>
                <div className="text-ink">{req.responsableNombre}</div>
            </div>
            <div>
                <div className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Teléfono de Contacto</div>
                <div className="text-ink font-mono text-brand">{req.responsableTelefono}</div>
            </div>
            <div className="md:col-span-2 bg-gray-50 p-3 rounded border border-gray-100 mt-1">
                <div className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mb-1">Justificación / Actividad</div>
                <div className="text-ink whitespace-pre-wrap">{req.justificacion}</div>
            </div>
        </div>
      </section>

      {/* TABLA DE PARTIDAS */}
      <section className="bg-surface p-4 rounded-[--radius-xl] shadow-[--shadow-card]">
         <h3 className="font-bold text-ink mb-4 text-sm">Detalle de partidas</h3>
         <table className="w-full text-xs">
            <thead className="bg-bg text-ink/70">
               <tr>
                  <th className="px-2 py-2 text-left">Solicitado</th>
                  <th className="px-2 py-2 text-left w-1/2">Concepto</th>
                  {canReview && <th className="px-2 py-2 text-left w-1/3">Acción de Revisión</th>}
               </tr>
            </thead>
            <tbody>
               {lineasTrabajo.map((l) => {
                  const isEditing = filasEditando[l.id];
                  return (
                     <tr key={l.id} className={`border-t ${isEditing ? 'bg-amber-50/60' : ''}`}>
                        <td className="px-2 py-3 align-top font-medium">
                           {l.cantidad} {l.unidad}
                        </td>
                        <td className="px-2 py-3 align-top">
                           <div className="font-semibold text-ink">{l.concepto}</div>
                           <div className="text-ink/60">{l.descripcion}</div>
                           {!canReview && l.cantidadAutorizada && (
                               <div className="mt-1 text-green-700 font-bold">
                                   Autorizado: {l.cantidadAutorizada} {l.unidadAutorizada || l.unidad}
                               </div>
                           )}
                           {l.observacionRevision && !isEditing && (
                             <div className="mt-1 text-red-600 italic border-l-2 border-red-300 pl-2">
                                Obs: {l.observacionRevision}
                             </div>
                           )}
                        </td>
                        
                        {canReview && (
                           <td className="px-2 py-3 align-top">
                              <label className={`
                                flex items-center gap-3 p-3 rounded-lg cursor-pointer border transition-all mb-2 select-none
                                ${isEditing ? 'bg-white border-red-200 ring-1 ring-red-100' : 'bg-gray-50 border-gray-200 hover:border-gray-300'}
                              `}>
                                 <input 
                                    type="checkbox" 
                                    className="w-4 h-4 accent-brand"
                                    checked={!!isEditing}
                                    onChange={(e) => handleToggleEdicion(l.id, e.target.checked)}
                                 />
                                 <div className="flex flex-col">
                                    <span className={`text-xs font-bold ${isEditing ? 'text-red-600' : 'text-gray-600'}`}>
                                        {isEditing ? "✕ Cancelar (No modificar)" : "✏️ Realizar observaciones / Ajustar"}
                                    </span>
                                 </div>
                              </label>

                              {isEditing && (
                                 <div className="bg-white border border-amber-200 rounded-lg p-3 space-y-3 animate-in fade-in zoom-in-95 duration-200 shadow-sm">
                                    <div className="grid grid-cols-2 gap-2">
                                       <div>
                                          <label className="block text-[9px] text-gray-500 uppercase mb-1 font-bold">Cant. Autorizada</label>
                                          <input 
                                             type="number"
                                             className="w-full border rounded px-2 py-1"
                                             placeholder={l.cantidad.toString()}
                                             value={l.cantidadAutorizada ?? ""}
                                             onChange={(e) => actualizarCampoLinea(l.id, "cantidadAutorizada", e.target.value)}
                                          />
                                       </div>
                                       <div>
                                          <label className="block text-[9px] text-gray-500 uppercase mb-1 font-bold">Unidad</label>
                                          <select 
                                             className="w-full border rounded px-2 py-1"
                                             value={l.unidadAutorizada ?? l.unidad}
                                             onChange={(e) => actualizarCampoLinea(l.id, "unidadAutorizada", e.target.value)}
                                          >
                                             <option value="pieza">pieza</option>
                                             <option value="par">par</option>
                                             <option value="caja">caja</option>
                                             <option value="juego">juego</option>
                                             <option value="litro">litro</option>
                                             <option value="metro">metro</option>
                                          </select>
                                       </div>
                                    </div>
                                    <div>
                                       <label className="block text-[9px] text-gray-500 uppercase mb-1 font-bold">Observación</label>
                                       <textarea 
                                          className="w-full border border-gray-300 rounded px-2 py-1 min-h-[50px] text-xs"
                                          placeholder="Motivo del ajuste..."
                                          value={l.observacionRevision ?? ""}
                                          onChange={(e) => actualizarCampoLinea(l.id, "observacionRevision", e.target.value)}
                                       />
                                    </div>
                                 </div>
                              )}
                           </td>
                        )}
                     </tr>
                  );
               })}
            </tbody>
         </table>
         {canReview && (
            <div className="mt-4 flex justify-end">
               <button onClick={guardarRevisionLineas} className="text-xs bg-white border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50 font-medium shadow-sm">
                  💾 Guardar cambios por partida
               </button>
            </div>
         )}
      </section>

      {/* FLUJO */}
      {isGestor && (
         <section className="bg-surface p-4 rounded-[--radius-xl] shadow-[--shadow-card] space-y-4 border-t-4 border-brand">
            <h3 className="font-bold text-ink text-sm">Flujo del Proceso</h3>

            {req.estado === 'en_revision' && (
                <div className="flex gap-3 justify-end flex-wrap">
                    <button onClick={() => handleDecision("borrador")} className="btn-secondary text-amber-900 border-amber-300 hover:bg-amber-50 px-4 py-2 rounded text-xs">↩️ Devolver a solicitante</button>
                    <button onClick={() => handleDecision("rechazada")} className="btn-secondary text-red-800 border-red-300 hover:bg-red-50 px-4 py-2 rounded text-xs">⛔ Rechazar solicitud</button>
                    <button onClick={() => handleDecision("cotizacion")} className="bg-brand text-white px-4 py-2 rounded text-xs shadow hover:bg-brand-700">✅ Validar y Cotizar</button>
                </div>
            )}

            {req.estado === 'cotizacion' && (
                <div className="space-y-3">
                    <div className="p-3 bg-blue-50 text-blue-800 text-xs rounded border border-blue-100">
                        <strong>Estado:</strong> Solicitando cotizaciones a proveedores.
                    </div>
                    <div className="flex gap-3 justify-end flex-wrap">
                        <button onClick={() => window.open(`/requisiciones/${req.id}/cotizacion-print`, '_blank')} className="bg-indigo-600 text-white px-4 py-2 rounded text-xs shadow hover:bg-indigo-700">🖨️ Lista para Proveedores</button>
                        <button onClick={() => window.open(`/requisiciones/${req.id}/imprimir`, '_blank')} className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded text-xs hover:bg-gray-50">🖨️ Imprimir Formato Interno</button>
                        <div className="w-full border-t my-2"></div>
                        <button onClick={() => handleDecision("suficiencia")} className="bg-green-600 text-white px-4 py-2 rounded text-xs shadow hover:bg-green-700">💰 Enviar a Suficiencia Presupuestal</button>
                    </div>
                </div>
            )}

            {req.estado === 'suficiencia' && (
                <div className="space-y-3">
                    <div className="p-3 bg-yellow-50 text-yellow-800 text-xs rounded border border-yellow-100">
                        <strong>Estado:</strong> En espera de autorización presupuestal (Tesorería).
                    </div>
                    <div className="flex gap-3 justify-end flex-wrap">
                        <button onClick={() => window.open(`/requisiciones/${req.id}/imprimir`, '_blank')} className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded text-xs hover:bg-gray-50">🖨️ Imprimir Requerimiento</button>
                        <button onClick={() => handleDecision("autorizada")} className="bg-brand text-white px-4 py-2 rounded text-xs shadow hover:bg-brand-700">✅ Confirmar Autorización (Tesorería)</button>
                    </div>
                </div>
            )}

            {req.estado === 'autorizada' && (
                <div className="space-y-3">
                    <div className="p-3 bg-green-50 text-green-800 text-xs rounded border border-green-100">
                        <strong>Estado:</strong> Autorizada. En proceso de compra o entrega.
                    </div>
                    <div className="flex gap-3 justify-end flex-wrap">
                        <button onClick={() => window.open(`/requisiciones/${req.id}/imprimir`, '_blank')} className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded text-xs hover:bg-gray-50">🖨️ Imprimir Formato Final</button>
                        <button onClick={() => handleDecision("material_entregado")} className="bg-gray-800 text-white px-4 py-2 rounded text-xs shadow hover:bg-gray-900">📦 Material Entregado / Finalizar</button>
                    </div>
                </div>
            )}

             {req.estado === 'material_entregado' && (
                <div className="p-3 bg-gray-100 text-gray-600 text-xs rounded border border-gray-200 text-center">
                    Esta requisición ha sido cerrada y archivada.
                </div>
            )}
         </section>
      )}
    </div>
  );
}