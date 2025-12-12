// src/components/AccessDenied.tsx
export default function AccessDenied() {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <div className="text-4xl mb-4">🚫</div>
      <h2 className="text-lg font-semibold text-ink mb-2">Acceso denegado</h2>
      <p className="text-sm text-ink/70 text-center max-w-md">
        No cuentas con permisos para acceder a esta sección. 
        Si consideras que esto es un error, contacta al administrador del sistema.
      </p>
    </div>
  );
}