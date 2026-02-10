import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import type { ReactNode } from "react";

import { SessionProvider, useSession } from "../hooks/useSession";
import type { Role } from "../types";

import { RequisicionesProvider } from "../hooks/useRequisiciones";
import { NotificacionesProvider } from "../hooks/useNotificaciones";
import { ToastProvider } from "../hooks/useToast";

import AppShell from "../components/layout/AppShell"; 
import AccessDenied from "../components/AccessDenied"; 

import LoginPage from "../pages/LoginPage";
import MisRequisiciones from "../pages/MisRequisiciones";
import NuevaRequisicion from "../pages/NuevaRequisicion";
import BandejaRevision from "../pages/BandejaRevision";
import DetalleRequisicion from "../pages/DetalleRequisicion";
import NotificacionesPage from "../pages/NotificacionesPage";
import UsuariosAdmin from "../pages/admin/UsuariosAdmin";
import RequisicionPrint from "../pages/RequisicionPrint";
import CotizacionPrint from "../pages/CotizacionPrint"; 

// 👇 NUEVO IMPORT
import ConfiguracionFechas from "../pages/admin/ConfiguracionFechas";

function RequireAuth({ children }: { children: ReactNode }) {
  const { user, booting } = useSession();
  if (booting) return <div className="flex h-screen items-center justify-center">Cargando...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function RequireRole({ allowed, children }: { allowed: Role[]; children: ReactNode }) {
  const { user, role, booting } = useSession();
  if (booting) return null; 
  if (!user) return <Navigate to="/login" replace />;
  if (!role || !allowed.includes(role)) return <AccessDenied />;
  return <>{children}</>;
}

function RootRedirect() {
  const { role, booting } = useSession();
  if (booting) return null;
  if (role === 'revision' || role === 'autorizacion' || role === 'direccion' || role === 'admin' || role === 'almacen') {
    return <Navigate to="/revision/requisiciones" replace />;
  }
  return <Navigate to="/mis-requisiciones" replace />;
}

function InnerRouter() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        {/* RUTA DE IMPRESIÓN OFICIAL */}
        <Route path="/requisiciones/:id/print" element={
            <RequireAuth>
                <RequisicionPrint />
            </RequireAuth>
        } />

        {/* RUTA DE COTIZACIÓN */}
        <Route path="/requisiciones/:id/cotizacion" element={
            <RequireAuth>
                <CotizacionPrint />
            </RequireAuth>
        } />

        <Route element={<RequireAuth><AppShell /></RequireAuth>}>
            <Route path="/" element={<RootRedirect />} />
            <Route path="/mis-requisiciones" element={<MisRequisiciones />} />
            <Route path="/nueva" element={<RequireRole allowed={["solicitud", "admin", "revision"]}><NuevaRequisicion /></RequireRole>} />
            <Route path="/revision/requisiciones" element={<RequireRole allowed={["revision", "autorizacion", "direccion", "admin", "almacen"]}><BandejaRevision /></RequireRole>} />
            <Route path="/revision/:id" element={<DetalleRequisicion />} />
            <Route path="/requisiciones/:id" element={<DetalleRequisicion />} />
            <Route path="/notificaciones" element={<NotificacionesPage />} />
            <Route path="/admin/usuarios" element={<RequireRole allowed={["admin"]}><UsuariosAdmin /></RequireRole>} />
            
            {/* 👇 NUEVA RUTA PARA DIRECCIÓN Y ADMIN */}
            <Route path="/admin/configuracion" element={<RequireRole allowed={["admin", "direccion"]}><ConfiguracionFechas /></RequireRole>} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  );
}

export default function AppRouter() {
  return (
    <SessionProvider>
      <ToastProvider>
        <RequisicionesProvider>
          <NotificacionesProvider>
            <InnerRouter />
          </NotificacionesProvider>
        </RequisicionesProvider>
      </ToastProvider>
    </SessionProvider>
  );
}