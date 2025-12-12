// src/components/layout/AppShell.tsx
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
  // SOLICITUD
  { label: "Dashboard", to: "/", roles: ["solicitud", "admin"] },
  { label: "Nuevo requerimiento", to: "/nueva", roles: ["solicitud", "admin"] },
  {
    label: "Mis requisiciones",
    to: "/mis-requisiciones",
    roles: ["solicitud", "admin"],
  },
  {
    label: "Notificaciones",
    to: "/notificaciones",
    roles: ["solicitud", "revision", "admin"],
  },

  // REVISIÓN
  {
    label: "Revisión",
    to: "/revision/requisiciones",
    roles: ["revision", "admin"],
  },
];

export function AppShell({ children }: { children: ReactNode }) {
  const { user, role, logout } = useSession();
  // Traemos 'notificaciones' (el array completo) en lugar de 'pendientes' (el numero global)
  // para poder filtrar el contador según el rol.
  const { notificaciones } = useNotificaciones();
  const navigate = useNavigate();

  const items = NAV_ITEMS.filter((item) => role && item.roles.includes(role));

  // CÁLCULO INTELIGENTE DEL CONTADOR (BADGE)
  const countPendientes = notificaciones.filter(n => {
      if (n.leida) return false; // Solo las no leídas
      
      // Aplicamos el mismo filtro que en la página de notificaciones
      if (role === 'admin') return true;
      if (role === 'revision') return n.targetRole === 'revision';
      if (role === 'solicitud') return n.targetRole === 'solicitud' || !n.targetRole;
      return false;
  }).length;

  // Condición para mostrar el botón: Solicitud, Revisión o Admin
  const mostrarNotificaciones = role === "solicitud" || role === "revision" || role === "admin";

  return (
    <div className="min-h-screen bg-bg flex">
      {/* SIDEBAR */}
      <aside className="w-64 bg-surface border-r border-border hidden md:flex md:flex-col">
        <div className="px-4 py-4 border-b border-border flex items-center gap-3">
          <img src="/oficialia.jpeg" alt="Oficialía Mayor" className="h-10" />
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                [
                  "block text-sm font-medium rounded-lg px-3 py-2 text-left",
                  isActive ? "bg-brand text-white" : "text-ink hover:bg-gray-100",
                ].join(" ")
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="px-4 py-4 border-t border-border text-xs text-ink/70">
          <div className="font-semibold text-ink text-sm mb-1">
            {user?.email}
          </div>
          <div className="mb-2">Rol: {role}</div>
          <button
            onClick={logout}
            className="w-full text-xs py-1.5 rounded-lg border border-border hover:bg-gray-100"
          >
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* MAIN AREA */}
      <div className="flex-1 flex flex-col">
        {/* HEADER SUPERIOR */}
        <header className="bg-surface shadow-[--shadow-card]">
          <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
            <div>
              <h1 className="text-base font-semibold text-ink">
                Sistema de Requerimientos
              </h1>
              <p className="text-xs text-ink/70">
                Oficialía Mayor · Tapachula 2024–2027
              </p>
            </div>

            <div className="flex items-center gap-3 text-xs text-ink/70">
              
              {/* BOTÓN DE NOTIFICACIONES (AHORA PARA TODOS LOS ROLES) */}
              {mostrarNotificaciones && (
                <button
                  type="button"
                  onClick={() => navigate("/notificaciones")}
                  className="relative px-3 py-1 rounded-[--radius-xl] border border-border hover:bg-gray-100 transition-colors"
                >
                  <span className="mr-1">🔔</span>
                  <span>Notificaciones</span>
                  {countPendientes > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full bg-brand text-white text-[10px] flex items-center justify-center shadow-sm">
                      {countPendientes}
                    </span>
                  )}
                </button>
              )}

              <div className="text-right border-l border-gray-300 pl-3 ml-1">
                <div className="font-medium">{user?.email}</div>
                <div className="text-[10px] uppercase text-gray-500">{role}</div>
              </div>
            </div>
          </div>
        </header>

        {/* CONTENIDO */}
        <main className="max-w-6xl mx-auto w-full px-4 py-6">{children}</main>
      </div>
    </div>
  );
}