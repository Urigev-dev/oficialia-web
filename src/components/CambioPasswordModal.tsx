import React, { useState, useEffect } from 'react';
import { 
  X, 
  Lock, 
  Save, 
  AlertCircle, 
  LogOut, 
  Eye, 
  EyeOff, 
  Check, 
  Circle 
} from 'lucide-react';
import { useSession } from '../hooks/useSession';
import { Button } from './ui/Button';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function CambioPasswordModal({ isOpen, onClose }: Props) {
  const { changePassword } = useSession();
  
  const [pass1, setPass1] = useState('');
  const [pass2, setPass2] = useState('');
  const [showPass, setShowPass] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Validaciones en tiempo real
  const validations = {
    length: pass1.length >= 8,
    upper: /[A-Z]/.test(pass1),
    lower: /[a-z]/.test(pass1),
    number: /[0-9]/.test(pass1),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(pass1)
  };

  // Reseteo al abrir/cerrar
  useEffect(() => {
    if (isOpen) {
      setPass1('');
      setPass2('');
      setError('');
      setShowPass(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const isFormValid = Object.values(validations).every(Boolean) && pass1 === pass2 && pass1.length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!isFormValid) return setError('Por favor, cumple con todos los requisitos de seguridad.');

    setLoading(true);
    try {
      await changePassword(pass1);
      onClose(); 
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error al cambiar la contraseña.');
      setLoading(false);
    }
  };

  // Componente de ítem de validación
  const ValidationItem = ({ fulfilled, text }: { fulfilled: boolean, text: string }) => (
    <div className={`flex items-center gap-2 text-xs transition-colors ${fulfilled ? 'text-emerald-600 font-medium' : 'text-gray-400'}`}>
      {fulfilled ? <Check size={12} strokeWidth={3} /> : <Circle size={10} />}
      <span>{text}</span>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-gray-100 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex justify-between items-center shrink-0">
          <h3 className="font-bold text-gray-800 flex items-center gap-2">
            <Lock size={18} className="text-[var(--color-brand)]" />
            Cambiar Contraseña
          </h3>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-gray-600 transition-colors outline-none"
            type="button"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body Scrollable */}
        <div className="p-6 overflow-y-auto">
          {/* Aviso de seguridad */}
          <div className="mb-4 p-3 bg-blue-50 text-blue-800 text-xs rounded-lg flex gap-2 items-start border border-blue-100">
             <LogOut size={16} className="shrink-0 mt-0.5" />
             <p>Por seguridad, al cambiar tu contraseña <strong>se cerrará tu sesión automáticamente</strong> y deberás ingresar con la nueva clave.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            
            {error && (
              <div className="bg-red-50 text-red-700 p-3 rounded-lg text-xs font-medium flex items-start gap-2 border border-red-100">
                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Input 1: Nueva Contraseña */}
            <div className="space-y-1 relative">
              <label className="text-xs font-bold uppercase text-gray-500 tracking-wider">Nueva Contraseña</label>
              <div className="relative">
                <input 
                  type={showPass ? "text" : "password"}
                  className="w-full p-3 pr-10 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[var(--color-brand)]/20 focus:border-[var(--color-brand)] outline-none transition-all"
                  placeholder="Ingresa tu nueva clave"
                  value={pass1}
                  onChange={e => setPass1(e.target.value)}
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  tabIndex={-1}
                >
                  {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Checklist de Validación */}
            <div className="grid grid-cols-2 gap-2 p-3 bg-gray-50 rounded-lg border border-gray-100">
                <ValidationItem fulfilled={validations.length} text="Mínimo 8 caracteres" />
                <ValidationItem fulfilled={validations.upper} text="Una mayúscula" />
                <ValidationItem fulfilled={validations.lower} text="Una minúscula" />
                <ValidationItem fulfilled={validations.number} text="Un número" />
                <ValidationItem fulfilled={validations.special} text="Un carácter especial (!@#$)" />
            </div>

            {/* Input 2: Confirmar */}
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase text-gray-500 tracking-wider">Confirmar Contraseña</label>
              <input 
                type={showPass ? "text" : "password"}
                className={`w-full p-3 bg-gray-50 border rounded-lg focus:ring-2 outline-none transition-all ${
                    pass2 && pass1 !== pass2 
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-200' 
                    : 'border-gray-200 focus:ring-[var(--color-brand)]/20 focus:border-[var(--color-brand)]'
                }`}
                placeholder="Repite la contraseña"
                value={pass2}
                onChange={e => setPass2(e.target.value)}
                disabled={loading}
              />
              {pass2 && pass1 !== pass2 && (
                  <p className="text-[10px] text-red-500 font-bold mt-1">Las contraseñas no coinciden</p>
              )}
            </div>

            {/* Botones */}
            <div className="pt-4 flex justify-end gap-3">
              <Button type="button" variant="ghost" onClick={onClose} disabled={loading}>
                Cancelar
              </Button>
              <Button type="submit" loading={loading} icon={Save} disabled={!isFormValid || loading}>
                {loading ? 'Actualizando...' : 'Actualizar y Salir'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}