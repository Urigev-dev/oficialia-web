// src/pages/NuevaRequisicion.tsx
import { useEffect, useState, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  useRequisiciones,
  type Linea,
  type RequisicionFormData,
} from "../hooks/useRequisiciones";
import { useSession } from "../hooks/useSession";
import { useNotificaciones } from "../hooks/useNotificaciones";

const UNIDADES = [
  "pieza", "par", "caja", "metro", "litro", "kilogramo", "juego",
  "servicio", "paquete", "rollo", "bote",
];

function hoyISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function crearLinea(): Linea {
  return {
    id: typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `lin-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    cantidad: 1,
    unidad: "pieza",
    concepto: "",
    descripcion: "",
  };
}

const FORM_DEFAULT: RequisicionFormData = {
  fecha: hoyISO(),
  tipoMaterial: "papeleria",
  secretariaNombre: "",
  direccion: "",
  responsableNombre: "",
  responsableTelefono: "",
  justificacion: "",
  lineas: [crearLinea()],
};

export default function NuevaRequisicion() {
  const navigate = useNavigate();
  const [search] = useSearchParams();
  const { user } = useSession();
  const { agregarNotificacion } = useNotificaciones();

  const {
    requisiciones,
    crearRequisicion,
    actualizarRequisicion,
    actualizarEstado,
  } = useRequisiciones();

  const editId = search.get("id");
  const [form, setForm] = useState<RequisicionFormData>(FORM_DEFAULT);

  const reqOriginal = useMemo(
    () => (editId ? requisiciones.find((r) => r.id === editId) : null),
    [editId, requisiciones]
  );

  useEffect(() => {
    if (!reqOriginal) {
      setForm((prev) => ({
        ...prev,
        secretariaNombre: prev.secretariaNombre || "", 
      }));
      return;
    }
    setForm({
      fecha: reqOriginal.fecha,
      tipoMaterial: reqOriginal.tipoMaterial,
      secretariaNombre: reqOriginal.secretariaNombre,
      direccion: reqOriginal.direccion,
      responsableNombre: reqOriginal.responsableNombre,
      responsableTelefono: reqOriginal.responsableTelefono,
      justificacion: reqOriginal.justificacion,
      lineas: reqOriginal.lineas.map((l) => ({ ...l })),
    });
  }, [reqOriginal]);

  const onChangeCampo = (campo: keyof RequisicionFormData, valor: string) => {
    setForm((prev) => ({ ...prev, [campo]: valor }));
  };

  const onChangeLinea = (lineaId: string, campo: keyof Linea, valor: string | number) => {
    setForm((prev) => ({
      ...prev,
      lineas: prev.lineas.map((l: Linea) =>
        l.id === lineaId ? { ...l, [campo]: valor } : l
      ),
    }));
  };

  const agregarLinea = () => {
    setForm((prev) => ({
      ...prev,
      lineas: [...prev.lineas, crearLinea()],
    }));
  };

  const eliminarLinea = (lineaId: string) => {
    setForm((prev) => {
      if (prev.lineas.length === 1) return prev;
      return {
        ...prev,
        lineas: prev.lineas.filter((l: Linea) => l.id !== lineaId),
      };
    });
  };

  const validarParaEnvio = (): string | null => {
    if (!form.secretariaNombre.trim()) return "Falta la Secretaría / Instituto.";
    if (!form.direccion.trim()) return "Falta la Dirección.";
    if (!form.responsableNombre.trim()) return "Falta el Responsable.";
    if (!form.justificacion.trim()) return "Captura la justificación.";
    
    for (const l of form.lineas) {
      if (!l.concepto.trim()) return "Todas las partidas deben tener concepto.";
    }
    return null;
  };

  const handleGuardarBorrador = () => {
    if (!user) return;
    if (editId) {
      actualizarRequisicion(editId, form);
    } else {
      crearRequisicion(form, { uid: user.uid, email: user.email }, { enviar: false });
    }
    navigate("/mis-requisiciones");
  };

  const handleEnviarRevision = () => {
    if (!user) return;
    const error = validarParaEnvio();
    if (error) { window.alert(error); return; }
    
    if (!window.confirm("¿Enviar a revisión?")) return;

    if (editId) {
      actualizarRequisicion(editId, form);
      actualizarEstado(editId, "en_revision");
      agregarNotificacion({
          reqId: editId,
          folio: reqOriginal?.folio || "REQ",
          mensaje: "Requisición corregida enviada.",
          targetRole: "revision" 
      });
    } else {
      const nueva = crearRequisicion(form, { uid: user.uid, email: user.email }, { enviar: true });
      agregarNotificacion({
          reqId: nueva.id,
          folio: nueva.folio,
          mensaje: "Nueva requisición recibida.",
          targetRole: "revision"
      });
    }
    navigate("/mis-requisiciones");
  };

  const handleCancelar = () => {
    if (window.confirm("¿Salir sin guardar cambios?")) navigate("/mis-requisiciones");
  };

  const totalArticulos = form.lineas.reduce((acc, curr) => acc + (Number(curr.cantidad) || 0), 0);

  return (
    <div className="space-y-8 pb-12">
      {/* HEADER */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <h2 className="text-2xl font-bold text-ink flex items-center gap-2">
            {editId ? "✏️ Editando Requisición" : "📝 Nuevo Requerimiento"}
          </h2>
          <p className="text-sm text-ink/60 mt-1">
            {editId 
              ? `Folio: ${reqOriginal?.folio} · Ajusta los detalles solicitados.` 
              : "Complete la información para solicitar materiales o servicios."}
          </p>
        </div>
        <div className="text-right hidden md:block">
           <span className="text-xs font-bold text-brand bg-brand/10 px-3 py-1 rounded-full border border-brand/20">
              {form.lineas.length} Partida{form.lineas.length !== 1 && 's'}
           </span>
        </div>
      </header>

      {/* ALERTA DE CORRECCIONES */}
      {reqOriginal?.revisionNotas && (
        <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-lg shadow-sm animate-in fade-in slide-in-from-top-2">
          <div className="flex">
            <div className="flex-shrink-0 text-amber-500 text-xl">⚠️</div>
            <div className="ml-3">
              <h3 className="text-sm font-bold text-amber-800 uppercase tracking-wide">
                Correcciones requeridas
              </h3>
              <div className="mt-1 text-sm text-amber-900 font-medium">
                {reqOriginal.revisionNotas}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECCIÓN 1: DATOS GENERALES */}
      <section className="bg-surface rounded-2xl shadow-sm border border-border/50 p-6">
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 border-b border-gray-100 pb-2">
          1. Datos Generales
        </h3>
        
        <div className="grid md:grid-cols-12 gap-6 text-sm">
          {/* Fila 1 */}
          <div className="md:col-span-3">
            <label className="block text-xs font-bold text-ink mb-1.5">Fecha</label>
            <input
              type="date"
              value={form.fecha}
              min={hoyISO()}
              onChange={(e) => onChangeCampo("fecha", e.target.value)}
              className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-brand focus:border-brand outline-none transition-all"
            />
          </div>
          <div className="md:col-span-3">
            <label className="block text-xs font-bold text-ink mb-1.5">Tipo de Material</label>
            <select
              value={form.tipoMaterial}
              onChange={(e) => onChangeCampo("tipoMaterial", e.target.value)}
              className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-brand outline-none transition-all"
            >
              <option value="papeleria">Papelería</option>
              <option value="limpieza">Limpieza</option>
              <option value="mantenimiento">Mantenimiento</option>
              <option value="seguridad">Seguridad</option>
              <option value="otros">Otros</option>
            </select>
          </div>
          <div className="md:col-span-6">
            <label className="block text-xs font-bold text-ink mb-1.5">Secretaría / Instituto</label>
            <input
              type="text"
              value={form.secretariaNombre}
              onChange={(e) => onChangeCampo("secretariaNombre", e.target.value)}
              placeholder="Ej. Secretaría de Administración"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-brand outline-none transition-all"
            />
          </div>

          {/* Fila 2 */}
          <div className="md:col-span-4">
            <label className="block text-xs font-bold text-ink mb-1.5">Dirección / Depto.</label>
            <input
              type="text"
              value={form.direccion}
              onChange={(e) => onChangeCampo("direccion", e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-brand outline-none transition-all"
            />
          </div>
          <div className="md:col-span-5">
            <label className="block text-xs font-bold text-ink mb-1.5">Responsable</label>
            <input
              type="text"
              value={form.responsableNombre}
              onChange={(e) => onChangeCampo("responsableNombre", e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-brand outline-none transition-all"
            />
          </div>
          <div className="md:col-span-3">
            <label className="block text-xs font-bold text-ink mb-1.5">Teléfono</label>
            <input
              type="tel"
              value={form.responsableTelefono}
              onChange={(e) => onChangeCampo("responsableTelefono", e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-brand outline-none transition-all"
            />
          </div>

          {/* Justificación */}
          <div className="md:col-span-12">
            <label className="block text-xs font-bold text-ink mb-1.5">Justificación</label>
            <textarea
              value={form.justificacion}
              onChange={(e) => onChangeCampo("justificacion", e.target.value)}
              rows={2}
              placeholder="Describa brevemente el uso..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-brand outline-none resize-none transition-all"
            />
          </div>
        </div>
      </section>

      {/* SECCIÓN 2: PARTIDAS (Sticky Header) */}
      <section className="bg-surface rounded-2xl shadow-sm border border-border/50 relative overflow-visible">
        
        {/* ENCABEZADO PEGAJOSO */}
        <div className="sticky top-16 md:top-20 z-20 bg-white px-6 py-4 border-b border-border flex justify-between items-center shadow-sm rounded-t-2xl transition-all">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
            2. Lista de Materiales
          </h3>
          <button 
            type="button" 
            onClick={agregarLinea} 
            className="flex items-center gap-1 text-xs bg-brand text-white px-4 py-2 rounded-lg hover:bg-brand-700 transition-colors shadow-sm font-semibold"
          >
            <span className="text-lg leading-none pb-0.5">+</span> Agregar Fila
          </button>
        </div>
        
        {/* Contenedor de la tabla */}
        <div className="overflow-x-auto rounded-b-2xl">
          <table className="w-full min-w-[750px] text-sm">
            <thead className="bg-gray-50 text-xs text-gray-500 uppercase font-semibold">
              <tr>
                <th className="px-4 py-3 w-24 text-center">Cant.</th>
                <th className="px-4 py-3 w-36 text-left">Unidad</th>
                <th className="px-4 py-3 text-left w-1/3">Concepto (Nombre)</th>
                <th className="px-4 py-3 text-left">Especificaciones / Detalles</th>
                <th className="px-4 py-3 w-16 text-center"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {form.lineas.map((l: Linea, index: number) => {
                const tieneError = !!l.observacionRevision;
                return (
                  <tr
                    key={l.id}
                    className={`group transition-colors ${tieneError ? "bg-red-50" : "hover:bg-gray-50"}`}
                  >
                    <td className="px-3 py-3 align-top">
                      <input
                        type="number"
                        min={1}
                        className="w-full text-center font-bold border border-gray-200 rounded-md py-2 focus:border-brand focus:ring-1 focus:ring-brand outline-none transition-shadow bg-white"
                        value={l.cantidad}
                        onChange={(e) =>
                          onChangeLinea(
                            l.id,
                            "cantidad",
                            e.target.value === "" ? 0 : Number(e.target.value)
                          )
                        }
                      />
                    </td>
                    <td className="px-3 py-3 align-top">
                      <select
                        className="w-full border border-gray-200 rounded-md py-2 px-2 text-sm focus:border-brand focus:ring-1 focus:ring-brand outline-none bg-white transition-shadow"
                        value={l.unidad}
                        onChange={(e) => onChangeLinea(l.id, "unidad", e.target.value)}
                      >
                        {UNIDADES.map((u) => (
                          <option key={u} value={u}>{u}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-3 py-3 align-top">
                      <input
                        type="text"
                        placeholder="Ej. Bolígrafos tinta negra"
                        className={`w-full border rounded-md py-2 px-3 text-sm font-medium outline-none transition-shadow focus:ring-1 ${
                          tieneError 
                            ? "border-red-300 ring-red-200 bg-white" 
                            : "border-gray-200 focus:border-brand focus:ring-brand"
                        }`}
                        value={l.concepto}
                        onChange={(e) => onChangeLinea(l.id, "concepto", e.target.value)}
                      />
                      {tieneError && (
                        <div className="mt-1.5 text-xs text-red-600 font-bold flex items-center gap-1 animate-pulse">
                          <span>👉</span> REVISOR: {l.observacionRevision}
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-3 align-top">
                      <input
                        type="text"
                        placeholder="Marca, modelo, color, tamaño..."
                        className="w-full border border-gray-200 rounded-md py-2 px-3 text-sm text-gray-600 focus:text-ink focus:border-brand focus:ring-1 focus:ring-brand outline-none transition-shadow"
                        value={l.descripcion}
                        onChange={(e) => onChangeLinea(l.id, "descripcion", e.target.value)}
                      />
                    </td>
                    <td className="px-2 py-3 text-center align-top">
                      {form.lineas.length > 1 && (
                        <button
                          type="button"
                          onClick={() => eliminarLinea(l.id)}
                          className="text-gray-400 hover:text-red-600 p-2 rounded-full hover:bg-red-50 transition-colors"
                          title="Eliminar partida"
                        >
                          ✕
                        </button>
                      )}
                      <div className="text-[10px] text-gray-400 mt-2 font-mono">#{index + 1}</div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            
            {/* PIE DE TABLA (Resumen Limpio) */}
            <tfoot className="bg-gray-50 border-t border-gray-200">
               <tr>
                  <td className="p-3 text-center font-bold text-lg text-brand">{totalArticulos}</td>
                  <td className="p-3 text-xs text-gray-500 font-bold uppercase tracking-wide pt-4">Total Artículos</td>
                  <td colSpan={3} className="p-3 text-right text-xs text-gray-400 italic">
                      Verifique sus cantidades antes de enviar.
                  </td>
               </tr>
            </tfoot>
          </table>
        </div>
      </section>

      {/* FOOTER ACCIONES (STICKY ABAJO) */}
      <section className="sticky bottom-0 z-20 bg-white/95 backdrop-blur border-t border-gray-200 p-4 -mx-4 md:mx-0 flex gap-3 justify-end shadow-[0_-4px_20px_rgba(0,0,0,0.08)] rounded-t-xl md:rounded-none">
        <button
          type="button"
          onClick={handleCancelar}
          className="px-6 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={handleGuardarBorrador}
          className="px-6 py-2.5 text-sm font-bold text-brand border border-brand/30 hover:bg-brand/5 rounded-xl transition-colors"
        >
          Guardar Borrador
        </button>
        <button
          type="button"
          onClick={handleEnviarRevision}
          className="px-8 py-2.5 text-sm font-bold text-white bg-brand hover:bg-brand-700 shadow-lg shadow-brand/20 rounded-xl transition-all transform active:scale-95"
        >
          {editId ? "Corregir y Reenviar 🚀" : "Enviar Solicitud 🚀"}
        </button>
      </section>
    </div>
  );
}