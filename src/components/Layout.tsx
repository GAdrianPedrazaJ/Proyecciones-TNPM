import React, { useState } from 'react';
import { useNavStore } from '../store/navStore';
import { useAuthStore } from '../store/authStore';
import {
  Calendar,
  LogOut,
  ShieldCheck,
  Menu,
  X,
  TrendingUp,
  UserCog,
  Settings,
  History,
  LayoutDashboard,
  MapPin,
  Box,
  Tag,
  Palette,
  Layers,
  Users
} from 'lucide-react';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentView, setCurrentView } = useNavStore();
  const { user, signOut } = useAuthStore();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const menuItems = [
    // --- MÓDULOS SUPERVISOR ---
    { id: 'supervisor-diaria', label: 'Proyección Diaria', icon: Calendar, roles: ['supervisor', 'administrador', 'superadministrador'] },
    { id: 'supervisor-semanal', label: 'Proyección Semanal', icon: Calendar, roles: ['supervisor', 'administrador', 'superadministrador'] },
    { id: 'supervisor-historial', label: 'Históricos PER0', icon: History, roles: ['supervisor', 'administrador', 'superadministrador'] },

    // --- MÓDULOS SUPERADMIN (Visualización) ---
    { id: 'admin-dashboard', label: 'Dashboard Curvas', icon: TrendingUp, roles: ['superadministrador'] },
    { id: 'admin-tablas', label: 'Agregados PER0', icon: LayoutDashboard, roles: ['superadministrador'] },

    // --- GESTIÓN DE TABLAS (MAESTROS) ---
    { id: 'gestion-sedes', label: 'Sedes', icon: MapPin, roles: ['administrador', 'superadministrador'] },
    { id: 'gestion-bloques', label: 'Bloques', icon: Box, roles: ['administrador', 'superadministrador'] },
    { id: 'gestion-productos', label: 'Productos', icon: Tag, roles: ['administrador', 'superadministrador'] },
    { id: 'gestion-colores', label: 'Colores', icon: Palette, roles: ['administrador', 'superadministrador'] },
    { id: 'gestion-variedades', label: 'Variedades', icon: Layers, roles: ['administrador', 'superadministrador'] },
    { id: 'gestion-areas', label: 'Áreas', icon: Layers, roles: ['administrador', 'superadministrador'] },
    { id: 'super-usuarios', label: 'Supervisores', icon: Users, roles: ['superadministrador'] },

    // --- CONFIGURACIÓN ---
    { id: 'super-roles', label: 'Permisos & Roles', icon: ShieldCheck, roles: ['superadministrador'] },
  ];

  const filteredMenu = menuItems.filter(item =>
    item.roles.includes(user?.rol || '')
  );

  const handleNavClick = (view: any) => {
    setCurrentView(view);
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row font-sans">
      {/* Mobile Header */}
      <header className="md:hidden bg-indigo-900 text-white p-4 flex justify-between items-center sticky top-0 z-50 shadow-md">
        <div className="flex items-center gap-2">
          <TrendingUp className="text-indigo-300" />
          <h1 className="font-black tracking-tighter">TNPM PROY</h1>
        </div>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 bg-indigo-800 rounded-xl">
          {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </header>

      {/* Sidebar */}
      <aside className={`
        fixed inset-0 z-40 md:relative md:z-auto
        transform ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        md:translate-x-0 transition-transform duration-300 ease-in-out
        flex flex-col w-72 bg-indigo-950 text-slate-200 shadow-2xl
      `}>
        <div className="p-8 hidden md:block">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-500/20">
              <TrendingUp className="text-white" size={24} />
            </div>
            <h1 className="text-2xl font-black text-white tracking-tighter italic">TNPM PROY</h1>
          </div>
          <p className="text-[10px] text-indigo-400 font-black uppercase tracking-[0.2em] mt-2">Gestión de Proyecciones</p>
        </div>

        <nav className="flex-1 px-4 space-y-1 overflow-y-auto pt-24 md:pt-0 pb-4 scrollbar-thin scrollbar-thumb-indigo-800">
          {filteredMenu.map((item) => (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-2xl transition-all duration-200 group ${
                currentView === item.id
                  ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-900/50 scale-[1.02]'
                  : 'hover:bg-indigo-900/50 hover:text-white'
              }`}
            >
              <item.icon size={18} className={currentView === item.id ? 'text-white' : 'text-indigo-400 group-hover:text-indigo-200'} />
              <span className="font-bold text-sm tracking-tight">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-indigo-900/50 bg-indigo-950/80 backdrop-blur-md">
          <div className="flex items-center gap-3 px-4 py-4 mb-4 bg-indigo-900/20 rounded-[1.5rem] border border-indigo-800/30">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500 flex items-center justify-center font-black text-white shadow-inner text-lg">
              {user?.nombre_completo?.charAt(0) || '?'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-black text-white truncate leading-none mb-1">{user?.nombre_completo || 'Usuario'}</p>
              <p className="text-[9px] text-indigo-400 font-black uppercase tracking-widest">{user?.rol}</p>
            </div>
          </div>
          <button
            onClick={signOut}
            className="w-full flex items-center justify-center space-x-2 px-4 py-3 rounded-2xl text-red-400 font-black text-xs uppercase tracking-widest hover:bg-red-500/10 transition-all border border-transparent hover:border-red-500/20"
          >
            <LogOut size={16} />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <main className="flex-1 overflow-y-auto p-4 md:p-10 lg:p-12">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
