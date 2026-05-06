import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { proyeccionesService } from '../services/proyecciones';
import { Calendar, ChevronLeft, ChevronRight, Save, Loader2, LayoutGrid } from 'lucide-react';
import { Bloque, Variedad, ProyeccionDiaria } from '../types/database';

export const SupervisorDiario: React.FC = () => {
  const { user } = useAuthStore();
  const [fechaBase, setFechaBase] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [bloques, setBloques] = useState<Bloque[]>([]);
  const [variedades, setVariedades] = useState<any[]>([]);
  const [idBloqueSeleccionado, setIdBloqueSeleccionado] = useState<string>('');
  const [proyecciones, setProyecciones] = useState<ProyeccionDiaria[]>([]);
  const [valores, setValores] = useState<Record<string, number>>({});
  const [guardando, setGuardando] = useState(false);

  const fechas3Dias = [
    new Date(new Date(fechaBase).setDate(new Date(fechaBase).getDate() - 1)).toISOString().split('T')[0],
    fechaBase,
    new Date(new Date(fechaBase).setDate(new Date(fechaBase).getDate() + 1)).toISOString().split('T')[0]
  ];

  useEffect(() => {
    if (user?.id_usuario) {
      cargarMaestros();
    }
  }, [user?.id_usuario]);

  useEffect(() => {
    if (user?.id_usuario && idBloqueSeleccionado) {
      cargarProyecciones();
    }
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

  const cargarProyecciones = async () => {
    setLoading(true);
    try {
      const data = await proyeccionesService.getProyeccionesDiarias(user!.id_usuario, fechas3Dias);
      const dataBloque = data.filter(p => p.id_bloque === idBloqueSeleccionado);
      setProyecciones(dataBloque);

      const nuevosValores: Record<string, number> = {};
      dataBloque.forEach(p => {
        const key = `${p.fecha_proyeccion}-${p.id_variedad}`;
        nuevosValores[key] = p.cantidad;
      });
      setValores(nuevosValores);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (fecha: string, idVariedad: string, valor: string) => {
    const num = parseInt(valor) || 0;
    setValores(prev => ({
      ...prev,
      [`${fecha}-${idVariedad}`]: num
    }));
  };

  const guardarTodo = async () => {
    setGuardando(true);
    try {
      const promesas = Object.entries(valores).map(([key, cantidad]) => {
        const [fecha, idVariedad] = key.split(/-(.+)/);
        const original = proyecciones.find(p => p.fecha_proyeccion === fecha && p.id_variedad === idVariedad);
        if (!original || original.cantidad !== cantidad) {
          return proyeccionesService.guardarProyeccionDiaria({
            id_supervisor: user!.id_usuario,
            id_bloque: idBloqueSeleccionado,
            id_variedad: idVariedad,
            fecha_proyeccion: fecha,
            cantidad: cantidad
          });
        }
        return null;
      }).filter(p => p !== null);

      await Promise.all(promesas);
      alert('Cambios guardados exitosamente');
      cargarProyecciones();
    } catch (error) {
      alert('Error al guardar proyecciones');
    } finally {
      setGuardando(false);
    }
  };

  const esEditable = (fecha: string) => {
    const hoyStr = new Date().toISOString().split('T')[0];
    const ayer = new Date();
    ayer.setDate(ayer.getDate() - 1);
    const ayerStr = ayer.toISOString().split('T')[0];
    return fecha === hoyStr || fecha === ayerStr;
  };

  if (loading && bloques.length === 0) return <div className="p-10 text-center"><Loader2 className="animate-spin mx-auto" /></div>;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
        <div>
          <h2 className="text-2xl font-black text-indigo-950 flex items-center gap-2">
            <Calendar className="text-indigo-500" /> Proyección Diaria
          </h2>
          <p className="text-slate-500 text-sm">Seleccione bloque y proyecte por variedad</p>
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
             <button onClick={() => setFechaBase(new Date(new Date(fechaBase).setDate(new Date(fechaBase).getDate()-1)).toISOString().split('T')[0])} className="p-2 hover:bg-slate-50 rounded-lg"><ChevronLeft size={20}/></button>
             <span className="px-4 font-black text-indigo-950 text-sm">{fechaBase}</span>
             <button onClick={() => setFechaBase(new Date(new Date(fechaBase).setDate(new Date(fechaBase).getDate()+1)).toISOString().split('T')[0])} className="p-2 hover:bg-slate-50 rounded-lg"><ChevronRight size={20}/></button>
          </div>

          <button
            onClick={guardarTodo}
            disabled={guardando}
            className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-700 shadow-lg shadow-indigo-200 flex items-center gap-2"
          >
            {guardando ? <Loader2 className="animate-spin" size={16}/> : <Save size={16}/>}
            Guardar Cambios
          </button>
        </div>
      </header>

      <div className="bg-white rounded-[2.5rem] shadow-xl border border-indigo-50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Variedad</th>
                {fechas3Dias.map(fecha => (
                  <th key={fecha} className="px-8 py-6 text-center">
                    <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">
                      {fecha === new Date().toISOString().split('T')[0] ? 'Día Actual' :
                       fecha < new Date().toISOString().split('T')[0] ? 'Día Anterior' : 'Siguiente Día'}
                    </span>
                    <span className="font-black text-indigo-900 text-xs">{fecha}</span>
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
                  {fechas3Dias.map(fecha => {
                    const key = `${fecha}-${v.id_variedad}`;
                    const editable = esEditable(fecha);
                    return (
                      <td key={fecha} className="px-8 py-5 text-center">
                        <input
                          type="number"
                          value={valores[key] ?? ''}
                          onChange={(e) => handleInputChange(fecha, v.id_variedad, e.target.value)}
                          disabled={!editable}
                          placeholder="0"
                          className={`w-28 p-3 text-center font-black rounded-2xl border-none outline-none transition-all ${
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
