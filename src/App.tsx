import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import { useNavStore } from './store/navStore';
import { useAuthStore } from './store/authStore';
import { authService } from './services/authService';
import { requestNotificationPermission } from './services/firebase';
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
import { Acumulados } from './components/Admin/Acumulados';
import AdminDashboard from './pages/AdminDashboard';
import { TrendingUp, Loader2, ArrowRight } from 'lucide-react';
import { logger } from './utils/logger';
import { NotificationToast } from './components/UI/NotificationToast';
import { PWAUpdatePrompt } from './components/UI/PWAUpdatePrompt';

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
        const currentUser = await authService.getCurrentUser();
        if (currentUser) {
          setUser(currentUser);
          // Solicitar permisos de notificación una vez logueado
          await requestNotificationPermission();
        }
      } catch (e) {
        logger.error("Error inicializando app", e);
      } finally {
        setChecking(false);
      }
    };
    initApp();
  }, [setUser]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const userData = await authService.login(username, password);
      setUser(userData);
      await requestNotificationPermission();
      if (userData.rol === 'supervisor') setCurrentView('supervisor-bloques');
      else setCurrentView('admin-dashboard');
    } catch (err: any) {
      setError(err.message || 'Error de autenticación');
    } finally {
      setLoading(false);
    }
  };

  const renderContent = () => {
    if (!user) return null;

    switch (currentView) {
      case 'supervisor-bloques': return <SupervisorBloques />;
      case 'supervisor-diaria': return <SupervisorDiario />;
      case 'supervisor-semanal': return <SupervisorSemanal />;
      case 'supervisor-historial': return <SupervisorHistorico />;
      case 'supervisor-detalle': return <SupervisorSemanaDetalle />;
      case 'admin-dashboard': return isAdmin() ? <AdminDashboard /> : null;
      case 'acumulados': return isAdmin() ? <Acumulados /> : null;
      case 'importar-excel': return isSuperAdmin() ? <ImportadorExcel /> : null;
      case 'gestion-sedes': return isAdmin() ? <GestionSedes /> : null;
      case 'gestion-areas': return isAdmin() ? <GestionAreas /> : null;
      case 'gestion-bloques': return isAdmin() ? <GestionBloques /> : null;
      case 'gestion-productos': return isAdmin() ? <GestionProductos /> : null;
      case 'gestion-colores': return isAdmin() ? <GestionColores /> : null;
      case 'gestion-variedades': return isAdmin() ? <GestionVariedades /> : null;
      case 'gestion-areas-bloques': return isAdmin() ? <GestionAreasBloques /> : null;
      case 'super-usuarios': return isAdmin() ? <GestionUsuarios /> : null;
      default: return isAdmin() ? <AdminDashboard /> : <SupervisorBloques />;
    }
  };

  if (checking) return <div className="min-h-screen flex items-center justify-center bg-black"><Loader2 className="animate-spin text-purple-500" size={64} /></div>;

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
        <NotificationToast />
        <PWAUpdatePrompt />
        <div className="bg-white p-12 rounded-[3.5rem] shadow-2xl w-full max-w-md border-2 border-slate-100">
          <TrendingUp className="text-purple-600 mb-8" size={48} />
          <h2 className="text-5xl font-black text-slate-950 mb-6 italic uppercase">TNPM</h2>
          <form onSubmit={handleLogin} className="space-y-4">
            <input type="text" placeholder="Usuario" value={username} onChange={(e) => setUsername(e.target.value)} className="w-full bg-slate-50 border-2 border-slate-100 py-4 pl-6 rounded-2xl outline-none font-bold" required />
            <input type="password" placeholder="Clave" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-slate-50 border-2 border-slate-100 py-4 pl-6 rounded-2xl outline-none font-bold" required />
            {error && <div className="text-red-600 text-xs font-bold">{error}</div>}
            <button type="submit" disabled={loading} className="w-full bg-purple-600 text-white py-5 rounded-2xl font-black uppercase flex items-center justify-center gap-3">
              {loading ? <Loader2 className="animate-spin" size={20} /> : <>Entrar <ArrowRight size={18} /></>}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <Layout>
      <NotificationToast />
      <PWAUpdatePrompt />
      {renderContent()}
    </Layout>
  );
};

export default App;
