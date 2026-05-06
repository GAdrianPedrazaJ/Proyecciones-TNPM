import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { proyeccionesService } from '../services/proyecciones';
import { getWeekNumber, calcularEstadoSemanas, EstadoSemanal } from '../utils/semanaUtils';
import { Bloque, Variedad, ProyeccionSemanal } from '../types/database';
import { CalendarDays, Save, Loader2, LayoutGrid, Info } from 'lucide-react';

export const SupervisorSemanal: React.FC = () => {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [bloques, setBloques] = useState<Bloque[]>([]);
  const [variedades, setVariedades] = useState<any[]>([]);
  const [idBloqueSeleccionado, setIdBloqueSeleccionado] = useState<string>('');
  const [estadoSemanas, setEstadoSemanas] = useState<EstadoSemanal[]>([]);
  const [proyecciones, setProyecciones] = useState<ProyeccionSemanal[]>([]);
  const [valores, setValores] = useState<Record<string, number>>({});
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (user?.id_usuario) {
      cargarMaestros();
    }
  }, [user?.id_usuario]);

  useEffect(() => {
    if (user?.id_usuario && idBloqueSeleccionado && estadoSemanas.length > 0) {
      cargarDatosSemana();
    }
  }, [idBloqueSeleccionado, estadoSemanas]);

  const cargarMaestros = async () => {
    setLoading(true);
    try {
      const { bloques, variedades } = await proyeccionesService.getDatosMaestrosSupervisor(user!.id_usuario);
      setBloques(bloques);
      setVariedades(variedades);
      if (bloques.length > 0 && !idBloqueSeleccionado) setIdBloqueSeleccionado(bloques[0].id_bloque);

      const estados = calcularEstadoSemanas(new Date());
      const hoy = new Date();
      const per0: EstadoSemanal = {
        semana_num: getWeekNumber(hoy),
        ano: hoy.getFullYear(),
        bloqueado: true,
        fechaDesbloqueo: ""
      };
      setEstadoSemanas([per0, ...estados]);
    } catch (error) {
      console.error("Error en maestros:", error);
    } finally {
      setLoading(false);
    }
  };

  const cargarDatosSemana = async () => {
    setLoading(true);
    try {
      const semanasNums = estadoSemanas.map(s => s.semana_num);
      const ano = estadoSemanas[0]?.ano || new Date().getFullYear();

      const data = await proyeccionesService.getProyeccionesSemanales(user!.id_usuario, ano, semanasNums);
      const dataBloque = data.filter(p => p.id_bloque === idBloqueSeleccionado);
      setProyecciones(dataBloque);

      const nuevosValores: Record<string, number> = {};
      dataBloque.forEach(p => {
        const key = `${p.semana_num}-${p.id_variedad}`;
        nuevosValores[key] = p.cantidad;
      });
      setValores(nuevosValores);
    } catch (error) {
      console.error("Error en proyecciones:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (semanaNum: number, idVariedad: string, valor: string) => {
    const num = parseInt(valor) || 0;
    setValores(prev => ({
      ...prev,
      [`${semanaNum}-${idVariedad}`]: num
    }));
  };

  const guardarTodo = async () => {
    setGuardando(true);
    try {
      const promesas = Object.entries(valores).map(([key, cantidad]) => {
        const [semanaNumStr, idVariedad] = key.split(/-(.+)/);
        const semanaNum = parseInt(semanaNumStr);
        const estado = estadoSemanas.find(s => s.semana_num === semanaNum);

        if (estado && !estado.bloqueado) {
          const original = proyecciones.find(p => p.semana_num === semanaNum && p.id_variedad === idVariedad);
          if (!original || original.cantidad !== cantidad) {
            return proyeccionesService.guardarProyeccionSemanal({
              id_supervisor: user!.id_usuario,
              id_bloque: idBloqueSeleccionado,
              id_variedad: idVariedad,
              semana_num: semanaNum,
              ano: estado.ano,
              cantidad: cantidad
            });
          }
        }
        return null;
      }).filter(p => p !== null);

      await Promise.all(promesas);
      alert('Proyecciones guardadas exitosamente');
      cargarDatosSemana();
    } catch (error) {
      alert('Error al guardar');
    } finally {
      setGuardando(false);
    }
  };

  if (loading && bloques.length === 0) return <div className="p-10 text-center"><Loader2 className="animate-spin mx-auto" /></div>;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
        <div>
          <h2 className="text-2xl font-black text-indigo-950 flex items-center gap-2">
            <CalendarDays className="text-indigo-500" /> Proyección Semanal (PER4)
          </h2>
          <p className="text-slate-500 text-sm">Resumen de proyecciones para las próximas 4 semanas</p>
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

          <button
            onClick={guardarTodo}
            disabled={guardando}
            className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-700 shadow-lg shadow-indigo-200 flex items-center gap-2"
          >
            {guardando ? <Loader2 className="animate-spin" size={16}/> : <Save size={16}/>}
            Guardar PER4
          </button>
        </div>
      </header>

      <div className="bg-white rounded-[2.5rem] shadow-xl border border-indigo-50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Variedad</th>
                {estadoSemanas.map((estado, idx) => (
                  <th key={estado.semana_num} className="px-8 py-6 text-center">
                    <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">
                      {idx === 0 ? 'PER 0' : `PER ${idx}`} {idx === 4 ? '(A PROYECTAR)' : ''}
                    </span>
                    <span className="font-black text-indigo-900 text-xs">Semana {estado.semana_num}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {variedades.map((v) => (
                <tr key={v.id_variedad} className="hover:bg-slate-50/30 transition-colors">
                  <td className="px-8 py-5">
                    <div className="flex flex-col">
                      <span className="font-black text-indigo-950 text-sm">
                        {v.color?.producto?.nombre} - {v.nombre}
                      </span>
                      <span className="text-[10px] text-slate-400 font-bold uppercase">{v.color?.nombre}</span>
                    </div>
                  </td>
                  {estadoSemanas.map((estado) => {
                    const key = `${estado.semana_num}-${v.id_variedad}`;
                    const editable = !estado.bloqueado;
                    return (
                      <td key={estado.semana_num} className="px-8 py-5 text-center">
                        <input
                          type="number"
                          value={valores[key] ?? ''}
                          onChange={(e) => handleInputChange(estado.semana_num, v.id_variedad, e.target.value)}
                          disabled={!editable}
                          placeholder="0"
                          className={`w-24 p-3 text-center font-black rounded-2xl border-none outline-none transition-all ${
                            editable
                            ? 'bg-slate-100 text-indigo-600 focus:ring-2 focus:ring-indigo-500'
                            : 'bg-slate-50 text-slate-400 cursor-not-allowed'
                          }`}
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
