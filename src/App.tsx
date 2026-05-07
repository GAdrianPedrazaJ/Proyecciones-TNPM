import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import { useNavStore } from './store/navStore';
import { useAuthStore } from './store/authStore';
import { authService } from './services/authService';
import { SupervisorDiario } from './components/SupervisorDiario';
import { SupervisorSemanal } from './components/SupervisorSemanal';
import { SupervisorHistorico } from './components/SupervisorHistorico';
import { SupervisorBloques } from './components/SupervisorBloques';
import { SupervisorSemanaDetalle } from './components/SupervisorSemanaDetalle';
import { GestionUsuarios } from './components/GestionUsuarios';
import { GestionSedes } from './components/Admin/GestionSedes';
import { GestionBloques } from './components/Admin/GestionBloques';
import { GestionProductos } from './components/Admin/GestionProductos';
import { GestionColores } from './components/Admin/GestionColores';
import { GestionVariedades } from './components/Admin/GestionVariedades';
import { GestionAreas } from './components/Admin/GestionAreas';
import { GestionAreasBloques } from './components/Admin/GestionAreasBloques';
import { ImportadorExcel } from './components/ImportadorExcel';
import AdminDashboard from './pages/AdminDashboard';
import { TrendingUp, Lock, User, Loader2, AlertCircle, ArrowRight } from 'lucide-react';
import { logger } from './utils/logger';
import { NotificationToast } from './components/UI/NotificationToast';

const App: React.FC = () => {
  const { currentView, setCurrentView } = useNavStore();
  const { user, setUser, isAdmin, isSuperAdmin } = useAuthStore();
  const [checking, setChecking] = useState(true);

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initApp = async () => {
      try {
        logger.info("Iniciando aplicación...");
        const currentUser = await authService.getCurrentUser();
        if (currentUser) {
          setUser(currentUser);
        }
      } catch (e) {
        logger.error("Error inicializando app", e);
      } finally {
        setChecking(false);
      }
    };
    initApp();
  }, [setUser]);

  useEffect(() => {
    if (user) {
      const adminViews = [
        'admin-dashboard', 'admin-tablas', 'importar-excel',
        'gestion-sedes', 'gestion-bloques', 'gestion-productos',
        'gestion-colores', 'gestion-variedades', 'gestion-areas',
        'gestion-areas-bloques'
      ];
      const superAdminViews = ['super-usuarios', 'super-roles'];

      if (adminViews.includes(currentView) && !isAdmin()) {
        setCurrentView('supervisor-bloques');
      }

      if (superAdminViews.includes(currentView) && !isSuperAdmin()) {
        setCurrentView('supervisor-bloques');
      }
    }
  }, [currentView, user, isAdmin, isSuperAdmin, setCurrentView]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const userData = await authService.login(username, password);
      setUser(userData);
      if (userData.rol === 'supervisor') setCurrentView('supervisor-bloques');
    } catch (err: any) {
      setError(err.message || 'Error de autenticación');
    } finally {
      setLoading(false);
    }
  };

  const renderContent = () => {
    switch (currentView) {
      case 'supervisor-bloques': return <SupervisorBloques />;
      case 'supervisor-diaria': return <SupervisorDiario />;
      case 'supervisor-semanal': return <SupervisorSemanal />;
      case 'supervisor-historial': return <SupervisorHistorico />;
      case 'supervisor-detalle': return <SupervisorSemanaDetalle />;
      case 'admin-dashboard': return isAdmin() ? <AdminDashboard /> : null;
      case 'importar-excel': return isSuperAdmin() ? <ImportadorExcel /> : null;
      case 'gestion-sedes': return isAdmin() ? <GestionSedes /> : null;
      case 'gestion-bloques': return isAdmin() ? <GestionBloques /> : null;
      case 'gestion-productos': return isAdmin() ? <GestionProductos /> : null;
      case 'gestion-colores': return isAdmin() ? <GestionColores /> : null;
      case 'gestion-variedades': return isAdmin() ? <GestionVariedades /> : null;
      case 'gestion-areas': return isAdmin() ? <GestionAreas /> : null;
      case 'gestion-areas-bloques': return isAdmin() ? <GestionAreasBloques /> : null;
      case 'super-usuarios': return isSuperAdmin() ? <GestionUsuarios /> : null;
      default: return <SupervisorBloques />;
    }
  };

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-center">
          <Loader2 className="animate-spin text-purple-500/40 mx-auto mb-6" size={64} />
          <p className="text-purple-400 text-[10px] font-black uppercase tracking-[0.4em] animate-pulse">Iniciando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6 font-sans">
        <NotificationToast />
        <div className="bg-white p-12 rounded-[3.5rem] shadow-2xl w-full max-w-md border-2 border-slate-100 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-purple-50 rounded-bl-full -z-0"></div>
          <div className="relative z-10">
            <div className="w-16 h-16 bg-purple-600 rounded-2xl mb-8 flex items-center justify-center shadow-xl shadow-purple-200 rotate-3">
              <TrendingUp className="text-white" size={32} />
            </div>
            <h2 className="text-5xl font-black text-slate-950 mb-2 tracking-tighter italic uppercase">TNPM</h2>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase ml-4">Usuario</label>
                <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} className="w-full bg-slate-50 border-2 border-slate-100 py-4 pl-6 rounded-2xl focus:border-purple-300 outline-none font-black" required />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase ml-4">Clave</label>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-slate-50 border-2 border-slate-100 py-4 pl-6 rounded-2xl focus:border-purple-300 outline-none font-black" required />
              </div>
              {error && <div className="text-red-700 bg-red-50 p-4 rounded-2xl text-[11px] font-bold border-2 border-red-100">{error}</div>}
              <button type="submit" disabled={loading} className="w-full bg-purple-600 text-white py-5 rounded-2xl font-black text-xs uppercase hover:bg-purple-700 transition-all flex items-center justify-center gap-3">
                {loading ? <Loader2 className="animate-spin" size={20} /> : <>Entrar <ArrowRight size={18} /></>}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return <Layout><NotificationToast />{renderContent()}</Layout>;
};

export default App;
