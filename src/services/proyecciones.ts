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

  guardarProyeccionDiaria: async (proyeccion: any) => {
    // Buscamos si ya existe para manejar la versión y evitar el error 409
    const { data: existente } = await supabase
      .from('proyecciones_diarias')
      .select('version, id_proyeccion')
      .match({
        id_supervisor: proyeccion.id_supervisor,
        id_bloque: proyeccion.id_bloque,
        id_variedad: proyeccion.id_variedad,
        fecha_proyeccion: proyeccion.fecha_proyeccion
      })
      .maybeSingle();

    const nuevaVersion = (existente?.version || 0) + 1;

    const { data, error } = await supabase
      .from('proyecciones_diarias')
      .upsert({
        ...(existente?.id_proyeccion ? { id_proyeccion: existente.id_proyeccion } : {}),
        id_supervisor: proyeccion.id_supervisor,
        id_bloque: proyeccion.id_bloque,
        id_variedad: proyeccion.id_variedad,
        fecha_proyeccion: proyeccion.fecha_proyeccion,
        cantidad: proyeccion.cantidad,
        version: nuevaVersion
      }, {
        onConflict: 'id_supervisor,id_bloque,id_variedad,fecha_proyeccion'
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // --- PROYECCIONES SEMANALES ---
  getProyeccionesSemanales: async (idSupervisor: string, ano: number, semanas: number[]) => {
    const { data, error } = await supabase
      .from('proyecciones_semanales')
      .select('*')
      .eq('id_supervisor', idSupervisor)
      .eq('ano', ano)
      .in('semana_num', semanas);

    if (error) throw error;
    return data;
  },

  guardarProyeccionSemanal: async (proyeccion: any) => {
    const { data: existente } = await supabase
      .from('proyecciones_semanales')
      .select('version, id_proyeccion')
      .match({
        id_supervisor: proyeccion.id_supervisor,
        id_bloque: proyeccion.id_bloque,
        id_variedad: proyeccion.id_variedad,
        semana_num: proyeccion.semana_num,
        ano: proyeccion.ano
      })
      .maybeSingle();

    const nuevaVersion = (existente?.version || 0) + 1;

    const { data, error } = await supabase
      .from('proyecciones_semanales')
      .upsert({
        ...(existente?.id_proyeccion ? { id_proyeccion: existente.id_proyeccion } : {}),
        id_supervisor: proyeccion.id_supervisor,
        id_bloque: proyeccion.id_bloque,
        id_variedad: proyeccion.id_variedad,
        semana_num: proyeccion.semana_num,
        ano: proyeccion.ano,
        cantidad: proyeccion.cantidad,
        version: nuevaVersion
      }, {
        onConflict: 'id_supervisor,id_bloque,id_variedad,semana_num,ano'
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

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
    reales?.forEach((r: any) => {
      const key = `${r.fecha}-${r.id_bloque}-${r.id_variedad}`;
      realMap.set(key, r.cantidad);
    });

    return proyecciones.map((p: any) => {
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

  getBloquesAsignados: async (idSupervisor: string) => {
    const { data: usuario } = await supabase.from('usuarios').select('rol').eq('id_usuario', idSupervisor).single();
    let query = supabase.from('bloques').select('*, id_sede(nombre)').eq('activo', true);
    if (usuario?.rol === 'supervisor') {
      const { data: areas } = await supabase.from('areas').select('id_area').eq('id_supervisor', idSupervisor);
      const areaIds = areas?.map(a => a.id_area) || [];
      const { data: ab } = await supabase.from('areas_bloques').select('id_bloque').in('id_area', areaIds);
      const bloqueIds = ab?.map(b => b.id_bloque) || [];
      query = query.in('id_bloque', bloqueIds);
    }
    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  getVariedadesPorBloque: async (idBloque: string) => {
    const { data, error } = await supabase
      .from('bloques_variedades')
      .select(`
        id_variedad,
        variedad:variedades(
          *,
          color:colores(
            *,
            producto:productos(*)
          )
        )
      `)
      .eq('id_bloque', idBloque)
      .eq('activo', true);

    if (error) throw error;
    return data?.map((item: any) => item.variedad).filter(v => v !== null) || [];
  },

  getDatosMaestrosSupervisor: async (idSupervisor: string) => {
    const bloques = await proyeccionesService.getBloquesAsignados(idSupervisor);
    return { bloques, variedades: [] };
  }
};
