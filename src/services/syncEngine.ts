import { supabase } from './supabase';
import { db, SyncQueueItem } from './offlineDB';
import { useSyncStore } from '../store/useSyncStore';
import { logger } from '../utils/logger';

const MAX_RETRIES = 5;
const BATCH_SIZE = 10;

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

export const syncEngine = {
  async checkDbAvailability(): Promise<boolean> {
    try {
      const { error } = await supabase.from('usuarios').select('count', { count: 'exact', head: true }).limit(1);
      if (error) {
        if (error.code === '57014' || error.message.includes('timeout')) return false;
      }
      return true;
    } catch (err) {
      logger.error("Error verificando disponibilidad de DB", err);
      return false;
    }
  },

  async processQueue() {
    const store = useSyncStore.getState();
    if (store.isSyncing || !store.isOnline) return;

    const queueItems = await db.sync_queue.toCollection().sortBy('timestamp');
    if (queueItems.length === 0) {
      store.setPendingChanges(0);
      return;
    }

    logger.info(`Iniciando sincronización de ${queueItems.length} registros pendientes.`);
    store.setSyncing(true);
    store.setPendingChanges(queueItems.length);

    try {
      for (let i = 0; i < queueItems.length; i += BATCH_SIZE) {
        const batch = queueItems.slice(i, i + BATCH_SIZE);

        for (const item of batch) {
          await this.processItemWithRetry(item);
        }

        const remaining = await db.sync_queue.count();
        store.setPendingChanges(remaining);
      }
      store.setError(null);
      logger.info("Sincronización completada exitosamente.");
    } catch (error: any) {
      logger.error('Error crítico en motor de sincronización', error);
      store.setError(error.message || 'Error de sincronización');
    } finally {
      store.setSyncing(false);
    }
  },

  async processItemWithRetry(item: SyncQueueItem, retryCount = 0): Promise<void> {
    try {
      const isAvailable = await this.checkDbAvailability();
      if (!isAvailable) {
        logger.warn(`DB ocupada. Reintento ${retryCount + 1}/${MAX_RETRIES} en espera...`);
        await delay(2000 * (retryCount + 1));
        return this.processItemWithRetry(item, retryCount + 1);
      }

      let result;
      if (item.action === 'INSERT') {
        result = await supabase.from(item.table).insert(item.data);
      } else if (item.action === 'UPDATE') {
        const idField = item.table === 'proyecciones_diarias' ? 'id_proyeccion' : 'id';
        result = await supabase.from(item.table).update(item.data).eq(idField, item.data[idField]);
      }

      if (result?.error) {
        if (result.error.code === '23505') {
          logger.warn('Conflicto de ID (Duplicate Key). Generando nuevo UUID y reintentando...');
          const idField = item.table === 'proyecciones_diarias' ? 'id_proyeccion' : 'id';
          const newData = { ...item.data, [idField]: crypto.randomUUID() };
          await db.sync_queue.update(item.id!, { data: newData });
          return this.processItemWithRetry({ ...item, data: newData }, retryCount);
        }
        throw result.error;
      }

      await db.sync_queue.delete(item.id!);
      logger.sync(`Registro sincronizado: ${item.table} (${item.id})`);

    } catch (error: any) {
      if (retryCount < MAX_RETRIES) {
        const waitTime = Math.pow(2, retryCount) * 1000;
        logger.warn(`Error procesando item. Reintentando en ${waitTime}ms...`, { error: error.message });
        await delay(waitTime);
        return this.processItemWithRetry(item, retryCount + 1);
      } else {
        logger.error(`Fallo definitivo tras ${MAX_RETRIES} intentos para item ${item.id}`, error);
        await db.sync_queue.update(item.id!, {
          attempts: item.attempts + 1,
          lastError: error.message
        });
        throw error;
      }
    }
  },

  async downloadMasterData() {
    try {
      logger.info("Descargando datos maestros...");
      const tables = ['sedes', 'bloques', 'productos', 'variedades'];

      for (const table of tables) {
        const { data, error } = await supabase.from(table).select('*').eq('activo', true);
        if (error) throw error;
        if (data) {
          // @ts-ignore - Dexie tables match table names
          await db[table].bulkPut(data);
        }
      }
      logger.info("Datos maestros actualizados localmente.");
    } catch (error) {
      logger.error('Error descargando datos maestros', error);
    }
  }
};
