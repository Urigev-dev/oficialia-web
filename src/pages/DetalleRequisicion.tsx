import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Printer, Save, 
  AlertTriangle, XCircle, Send, CheckCheck, Archive, Phone, Play, RotateCcw, DollarSign, PackageCheck,
  History, 
  X,
  ListChecks,
  FileText,
  Paperclip,
  Download
} from 'lucide-react';

import { useSession } from '../hooks/useSession';
import { useRequisiciones, type Linea, type EstadoRequisicion, type EventoHistorial } from '../hooks/useRequisiciones';
import { useNotificaciones } from '../hooks/useNotificaciones';
import { useToast } from '../hooks/useToast';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import ConfirmModal from '../components/ui/ConfirmModal';
import { requiereEntregaFisica } from '../data/catalogos';

export default function DetalleRequisicion() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, role } = useSession();
  
  const { requisiciones, actualizarLineas, actualizarRequisicion, obtenerRequisicion } = useRequisiciones();
  const { agregarNotificacion } = useNotificaciones();
  const { toast } = useToast();
  
  // --- ESTADOS LOCALES ---
  const [req, setReq] = useState<any>(undefined); 
  const [loadingReq, setLoadingReq] = useState(true);

  const [lineasEdicion, setLineasEdicion] = useState<Linea[]>([]);
  const [processing, setProcessing] = useState(false);

  // Modales
  const [modalOpen, setModalOpen] = useState(false); 
  const [modalAction, setModalAction] = useState<'rechazar' | 'corregir' | null>(null);
  const [motivoAccion, setMotivoAccion] = useState('');
  
  const [confirmTomarOpen, setConfirmTomarOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [confirmEntregaOpen, setConfirmEntregaOpen] = useState(false);
  const [confirmFinalizarServicioOpen, setConfirmFinalizarServicioOpen] = useState(false);

  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [proveedorInput, setProveedorInput] = useState("");
  const proveedorInputRef = useRef<HTMLInputElement>(null);

  const [transitionModal, setTransitionModal] = useState<{
      open: boolean;
      title: string;
      message: string;
      action: () => Promise<void>;
  }>({ open: false, title: '', message: '', action: async () => {} });

  // --- EFECTO DE CARGA ---
  useEffect(() => {
    if (!id) return;
    
    const cargar = async () => {
        setLoadingReq(true);
        const enContexto = requisiciones.find(r => r.id === id);
        
        if (enContexto) {
            setReq(enContexto);
            setLineasEdicion(enContexto.lineas || []);
            setLoadingReq(false);
        } else {
            const desdeDb = await obtenerRequisicion(id);
            if (desdeDb) {
                setReq(desdeDb);
                setLineasEdicion(desdeDb.lineas || []);
            } else {
                toast("La solicitud no existe o no tienes acceso.", "error");
                navigate("/revision/requisiciones");
            }
            setLoadingReq(false);
        }
    };
    
    cargar();
  }, [id, requisiciones, obtenerRequisicion, navigate]);

  useEffect(() => {
    if (authModalOpen) {
        const timer = setTimeout(() => {
            if (proveedorInputRef.current) proveedorInputRef.current.focus();
        }, 100);
        return () => clearTimeout(timer);
    }
  }, [authModalOpen]);

  if (loadingReq) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[50vh] animate-pulse">
            <div className="w-10 h-10 border-4 border-[var(--color-brand)]/30 border-t-[var(--color-brand)] rounded-full animate-spin mb-4"></div>
            <p className="text-gray-400 font-medium">Cargando detalles...</p>
        </div>
      );
  }

  if (!req) return null;

  // --- VARIABLES DERIVADAS ---
  const esFlujoFisico = req 
      ? requiereEntregaFisica(req.tipoMaterial, req.subTipoMaterial) 
      : true;

  const userRole = role as string;
  const isAlmacen = userRole === 'almacen'; 
  const isRevisor = userRole === 'revision' || userRole === 'admin';
  const isAutorizador = userRole === 'autorizacion' || userRole === 'direccion' || userRole === 'admin';

  const enRevision = req.estado === 'en_revision';
  const enCotizacion = req.estado === 'cotizacion';
  const enSuficiencia = req.estado === 'suficiencia';
  const enAutorizada = req.estado === 'autorizada';
  const enEntrega = req.estado === 'material_entregado'; 
  const enFinalizada = req.estado === 'finalizada';

  // NUEVO: Validación para permitir imprimir el formato solo en etapas avanzadas
  const permiteImprimirFormato = ['suficiencia', 'autorizada', 'material_entregado', 'finalizada'].includes(req.estado);

  const soyElRevisor = req.revisandoPor?.uid === user?.uid;
  const sinAsignar = !req.revisandoPor?.uid;
  const puedeEditar = enRevision && soyElRevisor;
  const puedeAutorizar = isAutorizador;

  const getPartidasObservadas = () => lineasEdicion.filter(l => l.observacionRevision && l.observacionRevision.trim() !== '');
  const partidasConObservaciones = getPartidasObservadas();

  const crearEvento = (accion: string, comentario: string = ''): EventoHistorial => ({
      fecha: new Date().toISOString(),
      autor: user?.email || user?.titular || 'Sistema', 
      accion,
      comentario
  });

  // --- FUNCIONES Y HANDLERS ---

  const handleDescargarCSV = () => {
      const itemsParaCsv = lineasEdicion.filter(l => (l.cantidadAutorizada ?? 0) > 0);
      if (itemsParaCsv.length === 0) {
          toast("No hay partidas con cantidad autorizada para exportar.", "info");
          return;
      }
      const BOM = "\uFEFF"; 
      const headers = "CANT. AUT.,UNIDAD,CONCEPTO,DESCRIPCIÓN\n";
      const rows = itemsParaCsv.map(item => {
          const clean = (text: string) => `"${(text || '').replace(/"/g, '""')}"`;
          return `${item.cantidadAutorizada},${clean(item.unidad)},${clean(item.concepto)},${clean(item.descripcion)}`;
      }).join("\n");

      const blob = new Blob([BOM + headers + rows], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Cotizacion_${req.folio}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };

  const solicitarTransicion = (title: string, message: string, action: () => Promise<void>) => {
      setTransitionModal({ open: true, title, message, action });
  };

  const ejecutarTransicionConfirmada = async () => {
      setTransitionModal(prev => ({ ...prev, open: false }));
      setProcessing(true);
      try {
          await transitionModal.action();
      } catch (e) {
          console.error(e);
          toast("Ocurrió un error en la operación.", "error");
      } finally {
          setProcessing(false);
      }
  };

  // --- ACCIONES DE FLUJO ---

  const ejecutarTomarRevision = async () => {
      if (!user) return;
      setConfirmTomarOpen(false);
      setProcessing(true);
      try {
          await actualizarRequisicion(req.id, {
              revisandoPor: { uid: user.uid, nombre: user.titular || user.email, email: user.email, fechaInicio: new Date().toISOString() }
          });
          
          await agregarNotificacion({
              targetUid: req.creadoPor.uid,
              reqId: req.id,
              folio: req.folio,
              tipo: 'info',
              mensaje: `Su solicitud con folio ${req.folio} ha sido asignada a un analista técnico. Se ha iniciado el proceso de revisión.`
          });

          toast("Solicitud asignada correctamente.", "success");
      } catch (e) { toast("Error al asignar.", "error"); } 
      finally { setProcessing(false); }
  };

  const guardarCambios = async () => {
      setProcessing(true);
      try {
          await actualizarLineas(req.id, lineasEdicion);
          toast("Cambios guardados.", "success");
      } catch (e) { toast("Error al guardar.", "error"); } 
      finally { setProcessing(false); }
  };

  const procesoEnviarCotizacion = async () => {
      const evento = crearEvento('Turnado a Cotización', 'Validación técnica completada. Se procede a cotizar.');
      await actualizarRequisicion(req.id, { 
          estado: 'cotizacion', 
          lineas: lineasEdicion, 
          historialObservaciones: [...(req.historialObservaciones || []), evento] 
      });

      await agregarNotificacion({
          targetUid: req.creadoPor.uid,
          reqId: req.id,
          folio: req.folio,
          tipo: 'info',
          mensaje: `La solicitud ${req.folio} ha avanzado a la etapa de Cotización. Por favor, mantente atento a cualquier indicación.`
      });

      toast("Enviado a Cotización.", "success");
  };

  const procesoEnviarSuficiencia = async () => {
      const evento = crearEvento('Suficiencia Presupuestal', 'Turnado para Validación Presupuestal.');
      await actualizarRequisicion(req.id, { 
          estado: 'suficiencia', 
          historialObservaciones: [...(req.historialObservaciones || []), evento] 
      });

      await agregarNotificacion({
          targetUid: req.creadoPor.uid,
          reqId: req.id,
          folio: req.folio,
          tipo: 'info',
          mensaje: `La solicitud ${req.folio} cuenta con cotización validada y está lista para solicitar Suficiencia Presupuestal para dictamen financiero. IMPORTANTE: Descargue el formato, imprímalo y entréguelo firmado en la Dirección de Adquisiciones.`
      });

      toast("Turnado a suficiencia.", "success");
  };

  const procesoRegresarRevision = async () => {
      const evento = crearEvento('Devolución a Revisión', 'Se requiere ajustar especificaciones técnicas.');
      await actualizarRequisicion(req.id, { 
          estado: 'en_revision',
          historialObservaciones: [...(req.historialObservaciones || []), evento]
      });

      await agregarNotificacion({
          targetUid: req.creadoPor.uid,
          reqId: req.id,
          folio: req.folio,
          tipo: 'info',
          mensaje: `La solicitud ${req.folio} ha sido devuelta a la etapa de Revisión Técnica para ajustes en la cotización o especificaciones. Por favor, mantente atento a cualquier indicación.`
      });

      toast("Devuelto a Revisión.", "info");
  };

  const procesoRegresarSuficienciaARevision = async () => {
      const evento = crearEvento('Rechazo Presupuestal', 'Devuelto a Revisión para ajuste de partidas por insuficiencia.');
      await actualizarRequisicion(req.id, { 
          estado: 'en_revision', 
          historialObservaciones: [...(req.historialObservaciones || []), evento]
      });

      await agregarNotificacion({
          targetUid: req.creadoPor.uid,
          reqId: req.id,
          folio: req.folio,
          tipo: 'error',
          mensaje: `La solicitud ${req.folio} ha sido devuelta a la etapa de Revisión por ajustes presupuestales. Por favor, mantente atento a cualquier indicación.`
      });
      
      toast("Devuelto a Revisión por Presupuesto.", "info");
  };

  const confirmarRechazoOCorreccion = async () => {
      const partidasObs = getPartidasObservadas();
      const hayObservaciones = partidasObs.length > 0;
      const hayNotaGeneral = motivoAccion.trim().length > 0;

      if (!hayObservaciones && !hayNotaGeneral) {
          toast("Si no hay observaciones por partida, debes indicar una instrucción general.", "error");
          return;
      }

      setProcessing(true);
      try {
          const nuevoEstado: EstadoRequisicion = modalAction === 'rechazar' ? 'rechazada' : 'borrador'; 
          
          let resumenObs = "";
          if (hayObservaciones) {
              resumenObs = "\nDETALLE TÉCNICO:\n" + partidasConObservaciones.map(p => `- ${p.concepto}: ${p.observacionRevision}`).join('\n');
          }
          
          const comentarioFinal = `${motivoAccion}\n${resumenObs}`.trim();
          const evento = crearEvento(modalAction === 'rechazar' ? 'No Procedente' : 'Solicitud de Ajustes', comentarioFinal);
          
          await actualizarRequisicion(req.id, { 
              estado: nuevoEstado, 
              revisionNotas: comentarioFinal, 
              historialObservaciones: [...(req.historialObservaciones || []), evento], 
              lineas: lineasEdicion 
          });

          if (modalAction === 'rechazar') {
             await agregarNotificacion({
                targetUid: req.creadoPor.uid,
                reqId: req.id, folio: req.folio, tipo: 'error',
                mensaje: `La solicitud ${req.folio} ha sido RECHAZADA por no cumplir con los criterios establecidos. Favor de revisar el motivo en el sistema.`
             });
          } else {
             await agregarNotificacion({
                targetUid: req.creadoPor.uid,
                reqId: req.id, folio: req.folio, tipo: 'info',
                mensaje: `Se han detectado observaciones en la solicitud ${req.folio}. Favor de ingresar al sistema para realizar los ajustes indicados.`
             });
          }

          toast("Procesado correctamente.", "info");
          setModalOpen(false);
          navigate('/revision/requisiciones');
      } catch (e) { toast("Error al procesar.", "error"); } 
      finally { setProcessing(false); }
  };

  const setupRechazo = () => { setModalAction('rechazar'); setMotivoAccion(''); setModalOpen(true); };
  const setupCorreccion = () => { setModalAction('corregir'); setMotivoAccion(''); setModalOpen(true); };
  
  const handleOpenAutorizar = () => { setProveedorInput(""); setAuthModalOpen(true); };

  const confirmAutorizacion = async () => {
      if (!proveedorInput.trim()) return toast("Ingresa el proveedor", "error");
      setProcessing(true);
      try {
          const evento = crearEvento('Solicitud Aprobada', `Adjudicado a: ${proveedorInput}`);
          await actualizarRequisicion(req.id, { estado: 'autorizada', proveedor: proveedorInput, historialObservaciones: [...(req.historialObservaciones || []), evento] });
          
          if (esFlujoFisico) {
              await agregarNotificacion({ reqId: req.id, folio: req.folio, mensaje: `Entrega Autorizada (${req.area}).`, tipo: 'success', targetRole: 'almacen' });
          }
          
          await agregarNotificacion({
              targetUid: req.creadoPor.uid,
              reqId: req.id,
              folio: req.folio,
              tipo: 'success',
              mensaje: `La solicitud ${req.folio} ha sido AUTORIZADA. Favor de contactar a la Dirección de Adquisiciones y Servicios para coordinar la entrega o ejecución.`
          });
          
          toast("Autorizada correctamente.", "success");
          setAuthModalOpen(false);
      } catch (e) { console.error(e); } 
      finally { setProcessing(false); }
  };
  
  const confirmarEntregaAlmacen = async () => {
      setConfirmEntregaOpen(false);
      setProcessing(true);
      try {
          const evento = crearEvento('Entrega en Almacén', 'Entrega de Bienes Concluida.');
          await actualizarRequisicion(req.id, { estado: 'finalizada', historialObservaciones: [...(req.historialObservaciones || []), evento] });
          
          await agregarNotificacion({
              targetUid: req.creadoPor.uid,
              reqId: req.id,
              folio: req.folio,
              tipo: 'success',
              mensaje: `Se ha registrado la entrega física de los bienes correspondientes a la solicitud ${req.folio}. El trámite ha concluido exitosamente.`
          });

          toast("Entrega registrada.", "success");
          navigate('/revision/requisiciones');
      } catch(e) { console.error(e); } 
      finally { setProcessing(false); }
  };

  const finalizarServicio = async () => {
      setConfirmFinalizarServicioOpen(false);
      setProcessing(true);
      try {
          const evento = crearEvento('Servicio/Intangible Entregado', 'Concluido satisfactoriamente.');
          await actualizarRequisicion(req.id, { estado: 'finalizada', historialObservaciones: [...(req.historialObservaciones || []), evento] });
          
          await agregarNotificacion({ 
              targetUid: req.creadoPor.uid, 
              reqId: req.id, 
              folio: req.folio, 
              tipo: 'success', 
              mensaje: `El servicio de la solicitud ${req.folio} ha sido marcado como CONCLUIDO y recibido a satisfacción.` 
          });
          
          toast("Proceso finalizado.", "success");
          navigate('/revision/requisiciones');
      } catch(e) { console.error(e); } finally { setProcessing(false); }
  };
  
  const setupFinalizar = async () => {
      const evento = crearEvento('Cierre Administrativo', 'Expediente archivado.');
      await actualizarRequisicion(req.id, { estado: 'finalizada', historialObservaciones: [...(req.historialObservaciones || []), evento] });
      toast("Proceso finalizado.", "success");
      navigate('/revision/requisiciones');
  };

  const handleLineaChange = (idx: number, field: keyof Linea, val: any) => {
      const copy = [...lineasEdicion];
      // @ts-ignore
      copy[idx] = { ...copy[idx], [field]: val };
      setLineasEdicion(copy);
  };

  return (
    <div className="pb-20">
      
      {/* -------------------------------------------------------
          HEADER MEJORADO: NAVEGACIÓN PROFESIONAL
          -------------------------------------------------------
      */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
         <div className="flex items-center gap-3 group">
             {/* Botón de Regreso Elegante */}
             <button 
                onClick={() => navigate(-1)} 
                className="flex items-center gap-2 text-slate-400 hover:text-[var(--color-brand)] transition-colors py-2"
                title="Volver a la bandeja"
             >
                <div className="p-2 rounded-full border border-slate-200 bg-white group-hover:border-[var(--color-brand)]/30 group-hover:bg-[var(--color-brand)]/5 transition-all shadow-sm">
                    <ArrowLeft size={18} className="transition-transform group-hover:-translate-x-0.5" />
                </div>
                <div className="hidden sm:block text-xs font-bold uppercase tracking-wider text-slate-500 group-hover:text-[var(--color-brand)] transition-colors">
                    SALIR
                </div>
             </button>

             {/* Divisor Vertical */}
             <div className="h-8 w-px bg-gray-200 mx-1"></div>

             {/* Título y Badge */}
             <div>
                 <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                     {req.folio}
                     <Badge variant={req.estado === 'autorizada' ? 'success' : req.estado === 'rechazada' ? 'danger' : 'default'}>
                        {req.estado.replace('_', ' ')}
                     </Badge>
                 </h1>
                 <p className="text-sm text-gray-500 font-medium">
                    Solicitado el {new Date(req.fechaSolicitud).toLocaleDateString()}
                 </p>
             </div>
         </div>
         
         <div className="flex flex-wrap gap-2">
             <Button variant="ghost" size="sm" icon={History} onClick={() => setHistoryOpen(true)}>Historial</Button>
             
             {/* RENDERIZADO CONDICIONAL MODIFICADO AQUI */}
             {!isAlmacen && (
                <>
                    {enCotizacion && isRevisor && (
                        <>
                            <Button 
                                variant="outline" 
                                size="sm" 
                                icon={Download} 
                                onClick={handleDescargarCSV}
                            >
                                CSV
                            </Button>

                            <Button 
                                variant="outline" 
                                size="sm" 
                                icon={Printer} 
                                onClick={() => window.open(`#/requisiciones/${req.id}/cotizacion`, '_blank')}
                            >
                                Cotización
                            </Button>
                        </>
                    )}
                    {permiteImprimirFormato && (
                        <Button variant="outline" size="sm" icon={Printer} onClick={() => window.open(`#/requisiciones/${req.id}/print`, '_blank')}>Formato</Button>
                    )}
                </>
             )}
             {isAlmacen && permiteImprimirFormato && (
                 <Button variant="outline" size="sm" icon={Printer} onClick={() => window.open(`#/requisiciones/${req.id}/print`, '_blank')}>Formato</Button>
             )}
         </div>
      </div>

      {/* Alerta de Rechazo */}
      {req.estado === 'rechazada' && req.revisionNotas && (
         <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded-r-lg shadow-sm animate-fade-in-up">
             <div className="flex items-start gap-3">
                 <AlertTriangle className="text-red-600 mt-0.5 shrink-0" size={24} />
                 <div>
                     <h3 className="font-bold text-red-800 text-lg">Solicitud No Procedente</h3>
                     <div className="text-red-700 text-sm mt-2 whitespace-pre-wrap leading-relaxed border-t border-red-200 pt-2">
                         {req.revisionNotas}
                     </div>
                 </div>
             </div>
         </div>
      )}

      {/* Tarjeta Información */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6">
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1"><label className="text-xs font-bold text-gray-500 uppercase block">Órgano Requirente</label><p className="font-medium text-gray-900">{req.organoRequirente}</p></div>
              <div className="space-y-1"><label className="text-xs font-bold text-gray-500 uppercase block">Área Solicitante</label><p className="font-medium text-gray-900">{req.area}</p></div>
              <div className="md:col-span-2">
                  <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Categoría del Gasto</label>
                  <div className="inline-block p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-bold text-gray-800">
                      {req.subTipoMaterial || req.tipoMaterial}
                  </div>
              </div>
              <div className="md:col-span-2 space-y-1"><label className="text-xs font-bold text-gray-500 uppercase block">Justificación</label><div className="p-3 bg-gray-50 rounded-lg text-sm text-gray-700 italic border border-gray-100">{req.justificacion}</div></div>
              {req.adjuntos && req.adjuntos.length > 0 && (
                  <div className="md:col-span-2 space-y-1"><label className="text-xs font-bold text-gray-500 uppercase block flex items-center gap-2"><Paperclip size={14}/> Evidencias Adjuntas</label><div className="flex flex-wrap gap-2">{req.adjuntos.map((adj: any, i: number) => (<a key={i} href={adj.url} target="_blank" rel="noreferrer" className="flex items-center gap-2 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium border border-blue-100"><FileText size={16} />{adj.nombre}</a>))}</div></div>
              )}
              <div className="space-y-1 border-t border-gray-100 pt-4 md:col-span-2">
                  <div className="flex gap-8">
                      <div><label className="text-xs font-bold text-gray-500 uppercase block">Responsable</label><p className="font-medium text-gray-900">{req.responsableNombre}</p></div>
                      <div><label className="text-xs font-bold text-gray-500 uppercase block">Contacto</label><div className="flex items-center gap-1 text-gray-900 font-medium"><Phone size={14} className="text-gray-400" />{req.responsableTelefono}</div></div>
                  </div>
              </div>
              {req.proveedor && (<div className="md:col-span-2 border-t border-gray-100 pt-4"><label className="text-xs font-bold text-blue-600 uppercase block">Proveedor</label><p className="font-medium text-gray-900">{req.proveedor}</p></div>)}
          </div>
      </div>

      {/* Tabla de Partidas */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6">
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
              <h3 className="font-bold text-gray-800 flex items-center gap-2">
                  <ListChecks size={18} className="text-[var(--color-brand)]" />
                  Detalle de Material o Servicio
              </h3>
              {!puedeEditar && <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded">Lectura</span>}
          </div>
          
          <div className="hidden md:grid md:grid-cols-12 gap-2 px-6 py-3 bg-gray-50/50 border-b border-gray-100 text-xs font-bold text-gray-500 uppercase tracking-wider">
              <div className="col-span-1 text-center">Cant.</div>
              <div className="col-span-1">Unidad</div>
              <div className="col-span-3">Concepto</div>
              <div className="col-span-4">Descripción</div>
              <div className="col-span-1 text-center">Autorizada</div>
              <div className="col-span-2 text-center">Observaciones</div>
          </div>

          <div className="divide-y divide-gray-100">
              {lineasEdicion.map((item, idx) => (
                  <div key={item.id} className="flex flex-col md:grid md:grid-cols-12 gap-2 p-4 md:px-6 md:py-4 md:items-start text-sm hover:bg-gray-50 transition-colors">
                      <div className="md:col-span-1 md:text-center flex justify-between md:block"><span className="md:hidden text-xs font-bold text-gray-400">CANTIDAD:</span><span className="font-bold text-gray-800">{item.cantidad}</span></div>
                      <div className="md:col-span-1 flex justify-between md:block"><span className="md:hidden text-xs font-bold text-gray-400">UNIDAD:</span><span className="text-gray-500 uppercase text-xs">{item.unidad}</span></div>
                      <div className="md:col-span-3"><span className="md:hidden text-xs font-bold text-gray-400 block mb-1">CONCEPTO:</span><p className="font-medium text-gray-900">{item.concepto}</p></div>
                      <div className="md:col-span-4 text-gray-600 text-xs leading-relaxed"><span className="md:hidden text-xs font-bold text-gray-400 block mb-1">DESCRIPCIÓN:</span>{item.descripcion}</div>
                      
                      <div className="md:col-span-1 flex justify-between md:block md:text-center bg-yellow-50/30 -mx-4 md:mx-0 px-4 md:px-0 py-2 md:py-0">
                          <span className="md:hidden text-xs font-bold text-gray-400 self-center">AUTORIZADA:</span>
                          {puedeEditar ? (
                              <input 
                                  type="number" 
                                  min="0" 
                                  className={`w-full text-center border rounded outline-none p-1 font-bold 
                                    ${(item.cantidadAutorizada === 0) 
                                      ? 'border-red-500 bg-red-100 text-red-600 focus:ring-red-400' 
                                      : 'border-yellow-200 bg-yellow-50 text-gray-800 focus:ring-1 focus:ring-yellow-400' 
                                    }`}
                                  value={item.cantidadAutorizada ?? item.cantidad} 
                                  onChange={(e) => handleLineaChange(idx, 'cantidadAutorizada', parseInt(e.target.value) || 0)} 
                              />
                          ) : (
                              <span className={`font-bold ${(item.cantidadAutorizada === 0) ? 'text-red-600' : 'text-gray-900'}`}>
                                  {item.cantidadAutorizada ?? '-'}
                              </span>
                          )}
                      </div>
                      
                      <div className="md:col-span-2">
                          <span className="md:hidden text-xs font-bold text-gray-400 block mb-1">OBSERVACIONES:</span>
                          {puedeEditar ? (
                              <textarea className="w-full border border-gray-200 rounded px-2 py-1 text-xs resize-y" placeholder="Observación..." rows={1} value={item.observacionRevision || ''} onChange={(e) => handleLineaChange(idx, 'observacionRevision', e.target.value)} />
                          ) : (
                              item.observacionRevision && <div className="text-xs text-red-600 bg-red-50 p-2 rounded border border-red-100">{item.observacionRevision}</div>
                          )}
                      </div>
                  </div>
              ))}
          </div>
      </div>

      {/* Barra Acciones */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200 flex justify-end gap-3 z-40 md:static md:bg-transparent md:border-0 md:p-0">
         {!isAlmacen && (
             <>
                 {enRevision && sinAsignar && isRevisor && <Button variant="primary" icon={Play} onClick={() => setConfirmTomarOpen(true)} loading={processing}>Tomar Revisión</Button>}
                 
                 {enRevision && soyElRevisor && (
                     <>
                        <Button variant="danger" icon={XCircle} onClick={setupRechazo}>Rechazar</Button>
                        <Button variant="secondary" icon={AlertTriangle} onClick={setupCorreccion}>Corrección</Button>
                        <Button variant="outline" icon={Save} onClick={guardarCambios} loading={processing}>Guardar</Button>
                        
                        <Button 
                            variant="primary" 
                            icon={Send} 
                            onClick={() => solicitarTransicion(
                                "Avanzar a Cotización", 
                                "¿Estás seguro de finalizar la revisión técnica y enviar a cotización? Asegúrate de haber guardado los cambios.",
                                procesoEnviarCotizacion
                            )} 
                            loading={processing}
                        >
                            A Cotización
                        </Button>
                     </>
                 )}

                 {enCotizacion && (isRevisor || isAutorizador) && (
                     <>
                        <Button 
                            variant="secondary" 
                            icon={RotateCcw} 
                            onClick={() => solicitarTransicion(
                                "Regresar a Revisión",
                                "Esta acción devolverá la solicitud a la etapa de Revisión Técnica para realizar ajustes.",
                                procesoRegresarRevision
                            )}
                        >
                            Regresar a Revisión
                        </Button>

                        <Button 
                            variant="primary" 
                            icon={DollarSign} 
                            onClick={() => solicitarTransicion(
                                "Enviar a Suficiencia",
                                "Se enviará el expediente para validación presupuestal. ¿Confirmar envío?",
                                procesoEnviarSuficiencia
                            )}
                        >
                            A Suficiencia
                        </Button>
                     </>
                 )}

                 {enSuficiencia && (
                     <>
                        {(isRevisor || isAutorizador) && (
                            <Button 
                                variant="secondary" 
                                icon={RotateCcw} 
                                onClick={() => solicitarTransicion(
                                    "Devolver a Revisión",
                                    "La solicitud será devuelta a la etapa de Revisión para ajuste de partidas por temas presupuestales.",
                                    procesoRegresarSuficienciaARevision
                                )}
                            >
                                Regresar a Revisión
                            </Button>
                        )}
                        {(isRevisor || puedeAutorizar) && (
                            <Button variant="primary" icon={CheckCheck} onClick={handleOpenAutorizar}>Autorizar</Button>
                        )}
                     </>
                 )}

                 {enAutorizada && (
                     <>
                        {esFlujoFisico ? (
                             <div className="flex items-center gap-2 text-blue-600 bg-blue-50 px-4 py-2 rounded-lg"><PackageCheck size={18} /><span className="font-bold text-sm">Esperando entrega en Almacén</span></div>
                        ) : (
                             (isRevisor || isAutorizador) && (
                                <Button 
                                    variant="primary" 
                                    icon={CheckCheck} 
                                    className="bg-green-600 hover:bg-green-700 text-white"
                                    onClick={() => setConfirmFinalizarServicioOpen(true)}
                                >
                                    Finalizar Servicio/Entrega
                                </Button>
                             )
                        )}
                     </>
                 )}
             </>
         )}
         {isAlmacen && (
             <>
                 {(enAutorizada && esFlujoFisico) ? (
                     <Button variant="primary" icon={PackageCheck} onClick={() => setConfirmEntregaOpen(true)} className="bg-purple-600 hover:bg-purple-700 text-white">Confirmar Entrega</Button>
                 ) : !enFinalizada ? (
                     <span className="text-gray-400 italic text-sm">Espera autorización o no requiere entrega física...</span>
                 ) : null}
             </>
         )}
         {enFinalizada && <span className="text-green-600 font-bold flex items-center gap-2"><Archive size={16}/> Finalizado</span>}
         {isRevisor && enEntrega && <Button variant="primary" icon={Archive} onClick={setupFinalizar}>Finalizar Proceso</Button>}
      </div>

      <ConfirmModal 
         isOpen={transitionModal.open} 
         onClose={() => setTransitionModal(prev => ({...prev, open: false}))}
         onConfirm={ejecutarTransicionConfirmada}
         title={transitionModal.title}
         message={transitionModal.message}
         type="info"
      />

      <ConfirmModal 
         isOpen={confirmEntregaOpen} onClose={() => setConfirmEntregaOpen(false)}
         onConfirm={confirmarEntregaAlmacen}
         title="Confirmar Entrega"
         message="Confirmo que he entregado los bienes o servicios. Esta acción registrará la salida definitiva."
         type="info"
      />

      <ConfirmModal 
         isOpen={confirmFinalizarServicioOpen} onClose={() => setConfirmFinalizarServicioOpen(false)}
         onConfirm={finalizarServicio}
         title="Confirmar Finalización"
         message="Confirmo que el servicio ha sido recibido satisfactoriamente."
         type="info"
      />
      
      <ConfirmModal 
        isOpen={modalOpen} 
        onClose={() => setModalOpen(false)} 
        onConfirm={confirmarRechazoOCorreccion} 
        title={modalAction === 'rechazar' ? 'Dictaminar No Procedencia' : 'Solicitar Ajustes'} 
        type="warning"
      > 
        <div className="space-y-4 text-sm text-gray-700">
             <p className="font-medium">
                 {modalAction === 'rechazar' 
                  ? 'Se notificará que la solicitud no procede por los siguientes motivos:' 
                  : 'Se devolverá la solicitud al usuario para subsanar lo siguiente:'}
             </p>

             {partidasConObservaciones.length > 0 && (
                 <div className="bg-amber-50 border border-amber-200 rounded-lg overflow-hidden">
                     <div className="px-3 py-2 bg-amber-100/50 border-b border-amber-200 flex items-center gap-2">
                          <AlertTriangle size={14} className="text-amber-700"/>
                          <span className="text-xs font-bold text-amber-800 uppercase">Observaciones Técnicas</span>
                     </div>
                     <ul className="divide-y divide-amber-200/50 max-h-40 overflow-y-auto">
                         {partidasConObservaciones.map((item, idx) => (
                             <li key={idx} className="p-3 text-xs">
                                 <span className="font-bold text-gray-900">{item.concepto}:</span>
                                 <span className="ml-1 text-gray-600 italic">{item.observacionRevision}</span>
                             </li>
                         ))}
                     </ul>
                 </div>
             )}

             <div>
                  <label className="text-xs font-bold text-gray-500 uppercase block mb-1">
                      Dictamen General / Instrucciones
                  </label>
                  <textarea 
                      className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[var(--color-brand)]/20 outline-none resize-y min-h-[80px]"
                      placeholder={partidasConObservaciones.length > 0 ? "Opcional: Comentarios adicionales..." : "Requerido: Describe el motivo del ajuste..."}
                      value={motivoAccion}
                      onChange={e => setMotivoAccion(e.target.value)}
                  />
             </div>
        </div>
      </ConfirmModal>

      <ConfirmModal 
        isOpen={confirmTomarOpen} onClose={() => setConfirmTomarOpen(false)} 
        onConfirm={ejecutarTomarRevision} 
        title="Tomar Revisión" 
        message="Al confirmar, te asignarás esta solicitud para su revisión técnica."
        type="info" 
      />
      
      {authModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-scale-in">
            <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-2xl">
                 <h3 className="text-xl font-bold mb-2 flex items-center gap-2 text-gray-900">
                     <CheckCheck className="text-green-600"/> Autorizar Adquisición
                 </h3>
                 <p className="text-sm text-gray-500 mb-4 leading-relaxed">
                     Para finalizar la autorización, ingrese el nombre del <strong>proveedor adjudicado</strong>.
                 </p>
                 <input 
                   ref={proveedorInputRef}
                   className="w-full border border-gray-300 p-3 rounded-lg mb-4 outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all" 
                   placeholder="Ej. Papelería El Centro S.A. de C.V." 
                   value={proveedorInput} 
                   onChange={e=>setProveedorInput(e.target.value)} 
                 />
                 <div className="flex justify-end gap-2">
                     <Button variant="ghost" onClick={() => setAuthModalOpen(false)}>Cancelar</Button>
                     <Button variant="primary" onClick={confirmAutorizacion} loading={processing}>Confirmar y Autorizar</Button>
                 </div>
            </div>
        </div>
      )}
      
      {historyOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh] animate-scale-in">
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <h3 className="font-bold text-gray-800 flex items-center gap-2">
                        <History size={20} className="text-[var(--color-brand)]"/> 
                        Bitácora de Movimientos
                    </h3>
                    <button onClick={() => setHistoryOpen(false)} className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-200 rounded-full transition-colors">
                        <X size={20} />
                    </button>
                </div>
                <div className="p-6 overflow-y-auto">
                   {!req.historialObservaciones?.length ? <p className="text-center text-gray-500 italic py-8">Sin registros en bitácora.</p> : (
                       <div className="space-y-6 relative before:absolute before:inset-0 before:ml-2.5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-200 before:to-transparent">
                           {req.historialObservaciones.map((h: any, i: number) => (
                               <div key={i} className="relative pl-8">
                                   <div className="absolute left-0 top-1 h-5 w-5 rounded-full border-4 border-white bg-[var(--color-brand)] shadow-sm"></div>
                                   <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between">
                                       <p className="font-bold text-gray-900">{h.accion}</p>
                                       <span className="text-xs text-gray-400 font-mono">
                                           {new Date(h.fecha).toLocaleString()}
                                       </span>
                                   </div>
                                   <p className="text-xs text-[var(--color-brand)] font-medium mt-0.5 lowercase tracking-wide">
                                       {h.autor}
                                   </p>
                                   {h.comentario && (
                                       <div className="mt-2 p-3 bg-gray-50 rounded-lg text-sm text-gray-600 italic border border-gray-100 whitespace-pre-wrap">
                                           {h.comentario}
                                       </div>
                                   )}
                               </div>
                           ))}
                       </div>
                   )}
                </div>
            </div>
        </div>
      )}
    </div>
  );
}