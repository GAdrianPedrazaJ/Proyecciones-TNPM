import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { useProyectionStore } from '../store/proyectionStore';
import { useNavStore } from '../store/navStore';
import { useNotificationStore } from '../store/notificationStore';
import { proyeccionesService } from '../services/proyecciones';
import { auditService } from '../services/auditService';
import { getWeekNumber, calcularEstadoSemanas, EstadoSemanal } from '../utils/semanaUtils';
import { logger } from '../utils/logger';
import { ProyeccionSemanal, Bloque } from '../types/database';
import { CalendarDays, Save, Loader2, Info, ArrowLeft, Lock, AlertCircle, CloudLightning, CheckCircle2, LayoutGrid } from 'lucide-react';
import { TableSkeleton } from './UI/Skeleton';

export const SupervisorSemanal: React.FC = () => {
  const { user } = useAuthStore();
  const { idBloqueSeleccionado, setIdBloqueSeleccionado } = useProyectionStore();
  const { setCurrentView } = useNavStore();
  const { addNotification } = useNotificationStore();

  const [loading, setLoading] = useState(false);
  const [bloques, setBloques] = useState<Bloque[]>([]);
  const [variedades, setVariedades] = useState<any[]>([]);
  const [estadoSemanas, setEstadoSemanas] = useState<EstadoSemanal[]>([]);
  const [proyecciones, setProyecciones] = useState<ProyeccionSemanal[]>([]);
  const [valores, setValores] = useState<Record<string, number>>({});
  const [guardando, setGuardando] = useState(false);
  const [nombreBloque, setNombreBloque] = useState('');
  const [esPrimeraProyeccion, setEsPrimeraProyeccion] = useState(false);
  const [ultimoGuardado, setUltimoGuardado] = useState<string | null>(null);

  useEffect(() => {
    if (user?.id_usuario) cargarBloques();
  }, [user]);

  useEffect(() => {
    if (idBloqueSeleccionado) {
      const hoy = new Date();
      const per0: EstadoSemanal = {
        semana_num: getWeekNumber(hoy),
        ano: hoy.getFullYear(),
        bloqueado: false,
        fechaDesbloqueo: ""
      };
      setEstadoSemanas([per0, ...calcularEstadoSemanas(hoy)]);
      cargarDatos();
    }
  }, [idBloqueSeleccionado]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (Object.keys(valores).length > 0) guardarTodo(true);
    }, 5000);
    return () => clearTimeout(timer);
  }, [valores]);

  const cargarBloques = async () => {
    try {
      const data = await proyeccionesService.getBloquesAsignados(user!.id_usuario);
      setBloques(data);
      if (data.length > 0 && !idBloqueSeleccionado) setIdBloqueSeleccionado(data[0].id_bloque);
    } catch (e) { logger.error('Error cargando bloques', e); }
  };

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const bloqueActual = bloques.find(b => b.id_bloque === idBloqueSeleccionado);
      setNombreBloque(bloqueActual?.nombre || 'Bloque');

      const hoy = new Date();
      const semanasNums = [getWeekNumber(hoy), ...calcularEstadoSemanas(hoy).map(s => s.semana_num)];

      const [vars, data] = await Promise.all([
        proyeccionesService.getVariedadesPorBloque(idBloqueSeleccionado),
        proyeccionesService.getProyeccionesSemanales(user!.id_usuario, hoy.getFullYear(), semanasNums)
      ]);

      setVariedades(vars);
      const dataBloque = data.filter(p => p.id_bloque === idBloqueSeleccionado);
      setProyecciones(dataBloque);
      setEsPrimeraProyeccion(dataBloque.length === 0);

      const nuevosValores: Record<string, number> = {};
      dataBloque.forEach(p => { nuevosValores[`${p.semana_num}|${p.id_variedad}`] = p.cantidad; });
      setValores(nuevosValores);
    } catch (error) { logger.error('Error cargando datos', error); }
    finally { setLoading(false); }
  };

  const esCeldaEditable = (idx: number, semanaNum: number, idVariedad: string) => {
    if (esPrimeraProyeccion) return true;
    if (idx === 0) return true;
    if (idx === 4) {
      const yaTieneDato = proyecciones.some(p => p.semana_num === semanaNum && p.id_variedad === idVariedad && p.cantidad > 0);
      return !yaTieneDato;
    }
    return false;
  };

  const handleKeyDown = (e: React.KeyboardEvent, vIdx: number, sIdx: number) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const nextInput = document.getElementById(`input-${estadoSemanas[sIdx].semana_num}-${variedades[vIdx + 1]?.id_variedad}`);
      if (nextInput) { nextInput.focus(); (nextInput as HTMLInputElement).select(); }
    }
  };

  const guardarTodo = async (silencioso = false) => {
    const cambios = Object.entries(valores).map(([key, cantidad]) => {
      const [semanaNumStr, idVariedad] = key.split('|');
      const semanaNum = parseInt(semanaNumStr);
      const idx = estadoSemanas.findIndex(s => s.semana_num === semanaNum);
      const original = proyecciones.find(p => p.semana_num === semanaNum && p.id_variedad === idVariedad);

      if (idx !== -1 && esCeldaEditable(idx, semanaNum, idVariedad) && (!original || original.cantidad !== cantidad)) {
        return { semanaNum, idVariedad, cantidad, ano: estadoSemanas[idx].ano, anterior: original?.cantidad };
      }
      return null;
    }).filter(c => c !== null);

    if (cambios.length === 0 || guardando) return;
    if (!silencioso) setGuardando(true);

    try {
      await Promise.all(cambios.map(async (c) => {
        const result = await proyeccionesService.guardarProyeccionSemanal({
          id_supervisor: user!.id_usuario,
          id_bloque: idBloqueSeleccionado,
          id_variedad: c!.idVariedad,
          semana_num: c!.semanaNum,
          ano: c!.ano,
          cantidad: c!.cantidad
        });

        // AUDITORIA
        await auditService.log({
          id_usuario: user!.id_usuario,
          accion: 'UPDATE',
          tabla: 'proyecciones_semanales',
          registro_id: result.id_proyeccion || 'N/A',
          valor_anterior: { cantidad: c!.anterior },
          valor_nuevo: { cantidad: c!.cantidad }
        });
      }));

      setUltimoGuardado(new Date().toLocaleTimeString());
      if (!silencioso) addNotification('Sincronización PER exitosa', 'success');

      const hoy = new Date();
      const semanasNums = estadoSemanas.map(s => s.semana_num);
      const data = await proyeccionesService.getProyeccionesSemanales(user!.id_usuario, hoy.getFullYear(), semanasNums);
      setProyecciones(data.filter(p => p.id_bloque === idBloqueSeleccionado));
      setEsPrimeraProyeccion(false);
    } catch (e) { logger.error('Error guardando PER', e); }
    finally { if (!silencioso) setGuardando(false); }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-in fade-in duration-500">
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-white p-6 rounded-[2rem] shadow-sm border border-slate-200">
        <div className="flex items-center gap-4">
          <button onClick={() => setCurrentView('supervisor-bloques')} className="p-3 bg-slate-100 hover:bg-purple-50 text-slate-500 rounded-xl border border-slate-200"><ArrowLeft size={20}/></button>
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight italic uppercase">Planificación PER</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[10px] font-black text-purple-600 uppercase tracking-widest">{nombreBloque}</span>
              {ultimoGuardado && <span className="text-[8px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full uppercase flex items-center gap-1"><CloudLightning size={10}/> {ultimoGuardado}</span>}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center bg-slate-100 p-1.5 rounded-xl border border-slate-200">
            <LayoutGrid size={16} className="ml-2 text-purple-600" />
            <select value={idBloqueSeleccionado} onChange={(e) => setIdBloqueSeleccionado(e.target.value)} className="bg-transparent border-none text-xs font-black text-slate-800 focus:ring-0 px-3 cursor-pointer">
              {bloques.map(b => <option key={b.id_bloque} value={b.id_bloque}>Bloque {b.nombre}</option>)}
            </select>
          </div>
          <button onClick={() => guardarTodo()} disabled={guardando} className="bg-purple-600 text-white px-6 py-3 rounded-xl font-black text-[10px] uppercase hover:bg-purple-700 flex items-center gap-2 shadow-lg transition-all">{guardando ? <Loader2 size={14} className="animate-spin"/> : <Save size={14}/>} Sincronizar</button>
        </div>
      </header>

      <div className="bg-amber-50 border-2 border-amber-100 p-4 rounded-2xl flex items-start gap-3">
        <AlertCircle className="text-amber-500 shrink-0 mt-0.5" size={18} />
        <p className="text-[10px] text-amber-800 font-bold leading-relaxed">
          <span className="font-black uppercase mr-2">Política:</span>
          PER 0 permite ajustes constantes. PER 4 es carga única semanal (se bloquea tras guardar).
        </p>
      </div>

      <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden">
        {loading && variedades.length === 0 ? (
          <div className="p-10"><TableSkeleton /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-8 py-5 text-[9px] font-black text-slate-600 uppercase tracking-widest">Variedad / Periodo</th>
                  {estadoSemanas.map((estado, idx) => (
                    <th key={estado.semana_num} className="px-4 py-5 text-center border-l border-slate-100 min-w-[110px]">
                      <span className={`block text-[8px] font-black uppercase mb-1 ${idx === 0 || idx === 4 ? 'text-purple-600' : 'text-slate-400'}`}>
                        {idx === 0 ? 'PER 0 (Actual)' : `PER ${idx}`}
                      </span>
                      <span className="text-[10px] font-bold text-slate-800">W{estado.semana_num}</span>
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
                    {estadoSemanas.map((estado, sIdx) => {
                      const key = `${estado.semana_num}|${v.id_variedad}`;
                      const editable = esCeldaEditable(sIdx, estado.semana_num, v.id_variedad);
                      const val = valores[key] || 0;
                      return (
                        <td key={estado.semana_num} className="px-2 py-4 text-center border-l border-slate-100">
                          <div className="relative inline-block">
                            <input id={`input-${estado.semana_num}-${v.id_variedad}`} type="number" value={valores[key] ?? ''} onChange={(e) => setValores(prev => ({...prev, [key]: parseInt(e.target.value) || 0}))} onKeyDown={(e) => handleKeyDown(e, vIdx, sIdx)} disabled={!editable} placeholder="0" className={`w-20 p-3 text-center font-black rounded-xl outline-none transition-all border-2 ${editable ? (val > 0 ? 'bg-emerald-50 text-emerald-700 border-emerald-100 focus:border-emerald-300' : 'bg-purple-50 text-purple-700 border-purple-100 focus:border-purple-300') : 'bg-slate-100 text-slate-400 border-slate-100 cursor-not-allowed'} text-xs`} />
                            {val > 0 && !editable && <CheckCircle2 size={12} className="absolute -top-1 -right-1 text-emerald-500 bg-white rounded-full shadow-sm" />}
                            {!editable && val === 0 && <Lock size={10} className="absolute -top-1 -right-1 text-slate-300" />}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
