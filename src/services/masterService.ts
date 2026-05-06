import { supabase } from './supabase';

export const masterService = {
  // Obtener registros activos
  getItems: async (tabla: string, selectQuery: string = '*') => {
    const { data, error } = await supabase
      .from(tabla)
      .select(selectQuery)
      .eq('activo', true)
      .order('fecha_creacion' as any, { ascending: false });

    if (error) throw error;
    return data;
  },

  // Borrado lógico (Desactivar) - Soporta ambos nombres para evitar errores
  deleteItem: async (tabla: string, idCampo: string, idValor: string) => {
    const { error } = await supabase
      .from(tabla)
      .update({ activo: false })
      .eq(idCampo, idValor);

    if (error) throw error;
    return true;
  },

  desactivarItem: async (tabla: string, idCampo: string, idValor: string) => {
    return masterService.deleteItem(tabla, idCampo, idValor);
  },

  // Guardar (Crear o Editar)
  saveItem: async (tabla: string, datos: any) => {
    console.log(`Intentando guardar en ${tabla}:`, datos);

    // Limpieza de datos: Evitar que strings vacíos rompan campos UUID o FK
    const cleanData = { ...datos };
    Object.keys(cleanData).forEach(key => {
      if (cleanData[key] === "" || cleanData[key] === null || cleanData[key] === undefined) {
        delete cleanData[key];
      }
    });

    // Usamos upsert de Supabase.
    // Si cleanData incluye el ID primario, actualizará. Si no, insertará uno nuevo.
    const { data, error } = await supabase
      .from(tabla)
      .upsert(cleanData)
      .select()
      .single();

    if (error) {
      console.error(`Error de base de datos en ${tabla}:`, error.message, error.details);
      throw new Error(error.message);
    }

    console.log(`Registro guardado exitosamente en ${tabla}`);
    return data;
  }
};
