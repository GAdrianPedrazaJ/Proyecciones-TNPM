import React, { useState } from 'react';
import { useNavStore } from '../store/navStore';
import { useAuthStore } from '../store/authStore';
import { useSyncStore } from '../store/useSyncStore';
import {
  Calendar,
  LogOut,
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
  Wifi,
  WifiOff,
  RefreshCw,
  CalendarRange,
  ChevronLeft,
  ChevronRight,
  PieChart,
  Settings2,
  GitBranch
} from 'lucide-react';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentView, setCurrentView } = useNavStore();
  const { user, signOut } = useAuthStore();
  const { isSyncing, isOnline } = useSyncStore();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const menuGroups = [
    {
      title: 'ANÁLISIS',
      items: [
        { id: 'admin-dashboard', label: 'Dashboard Curvas', icon: TrendingUp, roles: ['administrador', 'superadministrador'] },
        { id: 'acumulados', label: 'Acumulados', icon: PieChart, roles: ['administrador', 'superadministrador'] },
      ]
    },
    {
      title: 'OPERACIÓN',
      items: [
        { id: 'supervisor-bloques', label: 'Mis Bloques', icon: LayoutGrid, roles: ['supervisor', 'superadministrador'] },
        { id: 'supervisor-diaria', label: 'Proyección Diaria', icon: Calendar, roles: ['supervisor', 'superadministrador'] },
        { id: 'supervisor-semanal', label: 'Proyección Semanal', icon: GanttChart, roles: ['supervisor', 'superadministrador'] },
        { id: 'supervisor-detalle', label: 'Matriz Semanal', icon: CalendarRange, roles: ['supervisor', 'superadministrador'] },
        { id: 'supervisor-historial', label: 'Históricos PER 0', icon: History, roles: ['supervisor', 'superadministrador'] },
      ]
    },
    {
      title: 'MAESTROS',
      items: [
        { id: 'importar-excel', label: 'Importar Excel', icon: FileSpreadsheet, roles: ['superadministrador'] },
        { id: 'gestion-sedes', label: 'Sedes', icon: MapPin, roles: ['administrador', 'superadministrador'] },
        { id: 'gestion-areas', label: 'Áreas', icon: GitBranch, roles: ['superadministrador'] },
        { id: 'gestion-bloques', label: 'Bloques', icon: Box, roles: ['administrador', 'superadministrador'] },
        { id: 'gestion-productos', label: 'Productos', icon: Tag, roles: ['administrador', 'superadministrador'] },
        { id: 'gestion-colores', label: 'Colores', icon: Palette, roles: ['administrador', 'superadministrador'] },
        { id: 'gestion-variedades', label: 'Variedades', icon: Layers, roles: ['administrador', 'superadministrador'] },
        { id: 'gestion-areas-bloques', label: 'Áreas y Bloques', icon: Settings2, roles: ['superadministrador'] },
        { id: 'super-usuarios', label: 'Usuarios', icon: Users, roles: ['superadministrador'] },
      ]
    }
  ];

  const isItemVisible = (item: any) => {
    if (!user) return false;
    if (user.rol === 'superadministrador') return item.roles.includes('superadministrador');
    if (user.rol === 'administrador') {
      const isAllowedByRole = item.roles.includes('administrador');
      const isAllowedByPermissions = !user.secciones_permitidas || user.secciones_permitidas.includes(item.id);
      return isAllowedByRole && isAllowedByPermissions;
    }
    return item.roles.includes(user.rol);
  };

  return (
    <div className="h-screen w-full bg-slate-50 flex flex-col md:flex-row font-sans overflow-hidden">
      <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="md:hidden fixed top-4 right-4 z-50 p-3 bg-black text-white rounded-2xl shadow-lg">
        {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      <aside className={`fixed inset-y-0 left-0 z-40 md:relative md:z-auto transform ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 transition-all duration-300 ease-in-out flex flex-col bg-black border-r border-white/5 shadow-2xl h-full ${isCollapsed ? 'w-20' : 'w-72'}`}>
        <button onClick={() => setIsCollapsed(!isCollapsed)} className="hidden md:flex absolute -right-3 top-10 bg-purple-600 text-white rounded-full p-1 shadow-lg border-2 border-slate-50 hover:bg-purple-700 transition-colors z-50">
          {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>

        <div className={`p-6 ${isCollapsed ? 'px-4' : 'px-8'} pb-6`}>
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2.5 bg-purple-600 rounded-2xl shrink-0 rotate-3">
              <TrendingUp className="text-white" size={24} />
            </div>
            {!isCollapsed && <h1 className="text-2xl font-black text-white italic">TNPM</h1>}
          </div>
          <div className={`mt-6 flex items-center bg-white/5 rounded-2xl border border-white/10 ${isCollapsed ? 'p-2.5 justify-center' : 'px-4 py-3 gap-3'}`}>
            {isSyncing ? <RefreshCw className="text-purple-400 animate-spin" size={14} /> : (isOnline ? <Wifi className="text-emerald-400" size={14} /> : <WifiOff className="text-red-400" size={14} />)}
            {!isCollapsed && <p className="text-[11px] font-bold text-white">{isOnline ? 'Conectado' : 'Offline'}</p>}
          </div>
        </div>

        <nav className={`flex-1 space-y-8 overflow-y-auto pb-6 ${isCollapsed ? 'px-2' : 'px-4'}`}>
          {menuGroups.map((group) => {
            const visibleItems = group.items.filter(item => isItemVisible(item));
            if (visibleItems.length === 0) return null;
            return (
              <div key={group.title} className="space-y-1.5">
                {!isCollapsed && <h3 className="px-5 text-[10px] font-black text-white/20 uppercase tracking-[0.3em] mb-2">{group.title}</h3>}
                {visibleItems.map((item) => {
                  const isActive = currentView === item.id;
                  return (
                    <button key={item.id} onClick={() => { setCurrentView(item.id as any); setIsMobileMenuOpen(false); }} className={`w-full flex items-center rounded-2xl transition-all ${isCollapsed ? 'justify-center p-3' : 'px-5 py-3 space-x-4'} ${isActive ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20' : 'text-white/40 hover:bg-white/5 hover:text-white'}`}>
                      <item.icon size={isCollapsed ? 22 : 18} />
                      {!isCollapsed && <span className="font-bold text-sm truncate">{item.label}</span>}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </nav>

        <div className={`p-4 border-t border-white/5 bg-white/[0.02] ${isCollapsed ? 'flex flex-col items-center' : ''}`}>
          <div className={`flex items-center bg-white/5 rounded-2xl ${isCollapsed ? 'p-2 mb-2' : 'gap-4 px-4 py-4 mb-3'}`}>
            <div className="w-10 h-10 rounded-xl bg-purple-600 flex items-center justify-center font-black text-white">{user?.nombre_completo?.charAt(0)}</div>
            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-bold text-white truncate">{user?.nombre_completo}</p>
                <p className="text-[9px] text-purple-400 font-black uppercase">{user?.rol}</p>
              </div>
            )}
          </div>
          <button onClick={signOut} className="w-full py-3 flex items-center justify-center gap-2 text-white/20 hover:text-red-400 transition-all font-black text-[10px] uppercase">
            <LogOut size={16} /> {!isCollapsed && 'Cerrar Sesión'}
          </button>
        </div>
      </aside>

      <main className="flex-1 h-full overflow-y-auto bg-slate-50 relative">
        <div className="p-6 md:p-12 max-w-[1600px] mx-auto">{children}</div>
      </main>
    </div>
  );
};

export default Layout;
