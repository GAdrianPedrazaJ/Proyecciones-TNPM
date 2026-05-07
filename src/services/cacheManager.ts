import { openDB, IDBPDatabase } from 'idb';
import { Proyeccion, Registro } from '../types/database';

const DB_NAME = 'proyecciones_tnpm_db';
const STORE_PROYECCIONES = 'proyecciones_pendientes';
const STORE_REGISTROS = 'registros_pendientes';

export const initDB = async (): Promise<IDBPDatabase> => {
  return openDB(DB_NAME, 2, {
    upgrade(db, oldVersion) {
      if (oldVersion < 1) {
        db.createObjectStore(STORE_PROYECCIONES, { keyPath: 'id' });
      }
      if (oldVersion < 2) {
        if (!db.objectStoreNames.contains(STORE_REGISTROS)) {
          db.createObjectStore(STORE_REGISTROS, { keyPath: 'id' });
        }
      }
    },
  });
};

export const saveLocalProyeccion = async (proyeccion: Proyeccion) => {
  const db = await initDB();
  await db.put(STORE_PROYECCIONES, proyeccion);
};

export const getLocalProyecciones = async (): Promise<Proyeccion[]> => {
  const db = await initDB();
  return db.getAll(STORE_PROYECCIONES);
};

export const deleteLocalProyeccion = async (id: string) => {
  const db = await initDB();
  await db.delete(STORE_PROYECCIONES, id);
};

export const saveLocalRegistro = async (registro: Registro) => {
  const db = await initDB();
  await db.put(STORE_REGISTROS, registro);
};

export const getLocalRegistros = async (): Promise<Registro[]> => {
  const db = await initDB();
  return db.getAll(STORE_REGISTROS);
};

export const deleteLocalRegistro = async (id: string) => {
  const db = await initDB();
  await db.delete(STORE_REGISTROS, id);
};
