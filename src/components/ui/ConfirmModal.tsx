import { AlertTriangle, X } from 'lucide-react';
import { Button } from './Button';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message?: string; // Ahora es opcional si usas children
  children?: React.ReactNode; // NUEVO: Para meter inputs personalizados
  type?: 'danger' | 'warning' | 'info';
}

export default function ConfirmModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = "¿Estás seguro?", 
  message,
  children,
  type = 'danger'
}: ConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-scale-in">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <h3 className="font-bold text-gray-800 flex items-center gap-2">
            {type === 'danger' && <AlertTriangle className="text-red-500" size={20} />}
            {type === 'warning' && <AlertTriangle className="text-amber-500" size={20} />}
            {title}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          {message && (
            <p className="text-gray-600 leading-relaxed text-sm mb-2">
              {message}
            </p>
          )}
          {/* Aquí se renderiza el textarea si existe */}
          {children}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 flex justify-end gap-3">
          <Button variant="ghost" onClick={onClose} size="sm">
            Cancelar
          </Button>
          <Button 
            variant={type === 'danger' ? 'danger' : 'primary'} 
            onClick={onConfirm} 
            size="sm"
          >
            Confirmar
          </Button>
        </div>
      </div>
    </div>
  );
}