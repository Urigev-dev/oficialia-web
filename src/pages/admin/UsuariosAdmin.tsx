import { useState } from "react";
import { useSession, type SessionUser, type Role } from "../../hooks/useSession";
import { ORGANOS_REQUIRENTES } from "../../data/catalogos";
import AccessDenied from "../../components/AccessDenied";

// 1. SOLUCIÓN: Definimos el tipo extendido que incluye 'password'
interface UserFormState extends Partial<SessionUser> {
  password?: string;
}

function prettyError(e: any) {
  const code = e?.code || e?.name || "";
  const msg = String(e?.message || "");

  if (code === "auth/email-already-in-use") return "Ese correo ya existe. Usa otro correo.";
  if (code === "auth/invalid-email") return "Correo inválido.";
  if (code === "auth/weak-password") return "Contraseña débil. Usa al menos 6 caracteres.";
  if (code === "auth/operation-not-allowed")
    return "Email/Password no está habilitado en Firebase Auth (Authentication > Sign-in method).";
  if (code === "permission-denied" || msg.includes("Missing or insufficient permissions"))
    return "Sin permisos para crear usuarios. Revisa/implementa tus Firestore Rules y despliega reglas.";

  return msg || "No se pudo completar la operación. Revisa consola y reglas.";
}

export default function UsuariosAdmin() {
  const { user, allUsers, createUser, updateUser, deleteUser, loading, error } = useSession();
  
  // 2. SOLUCIÓN: Usamos <UserFormState | null> en lugar de <Partial<SessionUser> | null>
  // Esto le dice a TS que 'editing' puede tener la propiedad 'password'.
  const [editing, setEditing] = useState<UserFormState | null>(null);

  if (user?.role !== "admin") return <AccessDenied />;

  const handleSave = async () => {
    // Validaciones
    if (!editing || !editing.email || !editing.role || !editing.organo) {
      alert("Complete campos");
      return;
    }

    // Aquí TS ya no dará error al leer editing.password
    if (!editing.uid && !editing.password) {
      alert("La contraseña es requerida para crear el usuario.");
      return;
    }

    try {
      if (editing.uid) {
        await updateUser(editing.uid, {
          email: editing.email.trim(),
          role: editing.role as Role,
          organo: editing.organo,
          titular: editing.titular ?? "",
        });
        setEditing(null);
        alert("Usuario actualizado.");
      } else {
        await createUser({
          email: editing.email.trim(),
          // Aquí TS permite leer editing.password porque existe en UserFormState
          password: String(editing.password || ""),
          role: editing.role as Role,
          organo: editing.organo,
          titular: editing.titular ?? "",
        } as any);
        setEditing(null);
        alert("Usuario creado.");
      }
    } catch (e: any) {
      console.error(e);
      alert(prettyError(e));
    }
  };

  const handleDelete = async (u: SessionUser) => {
    if (!window.confirm(`¿Eliminar el perfil de ${u.email}?`)) return;
    try {
      await deleteUser(u.uid);
      alert("Usuario eliminado.");
    } catch (e: any) {
      console.error(e);
      alert(prettyError(e));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Administración de Usuarios</h2>
        <button
          // Al crear nuevo, inicializamos un objeto compatible con UserFormState
          onClick={() => setEditing({ role: "solicitud", organo: ORGANOS_REQUIRENTES[0] })}
          className="bg-brand text-white px-4 py-2 rounded shadow"
          disabled={loading}
        >
          + Nuevo Usuario
        </button>
      </div>

      {(error || "") && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 text-sm rounded p-3">
          {error}
        </div>
      )}

      {editing ? (
        <div className="bg-white p-6 rounded shadow border max-w-lg mx-auto space-y-4">
          <h3 className="font-bold">{editing.uid ? "Editar" : "Crear"} Usuario</h3>

          <div>
            <label className="text-xs font-bold">Correo</label>
            <input
              type="email"
              className="w-full border p-2 rounded"
              value={editing.email || ""}
              onChange={(e) => setEditing({ ...editing, email: e.target.value })}
            />
          </div>

          <div>
            <label className="text-xs font-bold">Contraseña</label>
            <input
              type="text"
              className="w-full border p-2 rounded"
              // Aquí solucionamos el error: editing.password ahora es válido
              value={editing.password || ""}
              onChange={(e) => setEditing({ ...editing, password: e.target.value })}
              placeholder="Requerido"
            />
          </div>

          <div>
            <label className="text-xs font-bold">Órgano Requirente</label>
            <select
              className="w-full border p-2 rounded"
              value={editing.organo || ORGANOS_REQUIRENTES[0]}
              onChange={(e) => setEditing({ ...editing, organo: e.target.value })}
            >
              {ORGANOS_REQUIRENTES.map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-bold">Nombre del Titular</label>
            <input
              type="text"
              className="w-full border p-2 rounded"
              value={editing.titular || ""}
              onChange={(e) => setEditing({ ...editing, titular: e.target.value })}
            />
          </div>

          <div>
            <label className="text-xs font-bold">Rol</label>
            <select
              className="w-full border p-2 rounded"
              value={(editing.role as any) || "solicitud"}
              onChange={(e) => setEditing({ ...editing, role: e.target.value as Role })}
            >
              <option value="solicitud">Solicitante</option>
              <option value="revision">Revisión</option>
              <option value="direccion">Dirección</option>
              <option value="autorizacion">Autorización</option>
              <option value="admin">Admin</option>
              <option value="almacen">Almacén</option>
            </select>
          </div>

          <div className="flex justify-end gap-2 mt-4">
            <button
              onClick={() => setEditing(null)}
              className="px-3 py-1 border rounded"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              className="px-3 py-1 bg-brand text-white rounded"
              disabled={loading}
            >
              {loading ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded shadow overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left">
              <tr>
                <th className="p-3">Usuario / Correo</th>
                <th className="p-3">Órgano / Titular</th>
                <th className="p-3">Rol</th>
                <th className="p-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {allUsers.map((u) => (
                <tr key={u.uid}>
                  <td className="p-3 font-mono">{u.email}</td>
                  <td className="p-3">
                    <div className="font-bold">{u.organo}</div>
                    <div className="text-gray-500">{u.titular}</div>
                  </td>
                  <td className="p-3">
                    <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-xs uppercase">
                      {u.role}
                    </span>
                  </td>
                  <td className="p-3 text-right space-x-2">
                    <button
                      // 'u' es SessionUser, pero es compatible con UserFormState
                      onClick={() => setEditing(u)}
                      className="text-blue-600 hover:underline"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDelete(u)}
                      className="text-red-600 hover:underline"
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
              {allUsers.length === 0 && (
                <tr>
                  <td className="p-3 text-gray-500" colSpan={4}>
                    No hay usuarios cargados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}