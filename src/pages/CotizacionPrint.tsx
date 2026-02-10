import { useEffect } from "react";
import { useParams } from "react-router-dom";
import { useRequisiciones } from "../hooks/useRequisiciones";
import { Printer, X } from "lucide-react";

export default function CotizacionPrint() {
  const { id } = useParams<{ id: string }>();
  const { requisiciones } = useRequisiciones();
  const req = requisiciones.find((r) => r.id === id);

  useEffect(() => {
    // Implementación original simple
    if (req) setTimeout(() => window.print(), 800);
  }, [req]);

  if (!req) return <div className="p-8 text-center font-bold">Preparando formato de impresión...</div>;

  const items = req.lineas.filter(l => (l.cantidadAutorizada ?? l.cantidad) > 0);
  
  const fechaHoy = new Date().toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="bg-white text-black min-h-screen w-full max-w-[21.59cm] mx-auto p-12 print:p-0 print:m-0 font-sans text-sm relative">
      
      {/* --- BOTONES FLOTANTES (Solo pantalla) --- */}
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

      {/* --- ENCABEZADO OFICIAL --- */}
      <header className="flex justify-between items-center mb-8 border-b-2 border-gray-800 pb-4 gap-4">
        
        {/* Logo Izquierda (Gobierno) */}
        <div className="w-1/5 flex justify-start">
             <img src="/logo-tapachula.jpeg" alt="Gobierno Municipal" className="h-24 object-contain" />
        </div>

        {/* Centro - Títulos */}
        <div className="flex-1 text-center">
            <h1 className="text-xl font-black uppercase tracking-widest text-gray-900 whitespace-nowrap scale-x-95 origin-center">
                H. Ayuntamiento de Tapachula
            </h1>
            <h2 className="text-lg font-bold uppercase text-gray-700 mt-1 tracking-wide">
                Oficialía Mayor
            </h2>
            <h3 className="text-[11px] font-bold uppercase bg-gray-100 inline-block px-3 py-1 rounded-full mt-2 tracking-wider">
                Dirección de Adquisiciones y Servicios
            </h3>
        </div>

        {/* Logo Derecha (Oficialía) */}
        <div className="w-1/5 flex justify-end">
             <img src="/oficialia.jpeg" alt="Oficialía Mayor" className="h-24 object-contain" />
        </div>
      </header>

      {/* FECHA Y DESTINATARIO */}
      <div className="text-right mb-8">
        <p className="font-bold uppercase text-xs">Tapachula, Chiapas a {fechaHoy}</p>
      </div>

      <div className="mb-6">
        <p className="font-bold mb-2">A QUIEN CORRESPONDA:</p>
        <p className="text-justify leading-relaxed indent-8">
            Por medio de la presente, y con la finalidad de dar cumplimiento a los procesos de adjudicación de bienes y servicios,
            me permito solicitarle de la manera más atenta, nos brinde su <strong>cotización formal</strong> (incluyendo IVA desglosado y
            tiempo de entrega) para los siguientes conceptos:
        </p>
      </div>

      {/* TABLA DE PRODUCTOS */}
      <div className="mb-12">
        <table className="w-full border-collapse border border-gray-300 text-xs">
            <thead>
                <tr className="bg-gray-100 text-gray-900">
                    <th className="border border-gray-300 px-3 py-2 w-16 font-bold uppercase">Cant.</th>
                    <th className="border border-gray-300 px-3 py-2 w-24 font-bold uppercase">Unidad</th>
                    <th className="border border-gray-300 px-3 py-2 font-bold uppercase text-left">Descripción Detallada</th>
                </tr>
            </thead>
            <tbody>
                {items.map((item, idx) => (
                    <tr key={idx}>
                        <td className="border border-gray-300 px-3 py-3 text-center font-bold">
                            {item.cantidadAutorizada ?? item.cantidad}
                        </td>
                        <td className="border border-gray-300 px-3 py-3 text-center uppercase">
                            {item.unidad}
                        </td>
                        <td className="border border-gray-300 px-3 py-3 uppercase">
                            <span className="font-bold block">{item.concepto}</span>
                            <span className="text-gray-600">{item.descripcion}</span>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
      </div>

      {/* PIE DE PÁGINA / FIRMAS */}
      <div className="mt-auto pt-10 text-center break-inside-avoid">
        <p className="text-xs font-bold uppercase mb-12">Atentamente</p>
        
        <div className="inline-block border-t border-black px-12 pt-2">
            <p className="font-bold uppercase text-xs">Dirección de Adquisiciones y Servicios</p>
            <p className="text-[10px] text-gray-500 uppercase mt-1">Oficialía Mayor</p>
        </div>
      </div>

    </div>
  );
}