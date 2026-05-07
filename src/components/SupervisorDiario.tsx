import React, { useEffect, useState, useCallback } from 'react';
import { useAuthStore } from '../store/authStore';
import { useProyectionStore } from '../store/proyectionStore';
import { useNavStore } from '../store/navStore';
import { useNotificationStore } from '../store/notificationStore';
import { proyeccionesService } from '../services/proyecciones';
import { getWeekRange } from '../utils/semanaUtils';
import { logger } from '../utils/logger';
import { Calendar, ChevronLeft, ChevronRight, Save, Loader2, Info, ArrowLeft, Clock, CheckCircle2, CloudLightning, LayoutGrid } from 'lucide-react';
import { ProyeccionDiaria, Bloque } from '../types/database';

export const SupervisorDiario: React.FC = () => {
  const { user } = useAuthStore();
  const { idBloqueSeleccionado, setIdBloqueSeleccionado } = useProyectionStore();
  const { setCurrentView } = useNavStore();
  const { addNotification } = useNotificationStore();

  const [fechaBase, setFechaBase] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [bloques, setBloques] = useState<Bloque[]>([]);
  const [variedades, setVariedades] = useState<any[]>([]);
  const [proyecciones, setProyecciones] = useState<ProyeccionDiaria[]>([]);
  const [valores, setValores] = useState<Record<string, number>>({});
  const [guardando, setGuardando] = useState(false);
  const [nombreBloque, setNombreBloque] = useState('');
  const [esPrimeraProyeccion, setEsPrimeraProyeccion] = useState(false);
  const [ultimoGuardado, setUltimoGuardado] = useState<string | null>(null);

  const diasSemana = Array.from({ length: 7 }, (_, i) => {
    const { start } = getWeekRange(new Date(fechaBase));
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    return d.toISOString().split('T')[0];
  });

  useEffect(() => {
    if (user?.id_usuario) {
      cargarBloques();
    }
  }, [user]);

  useEffect(() => {
    if (idBloqueSeleccionado) {
      cargarDatos();
    }
  }, [idBloqueSeleccionado, fechaBase]);

  // Autoguardado
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
      if (data.length > 0 && !idBloqueSeleccionado) {
        setIdBloqueSeleccionado(data[0].id_bloque);
      }
    } catch (e) {
      logger.error('Error cargando bloques', e);
    }
  };

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const bloqueActual = bloques.find(b => b.id_bloque === idBloqueSeleccionado);
      setNombreBloque(bloqueActual?.nombre || 'Bloque');

      const [vars, data] = await Promise.all([
        proyeccionesService.getVariedadesPorBloque(idBloqueSeleccionado),
        proyeccionesService.getProyeccionesDiarias(user!.id_usuario, diasSemana)
      ]);

      setVariedades(vars);
      const dataBloque = data.filter((p: any) => p.id_bloque === idBloqueSeleccionado);
      setProyecciones(dataBloque);
      setEsPrimeraProyeccion(dataBloque.length === 0);

      const nuevosValores: Record<string, number> = {};
      dataBloque.forEach((p: any) => {
        nuevosValores[`${p.fecha_proyeccion}|${p.id_variedad}`] = p.cantidad;
      });
      setValores(nuevosValores);
    } catch (error) {
      logger.error('Error cargando datos', error);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, vIdx: number, fIdx: number) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const nextInput = document.getElementById(`input-${diasSemana[fIdx]}-${variedades[vIdx + 1]?.id_variedad}`);
      if (nextInput) {
        nextInput.focus();
        (nextInput as HTMLInputElement).select();
      }
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
      if (!silencioso) addNotification('Sincronización exitosa', 'success');
    } catch (e) {
      logger.error('Error al guardar', e);
    } finally {
      if (!silencioso) setGuardando(false);
    }
  };

  const esEditable = (fecha: string) => fecha >= new Date().toISOString().split('T')[0];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-in fade-in duration-500">
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-white p-6 rounded-[2rem] shadow-sm border border-slate-200">
        <div className="flex items-center gap-4">
          <button onClick={() => setCurrentView('supervisor-bloques')} className="p-3 bg-slate-100 hover:bg-purple-50 text-slate-500 rounded-xl transition-all border border-slate-200"><ArrowLeft size={20}/></button>
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight italic uppercase">Diario de Producción</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[10px] font-black text-purple-600 uppercase tracking-widest">{nombreBloque}</span>
              {ultimoGuardado && <span className="text-[8px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full uppercase tracking-tighter flex items-center gap-1"><CloudLightning size={10}/> {ultimoGuardado}</span>}
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
            <button onClick={() => setFechaBase(new Date(new Date(fechaBase).setDate(new Date(fechaBase).getDate() - 7)).toISOString().split('T')[0])} className="p-2 hover:bg-white text-slate-600 rounded-lg"><ChevronLeft size={16}/></button>
            <span className="px-4 text-[10px] font-black text-slate-900">{fechaBase}</span>
            <button onClick={() => setFechaBase(new Date(new Date(fechaBase).setDate(new Date(fechaBase).getDate() + 7)).toISOString().split('T')[0])} className="p-2 hover:bg-white text-slate-600 rounded-lg"><ChevronRight size={16}/></button>
          </div>
          <button onClick={() => guardarTodo()} disabled={guardando} className="bg-purple-600 text-white px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-purple-700 flex items-center gap-2 transition-all">{guardando ? <Loader2 size={14} className="animate-spin"/> : <Save size={14}/>} Guardar</button>
        </div>
      </header>

      {!idBloqueSeleccionado ? (
        <div className="bg-white p-20 rounded-[3rem] text-center border-2 border-dashed border-slate-200">
          <Info className="mx-auto text-slate-300 mb-4" size={48} />
          <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Por favor, seleccione un bloque para comenzar.</p>
        </div>
      ) : (
        <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-8 py-5 text-[9px] font-black text-slate-600 uppercase tracking-widest">Variedad</th>
                  {diasSemana.map((fecha, idx) => (
                    <th key={fecha} className="px-4 py-5 text-center border-l border-slate-100 min-w-[100px]">
                      <span className="block text-[8px] font-black text-purple-600 uppercase mb-1">{['LUN','MAR','MIE','JUE','VIE','SAB','DOM'][idx]}</span>
                      <span className="text-[10px] font-bold text-slate-800">{fecha.split('-').slice(1).reverse().join('/')}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {variedades.map((v, vIdx) => (
                  <tr key={v.id_variedad} className="hover:bg-slate-50 transition-colors">
                    <td className="px-8 py-4">
                      <span className="text-xs font-black text-slate-900 uppercase italic leading-none">{v.nombre}</span>
                      <p className="text-[9px] text-slate-500 font-bold uppercase tracking-tighter mt-1">{v.color?.nombre}</p>
                    </td>
                    {diasSemana.map((fecha, fIdx) => {
                      const key = `${fecha}|${v.id_variedad}`;
                      const editable = esEditable(fecha);
                      const val = valores[key] || 0;
                      return (
                        <td key={fecha} className="px-2 py-4 text-center border-l border-slate-100">
                          <input id={`input-${fecha}-${v.id_variedad}`} type="number" value={valores[key] ?? ''} onChange={(e) => setValores(prev => ({...prev, [key]: parseInt(e.target.value) || 0}))} onKeyDown={(e) => handleKeyDown(e, vIdx, fIdx)} disabled={!editable} placeholder="0" className={`w-20 p-3 text-center font-black rounded-xl outline-none transition-all border-2 ${editable ? (val > 0 ? 'bg-emerald-50 text-emerald-700 border-emerald-100 focus:border-emerald-300' : 'bg-purple-50 text-purple-700 border-purple-100 focus:border-purple-300') : 'bg-slate-100 text-slate-400 border-slate-100 cursor-not-allowed'} text-xs`} />
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
