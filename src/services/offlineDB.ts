import Dexie, { Table } from 'dexie';
import { Bloque, Sede, Producto, Variedad, ProyeccionDiaria } from '../types/database';

// Interfaz para la cola de sincronización
export interface SyncQueueItem {
  id?: number;
  table: string;
  data: any;
  action: 'INSERT' | 'UPDATE' | 'DELETE';
  timestamp: number;
  attempts: number;
  lastError?: string;
}

export class OfflineDB extends Dexie {
  // Tablas Maestras (Cache)
  sedes!: Table<Sede>;
  bloques!: Table<Bloque>;
  productos!: Table<Producto>;
  variedades!: Table<Variedad>;

  // Cola de Sincronización
  sync_queue!: Table<SyncQueueItem>;

  // Almacenamiento local de proyecciones (para visualización rápida offline)
  proyecciones_diarias!: Table<ProyeccionDiaria>;

  constructor() {
    super('TNPM_OfflineDB');
    this.version(1).stores({
      sedes: 'id_sede, nombre',
      bloques: 'id_bloque, id_sede, nombre',
      productos: 'id_producto, nombre',
      variedades: 'id_variedad, id_color, nombre',
      sync_queue: '++id, table, action, timestamp',
      proyecciones_diarias: 'id_proyeccion, id_supervisor, fecha_proyeccion, [id_bloque+id_variedad+fecha_proyeccion]'
    });
  }
}

export const db = new OfflineDB();
