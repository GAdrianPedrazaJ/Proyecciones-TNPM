import { create } from 'zustand';

export type View =
  | 'supervisor-diaria'
  | 'supervisor-semanal'
  | 'supervisor-historial'
  | 'admin-dashboard'
  | 'admin-tablas'
  | 'gestion-sedes'
  | 'gestion-bloques'
  | 'gestion-productos'
  | 'gestion-colores'
  | 'gestion-variedades'
  | 'gestion-areas'
  | 'super-usuarios'
  | 'super-roles';

interface NavState {
  currentView: View;
  setCurrentView: (view: View) => void;
}

export const useNavStore = create<NavState>((set) => ({
  currentView: 'supervisor-diaria',
  setCurrentView: (view) => set({ currentView: view }),
}));
