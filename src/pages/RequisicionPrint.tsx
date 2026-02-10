import { useEffect } from "react";
import { useParams } from "react-router-dom";
import { useRequisiciones } from "../hooks/useRequisiciones";
import { useSession } from "../hooks/useSession"; // Importamos useSession para validar el rol
import { Printer, X } from "lucide-react";

export default function RequisicionPrint() {
  const { id } = useParams<{ id: string }>();
  const { requisiciones } = useRequisiciones();
  const { role } = useSession(); // Obtenemos el rol actual
  const req = requisiciones.find((r) => r.id === id);

  useEffect(() => {
    if (req) setTimeout(() => window.print(), 800);
  }, [req]);

  if (!req) return <div className="p-8 text-center font-bold">Preparando formato oficial...</div>;

  const isAlmacen = role === 'almacen';

  // LÓGICA DE FILTRADO:
  // Si es Almacén: Solo mostrar items con cantidadAutorizada > 0.
  // Si es otro rol: Mostrar todos los items (incluso los de 0 para ver qué se rechazó).
  const items = isAlmacen 
      ? req.lineas.filter(l => (l.cantidadAutorizada ?? 0) > 0)
      : req.lineas;

  const formatoFechaUTC = (fechaString: string) => {
      if (!fechaString) return "SIN FECHA";
      const [anio, mes, dia] = fechaString.split('-');
      const fecha = new Date(parseInt(anio), parseInt(mes) - 1, parseInt(dia));
      return fecha.toLocaleDateString('es-MX', { year: 'numeric', month: '2-digit', day: '2-digit' });
  };

  return (
    <div className="bg-white text-black min-h-screen w-full max-w-[21.59cm] mx-auto p-8 print:p-0 print:m-0 font-sans text-xs">
      
      {/* --- BOTONES FLOTANTES --- */}
      <div className="print:hidden fixed top-4 right-4 z-50 flex flex-col gap-2">
        <button 
            onClick={() => window.close()} 
            className="bg-white text-gray-700 border border-gray-300 px-5 py-3 rounded-full shadow-lg flex items-center gap-2 font-bold hover:bg-gray-50 transition-all"
        >
            <X size={18} /> Cerrar
        </button>

        <button 
            onClick={() => window.print()} 
            className="bg-gray-900 text-white px-5 py-3 rounded-full shadow-xl flex items-center gap-2 font-bold hover:scale-105 transition-transform"
        >
            <Printer size={18} /> Imprimir
        </button>
      </div>

      {/* ENCABEZADO */}
      <header className="flex justify-between items-start mb-6 border-b-2 border-black pb-2">
        <div className="w-1/5">
             <img src="/logo-tapachula.jpeg" alt="Logo" className="h-20 object-contain" />
        </div>
        <div className="flex-1 text-center pt-4">
            <h3 className="text-xl font-bold uppercase mt-2">H. Ayuntamiento de Tapachula</h3>
            <h4 className="text-sm font-bold uppercase">Oficialía Mayor</h4>
            <div className="mt-2 bg-black text-white px-4 py-1 inline-block font-bold text-sm uppercase rounded-sm">
                {/* Si es almacén, cambiamos el título para que sea más específico, o lo dejamos igual */}
                {isAlmacen ? "Orden de Surtido de Materiales" : "Requisición de Materiales y Servicios"}
            </div>
        </div>
        <div className="w-1/5 flex justify-end">
             <img src="/oficialia.jpeg" alt="Oficialía" className="h-20 object-contain" />
        </div>
      </header>

      {/* DATOS GENERALES */}
      <div className="grid grid-cols-3 gap-4 mb-6">
          {/* Columna Izquierda */}
          <div className="col-span-2 space-y-2 border border-black p-2">
              <div className="grid grid-cols-3 gap-2">
                  <span className="font-bold uppercase text-right">Órgano Requirente:</span>
                  <span className="col-span-2 border-b border-gray-400 uppercase">{req.organoRequirente}</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                  <span className="font-bold uppercase text-right">Área:</span>
                  <span className="col-span-2 border-b border-gray-400 uppercase">{req.area}</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                  <span className="font-bold uppercase text-right">Tipo de Material:</span>
                  <span className="col-span-2 border-b border-gray-400 uppercase text-[10px] leading-tight">
                      {req.subTipoMaterial || req.tipoMaterial}
                  </span>
              </div>

              {/* CAMBIO 1: Mostrar Proveedor solo si es Almacén y existe el dato */}
              {isAlmacen && req.proveedor && (
                  <div className="grid grid-cols-3 gap-2">
                      <span className="font-bold uppercase text-right">Proveedor:</span>
                      <span className="col-span-2 border-b border-gray-400 uppercase font-bold">
                          {req.proveedor}
                      </span>
                  </div>
              )}
          </div>

          {/* Columna Derecha */}
          <div className="col-span-1 space-y-4">
              <div className="border border-black p-2 text-center">
                  <p className="font-bold uppercase text-[10px] mb-1">Fecha de Solicitud</p>
                  <p className="font-mono text-sm font-bold">{formatoFechaUTC(req.fechaSolicitud)}</p>
              </div>
              <div className="border border-black p-2 text-center bg-gray-100">
                  <p className="font-bold uppercase text-[10px] mb-1">Folio</p>
                  <p className="font-mono text-sm font-bold text-red-600">{req.folio}</p>
              </div>
          </div>
      </div>

      {/* TABLA DE ITEMS */}
      <div className="mb-6">
        <table className="w-full border-collapse border border-black text-[10px]">
            <thead>
                <tr className="bg-gray-200 text-black text-center">
                    {/* CAMBIO 2: Ocultar columna CANT. SOLIC. si es Almacén */}
                    {!isAlmacen && (
                        <th className="border border-black px-1 py-2 w-12">CANT.<br/>SOLIC.</th>
                    )}
                    
                    <th className="border border-black px-1 py-2 w-12">CANT.<br/>AUT.</th>
                    <th className="border border-black px-1 py-2 w-16">UNIDAD</th>
                    <th className="border border-black px-2 py-2 w-1/4">CONCEPTO</th>
                    <th className="border border-black px-2 py-2">DESCRIPCIÓN</th>
                </tr>
            </thead>
            <tbody>
                {items.map((item, idx) => {
                    // Estilo tachado rojo para items en 0 (solo visible para no-almacén, ya que almacén filtra los ceros)
                    const isRejected = !isAlmacen && item.cantidadAutorizada === 0;
                    const cellStyle = isRejected ? "text-red-600 line-through decoration-red-600" : "text-black";

                    return (
                        <tr key={idx} className="text-center align-top">
                            {/* Ocultar celda CANT. SOLIC. si es Almacén */}
                            {!isAlmacen && (
                                <td className="border border-black px-1 py-2 font-bold text-black">{item.cantidad}</td>
                            )}
                            
                            <td className={`border border-black px-1 py-2 font-bold bg-gray-50 ${cellStyle}`}>
                                {item.cantidadAutorizada ?? ''}
                            </td>
                            <td className={`border border-black px-1 py-2 uppercase ${cellStyle}`}>
                                {item.unidad}
                            </td>
                            <td className={`border border-black px-2 py-2 uppercase text-left font-bold ${cellStyle}`}>
                                {item.concepto}
                            </td>
                            <td className={`border border-black px-2 py-2 uppercase text-left text-[9px] ${cellStyle}`}>
                                {item.descripcion}
                            </td>
                        </tr>
                    );
                })}
                
                {/* Filas vacías para mantener estructura visual */}
                {Array.from({ length: Math.max(0, 5 - items.length) }).map((_, i) => (
                    <tr key={`empty-${i}`} className="h-8">
                        {!isAlmacen && <td className="border border-black"/>}
                        <td className="border border-black"/><td className="border border-black"/><td className="border border-black"/><td className="border border-black"/>
                    </tr>
                ))}
            </tbody>
        </table>
      </div>

      {/* JUSTIFICACIÓN CON CONTACTO */}
      <div className="mb-8 border border-black p-2 min-h-[80px]">
          <p className="font-bold uppercase text-xs mb-1">Justificación:</p>
          <p className="text-xs uppercase leading-snug mb-4">{req.justificacion}</p>
          
          <div className="flex gap-8 mt-2 pt-2 border-t border-gray-300 text-[10px]">
              <div>
                  <span className="font-bold">RESPONSABLE / CONTACTO: </span>
                  <span className="uppercase">{req.responsableNombre}</span>
              </div>
              <div>
                  <span className="font-bold">TELÉFONO: </span>
                  <span>{req.responsableTelefono}</span>
              </div>
          </div>
      </div>

      {/* FIRMAS */}
      <div className="mt-auto break-inside-avoid">
          <div className="grid grid-cols-3 gap-4 items-end">
              
              {/* COLUMNA 1: SOLICITA */}
              <div className="text-center">
                  <div className="font-bold uppercase text-[10px] mb-8">SOLICITA</div>
                  <div className="border-b border-black w-3/4 mx-auto mb-1"></div>
                  <p className="font-bold uppercase text-[9px] px-2">{req.titularNombre}</p>
                  <p className="text-[8px] uppercase text-gray-600">Titular de {req.organoRequirente}</p>
              </div>

              {/* COLUMNA 2: Vo. Bo. */}
              <div className="text-center">
                  <div className="font-bold uppercase text-[10px] mb-8">Vo. Bo.</div>
                  <div className="border-b border-black w-3/4 mx-auto mb-1"></div>
                  <p className="font-bold uppercase text-[9px] px-2">LIC. ERICK DANIEL RODAS MORENO</p>
                  <p className="text-[8px] uppercase text-gray-600">Dirección de Adquisiciones y Servicios</p>
              </div>

              {/* COLUMNA 3: AUTORIZA */}
              <div className="text-center">
                  <div className="font-bold uppercase text-[10px] mb-8">AUTORIZA</div>
                  <div className="border-b border-black w-3/4 mx-auto mb-1"></div>
                  <p className="font-bold uppercase text-[9px] px-2">CP. DAYTON VENTURA MONTECINOS</p>
                  <p className="text-[8px] uppercase text-gray-600">Oficial Mayor</p>
              </div>

          </div>
      </div>

    </div>
  );
}