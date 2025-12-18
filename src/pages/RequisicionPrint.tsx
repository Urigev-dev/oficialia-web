// FILE: src/pages/RequisicionPrint.tsx
import { useEffect } from "react";
import { useParams } from "react-router-dom";
import { useRequisiciones } from "../hooks/useRequisiciones";

export default function RequisicionPrint() {
  const { id } = useParams<{ id: string }>();
  const { requisiciones } = useRequisiciones();
  const req = requisiciones.find((r) => r.id === id);

  useEffect(() => {
    if (req && req.estado !== "borrador") {
      setTimeout(() => window.print(), 800);
    }
  }, [req]);

  if (!req) return <div>Cargando...</div>;

  const items = req.lineas.filter(l => (l.cantidadAutorizada ?? l.cantidad) > 0);

  return (
    <div className="bg-white text-black p-8 mx-auto text-[9px] font-sans h-screen w-full max-w-[21.59cm] leading-tight">
      
      {/* HEADER OFICIAL: Logos a color */}
      <header className="flex justify-between items-center mb-4 border-b-2 border-black pb-3">
        <div className="w-32 flex-shrink-0">
            {/* FIX: Se quitó 'grayscale' */}
            <img src="./logo-tapachula.jpeg" alt="Logo" className="w-full object-contain" />
        </div>
        <div className="text-center flex-1 px-2">
            <h1 className="font-black text-base uppercase tracking-widest mb-1">H. Ayuntamiento de Tapachula</h1>
            <h2 className="font-bold text-[10px] uppercase text-gray-600 tracking-wide">Oficialía Mayor</h2>
            <div className="mt-2 px-6 py-1 bg-black text-white inline-block font-bold text-[9px] tracking-wider rounded-sm">
                REQUISICIÓN DE MATERIALES Y SERVICIOS
            </div>
        </div>
        <div className="w-32 flex-shrink-0 text-right">
            {/* FIX: Se quitó 'grayscale' */}
            <img src="./oficialia.jpeg" alt="Oficialía" className="w-full object-contain mb-2" />
        </div>
      </header>

      {/* DATOS GENERALES */}
      <div className="border-2 border-black mb-4">
          <div className="flex border-b border-black">
              <div className="w-1/4 border-r border-black p-1 bg-gray-100 font-bold flex flex-col justify-center text-center">
                  <div className="text-[8px] text-gray-500">FECHA DE SOLICITUD</div>
                  <div className="font-mono text-xs">{req.fecha}</div>
                  
                  <div className="mt-2 text-[8px] text-gray-500">FOLIO</div>
                  <div className="font-black text-sm text-red-800 tracking-wide">{req.folio}</div>
              </div>
              
              <div className="w-3/4 flex flex-col">
                  <div className="flex border-b border-black h-8 items-center">
                      <div className="w-28 bg-gray-50 p-1 pl-2 font-bold border-r border-gray-300 text-[8px] uppercase tracking-wide h-full flex items-center">Órgano Requirente:</div>
                      <div className="flex-1 p-1 pl-2 uppercase font-bold text-[9px]">{req.organoRequirente}</div>
                  </div>
                  <div className="flex border-b border-black h-8 items-center">
                      <div className="w-28 bg-gray-50 p-1 pl-2 font-bold border-r border-gray-300 text-[8px] uppercase tracking-wide h-full flex items-center">Dirección / Área:</div>
                      <div className="flex-1 p-1 pl-2 uppercase text-[9px]">{req.direccion}</div>
                  </div>
                  <div className="flex h-8 items-center">
                      <div className="w-28 bg-gray-50 p-1 pl-2 font-bold border-r border-gray-300 text-[8px] uppercase tracking-wide h-full flex items-center">Tipo de Material:</div>
                      <div className="flex-1 p-1 pl-2 uppercase text-[9px] font-medium">{req.tipoMaterial} <span className="text-gray-400 mx-1">|</span> {req.subTipoMaterial}</div>
                  </div>
              </div>
          </div>
      </div>

      {/* TABLA DE ÍTEMS */}
      <table className="w-full border-collapse border-2 border-black mb-4">
          <thead>
              <tr className="bg-gray-100 text-center font-bold border-b-2 border-black text-[8px] tracking-wider">
                  <th className="border-r border-black p-1 w-14">CANT.<br/>SOLIC.</th>
                  <th className="border-r border-black p-1 w-14 bg-gray-200">CANT.<br/>AUT.</th>
                  <th className="border-r border-black p-1 w-20">UNIDAD</th>
                  <th className="border-r border-black p-1 w-1/4">CONCEPTO</th>
                  <th className="p-1">DESCRIPCIÓN</th>
              </tr>
          </thead>
          <tbody>
              {items.map((l, i) => (
                  <tr key={i} className="border-b border-gray-300 text-[9px]">
                      <td className="border-r border-black p-1 text-center align-top pt-2 font-medium">{l.cantidad}</td>
                      <td className="border-r border-black p-1 text-center align-top pt-2 font-bold bg-gray-50 text-[10px]">
                        {l.cantidadAutorizada ?? l.cantidad}
                      </td>
                      <td className="border-r border-black p-1 text-center uppercase text-[8px] align-top pt-2">{l.unidad}</td>
                      <td className="border-r border-black p-1 align-top pt-2 px-2">
                          <span className="font-bold uppercase tracking-tight">{l.concepto}</span>
                      </td>
                      <td className="p-1 align-top pt-2 px-2">
                          <span className="uppercase text-gray-600 text-[8px]">{l.descripcion}</span>
                      </td>
                  </tr>
              ))}
              {Array.from({length: Math.max(0, 10 - items.length)}).map((_, i) => (
                  <tr key={`empty-${i}`} className="h-6 border-b border-gray-200">
                      <td className="border-r border-black"></td><td className="border-r border-black bg-gray-50"></td><td className="border-r border-black"></td><td className="border-r border-black"></td><td></td>
                  </tr>
              ))}
          </tbody>
      </table>

      {/* JUSTIFICACIÓN */}
      <div className="border-2 border-black mb-8 relative">
          <div className="p-3 min-h-[60px] text-[9px] uppercase italic bg-white text-justify leading-snug">
              <span className="font-bold text-gray-400 text-[8px] not-italic block mb-1">JUSTIFICACIÓN:</span>
              {req.justificacion}
          </div>
          <div className="border-t border-black p-1.5 flex justify-between bg-gray-100 px-4 text-[8px] uppercase font-bold tracking-wide">
              <span>RESPONSABLE: <span className="font-normal text-black ml-1">{req.responsableNombre}</span></span>
              <span>TEL: <span className="font-normal text-black ml-1">{req.responsableTelefono}</span></span>
          </div>
      </div>

      {/* FIRMAS */}
      <div className="grid grid-cols-3 gap-6 mt-12 text-center text-[9px]">
          <div className="flex flex-col justify-end h-28">
              <div className="font-bold mb-auto tracking-widest text-[8px]">SOLICITA</div>
              <div className="border-t border-black pt-2">
                  <div className="font-bold uppercase">{req.titularNombre}</div>
                  <div className="text-[7px] uppercase font-medium text-gray-600 mt-0.5">TITULAR DEL ÁREA DE {req.organoRequirente}</div>
              </div>
          </div>
          <div className="flex flex-col justify-end h-28">
              <div className="font-bold mb-auto tracking-widest text-[8px]">Vo. Bo.</div>
              <div className="border-t border-black pt-2">
                  <div className="font-bold uppercase">LIC. ERICK DANIEL RODAS MORENO</div>
                  <div className="text-[7px] uppercase font-medium text-gray-600 mt-0.5">DIRECTOR DE ADQUISICIONES</div>
              </div>
          </div>
          <div className="flex flex-col justify-end h-28">
              <div className="font-bold mb-auto tracking-widest text-[8px]">AUTORIZA</div>
              <div className="border-t border-black pt-2">
                  <div className="font-bold uppercase">CP. DAYTON VENTURA MONTECINOS</div>
                  <div className="text-[7px] uppercase font-medium text-gray-600 mt-0.5">OFICIAL MAYOR</div>
              </div>
          </div>
      </div>
    </div>
  );
}