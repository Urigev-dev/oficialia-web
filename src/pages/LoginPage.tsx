// src/pages/LoginPage.tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSession } from "../hooks/useSession";

export default function LoginPage() {
  const { login, error, loading } = useSession();
  const navigate = useNavigate();

  const [email, setEmail] = useState("solicitud@tapachula.gob.mx");
  const [pass, setPass] = useState("tapachula2025");

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const logged = await login(email, pass);
    if (!logged) return; // si hay error, ya se muestra en pantalla

    // Redirección según rol
    if (logged.role === "revision") {
      navigate("/revision/requisiciones");
    } else if (logged.role === "admin") {
      navigate("/");
    } else {
      // solicitante u otros
      navigate("/");
    }
  };

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center">
      <div className="bg-surface shadow-[--shadow-card] rounded-[--radius-2xl] p-8 w-full max-w-md">
        <div className="mb-6 text-center">
          <img
            src="/logo-tapachula.svg"
            alt="Tapachula"
            className="h-12 mx-auto mb-3"
          />
          <h1 className="text-xl font-bold text-ink">Iniciar sesión</h1>
        </div>

        <form className="space-y-4" onSubmit={onSubmit}>
          <div>
            <label className="block text-sm font-medium text-ink">
              Correo institucional
            </label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              placeholder="usuario@tapachula.gob.mx"
              className="mt-1 w-full rounded-[--radius-xl] border border-border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-ink">
              Contraseña
            </label>
            <input
              value={pass}
              onChange={(e) => setPass(e.target.value)}
              type="password"
              placeholder="••••••••"
              className="mt-1 w-full rounded-[--radius-xl] border border-border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand"
            />
            <div className="mt-1 text-xs text-ink/70">
              Asignada por el administrador. Podrás cambiarla en tu perfil.
            </div>
          </div>

          {error && (
            <div className="text-sm text-white bg-brand-700 rounded-[--radius-xl] px-3 py-2">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand text-white rounded-[--radius-xl] py-2 font-semibold hover:bg-brand-700 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? "Verificando…" : "Ingresar"}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-ink/80">
          ¿Problemas para entrar? Contacta al administrador.
        </p>
      </div>
    </div>
  );
}