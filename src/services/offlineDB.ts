import Dexie, { Table } from 'dexie';
import { Bloque, Sede, Producto, Variedad, ProyeccionDiaria } from '../types/database';

// Interfaz para la cola de sincronización extendida
export interface SyncQueueItem {
  id?: number;
  table: string;
  data: any;
  action: 'INSERT' | 'UPDATE' | 'DELETE' | 'UPSERT';
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
  colores!: Table<any>;
  areas!: Table<any>;

  // Cola de Sincronización
  sync_queue!: Table<SyncQueueItem>;

  // Almacenamiento local de proyecciones (Cache de trabajo)
  proyecciones_diarias!: Table<ProyeccionDiaria>;

  constructor() {
    super('TNPM_OfflineDB');
    this.version(1).stores({
      sedes: 'id_sede, nombre',
      bloques: 'id_bloque, id_sede, nombre',
      productos: 'id_producto, nombre',
      variedades: 'id_variedad, id_color, nombre',
      colores: 'id_color, id_producto',
      areas: 'id_area, id_sede',
      sync_queue: '++id, table, action, timestamp',
      proyecciones_diarias: 'id_proyeccion, id_supervisor, fecha_proyeccion, [id_bloque+id_variedad+fecha_proyeccion]'
    });
  }
}

export const db = new OfflineDB();
