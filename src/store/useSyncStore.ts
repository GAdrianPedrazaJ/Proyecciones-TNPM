import { create } from 'zustand';

interface SyncState {
  isSyncing: boolean;
  isOnline: boolean;
  pendingChanges: number;
  lastSyncError: string | null;
  setSyncing: (status: boolean) => void;
  setOnline: (status: boolean) => void;
  setPendingChanges: (count: number) => void;
  setError: (error: string | null) => void;
}

export const useSyncStore = create<SyncState>((set) => ({
  isSyncing: false,
  isOnline: navigator.onLine,
  pendingChanges: 0,
  lastSyncError: null,
  setSyncing: (status) => set({ isSyncing: status }),
  setOnline: (status) => set({ isOnline: status }),
  setPendingChanges: (count) => set({ pendingChanges: count }),
  setError: (error) => set({ lastSyncError: error }),
}));

// Listener para cambios de red
window.addEventListener('online', () => useSyncStore.getState().setOnline(true));
window.addEventListener('offline', () => useSyncStore.getState().setOnline(false));
