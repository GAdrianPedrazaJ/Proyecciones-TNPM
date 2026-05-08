import { supabase } from './supabase';
import { ProyeccionDiaria, ProyeccionSemanal } from '../types/database';
import { db } from './offlineDB';
import { syncEngine } from './syncEngine';
import { logger } from '../utils/logger';
import { auditService } from './auditService';
import { useAuthStore } from '../store/authStore';

export const proyeccionesService = {
  // --- PROYECCIONES DIARIAS ---
  getProyeccionesDiarias: async (idSupervisor: string, fechas: string[]) => {
    try {
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

      if (data && data.length > 0) {
        await db.proyecciones_diarias.bulkPut(data);
      }
      return data;
    } catch (err) {
      logger.warn("Error consultando online, usando cache local", err);
      return await db.proyecciones_diarias
        .where('id_supervisor').equals(idSupervisor)
        .filter(p => fechas.includes(p.fecha_proyeccion))
        .toArray();
    }
  },

  guardarProyeccionDiaria: async (proyeccion: any) => {
    const recordId = proyeccion.id_proyeccion || crypto.randomUUID();
    const fullProyeccion = { ...proyeccion, id_proyeccion: recordId };
    const user = useAuthStore.getState().user;

    try {
      await db.proyecciones_diarias.put(fullProyeccion);

      if (!navigator.onLine || !(await syncEngine.isDatabaseReady())) {
        throw new Error('OFFLINE_OR_BUSY');
      }

      const { data, error } = await supabase
        .from('proyecciones_diarias')
        .upsert(fullProyeccion, {
          onConflict: 'id_supervisor,id_bloque,id_variedad,fecha_proyeccion'
        })
        .select()
        .single();

      if (error) throw error;

      // AUDITORIA
      await auditService.log({
        id_usuario: user?.id_usuario || 'SYSTEM',
        accion: 'UPDATE',
        tabla: 'proyecciones_diarias',
        registro_id: recordId,
        valor_nuevo: fullProyeccion
      });

      return data;

    } catch (err: any) {
      logger.warn(`Encolando proyección diaria localmente: ${err.message}`);

      await db.sync_queue.add({
        table: 'proyecciones_diarias',
        data: fullProyeccion,
        action: 'UPSERT',
        timestamp: Date.now(),
        attempts: 0
      });

      syncEngine.processQueue();
      return fullProyeccion;
    }
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
    const recordId = proyeccion.id_proyeccion || crypto.randomUUID();
    const fullProyeccion = { ...proyeccion, id_proyeccion: recordId };
    const user = useAuthStore.getState().user;

    try {
      if (!navigator.onLine || !(await syncEngine.isDatabaseReady())) {
        throw new Error('OFFLINE_OR_BUSY');
      }

      const { data, error } = await supabase
        .from('proyecciones_semanales')
        .upsert(fullProyeccion, {
          onConflict: 'id_supervisor,id_bloque,id_variedad,semana_num,ano'
        })
        .select()
        .single();

      if (error) throw error;

      // AUDITORIA
      await auditService.log({
        id_usuario: user?.id_usuario || 'SYSTEM',
        accion: 'UPDATE',
        tabla: 'proyecciones_semanales',
        registro_id: recordId,
        valor_nuevo: fullProyeccion
      });

      return data;
    } catch (err: any) {
      logger.warn(`Encolando proyección semanal localmente: ${err.message}`);

      await db.sync_queue.add({
        table: 'proyecciones_semanales',
        data: fullProyeccion,
        action: 'UPSERT',
        timestamp: Date.now(),
        attempts: 0
      });

      syncEngine.processQueue();
      return fullProyeccion;
    }
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
