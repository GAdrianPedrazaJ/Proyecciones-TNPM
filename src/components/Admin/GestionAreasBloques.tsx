import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';
import { masterService } from '../../services/masterService';
import { Layers, Plus, Trash2, Loader2, AlertCircle, Link as LinkIcon, MapPin, User, CheckSquare, Square } from 'lucide-react';

export const GestionAreasBloques: React.FC = () => {
  const [areas, setAreas] = useState<any[]>([]);
  const [bloques, setBloques] = useState<any[]>([]);
  const [asignaciones, setAsignaciones] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [areaSeleccionada, setAreaSeleccionada] = useState('');
  const [bloquesSeleccionados, setBloquesSeleccionados] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [procesando, setProcesando] = useState(false);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const [areasData, bloquesData, asignacionesData] = await Promise.all([
        supabase.from('areas').select('*, supervisor:usuarios(nombre_completo)'),
        masterService.getItems('bloques'),
        supabase
          .from('areas_bloques')
          .select('*, area:areas(nombre, id_supervisor, supervisor:usuarios(nombre_completo)), bloque:bloques(nombre, id_sede, sede:sedes(nombre))')
      ]);

      setAreas(areasData.data || []);
      setBloques(bloquesData);
      setAsignaciones(asignacionesData.data || []);
    } catch (err) {
      console.error(err);
      setError('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  const toggleBloque = (id: string) => {
    setBloquesSeleccionados(prev =>
      prev.includes(id) ? prev.filter(b => b !== id) : [...prev, id]
    );
  };

  const handleAsignarMultiple = async () => {
    if (!areaSeleccionada || bloquesSeleccionados.length === 0) return;

    setError(null);
    setProcesando(true);
    try {
      // Intentamos insertar los registros uno por uno o en batch
      const inserts = bloquesSeleccionados.map(idBloque => ({
        id_area: areaSeleccionada,
        id_bloque: idBloque
      }));

      const { error: insError } = await supabase
        .from('areas_bloques')
        .insert(inserts);

      if (insError) {
        // Si sale 403 RLS, imprimimos más detalle para depuración
        console.error("Error de RLS en Supabase:", insError);
        throw new Error(insError.message || 'Error de permisos al vincular. Verifique las políticas RLS en Supabase.');
      }

      await loadInitialData();
      setBloquesSeleccionados([]);
      alert('Vínculos creados exitosamente');
    } catch (err: any) {
      setError(err.message || 'Error al asignar bloques');
    } finally {
      setProcesando(false);
    }
  };

  const handleEliminar = async (id: string) => {
    if (!window.confirm('¿Desea desvincular este bloque del área?')) return;
    try {
      const { error: delError } = await supabase.from('areas_bloques').delete().eq('id', id);
      if (delError) throw delError;
      await loadInitialData();
    } catch (err) {
      setError('Error al eliminar');
    }
  };

  const bloquesDisponibles = bloques.filter(b => !asignaciones.some(asig => asig.id_bloque === b.id_bloque));

  if (loading && areas.length === 0) return (
    <div className="flex flex-col justify-center items-center h-[60vh] gap-6">
      <Loader2 className="animate-spin text-purple-600" size={48} />
      <p className="text-slate-600 font-black uppercase tracking-[0.4em] text-[10px]">Sincronizando Estructura...</p>
    </div>
  );

  return (
    <div className="space-y-10 max-w-7xl mx-auto pb-12 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-300 pb-8">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="h-1 w-8 bg-purple-600 rounded-full"></span>
            <span className="text-[10px] font-black text-purple-700 uppercase tracking-[0.3em]">Jerarquía de Producción</span>
          </div>
          <h2 className="text-4xl font-black text-slate-950 flex items-center gap-3 tracking-tighter uppercase italic">
            Vincular Bloques a Áreas
          </h2>
          <p className="text-slate-700 font-bold mt-2">Gestión masiva de vinculación de bloques por área supervisada.</p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Panel Lateral de Registro */}
        <div className="space-y-6">
          <div className="bg-white p-10 rounded-[3rem] shadow-sm border-2 border-slate-100 space-y-8">
            <div className="flex items-center gap-4 border-b border-slate-100 pb-6">
              <div className="p-3 bg-purple-600 text-white rounded-2xl shadow-lg shadow-purple-200">
                <LinkIcon size={24} />
              </div>
              <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter italic">Asignación Masiva</h3>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">1. Área Destino</label>
                <select
                  value={areaSeleccionada}
                  onChange={(e) => setAreaSeleccionada(e.target.value)}
                  className="w-full bg-slate-50 border-2 border-transparent focus:border-purple-500 py-4 px-6 rounded-2xl focus:ring-4 focus:ring-purple-100 transition-all font-black text-slate-900 outline-none appearance-none cursor-pointer"
                >
                  <option value="">-- Seleccionar Área --</option>
                  {areas.map(a => <option key={a.id_area} value={a.id_area}>{a.nombre} ({a.supervisor?.nombre_completo || 'N/A'})</option>)}
                </select>
              </div>

              <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">2. Seleccione Bloques ({bloquesSeleccionados.length})</label>
                <div className="max-h-60 overflow-y-auto border-2 border-slate-50 rounded-2xl p-2 bg-slate-50/50 space-y-1">
                  {bloquesDisponibles.length === 0 ? (
                    <p className="text-[10px] text-slate-400 font-bold p-4 text-center">Todos los bloques ya están asignados.</p>
                  ) : bloquesDisponibles.map(b => (
                    <button
                      key={b.id_bloque}
                      onClick={() => toggleBloque(b.id_bloque)}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${bloquesSeleccionados.includes(b.id_bloque) ? 'bg-purple-600 text-white shadow-md shadow-purple-200' : 'bg-white hover:bg-slate-100 text-slate-700'}`}
                    >
                      {bloquesSeleccionados.includes(b.id_bloque) ? <CheckSquare size={18} /> : <Square size={18} className="text-slate-300" />}
                      <div className="flex flex-col items-start">
                        <span className="text-xs font-black uppercase">Bloque {b.nombre}</span>
                        <span className={`text-[9px] font-bold ${bloquesSeleccionados.includes(b.id_bloque) ? 'text-purple-200' : 'text-slate-400'}`}>{b.sede?.nombre}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-3 text-red-700 bg-red-50 p-4 rounded-2xl text-[11px] font-bold border-2 border-red-100">
                  <AlertCircle size={16} />
                  <span>{error}</span>
                </div>
              )}

              <button
                onClick={handleAsignarMultiple}
                disabled={!areaSeleccionada || bloquesSeleccionados.length === 0 || procesando}
                className="w-full bg-purple-600 text-white py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-purple-700 shadow-xl shadow-purple-200 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 transition-all"
              >
                {procesando ? <Loader2 className="animate-spin" size={20} /> : <Plus size={20} />}
                VINCULAR {bloquesSeleccionados.length > 0 ? `(${bloquesSeleccionados.length})` : ''}
              </button>
            </div>
          </div>
        </div>

        {/* Lista de Asignaciones */}
        <div className="lg:col-span-2 bg-white rounded-[3rem] shadow-sm border-2 border-slate-100 overflow-hidden">
          <div className="p-8 border-b-2 border-slate-100 flex justify-between items-center bg-slate-50">
            <h3 className="text-[10px] font-black text-slate-800 uppercase tracking-[0.3em] flex items-center gap-2">
              <Layers className="text-purple-600" size={18} /> Mapeo de Redes Actual
            </h3>
            <span className="bg-white border-2 border-slate-200 text-slate-900 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm">{asignaciones.length} Vínculos</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] bg-white border-b-2 border-slate-100">
                  <th className="px-10 py-8">Área Administrativa</th>
                  <th className="px-10 py-8">Estructura Física (Bloque)</th>
                  <th className="px-10 py-8 text-right">Control</th>
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-slate-100">
                {asignaciones.map((asig) => (
                  <tr key={asig.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-10 py-6">
                      <div className="flex flex-col">
                        <span className="font-black text-slate-950 text-sm uppercase italic">{asig.area?.nombre}</span>
                        <div className="flex items-center gap-1.5 mt-1">
                          <User size={10} className="text-purple-500" />
                          <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{asig.area?.supervisor?.nombre_completo || 'Sin Responsable'}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-10 py-6">
                      <div className="flex flex-col">
                        <span className="font-black text-slate-950 text-sm group-hover:text-purple-600 transition-colors uppercase">Bloque {asig.bloque?.nombre}</span>
                        <div className="flex items-center gap-1.5 mt-1">
                          <MapPin size={10} className="text-slate-400" />
                          <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">{asig.bloque?.sede?.nombre}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-10 py-6 text-right">
                      <button
                        onClick={() => handleEliminar(asig.id)}
                        className="p-4 text-slate-400 hover:bg-red-50 hover:text-red-600 rounded-2xl transition-all active:scale-95 sm:opacity-0 group-hover:opacity-100"
                        title="Desvincular"
                      >
                        <Trash2 size={20} />
                      </button>
                    </td>
                  </tr>
                ))}
                {asignaciones.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-10 py-24 text-center">
                      <div className="flex flex-col items-center gap-4">
                        <LinkIcon size={48} className="text-slate-200" />
                        <p className="text-slate-500 font-black italic uppercase text-xs tracking-widest">No existen vínculos de red</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
