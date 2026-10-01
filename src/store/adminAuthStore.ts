import { create } from 'zustand';
import type { AdminProfile } from '@/types';

interface AuthState {
  admin: AdminProfile | null;
  hydrated: boolean;
  setAdmin: (a: AdminProfile | null) => void;
  setHydrated: (v: boolean) => void;
  clear: () => void;
}

export const useAdminAuthStore = create<AuthState>((set) => ({
  admin: null,
  hydrated: false,
  setAdmin: (admin) => set({ admin }),
  setHydrated: (hydrated) => set({ hydrated }),
  clear: () => set({ admin: null }),
}));
