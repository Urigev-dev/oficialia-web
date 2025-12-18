// FILE: src/components/layout/AppShell.tsx
import type { ReactNode } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useSession, type Role } from "../../hooks/useSession";
import { useNotificaciones } from "../../hooks/useNotificaciones";

type NavItem = {
  label: string;
  to: string;
  roles: Role[];
};

const NAV_ITEMS: NavItem[] = [
  // ADMIN & DIRECCIÓN (Dashboard solo para ellos)
  { label: "Dashboard", to: "/", roles: ["direccion", "admin"] },
  { label: "Gestión de Usuarios", to: "/admin/usuarios", roles: ["admin"] },

  // SOLICITUD
  { label: "Nuevo requerimiento", to: "/nueva", roles: ["solicitud", "admin"] },
  { label: "Mis requisiciones", to: "/mis-requisiciones", roles: ["solicitud", "admin"] },

  // REVISIÓN
  { label: "Bandeja de Entrada", to: "/revision/requisiciones", roles: ["revision", "admin"] },

  // COMÚN
  { label: "Notificaciones", to: "/notificaciones", roles: ["solicitud", "revision", "admin", "direccion"] },
];

export function AppShell({ children }: { children: ReactNode }) {
  const { user, role, logout } = useSession();
  const { notificaciones } = useNotificaciones();
  const navigate = useNavigate();

  // Filtrar ítems según el rol del usuario
  const items = NAV_ITEMS.filter((item) => role && item.roles.includes(role));

  // Contador de notificaciones no leídas (Badge)
  const countPendientes = notificaciones.filter(n => {
      if (n.leida) return false;
      if (role === 'admin') return true;
      if (role === 'revision') return n.targetRole === 'revision';
      if (role === 'solicitud') return n.targetRole === 'solicitud' || !n.targetRole;
      return false;
  }).length;

  const mostrarNotificaciones = role === "solicitud" || role === "revision" || role === "admin" || role === "direccion";

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* SIDEBAR (Fijo a la izquierda) */}
      <aside className="w-64 bg-white border-r border-gray-200 hidden md:flex md:flex-col z-40 shadow-sm fixed h-full">
        <div className="px-4 py-6 border-b border-gray-100 flex justify-center shrink-0">
          {/* LOGO OFICIALÍA (Ruta relativa corregida) */}
          <img src="./oficialia.jpeg" alt="Oficialía" className="h-14 object-contain" />
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `block text-sm font-medium rounded-lg px-3 py-2 text-left transition-colors ${
                  isActive ? "bg-gray-900 text-white shadow-md" : "text-gray-700 hover:bg-gray-100"
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Footer del Sidebar (Usuario y Cerrar Sesión) */}
        <div className="px-4 py-4 border-t border-gray-100 bg-gray-50 shrink-0">
            <div className="text-[10px] text-gray-400 uppercase font-bold tracking-wider mb-1">Sesión iniciada como:</div>
            <div className="font-bold text-sm text-gray-800 truncate mb-0.5" title={user?.email}>
                {user?.email}
            </div>
            {user?.organo && (
                <div className="text-xs text-blue-600 font-medium mb-3 truncate" title={user.organo}>
                    {user.organo}
                </div>
            )}
            
            <button
                onClick={logout}
                className="w-full text-xs font-semibold py-2 rounded-lg bg-white border border-gray-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all shadow-sm flex items-center justify-center gap-2"
            >
                <span>🚪</span> Cerrar sesión
            </button>
        </div>
      </aside>

      {/* ÁREA PRINCIPAL (Compensada con margen izquierdo) */}
      <div className="flex-1 flex flex-col min-w-0 md:ml-64 transition-all duration-300">
        {/* HEADER SUPERIOR */}
        <header className="bg-white shadow-sm sticky top-0 z-30 border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
            
            <div className="flex items-center gap-3">
                {/* LOGO TAPACHULA (Ruta relativa corregida) */}
                <img src="./logo-tapachula.jpeg" alt="Logo" className="h-10 w-10 rounded-full border border-gray-100 object-cover" />
                <div>
                    <h1 className="text-sm md:text-base font-bold text-gray-800 leading-tight hidden sm:block">
                        Sistema de Requerimientos
                    </h1>
                    <p className="text-[10px] md:text-xs text-gray-500">
                        Ayuntamiento 2024–2027
                    </p>
                </div>
            </div>

            <div className="flex items-center gap-4 text-xs">
              {mostrarNotificaciones && (
                <button
                  onClick={() => navigate("/notificaciones")}
                  className="relative p-2 rounded-full hover:bg-gray-100 text-gray-500 transition-colors border border-transparent hover:border-gray-200"
                  title="Ver notificaciones"
                >
                  <span className="text-xl">🔔</span>
                  {countPendientes > 0 && (
                    <span className="absolute top-0 right-0 min-w-[16px] h-[16px] rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center border border-white shadow-sm">
                      {countPendientes}
                    </span>
                  )}
                </button>
              )}

              <div className="text-right border-l border-gray-300 pl-4 hidden sm:block">
                <div className="font-bold text-gray-800 truncate max-w-[200px]" title={user?.organo}>
                    {user?.organo || "Cargando..."}
                </div>
                <div className="text-gray-500 text-[10px]">{user?.titular}</div>
                <div className="text-[10px] uppercase text-blue-600 font-bold tracking-wider">{role}</div>
              </div>
            </div>
          </div>
        </header>

        {/* CONTENIDO DE LA PÁGINA */}
        <main className="flex-1 overflow-y-auto bg-gray-50 p-4 md:p-6">
            <div className="max-w-6xl mx-auto pb-10">
                {children}
            </div>
        </main>
      </div>
    </div>
  );
}