import React, { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSession } from "../hooks/useSession";
import { 
  Eye, EyeOff, Lock, Mail, ArrowRight, AlertCircle, HelpCircle, X 
} from "lucide-react";
import { Button } from "../components/ui/Button";

export default function LoginPage() {
  const { login, error: authError, loading: sessionLoading, user, booting } = useSession();
  const navigate = useNavigate();

  // --- ESTADOS DEL FORMULARIO LOGIN ---
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [showPass, setShowPass] = useState(false); 
  const [localWarn, setLocalWarn] = useState<string | null>(null);

  // --- ESTADO PARA MODAL DE SOPORTE ---
  const [showSupportModal, setShowSupportModal] = useState(false);

  const normalizedEmail = useMemo(() => email.trim().toLowerCase(), [email]);

  useEffect(() => {
    if (!booting && user) {
      navigate("/", { replace: true });
    }
  }, [user, booting, navigate]);

  // Loader de pantalla completa mientras carga Firebase
  if (booting) {
    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-4">
            <div className="w-12 h-12 border-4 border-[var(--color-brand)]/30 border-t-[var(--color-brand)] rounded-full animate-spin"></div>
            <p className="text-slate-500 font-medium animate-pulse">Cargando sistema...</p>
        </div>
    );
  }

  // --- LÓGICA DE LOGIN ---
  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalWarn(null);

    if (!email || !pass) {
      setLocalWarn("Por favor, ingresa tus credenciales.");
      return;
    }
    
    await login(normalizedEmail, pass);
  };

  return (
    <React.Fragment>
      
      {/* --- MODAL DE SOPORTE --- */}
      {showSupportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden animate-scale-in border border-slate-100 relative">
            
            <button 
              onClick={() => setShowSupportModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-1 rounded-full transition-colors"
            >
              <X size={20} />
            </button>

            <div className="p-8 text-center">
              <div className="w-12 h-12 bg-blue-50 text-[var(--color-brand)] rounded-full flex items-center justify-center mx-auto mb-4">
                <HelpCircle size={24} />
              </div>
              
              <h3 className="text-xl font-bold text-slate-800 mb-2">Soporte Técnico</h3>
              <p className="text-sm text-slate-500 mb-6 leading-relaxed">
                Para restablecer tu contraseña o reportar problemas de acceso, por favor contacta al administrador:
              </p>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 mb-6">
                <p className="text-xs font-bold uppercase text-slate-400 mb-1">Correo de contacto</p>
                <a href="mailto:contacto@redacert.com" className="text-base font-bold text-[var(--color-brand)] hover:underline">
                  contacto@redacert.com
                </a>
              </div>

              <Button onClick={() => setShowSupportModal(false)} className="w-full">
                Entendido
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* --- PANTALLA PRINCIPAL --- */}
      <div className="min-h-screen flex flex-col md:flex-row bg-slate-100">
        
        {/* Lado Izquierdo: Branding (Oscuro) - DISEÑO ORIGINAL MANTENIDO */}
        <div className="hidden md:flex md:w-1/2 lg:w-5/12 bg-gradient-to-br from-slate-900 via-[#0f172a] to-slate-800 relative overflow-hidden items-center justify-center p-12 lg:p-20 text-white">
          {/* Efectos de fondo */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-white/5 via-transparent to-transparent opacity-70"></div>
          <div className="absolute bottom-0 left-0 right-0 h-64 bg-gradient-to-t from-slate-900/80 to-transparent"></div>
          
          <div className="relative z-10 flex flex-col items-center text-center">
            
            {/* LOGO ENCAPSULADO EN CÍRCULO BLANCO */}
            <div className="mb-8 p-6 bg-white rounded-full shadow-[0_0_50px_rgba(255,255,255,0.15)] animate-fade-in-down border-4 border-slate-800/50">
                <img 
                    src="/imagen2.jpeg" 
                    alt="Escudo Tapachula" 
                    className="h-24 w-24 object-contain" 
                />
            </div>
            
            <h1 className="text-4xl lg:text-5xl font-extrabold mb-4 tracking-tight leading-tight bg-clip-text text-transparent bg-gradient-to-b from-white to-white/80">
                OFICIALÍA MAYOR
            </h1>
            <div className="h-1.5 w-24 bg-gradient-to-r from-[var(--color-gold)] to-amber-300 rounded-full mb-6 shadow-lg shadow-amber-500/20"></div>
            <p className="text-lg lg:text-xl text-slate-300 font-light max-w-md leading-relaxed">
              Sistema Integral de Requisiciones y Control de Servicios
            </p>
            <p className="text-sm text-slate-500 mt-8 uppercase tracking-widest font-bold">H. Ayuntamiento de Tapachula</p>
          </div>
        </div>

        {/* Lado Derecho: Formulario (Claro) */}
        <div className="w-full md:w-1/2 lg:w-7/12 flex items-center justify-center p-4 sm:p-8 md:p-12 lg:p-20 bg-[#F1F5F9]">
          
          {/* Tarjeta del Login */}
          <div className="w-full max-w-[480px] bg-white rounded-[2rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] border border-white p-8 sm:p-12 relative overflow-hidden animate-fade-in-up">
            
            {/* Barra superior de color decorativa */}
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-[var(--color-brand)] via-blue-500 to-[var(--color-gold)]"></div>
            
            <div className="mb-10 text-center md:text-left">
               {/* Logo visible solo en móvil */}
               <div className="md:hidden flex justify-center mb-6">
                    <div className="p-3 bg-slate-50 rounded-full border border-slate-100">
                        <img src="/imagen2.jpeg" alt="Logo" className="h-14 w-14 object-contain" />
                    </div>
               </div>
               <h2 className="text-3xl font-extrabold text-slate-800">Bienvenido</h2>
               <p className="text-slate-500 mt-3 text-lg leading-relaxed">Ingresa tus credenciales institucionales para acceder.</p>
            </div>

            <form onSubmit={onSubmit} className="space-y-6">
              
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-slate-500 tracking-wider ml-1">Correo Electrónico</label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[var(--color-brand)] transition-colors" size={20} />
                  <input
                    type="email"
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[var(--color-brand)]/20 focus:border-[var(--color-brand)] outline-none transition-all font-medium text-slate-700 shadow-sm group-hover:border-slate-300"
                    placeholder="usuario@tapachula.gob.mx"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-slate-500 tracking-wider ml-1">Contraseña</label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[var(--color-brand)] transition-colors" size={20} />
                  <input
                    type={showPass ? "text" : "password"}
                    className="w-full pl-12 pr-12 py-4 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[var(--color-brand)]/20 focus:border-[var(--color-brand)] outline-none transition-all font-medium text-slate-700 shadow-sm group-hover:border-slate-300"
                    placeholder="••••••••"
                    value={pass}
                    onChange={(e) => setPass(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-200 transition-all outline-none focus:bg-slate-200"
                  >
                    {showPass ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              {/* Advertencias */}
              {localWarn && (
                <div className="text-sm font-medium text-amber-700 bg-amber-50 p-4 rounded-xl border border-amber-100 flex items-start gap-3 animate-shake">
                  <AlertCircle size={18} className="mt-0.5 shrink-0" />
                  {localWarn}
                </div>
              )}

              {/* Errores Firebase */}
              {authError && (
                <div className="text-sm font-medium text-red-700 bg-red-50 p-4 rounded-xl border border-red-100 flex items-start gap-3 animate-shake">
                  <AlertCircle size={18} className="mt-0.5 shrink-0" />
                  {authError}
                </div>
              )}

              <Button
                type="submit"
                size="lg"
                className="w-full py-4 text-base font-bold shadow-xl shadow-[var(--color-brand)]/20 hover:shadow-[var(--color-brand)]/30 mt-2 transition-all hover:-translate-y-0.5"
                loading={sessionLoading}
                icon={ArrowRight}
              >
                INGRESAR AL SISTEMA
              </Button>

              {/* --- BOTÓN DE SOPORTE (Abre Modal) --- */}
              <div className="pt-6 text-center border-t border-slate-100 mt-6">
                  <button 
                    type="button"
                    onClick={() => setShowSupportModal(true)}
                    className="text-sm font-medium text-slate-500 hover:text-[var(--color-brand)] transition-colors hover:underline flex items-center justify-center gap-2 mx-auto"
                  >
                     <HelpCircle size={16} />
                     ¿Tienes problemas para ingresar?
                  </button>
              </div>

            </form>
          </div>
          
        </div>
      </div>
    </React.Fragment>
  );
}