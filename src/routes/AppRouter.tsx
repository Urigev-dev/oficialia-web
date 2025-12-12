// src/routes/AppRouter.tsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import type { ReactNode } from "react";

import LoginPage from "../pages/LoginPage";
import MisRequisiciones from "../pages/MisRequisiciones";
import NuevaRequisicion from "../pages/NuevaRequisicion";
import BandejaRevision from "../pages/BandejaRevision";
import DetalleRequisicion from "../pages/DetalleRequisicion";
import RequisicionPrint from "../pages/RequisicionPrint";
import NotificacionesPage from "../pages/NotificacionesPage"; // Usamos la nueva versión Page
import CotizacionPrint from "../pages/CotizacionPrint"; // <--- IMPORTANTE: Importar el nuevo archivo

import { AppShell } from "../components/layout/AppShell";
import AccessDenied from "../components/AccessDenied";

import {
  SessionProvider,
  useSession,
  type Role,
} from "../hooks/useSession";
import { RequisicionesProvider } from "../hooks/useRequisiciones";
import { NotificacionesProvider } from "../hooks/useNotificaciones";

// ---------- Guards ----------

function RequireAuth({ children }: { children: ReactNode }) {
  const { user } = useSession();
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

function RequireRole({
  allowed,
  children,
}: {
  allowed: Role[];
  children: ReactNode;
}) {
  const { role } = useSession();

  if (!role) return <AccessDenied />;
  if (!allowed.includes(role)) return <AccessDenied />;

  return <>{children}</>;
}

// ---------- Router interno ----------

function InnerRouter() {
  return (
    <BrowserRouter>
      <Routes>
        {/* LOGIN */}
        <Route path="/login" element={<LoginPage />} />

        {/* REDIRECCIÓN RAÍZ */}
        <Route path="/" element={<Navigate to="/mis-requisiciones" replace />} />

        {/* ROL SOLICITUD – Dashboard básico (mis requisiciones) */}
        <Route
          path="/mis-requisiciones"
          element={
            <RequireAuth>
              <RequireRole allowed={["solicitud", "admin"]}>
                <AppShell>
                  <MisRequisiciones />
                </AppShell>
              </RequireRole>
            </RequireAuth>
          }
        />

        {/* ROL SOLICITUD – Nueva requisición (creación / edición vía ?id=) */}
        <Route
          path="/nueva"
          element={
            <RequireAuth>
              <RequireRole allowed={["solicitud", "admin"]}>
                <AppShell>
                  <NuevaRequisicion />
                </AppShell>
              </RequireRole>
            </RequireAuth>
          }
        />

        {/* BANDEJA DE REVISIÓN – Adquisiciones */}
        <Route
          path="/revision/requisiciones"
          element={
            <RequireAuth>
              <RequireRole allowed={["revision", "admin"]}>
                <AppShell>
                  <BandejaRevision />
                </AppShell>
              </RequireRole>
            </RequireAuth>
          }
        />

        {/* DETALLE DE REQUISICIÓN 
            Lo comparten: solicitud, revisión y admin  */}
        <Route
          path="/requisiciones/:id"
          element={
            <RequireAuth>
              <RequireRole allowed={["solicitud", "revision", "admin"]}>
                <AppShell>
                  <DetalleRequisicion />
                </AppShell>
              </RequireRole>
            </RequireAuth>
          }
        />

        {/* IMPRESIÓN DE FORMATO FINAL (AUTORIZADA) */}
        <Route
          path="/requisiciones/:id/imprimir"
          element={
            <RequireAuth>
              <RequireRole allowed={["solicitud", "revision", "admin"]}>
                <RequisicionPrint />
              </RequireRole>
            </RequireAuth>
          }
        />

        {/* IMPRESIÓN LISTA COTIZACIÓN (PROVEEDORES) - NUEVA RUTA */}
        <Route
          path="/requisiciones/:id/cotizacion-print"
          element={
            <RequireAuth>
              <RequireRole allowed={["revision", "admin"]}>
                <CotizacionPrint />
              </RequireRole>
            </RequireAuth>
          }
        />

        {/* NOTIFICACIONES */}
        <Route
          path="/notificaciones"
          element={
            <RequireAuth>
              <RequireRole allowed={["solicitud", "revision", "admin"]}>
                <AppShell>
                  <NotificacionesPage />
                </AppShell>
              </RequireRole>
            </RequireAuth>
          }
        />

        {/* CATCH-ALL */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

// ---------- Wrapper con providers ----------

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