import React, { useState } from 'react';
import { useNavStore } from '../store/navStore';
import { useAuthStore } from '../store/authStore';
import { useSyncStore } from '../store/useSyncStore';
import {
  Calendar,
  LogOut,
  ShieldCheck,
  Menu,
  X,
  TrendingUp,
  History,
  MapPin,
  Box,
  Tag,
  Palette,
  Layers,
  Users,
  FileSpreadsheet,
  GanttChart,
  LayoutGrid,
  Link as LinkIcon,
  Wifi,
  WifiOff,
  RefreshCw,
  AlertCircle,
  CalendarRange
} from 'lucide-react';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentView, setCurrentView } = useNavStore();
  const { user, signOut } = useAuthStore();
  const { isSyncing, isOnline, lastSyncError } = useSyncStore();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const menuGroups = [
    {
      title: 'PROYECCIONES PER',
      roles: ['supervisor', 'administrador', 'superadministrador'],
      items: [
        { id: 'supervisor-bloques', label: 'Mis Bloques', icon: LayoutGrid, roles: ['supervisor', 'administrador', 'superadministrador'] },
        { id: 'supervisor-diaria', label: 'Proyección Diaria', icon: Calendar, roles: ['supervisor', 'administrador', 'superadministrador'] },
        { id: 'supervisor-semanal', label: 'Proyección Semanal (PER 4)', icon: GanttChart, roles: ['supervisor', 'administrador', 'superadministrador'] },
        { id: 'supervisor-detalle', label: 'Matriz Semanal', icon: CalendarRange, roles: ['supervisor', 'administrador', 'superadministrador'] },
        { id: 'supervisor-historial', label: 'Históricos PER 0', icon: History, roles: ['supervisor', 'administrador', 'superadministrador'] },
        { id: 'admin-dashboard', label: 'Dashboard Curvas', icon: TrendingUp, roles: ['superadministrador'] },
      ]
    },
    {
      title: 'MAESTROS',
      roles: ['administrador', 'superadministrador'],
      items: [
        { id: 'importar-excel', label: 'Importar Excel', icon: FileSpreadsheet, roles: ['superadministrador'] },
        { id: 'gestion-sedes', label: 'Sedes', icon: MapPin, roles: ['administrador', 'superadministrador'] },
        { id: 'gestion-bloques', label: 'Bloques', icon: Box, roles: ['administrador', 'superadministrador'] },
        { id: 'gestion-productos', label: 'Productos', icon: Tag, roles: ['administrador', 'superadministrador'] },
        { id: 'gestion-colores', label: 'Colores', icon: Palette, roles: ['administrador', 'superadministrador'] },
        { id: 'gestion-variedades', label: 'Variedades', icon: Layers, roles: ['administrador', 'superadministrador'] },
      ]
    }
  ];

  const handleNavClick = (view: any) => {
    setCurrentView(view);
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row font-sans overflow-hidden">
      {/* Sidebar */}
      <aside className={`
        fixed inset-0 z-40 md:relative md:z-auto
        transform ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        md:translate-x-0 transition-transform duration-300 ease-in-out
        flex flex-col w-72 bg-black border-r border-white/5 shadow-2xl
      `}>
        <div className="p-10">
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2.5 bg-purple-600 rounded-2xl shadow-xl shadow-purple-600/20 rotate-3">
              <TrendingUp className="text-white" size={24} />
            </div>
            <h1 className="text-2xl font-black text-white tracking-tighter italic">TNPM</h1>
          </div>

          {/* MONITOR DE SINCRONIZACIÓN */}
          <div className="mt-6 flex items-center gap-3 px-4 py-3 bg-white/5 rounded-2xl border border-white/10">
            {isSyncing ? (
              <RefreshCw className="text-purple-400 animate-spin" size={14} />
            ) : isOnline ? (
              <Wifi className="text-emerald-400" size={14} />
            ) : (
              <WifiOff className="text-red-400" size={14} />
            )}
            <div className="flex-1">
              <p className="text-[8px] font-black text-white/40 uppercase tracking-widest leading-none mb-1">Estado Cloud</p>
              <p className="text-[10px] font-bold text-white leading-none">
                {isSyncing ? 'Sincronizando...' : isOnline ? 'Conectado' : 'Sin Conexión'}
              </p>
            </div>
            {lastSyncError && <AlertCircle className="text-red-500 animate-pulse" size={14} />}
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-8 overflow-y-auto pb-10 scrollbar-thin scrollbar-thumb-white/10">
          {menuGroups.map((group) => {
            const visibleItems = group.items.filter(item => item.roles.includes(user?.rol || ''));
            if (visibleItems.length === 0) return null;

            return (
              <div key={group.title} className="space-y-1.5">
                <h3 className="px-5 text-[9px] font-black text-white/20 uppercase tracking-[0.3em] mb-2">{group.title}</h3>
                <div className="space-y-1">
                  {visibleItems.map((item) => {
                    const isActive = currentView === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => handleNavClick(item.id)}
                        className={`w-full flex items-center space-x-4 px-5 py-3.5 rounded-2xl transition-all duration-300 group ${
                          isActive
                            ? 'bg-purple-600 text-white shadow-xl shadow-purple-600/20'
                            : 'text-white/40 hover:bg-white/5 hover:text-white'
                        }`}
                      >
                        <item.icon size={18} className={isActive ? 'text-white' : 'text-purple-500'} />
                        <span className={`font-bold text-sm tracking-tight`}>{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/5 bg-white/[0.02]">
          <div className="flex items-center gap-4 px-4 py-5 mb-4 bg-white/5 rounded-3xl border border-white/5">
            <div className="w-10 h-10 rounded-xl bg-purple-600 flex items-center justify-center font-black text-white text-lg italic">
              {user?.nombre_completo?.charAt(0) || '?'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-black text-white truncate leading-none mb-1">{user?.nombre_completo}</p>
              <p className="text-[8px] text-purple-400 font-black uppercase tracking-widest">{user?.rol}</p>
            </div>
          </div>
          <button onClick={signOut} className="w-full flex items-center justify-center space-x-2 py-3 rounded-xl text-white/20 font-black text-[9px] uppercase tracking-widest hover:bg-red-500/10 hover:text-red-400 transition-all border border-transparent hover:border-red-500/20">
            <LogOut size={14} /> <span>Salir</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 h-screen overflow-y-auto bg-slate-50 relative">
        <div className="p-4 md:p-10 lg:p-12">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
