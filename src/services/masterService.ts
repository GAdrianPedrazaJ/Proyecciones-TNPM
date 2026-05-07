import { supabase } from './supabase';

export const masterService = {
  // Obtener registros activos con ordenamiento inteligente por tabla
  getItems: async (tabla: string, selectQuery: string = '*') => {
    let query = supabase
      .from(tabla)
      .select(selectQuery)
      .eq('activo', true);

    // Definimos qué columna usar para ordenar según la tabla
    const tablasConFecha = ['sedes', 'bloques', 'usuarios', 'proyecciones_diarias', 'proyecciones_semanales', 'datos_reales_diarios'];
    const tablasConNombre = ['productos', 'colores', 'variedades', 'areas'];

    if (tablasConFecha.includes(tabla.toLowerCase())) {
      query = query.order('fecha_creacion' as any, { ascending: false });
    } else if (tablasConNombre.includes(tabla.toLowerCase())) {
      query = query.order('nombre' as any, { ascending: true });
    } else if (tabla.toLowerCase() === 'areas_bloques') {
      query = query.order('fecha_asignacion' as any, { ascending: false });
    }

    const { data, error } = await query;
    if (error) {
      console.error(`Error en getItems para ${tabla}:`, error.message);
      throw error;
    }
    return data;
  },

  deleteItem: async (tabla: string, idCampo: string, idValor: string) => {
    const { error } = await supabase
      .from(tabla)
      .update({ activo: false })
      .eq(idCampo, idValor);

    if (error) throw error;
    return true;
  },

  saveItem: async (tabla: string, datos: any) => {
    const cleanData = { ...datos };
    Object.keys(cleanData).forEach(key => {
      if (cleanData[key] === "" || cleanData[key] === null || cleanData[key] === undefined) {
        delete cleanData[key];
      }
    });

    const { data, error } = await supabase
      .from(tabla)
      .upsert(cleanData)
      .select()
      .single();

    if (error) {
      console.error(`Error guardando en ${tabla}:`, error.message);
      throw new Error(error.message);
    }
    return data;
  }
};
