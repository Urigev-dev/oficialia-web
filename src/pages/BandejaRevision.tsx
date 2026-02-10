import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useRequisiciones, type Requisicion } from "../hooks/useRequisiciones";
import { useSession } from "../hooks/useSession";
import { 
  FileText, Clock, CheckCircle, Search, Eye, User, Inbox, Sparkles, ClipboardList, Car, SprayCan, Filter, Tag, Package 
} from "lucide-react";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";
import { requiereEntregaFisica } from "../data/catalogos"; 

type TabType = 'nuevas' | 'en_revision' | 'proceso' | 'autorizadas' | 'finalizadas';
type QuickFilterType = 'todos' | 'vehicular' | 'limpieza';

export default function BandejaRevision() {
  const { user } = useSession();
  const { requisiciones, loading } = useRequisiciones();
  const navigate = useNavigate();

  const isAlmacen = user?.role === 'almacen';

  const [activeTab, setActiveTab] = useState<TabType>('nuevas');
  const [searchTerm, setSearchTerm] = useState("");
  const [quickFilter, setQuickFilter] = useState<QuickFilterType>('todos');

  // Forzar pestaña correcta para almacén
  useEffect(() => {
      if (isAlmacen) {
          setActiveTab('autorizadas');
      }
  }, [isAlmacen]);

  if (loading) return <div className="p-8 text-center text-gray-500 animate-pulse">Cargando bandeja...</div>;

  const filteredData = requisiciones.filter(req => {
    // --- BUSCADOR GLOBAL ---
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      
      const folio = (req.folio || "").toLowerCase();
      const organo = (req.organoRequirente || "").toLowerCase();
      const tipo = (req.tipoMaterial || "").toLowerCase();
      const subTipo = (req.subTipoMaterial || "").toLowerCase();
      const justif = (req.justificacion || "").toLowerCase();

      const match = folio.includes(term) || 
                    organo.includes(term) || 
                    tipo.includes(term) ||
                    subTipo.includes(term) ||
                    justif.includes(term);
      
      if (!match) return false;
    }

    // --- FILTROS RÁPIDOS ---
    if (quickFilter !== 'todos') {
        const textoCompleto = `${req.tipoMaterial} ${req.subTipoMaterial || ''}`.toLowerCase();

        if (quickFilter === 'vehicular') {
            const terminosVehiculares = [
                "combustibles, lubricantes y aditivos",
                "refacciones y accesorios menores de equipo de transporte",
                "refacciones y accesorios menores de maquinaria y otros equipos",
                "reparación y mantenimiento de equipo de transporte",
                "instalación, reparación y mantenimiento de maquinaria, otros equipos y herramienta"
            ];
            const esVehicular = terminosVehiculares.some(t => textoCompleto.includes(t));
            if (!esVehicular) return false;
        }

        if (quickFilter === 'limpieza') {
            if (!textoCompleto.includes("material de limpieza")) return false;
        }
    }

    // Pestañas
    switch (activeTab) {
      case 'nuevas': // Solo revisor
        return req.estado === 'en_revision' && (!req.revisandoPor || !req.revisandoPor.uid);
      
      case 'en_revision': // Solo revisor
        return req.estado === 'en_revision' && req.revisandoPor?.uid === user?.uid;
      
      case 'proceso': // Solo revisor
        return ['cotizacion', 'suficiencia'].includes(req.estado) && req.revisandoPor?.uid === user?.uid;
      
      case 'autorizadas':
        // ALMACÉN: Ve autorizadas Y que requieran entrega física (Lista Blanca)
        if (isAlmacen) {
            return req.estado === 'autorizada' && requiereEntregaFisica(req.tipoMaterial, req.subTipoMaterial);
        }
        // REVISOR: Ve solo sus autorizadas (para monitorear o finalizar servicios)
        return req.estado === 'autorizada' && req.revisandoPor?.uid === user?.uid;
      
      case 'finalizadas':
        // ALMACÉN: Ve todas las finalizadas (Histórico general)
        if (isAlmacen) return req.estado === 'finalizada';
        
        // --- CAMBIO APLICADO: Solo FINALIZADAS (Exitosas). 
        // Las RECHAZADAS se ocultan de la vista operativa del Revisor.
        return req.estado === 'finalizada' && req.revisandoPor?.uid === user?.uid;
            
      default: return true;
    }
  }).sort((a, b) => new Date(b.fechaSolicitud).getTime() - new Date(a.fechaSolicitud).getTime());

  // Definición de pestañas
  let tabs = [];
  if (isAlmacen) {
      tabs = [
          { id: 'autorizadas', label: 'Por Entregar', icon: Package },
          { id: 'finalizadas', label: 'Histórico', icon: CheckCircle },
      ];
  } else {
      tabs = [
          { id: 'nuevas', label: 'Nuevas', icon: Sparkles },
          { id: 'en_revision', label: 'Mis Revisiones', icon: ClipboardList },
          { id: 'proceso', label: 'En Seguimiento', icon: Clock },
          { id: 'autorizadas', label: 'Autorizadas', icon: Package },
          { id: 'finalizadas', label: 'Histórico', icon: CheckCircle },
      ];
  }

  const renderAction = (req: Requisicion) => {
      // Acción Almacén
      if (isAlmacen) {
          if (req.estado === 'autorizada') {
              return <Button variant="primary" size="sm" icon={Package} onClick={() => navigate(`/revision/${req.id}`)}>Gestionar Entrega</Button>;
          }
          return <Button variant="ghost" size="sm" icon={Eye} onClick={() => navigate(`/revision/${req.id}`)}>Ver Detalle</Button>;
      }
      
      // Acción Revisor
      const soyElRevisor = req.revisandoPor?.uid === user?.uid;
      
      if (req.estado === 'en_revision') {
          // Botón "Ver Detalle" en lugar de "Tomar Revisión" (Cambio previo mantenido)
          if (!req.revisandoPor?.uid) {
              return <Button variant="ghost" size="sm" icon={Eye} onClick={() => navigate(`/revision/${req.id}`)}>Ver Detalle</Button>;
          }
          
          if (soyElRevisor) return <Button variant="outline" size="sm" icon={FileText} onClick={() => navigate(`/revision/${req.id}`)}>Continuar Revisión</Button>;
          
          return (
              <div className="flex items-center gap-1 text-xs text-gray-500 bg-gray-100 px-3 py-1.5 rounded-full border border-gray-200">
                  <User size={12} />
                  <span className="truncate max-w-[120px] font-medium">{req.revisandoPor?.nombre || 'Otro Revisor'}</span>
              </div>
          );
      }
      return <Button variant="ghost" size="sm" icon={Eye} onClick={() => navigate(`/revision/${req.id}`)}>Ver Detalle</Button>;
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{isAlmacen ? 'Despacho de Almacén' : 'Bandeja de Gestión'}</h1>
          <p className="text-sm text-gray-500">{isAlmacen ? 'Gestión de entregas de material.' : 'Administración de solicitudes.'}</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input type="text" placeholder="Buscar..." className="w-full pl-10 p-3 bg-white border border-gray-200 rounded-xl outline-none shadow-sm" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
          
          <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0">
              <button onClick={() => setQuickFilter('todos')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border ${quickFilter === 'todos' ? 'bg-gray-800 text-white' : 'bg-white'}`}>
                  <Filter size={16} /> Todos
              </button>
              <button onClick={() => setQuickFilter('vehicular')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border ${quickFilter === 'vehicular' ? 'bg-blue-600 text-white' : 'bg-white'}`}>
                  <Car size={16} /> Mantenimiento vehicular
              </button>
              <button onClick={() => setQuickFilter('limpieza')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border ${quickFilter === 'limpieza' ? 'bg-emerald-600 text-white' : 'bg-white'}`}>
                  <SprayCan size={16} /> Material de limpieza
              </button>
          </div>
      </div>

      <div className="flex overflow-x-auto border-b border-gray-200 no-scrollbar">
          {tabs.map(tab => {
              const count = requisiciones.filter(r => {
                  if (tab.id === 'nuevas') return r.estado === 'en_revision' && (!r.revisandoPor || !r.revisandoPor.uid);
                  if (tab.id === 'en_revision') return r.estado === 'en_revision' && r.revisandoPor?.uid === user?.uid;
                  if (tab.id === 'proceso') return ['cotizacion', 'suficiencia'].includes(r.estado) && r.revisandoPor?.uid === user?.uid;
                  if (tab.id === 'autorizadas') {
                      if (isAlmacen) {
                          return r.estado === 'autorizada' && requiereEntregaFisica(r.tipoMaterial, r.subTipoMaterial);
                      }
                      return r.estado === 'autorizada' && r.revisandoPor?.uid === user?.uid;
                  }
                  if (tab.id === 'finalizadas') {
                      if (isAlmacen) return r.estado === 'finalizada';
                      // LOGICA CORREGIDA: Solo 'finalizada', sin 'rechazada' para el Revisor
                      return r.estado === 'finalizada' && r.revisandoPor?.uid === user?.uid;
                  }
                  return false;
              }).length;

              return (
                  <button key={tab.id} onClick={() => setActiveTab(tab.id as TabType)} className={`flex items-center gap-2 px-6 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${activeTab === tab.id ? 'border-brand text-brand' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                      <tab.icon size={16} /> 
                      {tab.label}
                      {count > 0 && <span className={`ml-2 text-xs py-0.5 px-2 rounded-full ${activeTab === tab.id ? 'bg-brand text-white' : 'bg-gray-100 text-gray-600'}`}>{count}</span>}
                  </button>
              );
          })}
      </div>

      <div className="min-h-[300px]">
        {filteredData.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-dashed border-gray-300">
            <div className="inline-flex p-4 rounded-full bg-gray-50 mb-4"><Inbox className="text-gray-400" size={32} /></div>
            <p className="text-gray-900 font-medium">No se encontraron solicitudes.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredData.map((req) => (
              <div key={req.id} className="group bg-white p-5 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all flex flex-col md:flex-row gap-4 items-start md:items-center">
                <div className="flex-1 w-full space-y-2">
                    <div className="flex items-center flex-wrap gap-2 text-sm">
                        <span className="font-mono font-bold text-[var(--color-brand)] bg-gray-50 px-2 py-0.5 rounded border border-gray-100">{req.folio}</span>
                        <Badge variant={
                            req.estado === 'autorizada' ? 'success' : 
                            req.estado === 'rechazada' ? 'danger' : 
                            req.estado === 'cotizacion' ? 'warning' : 'default'
                        }>
                            {req.estado.replace('_', ' ')}
                        </Badge>
                        <span className="text-xs text-gray-400 flex items-center gap-1 ml-1">
                            <Clock size={12} /> 
                            {new Date(req.fechaSolicitud + 'T12:00:00').toLocaleDateString()}
                        </span>
                    </div>
                    <div><h3 className="text-base font-bold text-gray-900 leading-tight">{req.organoRequirente}</h3></div>
                    
                    <div>
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-600 border border-gray-200">
                            <Tag size={12} />
                            {req.subTipoMaterial || req.tipoMaterial}
                        </span>
                    </div>

                    <div><p className="text-xs text-gray-500 italic line-clamp-2">"{req.justificacion}"</p></div>
                </div>
                <div className="w-full md:w-auto flex justify-end md:border-l md:border-gray-100 md:pl-4 self-stretch items-center">
                   {renderAction(req)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}