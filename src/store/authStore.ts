import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Rol, Usuario } from '../types/database';

interface AuthState {
  user: Usuario | null;
  setUser: (user: Usuario | null) => void;
  signOut: () => void;
  isAdmin: () => boolean;
  isSuperAdmin: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      setUser: (user) => set({ user }),
      signOut: () => set({ user: null }),
      isAdmin: () => {
        const rol = get().user?.rol;
        return rol === 'administrador' || rol === 'superadministrador';
      },
      isSuperAdmin: () => get().user?.rol === 'superadministrador',
    }),
    {
      name: 'auth-storage',
    }
  )
);
