import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { useProyectionStore } from '../store/proyectionStore';
import { useNavStore } from '../store/navStore';
import { proyeccionesService } from '../services/proyecciones';
import { LayoutGrid, Box, Loader2, Tags, Calendar, CalendarDays, MapPin } from 'lucide-react';
import { CardSkeleton } from './UI/Skeleton';

export const SupervisorBloques: React.FC = () => {
  const { user } = useAuthStore();
  const { setCurrentView } = useNavStore();
  const { setIdBloqueSeleccionado } = useProyectionStore();
  const [loading, setLoading] = useState(true);
  const [bloques, setBloques] = useState<any[]>([]);
  const [variedadesPorBloque, setVariedadesPorBloque] = useState<Record<string, any[]>>({});

  useEffect(() => {
    if (user?.id_usuario) {
      cargarDatos();
    }
  }, [user?.id_usuario]);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const bloquesData = await proyeccionesService.getBloquesAsignados(user!.id_usuario);
      setBloques(bloquesData);

      const varsMap: Record<string, any[]> = {};
      // Paralelizamos para mayor velocidad
      await Promise.all(bloquesData.map(async (b) => {
        const vars = await proyeccionesService.getVariedadesPorBloque(b.id_bloque);
        varsMap[b.id_bloque] = vars;
      }));
      setVariedadesPorBloque(varsMap);
    } catch (error) {
      console.error("Error cargando bloques:", error);
    } finally {
      setLoading(false);
    }
  };

  const seleccionarYNavegar = (idBloque: string, vista: 'supervisor-diaria' | 'supervisor-semanal') => {
    setIdBloqueSeleccionado(idBloque);
    setCurrentView(vista);
  };

  return (
    <div className="space-y-10 max-w-7xl mx-auto pb-12 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-300 pb-8">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="h-1 w-8 bg-purple-600 rounded-full"></span>
            <span className="text-[10px] font-black text-purple-600 uppercase tracking-[0.3em]">Operaciones Campo</span>
          </div>
          <h2 className="text-4xl font-black text-slate-950 flex items-center gap-3 tracking-tighter uppercase italic">
            Mis Bloques
          </h2>
          <p className="text-slate-700 font-bold mt-2">Bienvenido, <span className="text-purple-600">{user?.nombre_completo}</span>.</p>
        </div>
      </header>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[...Array(6)].map((_, i) => <CardSkeleton key={i} />)}
        </div>
      ) : bloques.length === 0 ? (
        <div className="bg-white p-24 rounded-[3rem] shadow-sm border border-slate-200 text-center space-y-6">
          <Box size={64} className="mx-auto text-slate-300" />
          <p className="text-slate-600 font-black uppercase tracking-widest">Sin asignaciones registradas.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {bloques.map((bloque) => {
            const variedades = variedadesPorBloque[bloque.id_bloque] || [];
            return (
              <div key={bloque.id_bloque} className="bg-white rounded-[2.5rem] border-2 border-slate-100 overflow-hidden hover:border-purple-300 transition-all group shadow-sm flex flex-col hover:-translate-y-1">
                <div className="p-8 space-y-6 flex-1">
                  <div className="flex justify-between items-start">
                    <div className="p-4 bg-purple-50 text-purple-600 rounded-2xl group-hover:bg-purple-600 group-hover:text-white transition-all duration-500 shadow-sm">
                      <Box size={24} />
                    </div>
                    <div className="flex items-center gap-1.5 bg-slate-100 px-3 py-1.5 rounded-full border border-slate-200 shadow-sm">
                      <MapPin size={10} className="text-slate-600" />
                      <span className="text-[9px] font-black text-slate-800 uppercase tracking-widest">
                        {bloque.id_sede?.nombre || 'General'}
                      </span>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter italic group-hover:text-purple-600 transition-colors">Bloque {bloque.nombre}</h3>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-[10px] font-black text-slate-700 uppercase tracking-[0.2em] bg-slate-50 px-2 py-1 rounded-md border border-slate-100">{variedades.length} Variedades en siembra</span>
                    </div>
                  </div>

                  <div className="space-y-2 py-4 border-t border-slate-100">
                     {variedades.slice(0, 2).map((v, i) => (
                       <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-200 shadow-sm">
                          <span className="text-xs font-black text-slate-800 truncate pr-4 uppercase">{v.nombre}</span>
                          <span className="text-[9px] font-black text-purple-600 bg-purple-50 px-2 py-1 rounded-lg border border-purple-100 uppercase tracking-widest">{v.color?.nombre}</span>
                       </div>
                     ))}
                  </div>
                </div>

                <div className="p-4 bg-slate-50 border-t border-slate-200 grid grid-cols-2 gap-3">
                  <button
                    onClick={() => seleccionarYNavegar(bloque.id_bloque, 'supervisor-diaria')}
                    className="flex items-center justify-center gap-2 py-4 bg-white text-slate-900 rounded-2xl text-[10px] font-black uppercase tracking-widest border-2 border-slate-200 hover:border-purple-600 hover:text-purple-600 transition-all active:scale-95 shadow-sm"
                  >
                    <Calendar size={14} /> Diario
                  </button>
                  <button
                    onClick={() => seleccionarYNavegar(bloque.id_bloque, 'supervisor-semanal')}
                    className="flex items-center justify-center gap-2 py-4 bg-purple-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-purple-700 shadow-lg shadow-purple-200 transition-all active:scale-95"
                  >
                    <CalendarDays size={14} /> Semanal
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
