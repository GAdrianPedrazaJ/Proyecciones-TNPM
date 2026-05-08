import { supabase } from './supabase';
import { AuditoriaLog } from '../types/database';
import { logger } from '../utils/logger';

export const auditService = {
  /**
   * Registra una acción en la tabla de auditoría.
   */
  log: async (entry: Omit<AuditoriaLog, 'fecha_hora'>) => {
    try {
      const { error } = await supabase.from('auditoria_logs').insert([
        {
          ...entry,
          fecha_hora: new Date().toISOString(),
        },
      ]);
      if (error) throw error;
    } catch (err) {
      // Los fallos en auditoría no deben frenar la app, pero sí loguearse.
      logger.warn('No se pudo registrar log de auditoría', err);
    }
  },

  /**
   * Obtiene logs de auditoría para un registro específico.
   */
  getLogsByRegistro: async (registroId: string) => {
    const { data, error } = await supabase
      .from('auditoria_logs')
      .select('*')
      .eq('registro_id', registroId)
      .order('fecha_hora', { ascending: false });

    if (error) {
      logger.error('Error obteniendo logs de auditoría', error);
      return [];
    }
    return data;
  }
};
