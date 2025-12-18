import { useState } from "react";
import { useSession, type SessionUser, type Role } from "../../hooks/useSession";
import { ORGANOS_REQUIRENTES } from "../../data/catalogos";
import AccessDenied from "../../components/AccessDenied";

export default function UsuariosAdmin() {
  const { user, allUsers, createUser, updateUser, deleteUser } = useSession();
  const [editing, setEditing] = useState<Partial<SessionUser> | null>(null);

  if (user?.role !== "admin") return <AccessDenied />;

  const handleSave = () => {
      if (!editing || !editing.email || !editing.role || !editing.organo) return alert("Complete campos");
      if (editing.uid) {
          updateUser(editing.uid, editing);
      } else {
          createUser(editing as any);
      }
      setEditing(null);
  };

  return (
    <div className="space-y-6">
        <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold">Administración de Usuarios</h2>
            <button onClick={() => setEditing({ role: "solicitud", organo: ORGANOS_REQUIRENTES[0] })} className="bg-brand text-white px-4 py-2 rounded shadow">+ Nuevo Usuario</button>
        </div>

        {editing ? (
            <div className="bg-white p-6 rounded shadow border max-w-lg mx-auto space-y-4">
                <h3 className="font-bold">{editing.uid ? "Editar" : "Crear"} Usuario</h3>
                <div>
                    <label className="text-xs font-bold">Correo</label>
                    <input type="email" className="w-full border p-2 rounded" value={editing.email || ""} onChange={e => setEditing({...editing, email: e.target.value})} />
                </div>
                <div>
                    <label className="text-xs font-bold">Contraseña</label>
                    <input type="text" className="w-full border p-2 rounded" value={editing.password || ""} onChange={e => setEditing({...editing, password: e.target.value})} placeholder="Requerido" />
                </div>
                <div>
                    <label className="text-xs font-bold">Órgano Requirente</label>
                    <select className="w-full border p-2 rounded text-sm" value={editing.organo} onChange={e => setEditing({...editing, organo: e.target.value})}>
                        {ORGANOS_REQUIRENTES.map(o => <option key={o}>{o}</option>)}
                    </select>
                </div>
                <div>
                    <label className="text-xs font-bold">Nombre del Titular</label>
                    <input type="text" className="w-full border p-2 rounded" value={editing.titular || ""} onChange={e => setEditing({...editing, titular: e.target.value})} />
                </div>
                <div>
                    <label className="text-xs font-bold">Rol</label>
                    <select className="w-full border p-2 rounded" value={editing.role} onChange={e => setEditing({...editing, role: e.target.value as Role})}>
                        <option value="solicitud">Solicitante</option>
                        <option value="revision">Revisión</option>
                        <option value="direccion">Dirección</option>
                        <option value="autorizacion">Autorización</option>
                        <option value="admin">Admin</option>
                    </select>
                </div>
                <div className="flex justify-end gap-2 mt-4">
                    <button onClick={() => setEditing(null)} className="px-3 py-1 border rounded">Cancelar</button>
                    <button onClick={handleSave} className="px-3 py-1 bg-brand text-white rounded">Guardar</button>
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
                        {allUsers.map(u => (
                            <tr key={u.uid} className="hover:bg-gray-50">
                                <td className="p-3 font-medium">{u.email}</td>
                                <td className="p-3">
                                    <div className="text-xs text-gray-500">{u.organo}</div>
                                    <div>{u.titular}</div>
                                </td>
                                <td className="p-3"><span className="bg-blue-50 text-blue-800 px-2 py-0.5 rounded text-xs uppercase">{u.role}</span></td>
                                <td className="p-3 text-right space-x-2">
                                    <button onClick={() => setEditing(u)} className="text-blue-600 hover:underline">Editar</button>
                                    <button onClick={() => { if(confirm("¿Eliminar?")) deleteUser(u.uid) }} className="text-red-600 hover:underline">Eliminar</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        )}
    </div>
  );
}