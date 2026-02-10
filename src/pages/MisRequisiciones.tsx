import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useRequisiciones } from "../hooks/useRequisiciones";
import { useSession } from "../hooks/useSession";
import { useToast } from "../hooks/useToast";
import ConfirmModal from "../components/ui/ConfirmModal";
import { 
  FileText, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Plus, 
  Search,
  Eye,
  Edit,
  Trash2,
  LayoutDashboard
} from "lucide-react";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";

// MODIFICADO: Ajustamos los tipos para la nueva lógica de pestañas
type TabType = 'por_atender' | 'proceso' | 'finalizadas';

export default function MisRequisiciones() {
  const { user } = useSession();
  const { requisiciones, loading, eliminarBorrador } = useRequisiciones(); 
  const navigate = useNavigate();
  const { toast } = useToast();

  // MODIFICADO: Estado inicial apuntando a la nueva pestaña principal
  const [activeTab, setActiveTab] = useState<TabType>('por_atender');
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  if (loading) return <div className="p-8 text-center text-gray-500 animate-pulse">Cargando tus trámites...</div>;

  // Filtrado Base: Solo mis documentos
  const misDocs = requisiciones.filter(req => req.creadoPor?.uid === user?.uid);

  // Lógica de filtrado para la lista visible
  const filteredData = misDocs.filter(req => {
    // Filtro por Buscador
    if (searchTerm) {
      const match = (req.folio || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
                    (req.area || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
                    (req.tipoMaterial || "").toLowerCase().includes(searchTerm.toLowerCase());
      if (!match) return false;
    }

    // MODIFICADO: Nueva lógica de agrupación de estados
    switch (activeTab) {
      case 'por_atender': 
        // REGLA 1: Solo Borradores. Lo único que está "vivo" en manos del usuario para editar.
        return ['borrador'].includes(req.estado);

      case 'proceso':
        // Muestra lo que está en manos de la administración
        return ['en_revision', 'cotizacion', 'suficiencia'].includes(req.estado);

      case 'finalizadas':
        // REGLA 2: Incluye Éxito (Autorizada/Finalizada) y Fracaso (Rechazada)
        // Ambos son ciclos concluidos.
        return ['autorizada', 'finalizada', 'material_entregado', 'rechazada'].includes(req.estado);

      default:
        return true;
    }
  });

  // --- CÁLCULO DE CONTADORES ACTUALIZADO ---
  const counts = {
    por_atender: misDocs.filter(r => ['borrador'].includes(r.estado)).length,
    proceso: misDocs.filter(r => ['en_revision', 'cotizacion', 'suficiencia'].includes(r.estado)).length,
    finalizadas: misDocs.filter(r => ['autorizada', 'finalizada', 'material_entregado', 'rechazada'].includes(r.estado)).length
  };

  const handleDelete = async () => {
    if (deleteId) {
      // Reutilizamos eliminarBorrador (deleteDoc) que funciona para cualquier doc propio
      await eliminarBorrador(deleteId);
      toast("Solicitud eliminada correctamente", "success");
      setDeleteId(null);
    }
  };

  // MODIFICADO: Configuración de pestañas con nuevos nombres e iconos
  const tabs = [
    { id: 'por_atender', label: 'Por Atender', icon: AlertCircle, count: counts.por_atender },
    { id: 'proceso', label: 'En Proceso', icon: Clock, count: counts.proceso },
    { id: 'finalizadas', label: 'Finalizadas', icon: CheckCircle, count: counts.finalizadas },
  ];

  return (
    <React.Fragment>
      {/* MODAL REUTILIZADO: Mantenemos el mismo componente y mensajes 
        como se solicitó, ya que la acción destructiva es idéntica.
      */}
      <ConfirmModal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Eliminar Solicitud" 
        message="¿Estás seguro de que deseas eliminar esta solicitud permanentemente? Esta acción no se puede deshacer."
      />

      <div className="space-y-6 pb-20">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Mis Trámites</h1>
            <p className="text-sm text-gray-500">Consulta el estado de tus solicitudes.</p>
          </div>
          <Button icon={Plus} onClick={() => navigate('/nueva')}>
            Nueva Solicitud
          </Button>
        </div>

        {/* Buscador */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input 
            type="text" 
            placeholder="Buscar por folio, área o material..." 
            className="w-full pl-10 p-3 bg-white border border-gray-200 rounded-xl outline-none shadow-sm focus:ring-2 focus:ring-[var(--color-brand)]/20 transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Pestañas con Contadores */}
        <div className="flex overflow-x-auto border-b border-gray-200 no-scrollbar">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`flex items-center gap-2 px-6 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-brand text-brand'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <tab.icon size={16} />
              {tab.label}
              {tab.count > 0 && (
                <span className={`ml-2 text-xs py-0.5 px-2 rounded-full ${
                  activeTab === tab.id ? 'bg-brand text-white' : 'bg-gray-100 text-gray-600'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Lista de Resultados */}
        <div className="min-h-[300px]">
          {filteredData.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-xl border border-dashed border-gray-300">
              <div className="inline-flex p-4 rounded-full bg-gray-50 mb-4">
                <LayoutDashboard className="text-gray-400" size={32} />
              </div>
              <p className="text-gray-900 font-medium">No hay solicitudes en esta sección.</p>
              {activeTab === 'por_atender' && (
                <button onClick={() => navigate('/nueva')} className="mt-2 text-sm text-[var(--color-brand)] font-medium hover:underline">
                  Crear una nueva solicitud
                </button>
              )}
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredData.map((req) => (
                <div key={req.id} className="group bg-white p-5 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all flex flex-col md:flex-row gap-4 items-start md:items-center">
                  
                  {/* Icono de estado visual */}
                  <div className={`p-3 rounded-full shrink-0 ${
                    req.estado === 'borrador' ? 'bg-gray-100 text-gray-500' :
                    req.estado === 'autorizada' || req.estado === 'finalizada' ? 'bg-emerald-50 text-emerald-600' :
                    req.estado === 'rechazada' ? 'bg-red-50 text-red-600' :
                    'bg-blue-50 text-blue-600'
                  }`}>
                    <FileText size={24} />
                  </div>

                  <div className="flex-1 w-full space-y-1">
                     <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono font-bold text-xs text-gray-500">{req.folio || 'SIN FOLIO'}</span>
                        <Badge variant={
                            req.estado === 'autorizada' || req.estado === 'finalizada' ? 'success' : 
                            req.estado === 'rechazada' ? 'danger' : 
                            req.estado === 'borrador' ? 'neutral' : 'warning'
                        }>
                            {req.estado.replace('_', ' ')}
                        </Badge>
                     </div>
                     <h3 className="font-bold text-gray-900 text-sm md:text-base">{req.tipoMaterial}</h3>
                     {req.subTipoMaterial && <p className="text-xs text-gray-500">{req.subTipoMaterial}</p>}
                     <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                        <span className="flex items-center gap-1">
                           <Clock size={12} /> 
                           {req.createdAt?.seconds 
                              ? new Date(req.createdAt.seconds * 1000).toLocaleDateString() 
                              : "Reciente"}
                        </span>
                     </div>
                  </div>

                  <div className="w-full md:w-auto flex gap-2 justify-end self-center">
                     
                     {/* CASO 1: BORRADOR (Editar + Eliminar) */}
                     {req.estado === 'borrador' && (
                         <>
                           <Button 
                             variant="outline" 
                             size="sm" 
                             icon={Edit}
                             onClick={() => navigate(`/nueva?edit=${req.id}`)}
                             className="w-full md:w-auto"
                           >
                             Editar
                           </Button>
                           <button 
                             onClick={() => setDeleteId(req.id)}
                             className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                             title="Eliminar borrador"
                           >
                             <Trash2 size={18} />
                           </button>
                         </>
                     )}

                     {/* CASO 2: RECHAZADA (Ver Detalle + Eliminar para limpiar) - NO EDITAR */}
                     {req.estado === 'rechazada' && (
                        <>
                           <Button 
                             variant="ghost" 
                             size="sm" 
                             icon={Eye}
                             onClick={() => navigate(`/requisiciones/${req.id}`)}
                             className="w-full md:w-auto border border-red-100 text-red-700 bg-red-50"
                           >
                             Ver Motivo
                           </Button>
                           <button 
                             onClick={() => setDeleteId(req.id)}
                             className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                             title="Eliminar del historial"
                           >
                             <Trash2 size={18} />
                           </button>
                        </>
                     )}

                     {/* CASO 3: RESTO DE ESTADOS (Solo Ver) */}
                     {!['borrador', 'rechazada'].includes(req.estado) && (
                         <Button 
                           variant="ghost" 
                           size="sm" 
                           icon={Eye}
                           onClick={() => navigate(`/requisiciones/${req.id}`)}
                           className="w-full md:w-auto border border-gray-200"
                         >
                           Ver Detalle
                         </Button>
                     )}

                  </div>

                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </React.Fragment>
  );
}