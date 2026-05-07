import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { proyeccionesService } from '../services/proyecciones';
import { getWeekRange, getWeekNumber } from '../utils/semanaUtils';
import { Bloque } from '../types/database';
import { CalendarRange, ChevronLeft, ChevronRight, Save, Loader2, LayoutGrid, ArrowLeft, CloudLightning, CheckCircle2, AlertCircle } from 'lucide-react';
import { useNavStore } from '../store/navStore';
import { useNotificationStore } from '../store/notificationStore';
import { logger } from '../utils/logger';

export const SupervisorSemanaDetalle: React.FC = () => {
  const { user } = useAuthStore();
  const { setCurrentView } = useNavStore();
  const { addNotification } = useNotificationStore();

  const [fechaBase, setFechaBase] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [bloques, setBloques] = useState<Bloque[]>([]);
  const [variedades, setVariedades] = useState<any[]>([]);
  const [idBloqueSeleccionado, setIdBloqueSeleccionado] = useState<string>('');
  const [valores, setValores] = useState<Record<string, number>>({});
  const [guardando, setGuardando] = useState(false);
  const [ultimoGuardado, setUltimoGuardado] = useState<string | null>(null);
  const [proyecciones, setProyecciones] = useState<any[]>([]);
  const [esPrimeraProyeccion, setEsPrimeraProyeccion] = useState(false);

  const diasSemana = Array.from({ length: 7 }, (_, i) => {
    const { start } = getWeekRange(new Date(fechaBase));
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    return d.toISOString().split('T')[0];
  });

  useEffect(() => {
    if (user?.id_usuario) cargarBloques();
  }, [user]);

  useEffect(() => {
    if (idBloqueSeleccionado) cargarDatosSemana();
  }, [idBloqueSeleccionado, fechaBase]);

  // Autoguardado automático (Debounce)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (Object.keys(valores).length > 0) guardarTodo(true);
    }, 2000);
    return () => clearTimeout(timer);
  }, [valores]);

  const cargarBloques = async () => {
    try {
      const data = await proyeccionesService.getBloquesAsignados(user!.id_usuario);
      setBloques(data);
      if (data.length > 0 && !idBloqueSeleccionado) setIdBloqueSeleccionado(data[0].id_bloque);
    } catch (e) { logger.error('Error cargando bloques', e); }
  };

  const cargarDatosSemana = async () => {
    setLoading(true);
    try {
      const [vars, data] = await Promise.all([
        proyeccionesService.getVariedadesPorBloque(idBloqueSeleccionado),
        proyeccionesService.getProyeccionesDiarias(user!.id_usuario, diasSemana)
      ]);
      setVariedades(vars);
      const dataBloque = data.filter(p => p.id_bloque === idBloqueSeleccionado);
      setProyecciones(dataBloque);
      setEsPrimeraProyeccion(dataBloque.length === 0);

      const nuevosValores: Record<string, number> = {};
      dataBloque.forEach(p => { nuevosValores[`${p.fecha_proyeccion}|${p.id_variedad}`] = p.cantidad; });
      setValores(nuevosValores);
    } catch (error) { logger.error('Error en matriz semanal', error); }
    finally { setLoading(false); }
  };

  const handleKeyDown = (e: React.KeyboardEvent, vIdx: number, fIdx: number) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const nextInput = document.getElementById(`input-${diasSemana[fIdx]}-${variedades[vIdx + 1]?.id_variedad}`);
      if (nextInput) { nextInput.focus(); (nextInput as HTMLInputElement).select(); }
    }
  };

  const guardarTodo = async (silencioso = false) => {
    const cambios = Object.entries(valores).map(([key, cantidad]) => {
      const [fecha, idVariedad] = key.split('|');
      const original = proyecciones.find(p => p.fecha_proyeccion === fecha && p.id_variedad === idVariedad);
      return (!original || original.cantidad !== cantidad) ? { fecha, idVariedad, cantidad } : null;
    }).filter(c => c !== null);

    if (cambios.length === 0 || guardando) return;
    if (!silencioso) setGuardando(true);

    try {
      await Promise.all(cambios.map(c => proyeccionesService.guardarProyeccionDiaria({
        id_supervisor: user!.id_usuario,
        id_bloque: idBloqueSeleccionado,
        id_variedad: c!.idVariedad,
        fecha_proyeccion: c!.fecha,
        cantidad: c!.cantidad
      })));
      setUltimoGuardado(new Date().toLocaleTimeString());
      if (!silencioso) addNotification('Matriz actualizada', 'success');
    } catch (e) { logger.error('Error al guardar matriz', e); }
    finally { if (!silencioso) setGuardando(false); }
  };

  const esEditable = (fecha: string) => {
    const hoyStr = new Date().toISOString().split('T')[0];
    if (fecha < hoyStr) return false; // Ignorar a la izquierda
    if (esPrimeraProyeccion) return true; // Abrir todo el futuro si es la primera vez de la semana

    const mañana = new Date();
    mañana.setDate(mañana.getDate() + 1);
    const mañanaStr = mañana.toISOString().split('T')[0];
    return fecha === hoyStr || fecha === mañanaStr; // Solo hoy y mañana tras carga inicial
  };

  if (loading && bloques.length === 0) return (
    <div className="flex flex-col justify-center items-center h-[50vh] gap-6">
      <Loader2 className="animate-spin text-purple-600" size={48} />
      <p className="text-slate-800 font-black uppercase tracking-[0.4em] text-[10px]">Cargando Matriz...</p>
    </div>
  );

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-12 animate-in fade-in duration-500">
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-white p-6 rounded-[2rem] shadow-sm border border-slate-200">
        <div className="flex items-center gap-4">
          <button onClick={() => setCurrentView('supervisor-bloques')} className="p-3 bg-slate-100 hover:bg-purple-50 text-slate-500 rounded-xl transition-all border border-slate-200"><ArrowLeft size={20} /></button>
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight italic uppercase">Detalle Semanal</h2>
            <div className="flex items-center gap-2 mt-1">
               {ultimoGuardado && <span className="flex items-center gap-1 text-[8px] font-black text-emerald-600 uppercase tracking-tighter bg-emerald-50 px-2 py-0.5 rounded-full"><CloudLightning size={10} /> Sincronizado {ultimoGuardado}</span>}
               {esPrimeraProyeccion && <span className="text-[8px] font-black text-purple-600 uppercase tracking-tighter bg-purple-50 px-2 py-0.5 rounded-full">Apertura Semanal Activa</span>}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center bg-slate-100 p-1.5 rounded-xl border border-slate-200">
            <LayoutGrid size={16} className="ml-2 text-purple-600" />
            <select value={idBloqueSeleccionado} onChange={(e) => setIdBloqueSeleccionado(e.target.value)} className="bg-transparent border-none text-xs font-black text-slate-800 focus:ring-0 px-3 cursor-pointer">
              {bloques.map(b => <option key={b.id_bloque} value={b.id_bloque}>Bloque {b.nombre}</option>)}
            </select>
          </div>
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
             <button onClick={() => setFechaBase(new Date(new Date(fechaBase).setDate(new Date(fechaBase).getDate() - 7)).toISOString().split('T')[0])} className="p-2 hover:bg-white text-slate-700 rounded-xl transition-all"><ChevronLeft size={16}/></button>
             <span className="px-4 text-[10px] font-black text-slate-950 uppercase tracking-tighter">W{getWeekNumber(new Date(fechaBase))} - {fechaBase}</span>
             <button onClick={() => setFechaBase(new Date(new Date(fechaBase).setDate(new Date(fechaBase).getDate() + 7)).toISOString().split('T')[0])} className="p-2 hover:bg-white text-slate-700 rounded-xl transition-all"><ChevronRight size={16}/></button>
          </div>
          <button onClick={() => guardarTodo()} disabled={guardando} className="bg-purple-600 text-white px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-purple-700 flex items-center gap-2 transition-all">{guardando ? <Loader2 size={14} className="animate-spin"/> : <Save size={14}/>} Guardar</button>
        </div>
      </header>

      <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-8 py-5 text-[9px] font-black text-slate-600 uppercase tracking-widest sticky left-0 bg-slate-50 z-20 shadow-[2px_0_5px_rgba(0,0,0,0.05)]">Variedad</th>
                {diasSemana.map((fecha, idx) => (
                  <th key={fecha} className="px-4 py-5 text-center border-l border-slate-100 min-w-[110px]">
                    <span className="block text-[8px] font-black text-purple-700 uppercase mb-1">{['LUN','MAR','MIE','JUE','VIE','SAB','DOM'][idx]}</span>
                    <span className="text-[10px] font-bold text-slate-900">{fecha.split('-').reverse().slice(0,2).join('/')}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {variedades.map((v, vIdx) => (
                <tr key={v.id_variedad} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-8 py-4 sticky left-0 bg-white z-10 border-r border-slate-100 shadow-sm">
                    <span className="text-xs font-black text-slate-900 uppercase italic leading-none">{v.nombre}</span>
                    <p className="text-[9px] text-slate-500 font-bold uppercase mt-1">{v.color?.nombre}</p>
                  </td>
                  {diasSemana.map((fecha, fIdx) => {
                    const key = `${fecha}|${v.id_variedad}`;
                    const editable = esEditable(fecha);
                    const val = valores[key] || 0;
                    return (
                      <td key={fecha} className="px-2 py-4 text-center border-l border-slate-100">
                        <div className="relative inline-block">
                          <input id={`input-${fecha}-${v.id_variedad}`} type="number" value={valores[key] ?? ''} onChange={(e) => setValores(prev => ({...prev, [key]: parseInt(e.target.value) || 0}))} onKeyDown={(e) => handleKeyDown(e, vIdx, fIdx)} disabled={!editable} placeholder="0" className={`w-20 p-3 text-center font-black rounded-xl outline-none transition-all border-2 ${editable ? (val > 0 ? 'bg-emerald-50 text-emerald-700 border-emerald-100 focus:border-emerald-300' : 'bg-purple-50 text-purple-700 border-purple-100 focus:border-purple-300') : 'bg-slate-100 text-slate-400 border-slate-100 cursor-not-allowed'} text-xs`} />
                          {val > 0 && !editable && <CheckCircle2 size={12} className="absolute -top-1 -right-1 text-emerald-500 bg-white rounded-full shadow-sm" />}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
