import { supabase } from './supabase';
import { db, SyncQueueItem } from './offlineDB';
import { useSyncStore } from '../store/useSyncStore';
import { logger } from '../utils/logger';

const MAX_RETRIES = 7;
const BATCH_SIZE = 5;
const INITIAL_DELAY = 1000;

const getJitterDelay = (retryCount: number) => {
  const baseDelay = Math.pow(2, retryCount) * INITIAL_DELAY;
  const jitter = Math.random() * 1000;
  return baseDelay + jitter;
};

export const syncEngine = {
  async isDatabaseReady(): Promise<boolean> {
    try {
      const start = Date.now();
      const { error } = await supabase.from('sedes').select('id_sede', { head: true, count: 'exact' }).limit(1);
      const duration = Date.now() - start;

      if (duration > 3000) {
        logger.warn(`Base de datos saturada (Latencia: ${duration}ms). Esperando liberación...`);
        return false;
      }

      return !error;
    } catch (err) {
      return false;
    }
  },

  async processQueue() {
    const store = useSyncStore.getState();
    if (store.isSyncing || !store.isOnline) return;

    const pendingCount = await db.sync_queue.count();
    if (pendingCount === 0) {
      store.setPendingChanges(0);
      return;
    }

    store.setSyncing(true);
    logger.info(`Iniciando sincronización robusta: ${pendingCount} registros pendientes.`);

    try {
      while (true) {
        if (!navigator.onLine) break;

        const ready = await this.isDatabaseReady();
        if (!ready) {
          logger.warn("DB bajo carga pesada. Pausando motor 5s...");
          await new Promise(r => setTimeout(r, 5000));
          continue;
        }

        const items = await db.sync_queue.orderBy('timestamp').limit(BATCH_SIZE).toArray();
        if (items.length === 0) break;

        for (const item of items) {
          await this.processItemWithStrategy(item);
        }

        store.setPendingChanges(await db.sync_queue.count());
      }

      store.setError(null);
    } catch (error: any) {
      logger.error('Fallo en el motor de sincronización', error);
      store.setError(error.message);
    } finally {
      store.setSyncing(false);
    }
  },

  async processItemWithStrategy(item: SyncQueueItem, retryCount = 0): Promise<void> {
    try {
      const idField = this.getIdField(item.table);
      const recordId = item.data[idField];

      let result;
      if (item.action === 'INSERT') {
        result = await supabase.from(item.table).insert(item.data);
      } else if (item.action === 'UPDATE') {
        result = await supabase.from(item.table).update(item.data).eq(idField, recordId);
      } else if (item.action === 'UPSERT') {
        const onConflict = this.getOnConflictFields(item.table);
        result = await supabase.from(item.table).upsert(item.data, { onConflict });
      } else if (item.action === 'DELETE') {
        result = await supabase.from(item.table).delete().eq(idField, recordId);
      }

      if (result?.error) {
        const errorCode = result.error.code;

        // MANEJO DE CONFLICTOS DE UUID (Unique Violation)
        if (errorCode === '23505') {
          logger.warn(`Conflicto de UUID en ${item.table}: ${recordId}. Verificando existencia...`);
          const { data: existing } = await supabase.from(item.table).select(idField).eq(idField, recordId).maybeSingle();
          if (existing) {
            await db.sync_queue.delete(item.id!);
            return;
          }
        }

        // DETECCIÓN DE SATURACIÓN (429 o 503 mapeados a veces en el código de error por el proxy de Supabase)
        if (errorCode === '429' || errorCode === '503' || (result.error as any).status === 503) {
            throw new Error("SERVER_SATURATED");
        }

        throw result.error;
      }

      await db.sync_queue.delete(item.id!);
      logger.sync(`Sincronizado: ${item.table} [${recordId}]`);

    } catch (error: any) {
      if (retryCount < MAX_RETRIES) {
        const delay = getJitterDelay(retryCount);
        logger.warn(`Error procesando item. Reintentando en ${Math.round(delay)}ms... (Intento ${retryCount + 1})`);
        await new Promise(r => setTimeout(r, delay));
        return this.processItemWithStrategy(item, retryCount + 1);
      } else {
        logger.error(`Fallo definitivo tras ${MAX_RETRIES} intentos para item ${item.id}.`, error);
        await db.sync_queue.update(item.id!, {
          attempts: (item.attempts || 0) + 1,
          lastError: error.message
        });
      }
    }
  },

  getIdField(table: string): string {
    const mapping: Record<string, string> = {
      'proyecciones_diarias': 'id_proyeccion',
      'proyecciones_semanales': 'id_proyeccion',
      'usuarios': 'id_usuario',
      'sedes': 'id_sede',
      'bloques': 'id_bloque',
      'variedades': 'id_variedad',
      'productos': 'id_producto',
      'areas': 'id_area',
      'colores': 'id_color',
      'registros': 'id'
    };
    return mapping[table] || 'id';
  },

  getOnConflictFields(table: string): string {
    if (table === 'proyecciones_diarias') return 'id_supervisor,id_bloque,id_variedad,fecha_proyeccion';
    if (table === 'proyecciones_semanales') return 'id_supervisor,id_bloque,id_variedad,semana_num,ano';
    return this.getIdField(table);
  },

  async downloadMasterData() {
    try {
      const tables = ['sedes', 'bloques', 'productos', 'variedades', 'colores', 'areas'];
      for (const table of tables) {
        const { data, error } = await supabase.from(table).select('*').eq('activo', true);
        if (!error && data) {
          // @ts-ignore
          if (db[table]) await db[table].bulkPut(data);
        }
      }
      logger.info("Cache de datos maestros actualizada.");
    } catch (error) {
      logger.error('Error descargando datos maestros', error);
    }
  }
};
