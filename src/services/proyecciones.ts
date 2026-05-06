import { supabase } from './supabase';
import { ProyeccionDiaria, ProyeccionSemanal } from '../types/database';

export const proyeccionesService = {
  // --- PROYECCIONES DIARIAS ---
  getProyeccionesDiarias: async (idSupervisor: string, fechas: string[]) => {
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

    if (error) throw error;
    return data;
  },

  guardarProyeccionDiaria: async (proyeccion: Omit<ProyeccionDiaria, 'id_proyeccion' | 'version' | 'fecha_creacion'>) => {
    const { data: ultimaVersion } = await supabase
      .from('proyecciones_diarias')
      .select('version')
      .eq('id_supervisor', proyeccion.id_supervisor)
      .eq('id_bloque', proyeccion.id_bloque)
      .eq('id_variedad', proyeccion.id_variedad)
      .eq('fecha_proyeccion', proyeccion.fecha_proyeccion)
      .order('version', { ascending: false })
      .limit(1);

    const nuevaVersion = (ultimaVersion?.[0]?.version || 0) + 1;

    const { data, error } = await supabase
      .from('proyecciones_diarias')
      .insert([{
        ...proyeccion,
        version: nuevaVersion
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // --- HISTÓRICOS ---
  getHistoricoPER0: async (idSupervisor: string, fechaInicio: string, fechaFin: string) => {
    const { data: proyecciones, error: pError } = await supabase
      .from('proyecciones_diarias')
      .select(`
        *,
        bloque:bloques(nombre),
        variedad:variedades(
          nombre,
          color:colores(
            nombre,
            producto:productos(nombre)
          )
        )
      `)
      .eq('id_supervisor', idSupervisor)
      .gte('fecha_proyeccion', fechaInicio)
      .lte('fecha_proyeccion', fechaFin);

    if (pError) throw pError;

    const { data: reales, error: rError } = await supabase
      .from('datos_reales_diarios')
      .select('*')
      .gte('fecha', fechaInicio)
      .lte('fecha', fechaFin);

    if (rError) throw rError;

    const realMap = new Map();
    reales?.forEach(r => {
      const key = `${r.fecha}-${r.id_bloque}-${r.id_variedad}`;
      realMap.set(key, r.cantidad);
    });

    return proyecciones.map(p => {
      const key = `${p.fecha_proyeccion}-${p.id_bloque}-${p.id_variedad}`;
      const cantidadReal = realMap.get(key) || 0;
      const diferencia = p.cantidad > 0 ? ((cantidadReal - p.cantidad) / p.cantidad) * 100 : 0;

      return {
        ...p,
        cantidad_real: cantidadReal,
        diferencia_porcentaje: diferencia
      };
    });
  },

  // --- DATOS MAESTROS (FILTRADOS POR ACTIVO) ---
  getDatosMaestrosSupervisor: async (idSupervisor: string) => {
    const { data: usuario } = await supabase
      .from('usuarios')
      .select('rol')
      .eq('id_usuario', idSupervisor)
      .single();

    let query = supabase
      .from('areas')
      .select(`
        id_area,
        nombre,
        areas_bloques(
          bloque:bloques(*)
        )
      `)
      .eq('activo', true);

    if (usuario?.rol === 'supervisor') {
      query = query.eq('id_supervisor', idSupervisor);
    }

    const { data: areas, error: areaError } = await query;
    if (areaError) throw areaError;

    let bloques = areas?.flatMap(a =>
      a.areas_bloques
        .filter((ab: any) => ab.bloque.activo === true)
        .map((ab: any) => ab.bloque)
    ) || [];

    if (bloques.length === 0 && usuario?.rol !== 'supervisor') {
       const { data: todos } = await supabase
        .from('bloques')
        .select('*')
        .eq('activo', true);
       bloques = todos || [];
    }

    const { data: variedades, error: varError } = await supabase
      .from('variedades')
      .select(`
        *,
        color:colores(
          *,
          producto:productos(*)
        )
      `)
      .eq('activo', true);

    if (varError) throw varError;

    return { bloques, variedades };
  }
};
