import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { proyeccionesService } from '../services/proyecciones';
import { getWeekRange, getWeekNumber } from '../utils/semanaUtils';
import { Bloque, Variedad, ProyeccionDiaria } from '../types/database';
import { CalendarRange, ChevronLeft, ChevronRight, Save, Loader2, LayoutGrid } from 'lucide-react';

export const SupervisorSemanaDetalle: React.FC = () => {
  const { user } = useAuthStore();
  const [fechaBase, setFechaBase] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [bloques, setBloques] = useState<Bloque[]>([]);
  const [variedades, setVariedades] = useState<any[]>([]);
  const [idBloqueSeleccionado, setIdBloqueSeleccionado] = useState<string>('');
  const [valores, setValores] = useState<Record<string, number>>({});
  const [guardando, setGuardando] = useState(false);

  // Obtener los 7 días de la semana (Lunes a Domingo)
  const getDiasSemana = (fecha: string) => {
    const { start } = getWeekRange(new Date(fecha));
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      return d.toISOString().split('T')[0];
    });
  };

  const diasSemana = getDiasSemana(fechaBase);
  const nombresDias = ['LUNES', 'MARTES', 'MIÉRCOLES', 'JUEVES', 'VIERNES', 'SÁBADO', 'DOMINGO'];

  useEffect(() => {
    if (user?.id_usuario) cargarMaestros();
  }, [user?.id_usuario]);

  useEffect(() => {
    if (user?.id_usuario && idBloqueSeleccionado) cargarDatosSemana();
  }, [idBloqueSeleccionado, fechaBase]);

  const cargarMaestros = async () => {
    setLoading(true);
    try {
      const { bloques, variedades } = await proyeccionesService.getDatosMaestrosSupervisor(user!.id_usuario);
      setBloques(bloques);
      setVariedades(variedades);
      if (bloques.length > 0 && !idBloqueSeleccionado) setIdBloqueSeleccionado(bloques[0].id_bloque);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const cargarDatosSemana = async () => {
    setLoading(true);
    try {
      const data = await proyeccionesService.getProyeccionesDiarias(user!.id_usuario, diasSemana);
      const dataBloque = data.filter(p => p.id_bloque === idBloqueSeleccionado);

      const nuevosValores: Record<string, number> = {};
      dataBloque.forEach(p => {
        nuevosValores[`${p.fecha_proyeccion}-${p.id_variedad}`] = p.cantidad;
      });
      setValores(nuevosValores);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (fecha: string, idVariedad: string, valor: string) => {
    setValores(prev => ({
      ...prev,
      [`${fecha}-${idVariedad}`]: parseInt(valor) || 0
    }));
  };

  const guardarTodo = async () => {
    setGuardando(true);
    try {
      const promesas = Object.entries(valores).map(([key, cantidad]) => {
        const [fecha, idVariedad] = key.split(/-(.+)/);
        return proyeccionesService.guardarProyeccionDiaria({
          id_supervisor: user!.id_usuario,
          id_bloque: idBloqueSeleccionado,
          id_variedad: idVariedad,
          fecha_proyeccion: fecha,
          cantidad: cantidad
        });
      });

      await Promise.all(promesas);
      alert('Semana guardada exitosamente');
      cargarDatosSemana();
    } catch (error) {
      alert('Error al guardar');
    } finally {
      setGuardando(false);
    }
  };

  const cambiarSemana = (offset: number) => {
    const d = new Date(fechaBase);
    d.setDate(d.getDate() + offset * 7);
    setFechaBase(d.toISOString().split('T')[0]);
  };

  if (loading && bloques.length === 0) return <div className="p-10 text-center"><Loader2 className="animate-spin mx-auto" /></div>;

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-10">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
        <div>
          <h2 className="text-2xl font-black text-indigo-950 flex items-center gap-2">
            <CalendarRange className="text-indigo-500" /> Proyección Bloque # Semana
          </h2>
          <p className="text-slate-500 text-sm">Vista detallada de Lunes a Domingo (Semana {getWeekNumber(new Date(fechaBase))})</p>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
            <LayoutGrid size={18} className="ml-3 text-slate-400" />
            <select
              value={idBloqueSeleccionado}
              onChange={(e) => setIdBloqueSeleccionado(e.target.value)}
              className="bg-transparent border-none font-bold text-indigo-900 focus:ring-0 px-3 py-2"
            >
              {bloques.map(b => <option key={b.id_bloque} value={b.id_bloque}>{b.nombre}</option>)}
            </select>
          </div>

          <div className="flex items-center bg-white p-1 rounded-xl border border-slate-100 shadow-sm">
             <button onClick={() => cambiarSemana(-1)} className="p-2 hover:bg-slate-50 rounded-lg"><ChevronLeft size={20}/></button>
             <span className="px-4 font-black text-indigo-950 text-xs">Semana del {diasSemana[0]}</span>
             <button onClick={() => cambiarSemana(1)} className="p-2 hover:bg-slate-50 rounded-lg"><ChevronRight size={20}/></button>
          </div>

          <button
            onClick={guardarTodo}
            disabled={guardando}
            className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-700 shadow-lg shadow-indigo-200 flex items-center gap-2"
          >
            {guardando ? <Loader2 className="animate-spin" size={16}/> : <Save size={16}/>}
            Guardar Semana
          </button>
        </div>
      </header>

      <div className="bg-white rounded-[2.5rem] shadow-xl border border-indigo-50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-6 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest sticky left-0 bg-slate-50 z-10">Variedad</th>
                {diasSemana.map((fecha, idx) => (
                  <th key={fecha} className="px-4 py-6 text-center border-l border-slate-100">
                    <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">
                      {nombresDias[idx]}
                    </span>
                    <span className="font-black text-indigo-900 text-[10px]">{fecha}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {variedades.map((v) => (
                <tr key={v.id_variedad} className="hover:bg-slate-50/30 transition-colors">
                  <td className="px-6 py-4 sticky left-0 bg-white shadow-[2px_0_5px_rgba(0,0,0,0.02)] z-10">
                    <div className="flex flex-col">
                      <span className="font-black text-indigo-950 text-xs truncate max-w-[150px]">
                        {v.color?.producto?.nombre} - {v.nombre}
                      </span>
                      <span className="text-[9px] text-slate-400 font-bold uppercase">{v.color?.nombre}</span>
                    </div>
                  </td>
                  {diasSemana.map(fecha => {
                    const key = `${fecha}-${v.id_variedad}`;
                    return (
                      <td key={fecha} className="px-2 py-4 text-center border-l border-slate-50">
                        <input
                          type="number"
                          value={valores[key] ?? ''}
                          onChange={(e) => handleInputChange(fecha, v.id_variedad, e.target.value)}
                          placeholder="0"
                          className="w-full max-w-[100px] p-2.5 text-center font-black rounded-xl bg-slate-50 text-indigo-600 border-none outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-sm"
                        />
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
