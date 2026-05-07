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

  getAgregadoPER0: async (filtros?: { id_bloque?: string; id_color?: string }) => {
    const { start, end } = getWeekRange(new Date());

    let query = supabase
      .from('vw_proyecciones_diarias_ultima_version')
      .select(`
        id_bloque,
        id_variedad,
        cantidad,
        fecha_proyeccion,
        bloque:bloques(nombre),
        variedad:variedades(
          nombre,
          id_color,
          color:colores(
            nombre,
            producto:productos(nombre)
          )
        )
      `)
      .gte('fecha_proyeccion', start)
      .lte('fecha_proyeccion', end);

    if (filtros?.id_bloque) query = query.eq('id_bloque', filtros.id_bloque);

    const { data: proyecciones, error: pError } = await query;
    if (pError) throw pError;

    let realQuery = supabase
      .from('datos_reales_diarios')
      .select('*')
      .gte('fecha', start)
      .lte('fecha', end);

    if (filtros?.id_bloque) realQuery = realQuery.eq('id_bloque', filtros.id_bloque);

    const { data: reales, error: rError } = await realQuery;
    if (rError) throw rError;

    return { proyecciones, reales };
  },

  getDatosGraficoPER0: async (filtros?: { id_bloque?: string; id_color?: string }) => {
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
  }
};
