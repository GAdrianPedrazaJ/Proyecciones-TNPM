import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import { useNavStore } from './store/navStore';
import { useAuthStore } from './store/authStore';
import { authService } from './services/authService'; // Este deberá migrarse a Firebase próximamente
import { SupervisorDiario } from './components/SupervisorDiario';
import { SupervisorSemanal } from './components/SupervisorSemanal';
import { SupervisorHistorico } from './components/SupervisorHistorico';
import { GestionUsuarios } from './components/GestionUsuarios';
import { GestionSedes } from './components/Admin/GestionSedes';
import { GestionBloques } from './components/Admin/GestionBloques';
import { GestionProductos } from './components/Admin/GestionProductos';
import { GestionColores } from './components/Admin/GestionColores';
import { GestionVariedades } from './components/Admin/GestionVariedades';
import { GestionAreas } from './components/Admin/GestionAreas';
import AdminDashboard from './pages/AdminDashboard';
import { TrendingUp, Lock, User, Loader2, AlertCircle } from 'lucide-react';
import { logger } from './utils/logger';

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
          logger.info(`Usuario recuperado: ${currentUser.usuario_login}`);
        }
      } catch (e) {
        logger.error("Error inicializando app", e);
      } finally {
        setChecking(false);
      }
    };
    initApp();
  }, [setUser]);

  // Protección de rutas/vistas mediante lógica de renderizado
  useEffect(() => {
    if (user) {
      const adminViews = ['admin-dashboard', 'admin-tablas', 'gestion-sedes', 'gestion-bloques', 'gestion-productos', 'gestion-colores', 'gestion-variedades', 'gestion-areas'];
      const superAdminViews = ['super-usuarios', 'super-roles'];

      if (adminViews.includes(currentView) && !isAdmin()) {
        logger.warn(`Acceso no autorizado intentado a ${currentView} por ${user.usuario_login}`);
        setCurrentView('supervisor-diaria');
      }

      if (superAdminViews.includes(currentView) && !isSuperAdmin()) {
        logger.warn(`Acceso no autorizado intentado a ${currentView} por ${user.usuario_login}`);
        setCurrentView('supervisor-diaria');
      }
    }
  }, [currentView, user, isAdmin, isSuperAdmin, setCurrentView]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      logger.info(`Intento de login para: ${username}`);
      const userData = await authService.login(username, password);
      setUser(userData);
      logger.info(`Login exitoso: ${userData.usuario_login}`);
    } catch (err: any) {
      setError(err.message || 'Error de autenticación');
      logger.error("Error en login", err);
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-indigo-950">
        <div className="text-center">
          <Loader2 className="animate-spin text-white opacity-20 mx-auto mb-4" size={48} />
          <p className="text-indigo-300 text-xs font-bold uppercase tracking-widest text-balance">Verificando Credenciales...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-indigo-950 p-6 relative overflow-hidden font-sans">
        <div className="bg-white p-10 md:p-14 rounded-[3.5rem] shadow-2xl w-full max-w-md text-center relative z-10 border border-white/20">
          <div className="w-20 h-20 bg-indigo-600 rounded-3xl mx-auto mb-8 flex items-center justify-center shadow-2xl shadow-indigo-500/40 transform rotate-3">
            <TrendingUp className="text-white" size={40} />
          </div>
          <h2 className="text-4xl font-black text-indigo-950 mb-2 italic tracking-tighter">TNPM PROY</h2>
          <p className="text-slate-400 font-black text-[10px] uppercase tracking-[0.3em] mb-12 italic">Acceso Seguro</p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                placeholder="Usuario"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-slate-50 border-none py-4 pl-12 pr-4 rounded-2xl focus:ring-2 focus:ring-indigo-500 transition-all font-bold text-indigo-950 outline-none"
                required
              />
            </div>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="password"
                placeholder="Contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-50 border-none py-4 pl-12 pr-4 rounded-2xl focus:ring-2 focus:ring-indigo-500 transition-all font-bold text-indigo-950 outline-none"
                required
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 text-red-500 bg-red-50 p-3 rounded-xl text-xs font-bold border border-red-100">
                <AlertCircle size={14} />
                <span>Credenciales Incorrectas</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black text-sm hover:bg-indigo-700 transition-all shadow-lg active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : 'ENTRAR AL SISTEMA'}
            </button>
          </form>
          <p className="mt-8 text-[10px] text-slate-300 font-medium uppercase tracking-widest font-black">TNPM v1.0 PROD</p>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    switch (currentView) {
      case 'supervisor-diaria': return <SupervisorDiario />;
      case 'supervisor-semanal': return <SupervisorSemanal />;
      case 'supervisor-historial': return <SupervisorHistorico />;
      case 'admin-dashboard': return isAdmin() ? <AdminDashboard /> : null;
      case 'gestion-sedes': return isAdmin() ? <GestionSedes /> : null;
      case 'gestion-bloques': return isAdmin() ? <GestionBloques /> : null;
      case 'gestion-productos': return isAdmin() ? <GestionProductos /> : null;
      case 'gestion-colores': return isAdmin() ? <GestionColores /> : null;
      case 'gestion-variedades': return isAdmin() ? <GestionVariedades /> : null;
      case 'gestion-areas': return isAdmin() ? <GestionAreas /> : null;
      case 'super-usuarios': return isSuperAdmin() ? <GestionUsuarios /> : null;
      default: return <SupervisorDiario />;
    }
  };

  return <Layout>{renderContent()}</Layout>;
};

export default App;
