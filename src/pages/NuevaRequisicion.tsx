// FILE: src/pages/NuevaRequisicion.tsx
import { useEffect, useState, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  useRequisiciones,
  type Linea,
  type RequisicionFormData,
} from "../hooks/useRequisiciones";
import { useSession } from "../hooks/useSession";
import { useNotificaciones } from "../hooks/useNotificaciones";
import { CATEGORIAS, UNIDADES_MEDIDA } from "../data/catalogos";

function obtenerFechaLocal(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function crearLinea(): Linea {
  return {
    id: typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `lin-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    cantidad: 1,
    unidad: "", 
    concepto: "",
    descripcion: "",
  };
}

const FORM_DEFAULT: RequisicionFormData = {
  fecha: obtenerFechaLocal(),
  tipoMaterial: "",
  subTipoMaterial: "",
  organoRequirente: "",
  titularNombre: "",
  direccion: "",
  responsableNombre: "",
  responsableTelefono: "",
  justificacion: "",
  lineas: [crearLinea()],
};

export default function NuevaRequisicion() {
  const navigate = useNavigate();
  const [search] = useSearchParams();
  const { user, role } = useSession();
  const { agregarNotificacion } = useNotificaciones();

  const {
    requisiciones,
    crearRequisicion,
    actualizarRequisicion,
    actualizarEstado,
  } = useRequisiciones();

  const editId = search.get("id");
  const [form, setForm] = useState<RequisicionFormData>(FORM_DEFAULT);

  const catsPrincipales = Object.keys(CATEGORIAS);
  const catsSecundarias = form.tipoMaterial ? CATEGORIAS[form.tipoMaterial] || [] : [];

  const reqOriginal = useMemo(
    () => (editId ? requisiciones.find((r) => r.id === editId) : null),
    [editId, requisiciones]
  );

  useEffect(() => {
    if (reqOriginal) {
      setForm({
        fecha: reqOriginal.fecha,
        tipoMaterial: reqOriginal.tipoMaterial,
        subTipoMaterial: reqOriginal.subTipoMaterial || "",
        organoRequirente: reqOriginal.organoRequirente,
        titularNombre: reqOriginal.titularNombre,
        direccion: reqOriginal.direccion,
        responsableNombre: reqOriginal.responsableNombre,
        responsableTelefono: reqOriginal.responsableTelefono,
        justificacion: reqOriginal.justificacion,
        // Importante: aseguramos que 'observacionRevision' se copie a la línea
        lineas: reqOriginal.lineas.map((l) => ({ ...l })),
      });
    } else if (user) {
        setForm(prev => ({
            ...prev,
            fecha: obtenerFechaLocal(),
            organoRequirente: user.organo || "",
            titularNombre: user.titular || ""
        }));
    }
  }, [reqOriginal, user]);

  const onChangeCampo = (campo: keyof RequisicionFormData, valor: string) => {
    setForm((prev) => {
        const newState = { ...prev, [campo]: valor };
        if (campo === "tipoMaterial") {
            newState.subTipoMaterial = "";
        }
        return newState;
    });
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
    setForm((prev) => ({ ...prev, lineas: [...prev.lineas, crearLinea()] }));
  };

  const eliminarLinea = (lineaId: string) => {
    setForm((prev) => {
      if (prev.lineas.length === 1) return prev;
      return { ...prev, lineas: prev.lineas.filter((l) => l.id !== lineaId) };
    });
  };

  const handleSubmit = (enviar: boolean) => {
    if (!user) return;
    
    if (!form.tipoMaterial || !form.subTipoMaterial) return alert("Seleccione Tipo y Subcategoría de material.");
    if (!form.direccion.trim()) return alert("El campo Dirección / Área es obligatorio.");
    if (!form.responsableNombre.trim()) return alert("El nombre del responsable es obligatorio.");
    if (!form.justificacion.trim()) return alert("La justificación es obligatoria.");
    
    for (const l of form.lineas) {
      if (!l.concepto.trim()) return alert("Todas las partidas deben tener concepto.");
      if (!l.unidad) return alert("Seleccione la unidad de medida.");
    }

    if (enviar && !window.confirm("¿Está seguro de enviar la solicitud a revisión?")) return;

    const dataFinal = {
        ...form,
        organoRequirente: user.organo,
        titularNombre: user.titular
    };

    if (editId) {
      actualizarRequisicion(editId, dataFinal);
      if (enviar) {
        actualizarEstado(editId, "en_revision");
        agregarNotificacion({ reqId: editId, folio: reqOriginal?.folio || "REQ", mensaje: "Requisición corregida enviada.", targetRole: "revision" });
      }
    } else {
      const nueva = crearRequisicion(dataFinal, { uid: user.uid, email: user.email }, { enviar });
      if (enviar) {
        agregarNotificacion({ reqId: nueva.id, folio: nueva.folio, mensaje: "Nueva requisición recibida.", targetRole: "revision" });
      }
    }
    navigate("/mis-requisiciones");
  };

  const fechaMinima = (role === 'direccion' || role === 'admin') ? undefined : obtenerFechaLocal();
  const totalArticulos = form.lineas.reduce((acc, curr) => acc + (Number(curr.cantidad) || 0), 0);

  return (
    <div className="space-y-8 pb-24 font-sans text-gray-800">
      <header className="border-b border-gray-200 pb-4">
        <h2 className="text-2xl font-bold text-gray-800 tracking-tight">
          {editId ? "Editar Requerimiento" : "Nuevo Requerimiento"}
        </h2>
        <p className="text-sm text-gray-500 mt-1">
           Complete la información solicitada. Todos los campos son obligatorios.
        </p>
      </header>

      {/* DATOS GENERALES */}
      <section className="bg-white rounded-md shadow-sm border border-gray-200 p-6">
        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-6 border-b pb-2">
          Datos Generales
        </h3>
        
        <div className="grid md:grid-cols-12 gap-6 text-sm">
            <div className="md:col-span-2">
                <label className="block text-xs font-bold text-gray-700 mb-1">Fecha</label>
                <input
                type="date"
                value={form.fecha}
                min={fechaMinima}
                onChange={(e) => onChangeCampo("fecha", e.target.value)}
                className="w-full border border-gray-300 rounded px-2 py-2 focus:ring-1 focus:ring-gray-400 outline-none text-sm"
                />
            </div>

            <div className="md:col-span-4">
                <label className="block text-xs font-bold text-gray-700 mb-1">Tipo de material o servicio</label>
                <select
                value={form.tipoMaterial}
                onChange={(e) => onChangeCampo("tipoMaterial", e.target.value)}
                className="w-full border border-gray-300 rounded px-2 py-2 focus:ring-1 focus:ring-gray-400 outline-none text-sm"
                >
                <option value="">-- Seleccione --</option>
                {catsPrincipales.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
            </div>

            <div className="md:col-span-6">
                <label className="block text-xs font-bold text-gray-700 mb-1">Subcategoría</label>
                <select
                value={form.subTipoMaterial}
                onChange={(e) => onChangeCampo("subTipoMaterial", e.target.value)}
                disabled={!form.tipoMaterial}
                className="w-full border border-gray-300 rounded px-2 py-2 focus:ring-1 focus:ring-gray-400 outline-none disabled:bg-gray-100 disabled:text-gray-400 text-sm"
                >
                <option value="">-- Seleccione --</option>
                {catsSecundarias.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
            </div>

            <div className="md:col-span-12 grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Dirección / Área</label>
                    <input
                    type="text"
                    value={form.direccion}
                    onChange={(e) => onChangeCampo("direccion", e.target.value)}
                    placeholder="Ej. Depto Redes"
                    className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-1 focus:ring-gray-400 outline-none"
                    />
                </div>
                <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Responsable</label>
                    <input
                    type="text"
                    value={form.responsableNombre}
                    onChange={(e) => onChangeCampo("responsableNombre", e.target.value)}
                    className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-1 focus:ring-gray-400 outline-none"
                    />
                </div>
                <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Teléfono</label>
                    <input
                    type="tel"
                    value={form.responsableTelefono}
                    onChange={(e) => onChangeCampo("responsableTelefono", e.target.value)}
                    className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-1 focus:ring-gray-400 outline-none"
                    />
                </div>
            </div>

            <div className="md:col-span-12">
                <label className="block text-xs font-bold text-gray-700 mb-1">Justificación del Pedido</label>
                <textarea
                value={form.justificacion}
                onChange={(e) => onChangeCampo("justificacion", e.target.value)}
                rows={3}
                className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-1 focus:ring-gray-400 outline-none resize-none"
                />
            </div>
        </div>
      </section>

      {/* PARTIDAS */}
      <section className="bg-white rounded-md shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
            Detalle de Partidas
            </h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-sm">
            <thead className="bg-white border-b border-gray-200 text-gray-600 uppercase text-xs">
              <tr>
                <th className="px-4 py-3 w-24 text-center">Cant.</th>
                <th className="px-4 py-3 w-40 text-left">Unidad</th>
                <th className="px-4 py-3 text-left w-1/3">Concepto</th>
                <th className="px-4 py-3 text-left">Especificaciones</th>
                <th className="px-4 py-3 w-16"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {form.lineas.map((l, index) => {
                // Detectar si hay observación en esta línea
                const tieneObs = !!l.observacionRevision;
                
                return (
                  <tr key={l.id} className={tieneObs ? "bg-red-50/50" : "hover:bg-gray-50"}>
                      <td className="p-3 align-top">
                        <input
                          type="number" min={1}
                          className={`w-full text-center border rounded px-2 py-1.5 outline-none focus:ring-1 ${tieneObs ? 'border-red-400 focus:ring-red-500 bg-white' : 'border-gray-300 focus:ring-gray-500'}`}
                          value={l.cantidad}
                          onChange={(e) => onChangeLinea(l.id, "cantidad", Number(e.target.value))}
                        />
                      </td>
                      <td className="p-3 align-top">
                        <select
                          className={`w-full border rounded px-2 py-1.5 outline-none focus:ring-1 bg-white ${tieneObs ? 'border-red-400 focus:ring-red-500' : 'border-gray-300 focus:ring-gray-500'}`}
                          value={l.unidad}
                          onChange={(e) => onChangeLinea(l.id, "unidad", e.target.value)}
                        >
                           <option value="">-- Seleccione --</option>
                          {UNIDADES_MEDIDA.map((u) => <option key={u} value={u}>{u}</option>)}
                        </select>
                      </td>
                      <td className="p-3 align-top">
                        <input
                          type="text"
                          className={`w-full border rounded px-2 py-1.5 outline-none focus:ring-1 ${tieneObs ? 'border-red-400 focus:ring-red-500 bg-white' : 'border-gray-300 focus:ring-gray-500'}`}
                          value={l.concepto}
                          onChange={(e) => onChangeLinea(l.id, "concepto", e.target.value)}
                        />
                        {/* MOSTRAR OBSERVACIÓN AQUÍ */}
                        {tieneObs && (
                            <div className="mt-1 text-xs text-red-600 font-bold bg-red-100 p-2 rounded border border-red-200 animate-pulse">
                                ⚠️ Corrección: {l.observacionRevision}
                            </div>
                        )}
                      </td>
                      <td className="p-3 align-top">
                        <input
                          type="text"
                          className={`w-full border rounded px-2 py-1.5 outline-none focus:ring-1 ${tieneObs ? 'border-red-400 focus:ring-red-500 bg-white' : 'border-gray-300 focus:ring-gray-500'}`}
                          value={l.descripcion}
                          onChange={(e) => onChangeLinea(l.id, "descripcion", e.target.value)}
                        />
                      </td>
                      <td className="p-3 text-center align-top">
                        <div className="flex flex-col items-center gap-1">
                            {form.lineas.length > 1 && (
                              <button onClick={() => eliminarLinea(l.id)} className="text-gray-400 hover:text-red-600 font-bold p-1">✕</button>
                            )}
                            <span className="text-[10px] text-gray-300">#{index + 1}</span>
                        </div>
                      </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
               <tr className="bg-gray-50 border-t border-gray-200">
                  <td className="p-3 text-center font-bold text-lg text-brand">{totalArticulos}</td>
                  <td className="p-3 text-xs text-gray-500 font-bold uppercase tracking-wide pt-4">Total Artículos</td>
                  <td colSpan={3} className="p-2 text-right">
                    <button onClick={agregarLinea} className="text-xs font-bold text-gray-600 hover:text-black uppercase tracking-wide py-2 flex items-center justify-end gap-2 ml-auto">
                        <span>+</span> Agregar otra partida
                    </button>
                  </td>
               </tr>
            </tfoot>
          </table>
        </div>
      </section>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 flex justify-end gap-3 md:pl-72 z-30 shadow-lg">
        <button
          onClick={() => navigate("/mis-requisiciones")}
          className="px-5 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md border border-gray-300 transition-colors"
        >
          Cancelar
        </button>
        <button
          onClick={() => handleSubmit(false)}
          className="px-5 py-2 text-sm font-bold text-gray-700 border border-gray-300 hover:bg-gray-50 rounded-md transition-colors"
        >
          Guardar Borrador
        </button>
        <button
          onClick={() => handleSubmit(true)}
          className="px-6 py-2 text-sm font-bold text-white bg-gray-800 hover:bg-gray-900 rounded-md shadow-md transition-all"
        >
          Enviar Solicitud
        </button>
      </div>
    </div>
  );
}