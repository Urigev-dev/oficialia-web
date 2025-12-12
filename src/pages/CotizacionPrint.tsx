// src/pages/CotizacionPrint.tsx
import { useEffect } from "react";
import { useParams } from "react-router-dom";
import { useRequisiciones } from "../hooks/useRequisiciones";

export default function CotizacionPrint() {
  const { id } = useParams<{ id: string }>();
  const { requisiciones } = useRequisiciones();
  const req = requisiciones.find((r) => r.id === id);

  useEffect(() => {
    if (req) {
      setTimeout(() => window.print(), 500);
    }
  }, [req]);

  if (!req) return <div>Cargando...</div>;

  return (
    <div className="bg-white p-8 max-w-4xl mx-auto text-black font-sans">
      <header className="border-b-2 border-black pb-4 mb-6 flex justify-between items-end">
        <div>
            <h1 className="text-2xl font-bold uppercase tracking-wide">Solicitud de Cotización</h1>
            <p className="text-sm mt-1">H. Ayuntamiento de Tapachula, Chiapas</p>
            <p className="text-xs text-gray-500">Dirección de Adquisiciones y Servicios</p>
        </div>
        <div className="text-right">
            <div className="text-sm font-bold">Folio Ref: {req.folio}</div>
            <div className="text-xs mt-1">Fecha: {new Date().toLocaleDateString('es-MX')}</div>
        </div>
      </header>

      <div className="mb-6 text-sm">
        <p className="mb-2"><strong>Estimado Proveedor:</strong></p>
        <p>Por medio de la presente, solicitamos su cotización para los siguientes conceptos:</p>
      </div>

      <table className="w-full border-collapse border border-black text-xs">
        <thead>
            <tr className="bg-gray-200">
                <th className="border border-black p-2 w-16 text-center">Cant.</th>
                <th className="border border-black p-2 w-24 text-center">Unidad</th>
                <th className="border border-black p-2 text-left">Concepto</th>
                <th className="border border-black p-2 text-left">Detalles / Especificaciones</th>
            </tr>
        </thead>
        <tbody>
            {req.lineas
              .filter(l => l.estadoLinea !== 'rechazada') // Solo lo autorizado
              .map((l) => {
                // Usamos la cantidad autorizada si existe, si no, la original
                const cantidadFinal = l.cantidadAutorizada ?? l.cantidad;
                const unidadFinal = l.unidadAutorizada ?? l.unidad;
                
                return (
                    <tr key={l.id}>
                        <td className="border border-black p-2 text-center font-bold">{cantidadFinal}</td>
                        <td className="border border-black p-2 text-center">{unidadFinal}</td>
                        <td className="border border-black p-2 font-semibold uppercase">{l.concepto}</td>
                        <td className="border border-black p-2">{l.descripcion}</td>
                    </tr>
                );
            })}
        </tbody>
      </table>

      <div className="mt-12 pt-4 border-t border-black text-xs text-center">
        <p className="mb-8">Atentamente</p>
        <div className="w-64 border-t border-black mx-auto mt-12 pt-1">
            <p className="font-bold">Dirección de Adquisiciones</p>
            <p>Firma y Sello</p>
        </div>
      </div>
    </div>
  );
}