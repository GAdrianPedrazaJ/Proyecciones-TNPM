import { supabase } from './supabase';
import { getLocalProyecciones, deleteLocalProyeccion } from './cacheManager';
import { Proyeccion } from '../types/database';

export const syncAllPending = async () => {
  const pendingProyecciones = await getLocalProyecciones();

  if (pendingProyecciones.length === 0) {
    return { success: true, count: 0 };
  }

  try {
    const { error } = await supabase
      .from('proyecciones')
      .insert(pendingProyecciones);

    if (error) throw error;

    for (const proy of pendingProyecciones) {
      if (proy.id) {
        await deleteLocalProyeccion(proy.id);
      }
    }

    return { success: true, count: pendingProyecciones.length };
  } catch (error) {
    console.error('Error sincronizando proyecciones:', error);
    return { success: false, error };
  }
};

export const initSyncListener = () => {
  window.addEventListener('online', () => {
    console.log('Conexión restaurada. Sincronizando proyecciones...');
    syncAllPending();
  });
};
