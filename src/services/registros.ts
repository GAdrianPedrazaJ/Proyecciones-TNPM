import { supabase } from './supabase';
import { Registro } from '../types/database';
import { db } from './offlineDB';
import { syncEngine } from './syncEngine';
import { logger } from '../utils/logger';

export const createRegistro = async (registro: Omit<Registro, 'id' | 'created_at'>) => {
  const newId = crypto.randomUUID();
  const fullRegistro = {
    ...registro,
    id: newId,
    created_at: new Date().toISOString()
  };

  try {
    // 1. Verificar disponibilidad de red y saturación de DB
    if (!navigator.onLine) {
        throw new Error('OFFLINE');
    }

    const isReady = await syncEngine.isDatabaseReady();
    if (!isReady) {
      throw new Error('SERVER_BUSY');
    }

    // 2. Intentar guardado directo
    const { error } = await supabase.from('registros').insert([fullRegistro]);
    if (error) throw error;

    return { success: true, offline: false };

  } catch (err: any) {
    // 3. Si falla por cualquier motivo (red, saturación, etc), encolar localmente
    logger.warn(`Guardando registro localmente debido a: ${err.message || 'Error de red'}`);

    await db.sync_queue.add({
      table: 'registros',
      data: fullRegistro,
      action: 'INSERT',
      timestamp: Date.now(),
      attempts: 0
    });

    // Disparar proceso de sincronización en background
    syncEngine.processQueue();

    return { success: true, offline: true };
  }
};
