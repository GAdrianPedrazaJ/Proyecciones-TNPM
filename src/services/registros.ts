import { supabase } from './supabase';
import { Registro } from '../types/database';
import { saveLocalRegistro } from './cacheManager';

export const createRegistro = async (registro: Omit<Registro, 'id' | 'created_at'>) => {
  const newId = crypto.randomUUID();
  const fullRegistro = { ...registro, id: newId };

  try {
    // Intentar guardar en Supabase primero
    const { error } = await supabase
      .from('registros')
      .insert([fullRegistro]);

    if (error) {
      console.warn('Error al guardar en Supabase, guardando localmente:', error.message);
      await saveLocalRegistro(fullRegistro as Registro);
      return { success: true, offline: true };
    }

    return { success: true, offline: false };
  } catch (err) {
    console.error('Error inesperado, guardando localmente:', err);
    await saveLocalRegistro(fullRegistro as Registro);
    return { success: true, offline: true };
  }
};
