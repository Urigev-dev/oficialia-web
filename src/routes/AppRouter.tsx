// src/routes/AppRouter.tsx
import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import type { ReactNode } from "react";
import { SessionProvider, useSession, type Role } from "../hooks/useSession";
import { RequisicionesProvider } from "../hooks/useRequisiciones";
import { NotificacionesProvider } from "../hooks/useNotificaciones";

import { AppShell } from "../components/layout/AppShell";
import AccessDenied from "../components/AccessDenied";

// Páginas
import LoginPage from "../pages/LoginPage";
import MisRequisiciones from "../pages/MisRequisiciones";
import NuevaRequisicion from "../pages/NuevaRequisicion";
import BandejaRevision from "../pages/BandejaRevision";
import DetalleRequisicion from "../pages/DetalleRequisicion";
import RequisicionPrint from "../pages/RequisicionPrint";
import CotizacionPrint from "../pages/CotizacionPrint";
import NotificacionesPage from "../pages/NotificacionesPage";
import UsuariosAdmin from "../pages/admin/UsuariosAdmin";

// --- GUARDS ---

function RequireAuth({ children }: { children: ReactNode }) {
  const { user } = useSession();
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function RequireRole({ allowed, children }: { allowed: Role[]; children: ReactNode }) {
  const { role } = useSession();
  if (!role || !allowed.includes(role)) return <AccessDenied />;
  return <>{children}</>;
}

// --- ROUTER INTERNO ---

function InnerRouter() {
  return (
    <HashRouter>
      <Routes>
        {/* Login Público */}
        <Route path="/login" element={<LoginPage />} />
        
        {/* Redirección inteligente / Dashboard */}
        <Route path="/" element={
            <RequireAuth>
               <DashboardDispatcher />
            </RequireAuth>
        } />

        {/* --- RUTAS SOLICITANTE --- */}
        <Route path="/mis-requisiciones" element={
          <RequireAuth>
            <RequireRole allowed={["solicitud", "admin"]}>
                <AppShell><MisRequisiciones /></AppShell>
            </RequireRole>
          </RequireAuth>
        } />
        
        <Route path="/nueva" element={
          <RequireAuth>
            <RequireRole allowed={["solicitud", "admin"]}>
                <AppShell><NuevaRequisicion /></AppShell>
            </RequireRole>
          </RequireAuth>
        } />

        {/* --- RUTAS REVISIÓN --- */}
        <Route path="/revision/requisiciones" element={
          <RequireAuth>
            <RequireRole allowed={["revision", "admin", "autorizacion", "direccion"]}>
                <AppShell><BandejaRevision /></AppShell>
            </RequireRole>
          </RequireAuth>
        } />
        
        {/* --- RUTAS ADMIN --- */}
        <Route path="/admin/usuarios" element={
            <RequireAuth>
                <RequireRole allowed={["admin"]}>
                    <AppShell><UsuariosAdmin /></AppShell>
                </RequireRole>
            </RequireAuth>
        } />

        {/* --- DETALLES Y NOTIFICACIONES (Compartidos) --- */}
        <Route path="/requisiciones/:id" element={
          <RequireAuth>
            <AppShell><DetalleRequisicion /></AppShell>
          </RequireAuth>
        } />
        
        <Route path="/notificaciones" element={
          <RequireAuth>
            <AppShell><NotificacionesPage /></AppShell>
          </RequireAuth>
        } />

        {/* --- IMPRESIONES (Sin AppShell para que salga limpio al imprimir) --- */}
        <Route path="/requisiciones/:id/imprimir" element={
          <RequireAuth>
            <RequisicionPrint />
          </RequireAuth>
        } />
        
        <Route path="/requisiciones/:id/cotizacion-print" element={
          <RequireAuth>
            <RequireRole allowed={["revision", "admin"]}>
                <CotizacionPrint />
            </RequireRole>
          </RequireAuth>
        } />

        {/* Catch all: redirigir a inicio */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  );
}

// --- COMPONENTE DISPATCHER (Lógica de Dashboard) ---

function DashboardDispatcher() {
    const { user } = useSession();

    // 1. Solicitantes van directo a sus requisiciones
    if (user?.role === 'solicitud') return <Navigate to="/mis-requisiciones" replace />;
    
    // 2. Revisores van directo a su bandeja
    if (user?.role === 'revision') return <Navigate to="/revision/requisiciones" replace />;

    // 3. Admin / Dirección ven el Dashboard (ahora con MENÚ)
    return (
        <AppShell>
            <div className="flex flex-col items-center justify-center h-[60vh] text-center p-6">
                <div className="text-4xl mb-4">📊</div>
                <h2 className="text-xl font-bold text-gray-700">Dashboard de Dirección</h2>
                <p className="text-gray-500 mt-2">Bienvenido, {user?.titular || "Usuario"}.</p>
                <div className="mt-6 p-4 bg-blue-50 text-blue-800 rounded-lg text-sm max-w-md border border-blue-100">
                    <p className="font-bold mb-1">ℹ️ Panel en construcción</p>
                    <p>Usa el menú lateral para acceder a la <strong>Gestión de Usuarios</strong> o revisar el historial.</p>
                </div>
            </div>
        </AppShell>
    );
}

// --- COMPONENTE PRINCIPAL ---

export default function AppRouter() {
  return (
    <SessionProvider>
      <RequisicionesProvider>
        <NotificacionesProvider>
          <InnerRouter />
        </NotificacionesProvider>
      </RequisicionesProvider>
    </SessionProvider>
  );
}