// FILE: src/pages/CotizacionPrint.tsx
import { useEffect } from "react";
import { useParams } from "react-router-dom";
import { useRequisiciones } from "../hooks/useRequisiciones";

export default function CotizacionPrint() {
  const { id } = useParams<{ id: string }>();
  const { requisiciones } = useRequisiciones();
  const req = requisiciones.find((r) => r.id === id);

  useEffect(() => {
    if (req) setTimeout(() => window.print(), 800);
  }, [req]);

  if (!req) return <div>Cargando...</div>;

  const items = req.lineas.filter(l => (l.cantidadAutorizada ?? l.cantidad) > 0);

  return (
    <div className="bg-white p-12 max-w-[21.59cm] mx-auto text-black font-sans text-xs leading-relaxed h-screen box-border">
      
      {/* HEADER INSTITUCIONAL - Logos a color y texto en una línea */}
      <header className="flex justify-between items-center border-b-2 border-gray-900 pb-4 mb-6">
        <div className="w-32 flex-shrink-0">
            {/* FIX: Se quitó 'grayscale' */}
            <img src="./logo-tapachula.jpeg" alt="Logo" className="w-full object-contain" />
        </div>
        <div className="text-center flex-1 px-2">
            <h1 className="font-bold text-lg text-gray-900 mb-1 whitespace-nowrap">H. AYUNTAMIENTO DE TAPACHULA</h1>
            <h2 className="font-bold text-xs text-gray-600 tracking-widest uppercase">Oficialía Mayor</h2>
            <h3 className="text-[10px] font-bold mt-1 text-gray-500 uppercase tracking-wide">Dirección de Adquisiciones y Servicios</h3>
        </div>
        <div className="w-32 flex-shrink-0 flex justify-end">
             {/* FIX: Se quitó 'grayscale' */}
             <img src="./oficialia.jpeg" alt="Oficialia" className="w-full object-contain" />
        </div>
      </header>

      {/* TÍTULO Y DATOS ALINEADOS */}
      <div className="flex justify-between items-end mb-10 mt-8">
          <div className="pb-1">
              <h2 className="font-bold text-xl uppercase tracking-widest text-gray-800">
                  
              </h2>
          </div>
          
          <div className="text-right">
             <div className="text-sm font-bold text-black tracking-wide">
                 Solicitud No. <span className="text-red-800 font-mono text-base">{req.folio.split('-').pop()}</span>
             </div>
             <div className="text-[10px] uppercase tracking-wide text-gray-600 mt-1">
                 Tapachula, Chiapas a {new Date().toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })}
             </div>
          </div>
      </div>

      <div className="mb-8 text-xs text-justify px-2 font-serif leading-6">
        <p className="mb-4 font-bold tracking-wide">
            A QUIEN CORRESPONDA:
        </p>
        <p>
            Por medio de la presente, y con la finalidad de dar cumplimiento a los procesos de adjudicación de bienes y servicios, me permito solicitarle de la manera más atenta, nos brinde su <strong>cotización formal</strong> (incluyendo IVA desglosado y tiempo de entrega) para los siguientes conceptos:
        </p>
      </div>

      {/* TABLA DE CONCEPTOS */}
      <table className="w-full border-collapse border-t-2 border-b-2 border-black text-[10px] mb-16">
        <thead>
            <tr className="bg-gray-50 uppercase text-center font-bold border-b border-black tracking-wider">
                <th className="p-3 w-16">Cant.</th>
                <th className="p-3 w-24">Unidad</th>
                <th className="p-3 text-left">Descripción Detallada</th>
            </tr>
        </thead>
        <tbody>
            {items.map((l) => (
                <tr key={l.id} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="p-3 text-center font-bold text-xs align-top pt-3">
                        {l.cantidadAutorizada ?? l.cantidad}
                    </td>
                    <td className="p-3 text-center uppercase text-gray-600 align-top pt-3">
                        {l.unidadAutorizada ?? l.unidad}
                    </td>
                    <td className="p-3 align-top pt-3">
                        <div className="font-bold uppercase mb-1 tracking-wide">{l.concepto}</div>
                        <div className="text-gray-500 uppercase text-[9px]">{l.descripcion}</div>
                    </td>
                </tr>
            ))}
            {items.length < 5 && <tr className="h-20"><td></td><td></td><td></td></tr>}
        </tbody>
      </table>
      
      {/* FIRMA */}
      <div className="flex justify-center mt-auto">
          <div className="text-center w-80">
              <div className="font-bold mb-16 tracking-widest text-[10px]">ATENTAMENTE</div>
              <div className="border-t border-gray-900 pt-2">
                  <div className="font-bold text-xs uppercase tracking-wide">DIRECCIÓN DE ADQUISICIONES Y SERVICIOS</div>
                  
              </div>
          </div>
      </div>
      
      <footer className="fixed bottom-8 left-0 right-0 text-center text-[8px] text-gray-400 uppercase tracking-widest">
          H. Ayuntamiento de Tapachula 2024-2027 · Oficialía Mayor
      </footer>
    </div>
  );
}