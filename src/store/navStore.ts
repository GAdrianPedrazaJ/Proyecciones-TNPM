import { create } from 'zustand';

export type View =
  | 'supervisor-bloques'
  | 'supervisor-diaria'
  | 'supervisor-semanal'
  | 'supervisor-historial'
  | 'supervisor-detalle'
  | 'admin-dashboard'
  | 'acumulados'
  | 'admin-tablas'
  | 'importar-excel'
  | 'gestion-sedes'
  | 'gestion-areas'
  | 'gestion-bloques'
  | 'gestion-productos'
  | 'gestion-colores'
  | 'gestion-variedades'
  | 'gestion-areas-bloques'
  | 'super-usuarios'
  | 'super-roles';

interface NavState {
  currentView: View;
  setCurrentView: (view: View) => void;
}

export const useNavStore = create<NavState>((set) => ({
  currentView: 'supervisor-bloques',
  setCurrentView: (view) => set({ currentView: view }),
}));
