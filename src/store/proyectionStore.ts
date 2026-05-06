import { create } from 'zustand';
import { ProyeccionDiaria } from '../types/database';
import { supabase } from '../services/supabase';

interface ProyectionStore {
  proyecciones: ProyeccionDiaria[];
  fechaActual: string;
  loading: boolean;

  // Acciones
  setProyecciones: (proyecciones: ProyeccionDiaria[]) => void;
  setFechaActual: (fecha: string) => void;
  fetchProyecciones3Dias: (fecha: string, idSupervisor: string) => Promise<void>;

  obtenerProyecciones3Dias: (fecha: string) => {
    anterior: ProyeccionDiaria[];
    presente: ProyeccionDiaria[];
    siguiente: ProyeccionDiaria[]
  };

  permitirReproyectar: (fecha: string) => boolean;
}

export const useProyectionStore = create<ProyectionStore>((set, get) => ({
  proyecciones: [],
  fechaActual: new Date().toISOString().split('T')[0],
  loading: false,

  setProyecciones: (proyecciones) => set({ proyecciones }),
  setFechaActual: (fecha) => set({ fechaActual: fecha }),

  fetchProyecciones3Dias: async (fecha, idSupervisor) => {
    set({ loading: true });
    const hoy = new Date(fecha);
    const ayer = new Date(hoy);
    ayer.setDate(ayer.getDate() - 1);
    const mañana = new Date(hoy);
    mañana.setDate(mañana.getDate() + 1);

    const formatDate = (d: Date) => d.toISOString().split('T')[0];
    const fechas = [formatDate(ayer), formatDate(hoy), formatDate(mañana)];

    const { data, error } = await supabase
      .from('proyecciones_diarias')
      .select(`
        *,
        bloque:bloques(*),
        variedad:variedades(
          *,
          color:colores(
            *,
            producto:productos(*)
          )
        )
      `)
      .eq('id_supervisor', idSupervisor)
      .in('fecha_proyeccion', fechas)
      .order('version', { ascending: false });

    if (!error && data) {
      set({ proyecciones: data as any });
    }
    set({ loading: false });
  },

  obtenerProyecciones3Dias: (fecha) => {
    const hoy = new Date(fecha);
    const ayer = new Date(hoy);
    ayer.setDate(ayer.getDate() - 1);
    const mañana = new Date(hoy);
    mañana.setDate(mañana.getDate() + 1);

    const formatDate = (d: Date) => d.toISOString().split('T')[0];
    const allProyecciones = get().proyecciones;

    const filtrarUltimaVersion = (list: ProyeccionDiaria[]) => {
      const unique = new Map();
      list.forEach(p => {
        const key = `${p.id_bloque}-${p.id_variedad}`;
        if (!unique.has(key) || p.version > unique.get(key).version) {
          unique.set(key, p);
        }
      });
      return Array.from(unique.values());
    };

    return {
      anterior: filtrarUltimaVersion(allProyecciones.filter(p => p.fecha_proyeccion === formatDate(ayer))),
      presente: filtrarUltimaVersion(allProyecciones.filter(p => p.fecha_proyeccion === formatDate(hoy))),
      siguiente: filtrarUltimaVersion(allProyecciones.filter(p => p.fecha_proyeccion === formatDate(mañana)))
    };
  },

  permitirReproyectar: (fecha) => {
    const hoyStr = new Date().toISOString().split('T')[0];
    const ayer = new Date();
    ayer.setDate(ayer.getDate() - 1);
    const ayerStr = ayer.toISOString().split('T')[0];
    return fecha === hoyStr || fecha === ayerStr;
  }
}));
