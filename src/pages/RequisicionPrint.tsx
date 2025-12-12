// src/pages/RequisicionPrint.tsx
import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useRequisiciones } from "../hooks/useRequisiciones";

export default function RequisicionPrint() {
  const { id } = useParams<{ id: string }>();
  const { requisiciones } = useRequisiciones();
  const navigate = useNavigate();

  const req = requisiciones.find((r) => r.id === id);

  // Lanzar impresión automáticamente al abrir
  useEffect(() => {
    if (!req || req.estado === "borrador") return;
    const t = setTimeout(() => {
      window.print();
    }, 300);
    return () => clearTimeout(t);
  }, [req]);

  if (!req) {
    return (
      <div className="p-6 text-sm">
        No se encontró la requisición.{" "}
        <button
          type="button"
          onClick={() => navigate("/mis-requisiciones")}
          className="underline"
        >
          Volver a Mis requisiciones
        </button>
      </div>
    );
  }

  if (req.estado === "borrador") {
    return (
      <div className="p-6 text-sm">
        Esta requisición está en borrador y no se puede imprimir el formato
        oficial. Envíala a revisión desde “Mis requisiciones”.
      </div>
    );
  }

  return (
    <div className="bg-white text-black p-8 max-w-4xl mx-auto text-sm">
      {/* ENCABEZADO LOGOS + TÍTULO */}
      <header className="pb-3 mb-4 border-b border-gray-300">
        <div className="flex items-center justify-between">
          <img
            src="/logo-tapachula.jpeg"
            alt="Tapachula"
            className="h-16"
          />
          <img
            src="/oficialia.jpeg"
            alt="Oficialía Mayor"
            className="h-12"
          />
        </div>

        <div className="mt-3 text-center font-semibold text-base tracking-wide">
          FORMATO DE REQUERIMIENTO
        </div>
        <div className="mt-1 text-center text-[11px]">
          Folio: <span className="font-semibold">{req.folio}</span>
        </div>
      </header>

      {/* BLOQUE SUPERIOR (FECHA / SECRETARÍA / DIRECCIÓN / TIPO) */}
      <section className="border border-gray-400 mb-4">
        <div className="grid grid-cols-12 border-b border-gray-400">
          <div className="col-span-2 bg-gray-100 px-2 py-1 text-[11px] font-semibold">
            FECHA:
          </div>
          <div className="col-span-10 px-2 py-1 text-[11px]">
            {req.fecha}
          </div>
        </div>

        <div className="grid grid-cols-12 border-b border-gray-400">
          <div className="col-span-3 bg-gray-100 px-2 py-1 text-[11px] font-semibold">
            SECRETARÍA O INSTITUTO:
          </div>
          <div className="col-span-9 px-2 py-1 text-[11px] uppercase">
            {req.secretariaNombre}
          </div>
        </div>

        <div className="grid grid-cols-12 border-b border-gray-400">
          <div className="col-span-2 bg-gray-100 px-2 py-1 text-[11px] font-semibold">
            DIRECCIÓN:
          </div>
          <div className="col-span-10 px-2 py-1 text-[11px] uppercase">
            {req.direccion}
          </div>
        </div>

        <div className="grid grid-cols-12">
          <div className="col-span-4 bg-gray-100 px-2 py-1 text-[11px] font-semibold">
            TIPO DE MATERIAL Y/O SERVICIOS:
          </div>
          <div className="col-span-8 px-2 py-1 text-[11px] uppercase">
            {req.tipoMaterial}
          </div>
        </div>
      </section>

      {/* TABLA DE PARTIDAS */}
      <section className="border border-gray-400 mb-4">
        <div className="grid grid-cols-12 bg-gray-100 border-b border-gray-400 text-[11px] font-semibold">
          <div className="col-span-2 border-r border-gray-400 px-2 py-1 text-center">
            CANT. SOLICITADA
          </div>
          <div className="col-span-2 border-r border-gray-400 px-2 py-1 text-center">
            CANT. AUTORIZADA
          </div>
          <div className="col-span-4 border-r border-gray-400 px-2 py-1 text-center">
            CONCEPTO
          </div>
          <div className="col-span-4 px-2 py-1 text-center">
            DESCRIPCIÓN
          </div>
        </div>

        {req.lineas.map((l) => (
          <div
            key={l.id}
            className="grid grid-cols-12 border-b border-gray-200 text-[11px] min-h-[28px]"
          >
            <div className="col-span-2 border-r border-gray-200 px-2 py-1 text-center">
              {l.cantidad}
            </div>
            <div className="col-span-2 border-r border-gray-200 px-2 py-1 text-center">
              {/* Cantidad autorizada viene de la revisión */}
              {l.cantidadAutorizada ?? ""}
            </div>
            <div className="col-span-4 border-r border-gray-200 px-2 py-1">
              {l.concepto}
            </div>
            <div className="col-span-4 px-2 py-1">
              {l.descripcion}
            </div>
          </div>
        ))}

        {/* Relleno de filas vacías para que el formato se vea completo */}
        {Array.from({ length: Math.max(8 - req.lineas.length, 0) }).map(
          (_, idx) => (
            <div
              key={`empty-${idx}`}
              className="grid grid-cols-12 border-b border-gray-200 text-[11px] min-h-[28px]"
            >
              <div className="col-span-2 border-r border-gray-200" />
              <div className="col-span-2 border-r border-gray-200" />
              <div className="col-span-4 border-r border-gray-200" />
              <div className="col-span-4" />
            </div>
          )
        )}
      </section>

      {/* EL MATERIAL (JUSTIFICACIÓN) + FIRMAS */}
      <section className="border border-gray-400">
        <div className="border-b border-gray-400 px-2 py-1 text-[11px] font-semibold">
          EL MATERIAL (Justificación / actividad):
        </div>
        <div className="px-3 py-3 text-[11px] min-h-[48px]">
          {req.justificacion}
        </div>

        <div className="grid grid-cols-3 gap-4 px-4 py-8 text-center text-[11px]">
          <div>
            <div className="border-t border-gray-400 pt-2 mb-1" />
            <div className="font-semibold uppercase text-[10px]">SOLICITA</div>
            <div className="mt-1 text-[10px]">
              Nombre y firma de quien solicita
            </div>
          </div>
          <div>
            <div className="border-t border-gray-400 pt-2 mb-1" />
            <div className="font-semibold uppercase text-[10px]">VO. BO.</div>
            <div className="mt-1 text-[10px]">
              Lic. Erick Daniel Rodas Moreno
            </div>
            <div className="text-[10px]">
              Dirección de Adquisiciones y Servicios
            </div>
          </div>
          <div>
            <div className="border-t border-gray-400 pt-2 mb-1" />
            <div className="font-semibold uppercase text-[10px]">AUTORIZA</div>
            <div className="mt-1 text-[10px]">
              CP Dayton Ventura Montecinos
            </div>
            <div className="text-[10px]">Oficial Mayor</div>
          </div>
        </div>
      </section>

      <footer className="mt-4 text-[9px] text-center text-gray-600">
        Palacio Municipal · Tapachula, Chiapas · Gobierno Municipal 2024–2027
      </footer>
    </div>
  );
}