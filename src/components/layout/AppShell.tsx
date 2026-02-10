import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  FilePlus2, 
  FileCheck2, 
  Users, 
  LogOut, 
  Menu, 
  BellRing,
  KeyRound,
  Calendar // <-- NUEVO ICONO IMPORTADO
} from 'lucide-react';
import { useSession } from '../../hooks/useSession';
import { useNotificaciones } from '../../hooks/useNotificaciones';
import CambioPasswordModal from '../CambioPasswordModal'; 

export default function AppShell() {
  const { user, logout, role } = useSession(); 
  const { pendientes } = useNotificaciones(); 
  
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

  // MENU DE NAVEGACIÓN
  const navigation = [
    { 
      name: 'Bandeja Revisión', 
      href: '/revision/requisiciones', 
      icon: FileCheck2, 
      roles: ['revision', 'autorizacion', 'direccion', 'admin', 'almacen'] 
    },
    { 
      name: 'Mis Trámites', 
      href: '/mis-requisiciones', 
      icon: LayoutDashboard, 
      roles: ['solicitud', 'admin', 'revision', 'autorizacion', 'direccion', 'almacen'] 
    },
    { 
      name: 'Nueva Solicitud', 
      href: '/nueva', 
      icon: FilePlus2, 
      roles: ['solicitud', 'admin', 'revision'] 
    },
    // 👇 NUEVA OPCIÓN AGREGADA 👇
    {
      name: 'Fechas de Recepción',
      href: '/admin/configuracion',
      icon: Calendar, 
      roles: ['admin', 'direccion'] 
    },
    // 👆 FIN DE NUEVA OPCIÓN 👆
    { 
      name: 'Usuarios', 
      href: '/admin/usuarios', 
      icon: Users, 
      roles: ['admin'] 
    },
  ];

  const userInitials = user?.email?.substring(0, 2).toUpperCase() || 'UB';

  // Etiquetas de rol
  const getRoleLabel = (r: string) => {
    if (r === 'admin') return 'Administrador';
    if (r === 'revision') return 'Revisor'; 
    if (r === 'autorizacion') return 'Autorización';
    if (r === 'direccion') return 'Dirección';
    if (r === 'almacen') return 'Almacén'; 
    return 'Solicitante';
  };

  const currentNav = navigation.filter(item => item.roles.includes(role || ''));

  // --- LÓGICA AGREGADA: Verificar si es admin ---
  const isAdmin = role === 'admin';
  // ---------------------------------------------

  return (
    <React.Fragment>
      <CambioPasswordModal isOpen={isPasswordModalOpen} onClose={() => setIsPasswordModalOpen(false)} />
      
      <div className="flex h-screen bg-surface">
        
        {/* Sidebar Móvil Overlay */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-40 bg-black/50 md:hidden backdrop-blur-sm transition-opacity" onClick={() => setSidebarOpen(false)} />
        )}

        {/* Sidebar */}
        <aside className={`
          fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 shadow-xl md:shadow-none
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}>
          <div className="h-full flex flex-col">
            {/* Logo Area */}
            <div className="h-16 flex items-center justify-center border-b border-gray-100 bg-white">
               {/* TU LOGO ORIGINAL */}
               <div className="flex items-center gap-2">
                 <img src="/logo-tapachula.jpeg" alt="Logo" className="h-10 w-auto object-contain" />
               </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
              {currentNav.map((item) => {
                const isActive = location.pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={`
                      flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 group
                      ${isActive 
                        ? 'bg-[var(--color-brand)] text-white shadow-md shadow-brand/20' 
                        : 'text-gray-600 hover:bg-gray-50 hover:text-[var(--color-brand)]'
                      }
                    `}
                  >
                    <item.icon size={20} className={isActive ? 'text-white' : 'text-gray-400 group-hover:text-[var(--color-brand)]'} />
                    {item.name}
                  </Link>
                );
              })}
            </nav>

            {/* User Footer */}
            <div className="p-4 border-t border-gray-100 bg-gray-50/50">
              <button 
                onClick={logout}
                className="flex items-center gap-3 w-full px-4 py-3 text-sm font-medium text-gray-600 rounded-xl hover:bg-red-50 hover:text-red-600 transition-colors"
              >
                <LogOut size={20} />
                Cerrar Sesión
              </button>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-surface">
          {/* Topbar */}
          <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 md:px-8 shadow-sm z-30">
            <button 
              onClick={() => setSidebarOpen(true)}
              className="md:hidden p-2 text-gray-500 hover:bg-gray-100 rounded-lg"
            >
              <Menu size={24} />
            </button>

            <div className="flex-1 flex justify-end items-center gap-4 md:gap-6">
              
              {/* Notificaciones (TU CÓDIGO ORIGINAL) */}
              <Link to="/notificaciones" className="relative p-2 text-gray-400 hover:text-[var(--color-brand)] hover:bg-gray-50 rounded-full transition-all">
                <BellRing size={22} />
                {pendientes > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white animate-pulse" />
                )}
              </Link>

              <div className="h-8 w-px bg-gray-200 hidden md:block"></div>

              {/* Perfil */}
              <div className="flex items-center gap-3 pl-2">
                <div className="hidden md:flex flex-col items-end">
                  <span className="text-sm font-bold text-gray-800 leading-tight">
                    {user?.email || 'Usuario'}
                  </span>
                  <span className="text-[10px] uppercase font-bold text-[var(--color-brand)] tracking-wider">
                    {getRoleLabel(role || '')}
                  </span>
                </div>

                {/* --- BOTÓN DE PERFIL MODIFICADO CON LÓGICA DE ADMIN --- */}
                <div className="relative group">
                   <button 
                     onClick={() => isAdmin && setIsPasswordModalOpen(true)}
                     className={`w-9 h-9 rounded-full bg-[var(--color-brand)] text-white flex items-center justify-center font-bold text-xs shadow-sm ring-2 ring-white transition-all relative overflow-hidden 
                        ${isAdmin ? "hover:ring-[var(--color-brand)]/50 cursor-pointer group-hover:scale-105" : "cursor-default"}`}
                     title={isAdmin ? "Clic para cambiar contraseña" : "Usuario conectado"}
                   >
                     {/* Overlay de llave solo si es Admin */}
                     {isAdmin && (
                         <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <KeyRound size={14} className="text-white" />
                         </div>
                     )}
                     
                     {/* Texto/Iniciales: Se oculta al hacer hover SOLO si es admin */}
                     <span className={isAdmin ? "group-hover:opacity-0 transition-opacity" : ""}>
                        {userInitials}
                     </span>
                   </button>
                </div>
                {/* ----------------------------------------------------- */}
                
              </div>

            </div>
          </header>

          <main className="flex-1 overflow-auto p-4 md:p-8">
            <div className="max-w-6xl mx-auto animate-fade-in">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </React.Fragment>
  );
}