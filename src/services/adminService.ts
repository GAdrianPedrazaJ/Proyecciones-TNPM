import { supabase } from './supabase';
import { getWeekRange } from '../utils/semanaUtils';

export const adminService = {
  getStats: async () => {
    const [sedes, bloques, productos, variedades, usuarios] = await Promise.all([
      supabase.from('sedes').select('id_sede', { count: 'exact', head: true }).eq('activo', true),
      supabase.from('bloques').select('id_bloque', { count: 'exact', head: true }).eq('activo', true),
      supabase.from('productos').select('id_producto', { count: 'exact', head: true }).eq('activo', true),
      supabase.from('variedades').select('id_variedad', { count: 'exact', head: true }).eq('activo', true),
      supabase.from('usuarios').select('id_usuario', { count: 'exact', head: true }).eq('activo', true),
    ]);

    return {
      sedes: sedes.count || 0,
      bloques: bloques.count || 0,
      productos: productos.count || 0,
      variedades: variedades.count || 0,
      usuarios: usuarios.count || 0,
    };
  },

  getAgregadoPER0: async (filtros?: { id_sede?: string; id_bloque?: string; id_color?: string; id_producto?: string }) => {
    const { start, end } = getWeekRange(new Date());

    let query = supabase
      .from('vw_proyecciones_diarias_ultima_version')
      .select(`
        id_bloque,
        id_variedad,
        cantidad,
        fecha_proyeccion,
        bloque:bloques!inner(nombre, id_sede),
        variedad:variedades!inner(
          nombre,
          id_color,
          color:colores!inner(
            nombre,
            id_producto,
            producto:productos(nombre)
          )
        )
      `)
      .gte('fecha_proyeccion', start)
      .lte('fecha_proyeccion', end);

    if (filtros?.id_sede) query = query.eq('bloques.id_sede', filtros.id_sede);
    if (filtros?.id_bloque) query = query.eq('id_bloque', filtros.id_bloque);
    if (filtros?.id_color) query = query.eq('variedad.id_color', filtros.id_color);
    if (filtros?.id_producto) query = query.eq('variedad.color.id_producto', filtros.id_producto);

    const { data: proyecciones, error: pError } = await query;
    if (pError) throw pError;

    let realQuery = supabase
      .from('datos_reales_diarios')
      .select(`
        *,
        bloque:bloques!inner(id_sede)
      `)
      .gte('fecha', start)
      .lte('fecha', end);

    if (filtros?.id_sede) realQuery = realQuery.eq('bloque.id_sede', filtros.id_sede);
    if (filtros?.id_bloque) realQuery = realQuery.eq('id_bloque', filtros.id_bloque);

    const { data: reales, error: rError } = await realQuery;
    if (rError) throw rError;

    return { proyecciones, reales };
  },

  getDatosGraficoPER0: async (filtros?: any) => {
    const { start } = getWeekRange(new Date());
    const { proyecciones, reales } = await adminService.getAgregadoPER0(filtros);

    const dias = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
    return dias.map((dia, index) => {
      const fechaObj = new Date(start);
      fechaObj.setDate(fechaObj.getDate() + index);
      const fechaStr = fechaObj.toISOString().split('T')[0];

      const proyDia = proyecciones
        ?.filter((p: any) => p.fecha_proyeccion === fechaStr)
        .reduce((sum: number, p: any) => sum + p.cantidad, 0) || 0;

      const realDia = reales
        ?.filter((r: any) => r.fecha === fechaStr)
        .reduce((sum: number, r: any) => sum + r.cantidad, 0) || 0;

      return { name: dia, proyectado: proyDia, real: realDia };
    });
  },

  getAcumulados: async (filtros: { id_sede?: string; id_producto?: string; id_bloque?: string; id_color?: string }) => {
    const { start, end } = getWeekRange(new Date());

    let query = supabase
      .from('vw_proyecciones_diarias_ultima_version')
      .select(`
        cantidad,
        id_variedad,
        bloques!inner (id_sede, id_bloque),
        variedades!inner (
          id_variedad,
          nombre,
          id_color,
          colores!inner (
            id_color,
            nombre,
            id_producto
          )
        )
      `)
      .gte('fecha_proyeccion', start)
      .lte('fecha_proyeccion', end);

    if (filtros.id_sede) query = query.eq('bloques.id_sede', filtros.id_sede);
    if (filtros.id_bloque) query = query.eq('id_bloque', filtros.id_bloque);
    if (filtros.id_producto) query = query.eq('variedades.colores.id_producto', filtros.id_producto);
    if (filtros.id_color) query = query.eq('variedades.id_color', filtros.id_color);

    const { data, error } = await query;
    if (error) throw error;

    return data;
  }
};
