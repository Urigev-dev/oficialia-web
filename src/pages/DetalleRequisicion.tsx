// FILE: src/pages/DetalleRequisicion.tsx
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import type { Linea, EstadoRequisicion } from "../hooks/useRequisiciones";
import { useRequisiciones } from "../hooks/useRequisiciones";
import { useSession } from "../hooks/useSession";
import { useNotificaciones } from "../hooks/useNotificaciones";

function estadoLabel(estado: string) {
  const map: Record<string, string> = {
    borrador: "Borrador",
    en_revision: "En Revisión",
    cotizacion: "En Cotización",
    suficiencia: "Suficiencia Presupuestal",
    autorizada: "Autorizada",
    material_entregado: "Finalizada",
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

  useEffect(() => {
    if (req?.revisionNotas) setNotas(req.revisionNotas);
    if (req?.lineas) {
      setLineasTrabajo(
        req.lineas.map((l) => ({
          ...l,
          cantidadAutorizada: l.cantidadAutorizada ?? l.cantidad,
          unidadAutorizada: l.unidadAutorizada ?? l.unidad,
          observacionRevision: l.observacionRevision ?? "",
          estadoLinea: l.estadoLinea ?? "pendiente",
        }))
      );
    }
  }, [req]);

  if (!req) return <div className="p-8 text-center text-gray-500">Requisición no encontrada.</div>;

  const isGestor = role === "revision" || role === "admin";
  const canReview = isGestor && req.estado === "en_revision";

  const handleCellChange = (lineaId: string, campo: keyof Linea, valor: string | number) => {
    setLineasTrabajo((prev) =>
      prev.map((l) => {
        if (l.id !== lineaId) return l;
        return { ...l, [campo]: valor };
      })
    );
  };

  const guardarRevisionLineas = () => {
    const lineasFinales = lineasTrabajo.map((l) => {
        const cantAut = l.cantidadAutorizada ?? 0;
        return {
            ...l,
            estadoLinea: cantAut > 0 ? "autorizada" : "rechazada",
            cantidadAutorizada: cantAut
        } as Linea;
    });

    actualizarLineas(req.id, lineasFinales);
    
    const huboCambios = lineasFinales.some(
        l => l.observacionRevision || (l.cantidadAutorizada !== l.cantidad)
    );
    
    if (huboCambios) {
        agregarNotificacion({
            reqId: req.id,
            folio: req.folio,
            mensaje: "Se han realizado ajustes u observaciones a tus partidas.",
            tipo: "linea",
            targetRole: "solicitud"
        });
    }
    window.alert("Cambios guardados correctamente.");
  };

  const handleDecision = (nuevoEstado: EstadoRequisicion) => {
    let confirmMsg = `¿Cambiar estado a: ${estadoLabel(nuevoEstado)}?`;
    
    // Mensajes de confirmación específicos para regresar
    if (req.estado === 'cotizacion' && nuevoEstado === 'en_revision') confirmMsg = "¿Regresar a Revisión? (Se notificará al área técnica)";
    if (req.estado === 'suficiencia' && nuevoEstado === 'cotizacion') confirmMsg = "¿Regresar a Cotización? (Por ajuste de precios o proveedores)";
    if (req.estado === 'autorizada' && nuevoEstado === 'suficiencia') confirmMsg = "¿Regresar a Suficiencia? (Cancelando autorización de compra)";

    if (!window.confirm(confirmMsg)) return;
    
    const revisorData = user ? { uid: user.uid, email: user.email } : { uid: "sys", email: "sistema" };

    actualizarEstado(req.id, nuevoEstado, {
      revisionNotas: notas,
      revisadaPor: revisorData,
    });

    let msg = `Nuevo estado: ${estadoLabel(nuevoEstado)}`;
    if(nuevoEstado === 'autorizada') msg = "✅ TU SOLICITUD FUE AUTORIZADA. Procede a imprimir y firmar el formato.";
    
    agregarNotificacion({
      reqId: req.id,
      folio: req.folio,
      mensaje: msg,
      tipo: "estado",
      targetRole: "solicitud"
    });

    navigate("/revision/requisiciones");
  };

  return (
    <div className="space-y-8 pb-24 font-sans text-gray-800">
      {/* HEADER */}
      <header className="flex items-center justify-between border-b border-gray-200 pb-4">
        <div>
           <div className="flex items-center gap-3">
             <h2 className="text-2xl font-bold text-gray-800">Gestión de Requisición</h2>
             <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border ${
                 req.estado === 'en_revision' ? 'bg-amber-100 text-amber-800 border-amber-200' :
                 req.estado === 'autorizada' ? 'bg-green-100 text-green-800 border-green-200' :
                 'bg-blue-50 text-blue-800 border-blue-200'
             }`}>
                {estadoLabel(req.estado)}
             </span>
           </div>
           <p className="text-sm text-gray-500 mt-1">Folio: <span className="font-mono font-medium text-black">{req.folio}</span></p>
        </div>
        <button onClick={() => navigate(-1)} className="text-sm font-medium text-gray-500 hover:text-black hover:underline transition-colors">
            &larr; Volver al listado
        </button>
      </header>

      {/* INFO CARD */}
      <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 grid md:grid-cols-2 gap-6 text-sm">
        <div>
            <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Órgano Requirente</label>
            <div className="font-medium text-lg text-gray-900">{req.organoRequirente}</div>
        </div>
        <div>
            <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Área Solicitante</label>
            <div className="font-medium text-gray-700">{req.direccion}</div>
        </div>
        <div>
            <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Responsable</label>
            <div className="text-gray-700">{req.responsableNombre}</div>
            <div className="text-xs text-gray-500 mt-0.5">Tel: {req.responsableTelefono}</div>
        </div>
        <div>
            <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Categoría</label>
            <div className="text-gray-700">{req.tipoMaterial} / {req.subTipoMaterial}</div>
        </div>
        <div className="md:col-span-2 bg-gray-50 p-4 rounded border border-gray-100">
            <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Justificación</label>
            <p className="text-gray-800 italic leading-relaxed">{req.justificacion}</p>
        </div>
      </section>

      {/* TABLA DE REVISIÓN */}
      <section className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
         <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
            <h3 className="font-bold text-gray-700 text-sm uppercase tracking-wide">Detalle de Partidas</h3>
            {canReview && <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-1 rounded font-bold">EDICIÓN HABILITADA</span>}
         </div>
         
         <table className="w-full text-sm text-left">
            <thead className="bg-white text-gray-500 font-semibold border-b border-gray-200 text-xs uppercase">
            <tr>
                <th className="px-6 py-3 w-32">Solicitado</th>
                <th className="px-6 py-3">Descripción</th>
                <th className="px-6 py-3 w-40 text-center">Autorizado</th>
                <th className="px-6 py-3 w-1/3">Observaciones</th>
            </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
            {lineasTrabajo.map((l) => {
                const isRejected = (l.cantidadAutorizada ?? l.cantidad) === 0;
                return (
                    <tr key={l.id} className={`group transition-colors ${isRejected ? "bg-red-50" : "hover:bg-gray-50"}`}>
                        <td className="px-6 py-4 align-top font-medium text-gray-500">
                            {l.cantidad} <span className="text-xs">{l.unidad}</span>
                        </td>
                        <td className="px-6 py-4 align-top">
                            <div className="font-bold text-gray-800">{l.concepto}</div>
                            <div className="text-xs text-gray-500 mt-1">{l.descripcion}</div>
                        </td>
                        <td className="px-6 py-4 align-top text-center">
                            {canReview ? (
                                <input 
                                    type="number" min="0"
                                    className={`w-20 p-2 text-center font-bold border rounded-md outline-none focus:ring-2 transition-all ${isRejected ? 'border-red-300 text-red-600 bg-white ring-red-200' : 'border-gray-300 text-green-700 focus:ring-green-500'}`}
                                    value={l.cantidadAutorizada}
                                    onChange={(e) => handleCellChange(l.id, "cantidadAutorizada", Number(e.target.value))}
                                />
                            ) : (
                                <div className={`font-bold ${isRejected ? 'text-red-600' : 'text-green-700'}`}>
                                    {l.cantidadAutorizada}
                                </div>
                            )}
                        </td>
                        <td className="px-6 py-4 align-top">
                            {canReview ? (
                                <input 
                                    type="text" 
                                    className="w-full p-2 border border-gray-300 rounded-md text-xs focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                                    placeholder="Agregar nota..."
                                    value={l.observacionRevision}
                                    onChange={(e) => handleCellChange(l.id, "observacionRevision", e.target.value)}
                                />
                            ) : (
                                <span className="text-gray-500 italic text-xs">{l.observacionRevision || "—"}</span>
                            )}
                        </td>
                    </tr>
                );
            })}
            </tbody>
         </table>

         {canReview && (
            <div className="p-4 bg-gray-50 border-t border-gray-200 flex justify-end">
               <button onClick={guardarRevisionLineas} className="flex items-center gap-2 bg-slate-800 text-white px-5 py-2 rounded-md font-semibold text-xs shadow-md hover:bg-black transition-all">
                  💾 Guardar Cambios
               </button>
            </div>
         )}
      </section>

      {/* FLUJO DE ESTADOS (ACCIONES) */}
      {isGestor && (
         <section className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-[0_-5px_20px_rgba(0,0,0,0.1)] z-20 md:pl-72 flex justify-end gap-3 flex-wrap items-center">
            
            <div className="mr-auto text-xs font-bold text-gray-400 uppercase tracking-wider hidden sm:block">
                Acciones de Flujo:
            </div>

            {/* ESTADO: EN REVISIÓN */}
            {req.estado === 'en_revision' && (
                <>
                    <button onClick={() => handleDecision("rechazada")} className="px-5 py-2.5 bg-rose-600 text-white rounded-md text-sm font-bold shadow-sm hover:bg-rose-700 transition-colors">
                        ⛔ Rechazar
                    </button>
                    <button onClick={() => handleDecision("borrador")} className="px-5 py-2.5 bg-amber-500 text-white rounded-md text-sm font-bold shadow-sm hover:bg-amber-600 transition-colors">
                        ↩️ Devolver
                    </button>
                    <button onClick={() => handleDecision("cotizacion")} className="px-6 py-2.5 bg-indigo-600 text-white rounded-md text-sm font-bold shadow-md hover:bg-indigo-700 transition-colors">
                        ✅ Validar y Cotizar
                    </button>
                </>
            )}

            {/* ESTADO: COTIZACIÓN */}
            {req.estado === 'cotizacion' && (
                <>
                    {/* Botón Regresar Solicitado */}
                    <button onClick={() => handleDecision("en_revision")} className="text-gray-500 hover:text-gray-800 font-semibold text-sm px-3 transition-colors mr-2">
                        « Regresar a Revisión
                    </button>
                    
                    <div className="h-8 w-px bg-gray-300 mx-2"></div>

                    <button onClick={() => window.open(`#/requisiciones/${req.id}/cotizacion-print`, '_blank')} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md text-xs font-bold hover:bg-gray-50 transition-colors">
                        🖨️ Lista Proveedores
                    </button>
                    <button onClick={() => window.open(`#/requisiciones/${req.id}/imprimir`, '_blank')} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md text-xs font-bold hover:bg-gray-50 transition-colors">
                        🖨️ Formato Interno
                    </button>
                    
                    <button onClick={() => handleDecision("suficiencia")} className="px-6 py-2.5 bg-green-600 text-white rounded-md text-sm font-bold shadow-md hover:bg-green-700 transition-colors ml-2">
                        💰 Enviar a Suficiencia
                    </button>
                </>
            )}

            {/* ESTADO: SUFICIENCIA */}
            {req.estado === 'suficiencia' && (
                <>
                    {/* Botón Regresar Solicitado */}
                    <button onClick={() => handleDecision("cotizacion")} className="text-gray-500 hover:text-gray-800 font-semibold text-sm px-3 transition-colors mr-2">
                        « Regresar a Cotización
                    </button>

                    <div className="h-8 w-px bg-gray-300 mx-2"></div>

                    <button onClick={() => window.open(`#/requisiciones/${req.id}/imprimir`, '_blank')} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md text-xs font-bold hover:bg-gray-50 transition-colors">
                        🖨️ Imprimir Requerimiento
                    </button>
                    <button onClick={() => handleDecision("autorizada")} className="px-6 py-2.5 bg-emerald-600 text-white rounded-md text-sm font-bold shadow-md hover:bg-emerald-700 transition-colors ml-2">
                        ✅ Confirmar Autorización
                    </button>
                </>
            )}

            {/* ESTADO: AUTORIZADA */}
            {req.estado === 'autorizada' && (
                <>
                    {/* Botón Regresar Solicitado */}
                    <button onClick={() => handleDecision("suficiencia")} className="text-gray-500 hover:text-gray-800 font-semibold text-sm px-3 transition-colors mr-2">
                        « Regresar a Suficiencia
                    </button>

                    <div className="h-8 w-px bg-gray-300 mx-2"></div>

                    <button onClick={() => window.open(`#/requisiciones/${req.id}/imprimir`, '_blank')} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md text-xs font-bold hover:bg-gray-50 transition-colors">
                        🖨️ Imprimir Formato Final
                    </button>
                    <button onClick={() => handleDecision("material_entregado")} className="px-6 py-2.5 bg-slate-800 text-white rounded-md text-sm font-bold shadow-md hover:bg-black transition-colors ml-2">
                        📦 Finalizar / Archivar
                    </button>
                </>
            )}

             {req.estado === 'material_entregado' && (
                <div className="px-4 py-2 bg-gray-100 text-gray-500 text-xs font-bold rounded border border-gray-200">
                    EXPEDIENTE CERRADO
                </div>
            )}
         </section>
      )}
    </div>
  );
}