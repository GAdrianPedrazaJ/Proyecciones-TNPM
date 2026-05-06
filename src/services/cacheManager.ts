import { openDB, IDBPDatabase } from 'idb';
import { Proyeccion } from '../types/database';

const DB_NAME = 'proyecciones_tnpm_db';
const STORE_NAME = 'proyecciones_pendientes';

export const initDB = async (): Promise<IDBPDatabase> => {
  return openDB(DB_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    },
  });
};

export const saveLocalProyeccion = async (proyeccion: Proyeccion) => {
  const db = await initDB();
  await db.put(STORE_NAME, proyeccion);
};

export const getLocalProyecciones = async (): Promise<Proyeccion[]> => {
  const db = await initDB();
  return db.getAll(STORE_NAME);
};

export const deleteLocalProyeccion = async (id: string) => {
  const db = await initDB();
  await db.delete(STORE_NAME, id);
};

export const clearLocalProyecciones = async () => {
  const db = await initDB();
  await db.clear(STORE_NAME);
};
