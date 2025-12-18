// src/pages/LoginPage.tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSession } from "../hooks/useSession";

export default function LoginPage() {
  const { login, error, loading } = useSession();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const logged = await login(email, pass);
    if (logged) navigate("/"); // Simplificado
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white shadow-xl rounded-lg p-8 w-full max-w-md border border-gray-200">
        <div className="mb-8 text-center">
          {/* FIX IMAGEN: Ruta relativa */}
          <img src="./logo-tapachula.jpeg" alt="Tapachula" className="h-20 mx-auto mb-4 object-contain" />
          <h1 className="text-2xl font-bold text-gray-800">Iniciar sesión</h1>
          <p className="text-gray-500 text-sm">Sistema de Requerimientos v1.0</p>
        </div>

        <form className="space-y-5" onSubmit={onSubmit}>
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Correo Institucional</label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              className="w-full rounded-md border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:border-gray-500 focus:ring-1 focus:ring-gray-500 transition-colors"
              placeholder="ejemplo@tapachula.gob.mx"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Contraseña</label>
            <input
              value={pass}
              onChange={(e) => setPass(e.target.value)}
              type="password"
              className="w-full rounded-md border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:border-gray-500 focus:ring-1 focus:ring-gray-500 transition-colors"
              placeholder="••••••••"
            />
          </div>

          {error && <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md border border-red-100 text-center font-medium">{error}</div>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gray-900 text-white rounded-md py-2.5 font-bold hover:bg-black transition-all shadow-md disabled:opacity-70"
          >
            {loading ? "Verificando..." : "INGRESAR AL SISTEMA"}
          </button>
        </form>
      </div>
    </div>
  );
}