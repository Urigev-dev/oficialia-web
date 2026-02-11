import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  ArrowLeft, Save, Plus, Trash2, Info, Send, AlertTriangle, Paperclip, FileText, X 
} from 'lucide-react';

import { useSession } from '../hooks/useSession';
import { 
  useRequisiciones, 
  type Linea, 
  type Requisicion,
  type EstadoRequisicion 
} from '../hooks/useRequisiciones';
import { useNotificaciones } from '../hooks/useNotificaciones';
import { useToast } from '../hooks/useToast';
import { useVentanaEnvio } from '../hooks/useVentanaEnvio'; // 👉 1. Importación del Hook
import ConfirmModal from '../components/ui/ConfirmModal';
import { CATEGORIAS, UNIDADES_MEDIDA } from '../data/catalogos';
import { Button } from '../components/ui/Button';

// Imports para Storage
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { storage } from "../firebase/firebase";
import type { ArchivoAdjunto } from "../types";

export default function NuevaRequisicion() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('edit'); 
  const { toast } = useToast();

  const { user, role } = useSession();
  const { crearRequisicion, actualizarRequisicion, requisiciones, actualizarEstado } = useRequisiciones();
  const { agregarNotificacion } = useNotificaciones();
  
  // 👉 2. Instancia del Hook
  const { puedeEnviar, loadingConfig } = useVentanaEnvio();

  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSubmit, setIsSubmit] = useState(false);
  
  // Estado para subida de archivos
  const [uploading, setUploading] = useState(false);
  const [adjuntos, setAdjuntos] = useState<ArchivoAdjunto[]>([]);

  // Modal para eliminar partidas
  const [deleteModal, setDeleteModal] = useState<{ open: boolean, index: number | null }>({ open: false, index: null });

  // Modal para eliminar archivos
  const [deleteFileModal, setDeleteFileModal] = useState<{ open: boolean, file: ArchivoAdjunto | null }>({ open: false, file: null });

  // Estado para categoría de 3 niveles
  const [selectedCapitulo, setSelectedCapitulo] = useState("");

  const getLocalToday = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const minDate = ['admin', 'revision', 'direccion', 'autorizacion'].includes(role || '')
      ? undefined
      : getLocalToday();

  const [formData, setFormData] = useState({
    fechaSolicitud: getLocalToday(),
    area: (user as any)?.area || '',
    tipoMaterial: '',    
    subTipoMaterial: '', 
    organoRequirente: (user as any)?.organo || '',
    responsableNombre: '',
    responsableTelefono: '',
    justificacion: '',
  });

  const [items, setItems] = useState<Linea[]>([
    { id: Date.now().toString(), cantidad: 1, unidad: '', concepto: '', descripcion: '', cantidadAutorizada: 0 }
  ]);

  const [reqOriginal, setReqOriginal] = useState<Requisicion | null>(null);

  useEffect(() => {
    if (editId) {
      const req = requisiciones.find(r => r.id === editId);
      if (req) {
        setReqOriginal(req);
        setFormData({
          fechaSolicitud: req.fechaSolicitud || getLocalToday(),
          area: req.area,
          tipoMaterial: req.tipoMaterial,       
          subTipoMaterial: req.subTipoMaterial || '', 
          organoRequirente: req.organoRequirente,
          responsableNombre: req.responsableNombre,
          responsableTelefono: req.responsableTelefono,
          justificacion: req.justificacion,
        });
        setItems(req.lineas);
        setAdjuntos(req.adjuntos || []);

        const capituloEncontrado = Object.keys(CATEGORIAS).find(cap => 
            Object.keys(CATEGORIAS[cap]).includes(req.tipoMaterial)
        );
        if (capituloEncontrado) {
            setSelectedCapitulo(capituloEncontrado);
        }
      }
    } else {
        if (user) {
            setFormData(prev => ({
                ...prev,
                area: (user as any)?.area || '',
                organoRequirente: (user as any)?.organo || ''
            }));
        }
    }
  }, [editId, requisiciones, user]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      const validFiles = newFiles.filter(file => {
          const isValidType = file.type.startsWith('image/') || file.type === 'application/pdf';
          const isValidSize = file.size <= 5 * 1024 * 1024;
          if (!isValidType) toast(`${file.name} no es imagen o PDF`, "error");
          if (!isValidSize) toast(`${file.name} excede 5MB`, "error");
          return isValidType && isValidSize;
      });
      
      if (validFiles.length > 0) {
          await uploadFiles(validFiles);
      }
    }
  };

  const uploadFiles = async (filesToUpload: File[]) => {
      setUploading(true);
      try {
          const uploaded: ArchivoAdjunto[] = [];
          for (const file of filesToUpload) {
              const fileRef = ref(storage, `evidencias/${user?.uid}/${Date.now()}_${file.name}`);
              await uploadBytes(fileRef, file);
              const url = await getDownloadURL(fileRef);
              uploaded.push({ nombre: file.name, url, tipo: file.type, fullPath: fileRef.fullPath });
          }
          setAdjuntos(prev => [...prev, ...uploaded]);
          toast("Archivos adjuntados correctamente", "success");
      } catch (error) {
          console.error("Error subiendo", error);
          toast("Error al subir archivos", "error");
      } finally {
          setUploading(false);
      }
  };

  const requestRemoveFile = (archivo: ArchivoAdjunto) => {
      setDeleteFileModal({ open: true, file: archivo });
  };

  const confirmRemoveFile = async () => {
      const archivo = deleteFileModal.file;
      if (!archivo) return;

      setDeleteFileModal({ open: false, file: null });

      try {
          if (archivo.fullPath) {
              const fileRef = ref(storage, archivo.fullPath);
              await deleteObject(fileRef);
          } else {
              const fileRef = ref(storage, archivo.url);
              await deleteObject(fileRef);
          }

          setAdjuntos(prev => prev.filter(a => a.url !== archivo.url));
          toast("Archivo eliminado correctamente", "success");

      } catch (error) {
          console.error("Error eliminando archivo:", error);
          toast("No se pudo eliminar el archivo del servidor", "error");
      }
  };

  const requestRemoveItem = (index: number) => {
    if (items.length === 1) return toast("Mínimo una partida", "error");
    const item = items[index];
    if (item.concepto.trim() !== '' || item.descripcion.trim() !== '') {
        setDeleteModal({ open: true, index });
    } else {
        performRemove(index);
    }
  };

  const performRemove = (index: number) => {
    const newItems = [...items];
    newItems.splice(index, 1);
    setItems(newItems);
    setDeleteModal({ open: false, index: null });
  };

  const handleAddItem = () => {
    setItems([...items, { id: Date.now().toString(), cantidad: 1, unidad: '', concepto: '', descripcion: '', cantidadAutorizada: 0 }]);
  };

  const updateItem = (index: number, field: keyof Linea, value: any) => {
    const newItems = [...items];
    // @ts-ignore
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const handleCapituloChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      setSelectedCapitulo(e.target.value);
      setFormData(prev => ({ ...prev, tipoMaterial: '', subTipoMaterial: '' }));
  };
  const handleConceptoChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      setFormData(prev => ({ ...prev, tipoMaterial: e.target.value, subTipoMaterial: '' }));
  };
  const handlePartidaChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      setFormData(prev => ({ ...prev, subTipoMaterial: e.target.value }));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (submit: boolean) => {
    if (submit) {
        if (!formData.area.trim()) return toast("Falta el Área Solicitante", "error");
        if (!formData.responsableNombre.trim()) return toast("Falta el Responsable de Seguimiento", "error");
        if (!formData.responsableTelefono.trim()) return toast("Falta el Teléfono de Contacto", "error");
        if (!formData.tipoMaterial || !formData.subTipoMaterial) return toast("Selecciona la clasificación del gasto", "error");
        if (!formData.justificacion.trim()) return toast("Falta justificación", "error");
        if (items.some(l => !l.concepto || !l.descripcion || !l.unidad)) return toast("Completa las partidas (incluyendo unidad)", "error");
    } else {
        if (!formData.justificacion.trim()) {
            return toast("Escribe al menos la justificación para identificar el borrador", "info");
        }
    }
    
    setIsSubmit(submit);
    setShowConfirm(true);
  };

  const confirmSubmit = async () => {
    setShowConfirm(false);
    setLoading(true);
    try {
        const lineasProcesadas = items.map(i => ({
            ...i,
            observacionRevision: '',
            cantidadAutorizada: i.cantidad 
        }));

        // 👉 3. CÁLCULO DE FECHA: Se evalúa al confirmar el envío
        const tzOffset = (new Date()).getTimezoneOffset() * 60000;
        const fechaDeHoy = (new Date(Date.now() - tzOffset)).toISOString().split('T')[0];

        const dataToSave = {
            ...formData,
            // 👉 Se fuerza la fecha de hoy SI isSubmit es true, si no, se deja la que tenía
            fechaSolicitud: isSubmit ? fechaDeHoy : formData.fechaSolicitud,
            titularNombre: user?.titular || '', 
            direccionEntrega: '', 
            lineas: lineasProcesadas,
            adjuntos,
            estado: (isSubmit ? 'en_revision' : 'borrador') as EstadoRequisicion,
            revisionNotas: isSubmit ? '' : (reqOriginal?.revisionNotas || ''),
            historialObservaciones: reqOriginal?.historialObservaciones || [],
            creadoPor: { 
                uid: user?.uid || '', 
                email: user?.email || '', 
                nombre: user?.titular || '', 
                telefono: (user as any)?.telefono || '', 
                area: (user as any)?.area || '' 
            }
        };

        const payload = JSON.parse(JSON.stringify(dataToSave));

        let res: { id: string; folio: string } | undefined;
        
        if (editId) {
            const { creadoPor, ...rest } = payload;
            await actualizarRequisicion(editId, rest);
            if (isSubmit) await actualizarEstado(editId, 'en_revision');
            res = { id: editId, folio: reqOriginal?.folio || '' };
        } else {
            res = await crearRequisicion(payload, { enviar: isSubmit });
        }

        if (isSubmit && editId && reqOriginal?.revisandoPor?.uid && res) {
             await agregarNotificacion({
                 targetUid: reqOriginal.revisandoPor.uid,
                 reqId: res.id, folio: res.folio, tipo: 'accion',
                 mensaje: `CORRECCIÓN: ${res.folio} ha sido actualizada.`
             });
        }

        toast(isSubmit ? "Enviado con éxito" : "Borrador guardado", "success");
        navigate('/mis-requisiciones');
    } catch (e) {
        console.error(e);
        toast("Error al guardar", "error");
    } finally {
        setLoading(false);
    }
  };

  const conceptosDisponibles = selectedCapitulo ? Object.keys(CATEGORIAS[selectedCapitulo] || {}) : [];
  const partidasDisponibles = (selectedCapitulo && formData.tipoMaterial) ? CATEGORIAS[selectedCapitulo][formData.tipoMaterial] || [] : [];

  // --- NUEVA LÓGICA: PERMISO DE ENVÍO POR CORRECCIÓN ---
  // Si tiene un ID y contiene notas de revisión, significa que el revisor lo devolvió para corrección.
  const esCorreccion = Boolean(editId && reqOriginal?.revisionNotas);
  
  // El usuario puede enviar SI está dentro de los 5 días hábiles O SI es una corrección solicitada.
  const envioPermitido = puedeEnviar || esCorreccion;

  return (
    <React.Fragment>
      <ConfirmModal 
        isOpen={showConfirm} onClose={() => setShowConfirm(false)} onConfirm={confirmSubmit}
        title={isSubmit ? "Enviar Solicitud" : "Guardar Borrador"}
        message={isSubmit ? "¿Confirmas que la información es correcta?" : "Se guardará para editar después."}
        type="info"
      />
      
      <ConfirmModal 
        isOpen={deleteModal.open} onClose={() => setDeleteModal({ open: false, index: null })}
        onConfirm={() => deleteModal.index !== null && performRemove(deleteModal.index)}
        title="Eliminar partida" message="¿Deseas eliminar este renglón?" type="warning"
      />

      <ConfirmModal 
        isOpen={deleteFileModal.open} onClose={() => setDeleteFileModal({ open: false, file: null })}
        onConfirm={confirmRemoveFile}
        title="Eliminar archivo adjunto" 
        message={`¿Estás seguro de eliminar "${deleteFileModal.file?.nombre}" de forma permanente?`} 
        type="danger"
      />

      <div className="max-w-5xl mx-auto space-y-6 pb-24">
        
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors">
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{editId ? 'Corregir Solicitud' : 'Nueva Solicitud'}</h1>
            <p className="text-gray-500 text-sm">Completa la información del requerimiento.</p>
          </div>
        </div>

        {reqOriginal?.revisionNotas && editId && (
             <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 animate-fade-in shadow-sm">
                 <h3 className="text-amber-800 font-bold flex items-center gap-2 mb-2"><AlertTriangle size={20} /> Correcciones Solicitadas</h3>
                 <p className="text-amber-900 text-sm whitespace-pre-wrap leading-relaxed">{reqOriginal.revisionNotas}</p>
             </div>
        )}

        <form className="space-y-8" onSubmit={(e) => e.preventDefault()}>
          
          <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <div>
                <label className="text-xs font-bold uppercase text-gray-500 tracking-wider mb-1 block">Fecha de Solicitud</label>
                <input 
                    type="date" 
                    value={formData.fechaSolicitud} 
                    onChange={handleChange} 
                    name="fechaSolicitud" 
                    min={minDate}
                    className="w-full p-3 bg-white border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-[var(--color-brand)]/20 font-medium cursor-pointer" 
                />
              </div>
              <div>
                <label className="text-xs font-bold uppercase text-gray-500 tracking-wider mb-1 block">Órgano Requirente</label>
                <input type="text" value={formData.organoRequirente} disabled className="w-full p-3 bg-gray-100 border border-gray-200 rounded-lg text-gray-600 font-bold cursor-not-allowed" />
              </div>

              <div className="md:col-span-2">
                <label className="text-xs font-bold uppercase text-gray-500 tracking-wider mb-1 block">Área Solicitante</label>
                <input type="text" name="area" value={formData.area} onChange={handleChange} className="w-full p-3 bg-white border border-gray-300 rounded-lg outline-none focus:border-[var(--color-brand)]" />
              </div>

              <div>
                <label className="text-xs font-bold uppercase text-gray-500 tracking-wider mb-1 block">Responsable Seguimiento</label>
                <input type="text" name="responsableNombre" value={formData.responsableNombre} onChange={handleChange} className="w-full p-3 bg-white border border-gray-300 rounded-lg outline-none focus:border-[var(--color-brand)]" placeholder="Nombre completo" />
              </div>
              <div>
                <label className="text-xs font-bold uppercase text-gray-500 tracking-wider mb-1 block">Teléfono Contacto</label>
                <input type="tel" name="responsableTelefono" value={formData.responsableTelefono} onChange={handleChange} className="w-full p-3 bg-white border border-gray-300 rounded-lg outline-none focus:border-[var(--color-brand)]" placeholder="Celular / Extensión" />
              </div>

              <div className="md:col-span-2 bg-gray-50 p-5 rounded-lg border border-gray-200 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-3 mb-1">
                      <span className="text-sm font-bold text-[var(--color-brand)] uppercase flex items-center gap-2">
                          <FileText size={16}/> Clasificación Presupuestal
                      </span>
                  </div>
                  
                  <div>
                      <label className="block text-[10px] font-bold text-gray-500 mb-1 uppercase">1. Capítulo</label>
                      <select value={selectedCapitulo} onChange={handleCapituloChange} className="w-full p-2 bg-white border border-gray-300 rounded-md text-sm outline-none focus:border-blue-500">
                          <option value="">-- Seleccione --</option>
                          {Object.keys(CATEGORIAS).map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                  </div>
                  <div>
                      <label className="block text-[10px] font-bold text-gray-500 mb-1 uppercase">2. Concepto</label>
                      <select value={formData.tipoMaterial} onChange={handleConceptoChange} disabled={!selectedCapitulo} className="w-full p-2 bg-white border border-gray-300 rounded-md text-sm outline-none focus:border-blue-500 disabled:bg-gray-100 disabled:text-gray-400">
                          <option value="">-- Seleccione --</option>
                          {conceptosDisponibles.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                  </div>
                  <div>
                      <label className="block text-[10px] font-bold text-gray-500 mb-1 uppercase">3. Partida Genérica</label>
                      <select value={formData.subTipoMaterial} onChange={handlePartidaChange} disabled={!formData.tipoMaterial} className="w-full p-2 bg-white border border-gray-300 rounded-md text-sm outline-none focus:border-blue-500 disabled:bg-gray-100 disabled:text-gray-400">
                          <option value="">-- Seleccione --</option>
                          {partidasDisponibles.map(p => <option key={p} value={p}>{p}</option>)}
                      </select>
                  </div>
              </div>

              <div className="md:col-span-2">
                <label className="text-xs font-bold uppercase text-gray-500 tracking-wider mb-1 block">Justificación del Gasto</label>
                <textarea name="justificacion" rows={3} value={formData.justificacion} onChange={handleChange} className="w-full p-3 bg-white border border-gray-300 rounded-lg outline-none resize-none focus:border-[var(--color-brand)]" placeholder="Describa la necesidad..." />
              </div>

              <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Evidencias / Adjuntos (PDF o Imagen)</label>
                  
                  {adjuntos.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-3">
                          {adjuntos.map((adj) => (
                              <div key={adj.url} className="flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg text-xs border border-blue-100">
                                  <FileText size={14}/>
                                  <a href={adj.url} target="_blank" rel="noreferrer" className="hover:underline max-w-[150px] truncate">{adj.nombre}</a>
                                  <button type="button" onClick={() => requestRemoveFile(adj)} className="text-blue-400 hover:text-red-500"><X size={14}/></button>
                              </div>
                          ))}
                      </div>
                  )}

                  <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:bg-gray-50 transition-colors relative">
                      <input type="file" multiple accept="image/*,.pdf" onChange={handleFileChange} disabled={uploading} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed" />
                      <div className="flex flex-col items-center gap-2 text-gray-500">
                          <div className="p-3 bg-blue-50 text-blue-600 rounded-full"><Paperclip size={24} /></div>
                          <span className="text-sm font-medium">{uploading ? "Subiendo archivos..." : "Clic para adjuntar o arrastra archivos aquí"}</span>
                          <span className="text-xs text-gray-400">Máx 5MB por archivo</span>
                      </div>
                  </div>
              </div>

            </div>
          </section>

          <section className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-gray-50 px-6 py-3 border-b border-gray-200 flex justify-between items-center">
                  <h3 className="font-bold text-gray-700 flex items-center gap-2">
                      <Plus size={18} className="text-[var(--color-brand)]"/> Detalle de Bienes / Servicios
                  </h3>
              </div>
              
              <div className="hidden md:grid md:grid-cols-12 gap-4 px-4 py-2 bg-gray-100 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-200">
                  <div className="col-span-1 text-center">Cantidad</div>
                  <div className="col-span-2">Unidad</div>
                  <div className="col-span-3">Concepto</div>
                  <div className="col-span-5">Descripción</div>
                  <div className="col-span-1 text-center">Acción</div>
              </div>

              <div className="divide-y divide-gray-100">
                {items.map((item, index) => (
                  <div key={item.id} className="p-4 md:grid md:grid-cols-12 md:gap-4 md:items-start hover:bg-gray-50/50 transition-colors group">
                      
                      <div className="col-span-1 mb-2 md:mb-0">
                        <label className="md:hidden text-xs font-bold text-gray-400 block mb-1">Cantidad</label>
                        <input type="number" min="1" className="w-full p-2 border border-gray-300 rounded text-center font-bold focus:border-[var(--color-brand)] outline-none" value={item.cantidad} onChange={(e) => updateItem(index, 'cantidad', parseInt(e.target.value) || 0)} />
                      </div>
                      
                      <div className="col-span-2 mb-2 md:mb-0">
                        <label className="md:hidden text-xs font-bold text-gray-400 block mb-1">Unidad</label>
                        <select className="w-full p-2 border border-gray-300 rounded bg-white text-sm outline-none focus:border-[var(--color-brand)]" value={item.unidad} onChange={(e) => updateItem(index, 'unidad', e.target.value)}>
                           <option value="" disabled>-- Seleccione --</option>
                           {UNIDADES_MEDIDA.map(u => <option key={u} value={u}>{u}</option>)}
                        </select>
                      </div>
                      
                      <div className="col-span-3 mb-2 md:mb-0">
                        <label className="md:hidden text-xs font-bold text-gray-400 block mb-1">Concepto</label>
                        <input type="text" className="w-full p-2 border border-gray-300 rounded text-sm font-medium outline-none focus:border-[var(--color-brand)] placeholder:font-normal" placeholder="Ej. Papel Bond" value={item.concepto} onChange={(e) => updateItem(index, 'concepto', e.target.value)} />
                      </div>
                      
                      <div className="col-span-5 mb-2 md:mb-0">
                        <label className="md:hidden text-xs font-bold text-gray-400 block mb-1">Descripción</label>
                        <textarea rows={1} className="w-full p-2 border border-gray-300 rounded text-sm resize-none outline-none focus:border-[var(--color-brand)]" placeholder="Detalles específicos..." value={item.descripcion} onChange={(e) => updateItem(index, 'descripcion', e.target.value)} />
                        {item.observacionRevision && (
                            <div className="mt-1 text-xs text-red-600 font-medium bg-red-50 p-2 rounded border border-red-100 flex gap-1 items-start">
                                <Info size={14} className="shrink-0 mt-0.5" /><span>{item.observacionRevision}</span>
                            </div>
                        )}
                      </div>
                      
                      <div className="col-span-1 flex justify-center pt-1">
                        <button type="button" onClick={() => requestRemoveItem(index)} className="text-gray-300 hover:text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors">
                          <Trash2 size={18} />
                        </button>
                      </div>
                  </div>
                ))}
              </div>
              
              <div className="bg-gray-50 p-3 flex justify-center border-t border-gray-200">
                <Button type="button" variant="ghost" size="sm" onClick={handleAddItem} icon={Plus}>Agregar otra partida</Button>
              </div>
          </section>

          {/* 👉 4. NUEVA BARRA DE BOTONES CON BANNER INFORMATIVO */}
          {!envioPermitido && !loadingConfig && (
            <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-xl flex items-start gap-3 mt-4 mb-2 animate-fade-in">
              <Info className="shrink-0 mt-0.5" size={20} />
              <div className="text-sm">
                <p className="font-bold mb-1">El periodo de recepción ordinaria ha finalizado</p>
                <p>El sistema de requerimientos solo recibe solicitudes los primeros 5 días hábiles de cada mes. Puede continuar elaborando su solicitud y guardarla como <strong>Borrador</strong> para enviarla el próximo mes.</p>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-4 pt-6 border-t border-gray-200">
            <Button type="button" variant="secondary" onClick={() => navigate('/mis-requisiciones')} disabled={loading}>Cancelar</Button>
            <Button type="button" variant="outline" loading={loading} onClick={() => handleSubmit(false)} icon={Save} disabled={loading}>Guardar Borrador</Button>
            
            <Button 
              type="button" 
              variant="primary" 
              loading={loading} 
              onClick={() => handleSubmit(true)} 
              icon={Send} 
              disabled={loading || loadingConfig || !envioPermitido}
            >
              Enviar Solicitud
            </Button>
          </div>
        </form>
      </div>
    </React.Fragment>
  );
}