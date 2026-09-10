import { create } from 'zustand';
import type { User, LoginResponse } from '@/api/types';
import { login } from '@/api/mockApi';

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  loginUser: (role: "RETAILER" | "DISTRIBUTOR" | "MANUFACTURER" | "WASTE_FACILITY" | "REGULATOR" | "ADMIN") => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isLoading: false,
  loginUser: async (role) => {
    set({ isLoading: true });
    try {
      const response: LoginResponse = await login(role);
      set({ user: response.user, token: response.token });
    } finally {
      set({ isLoading: false });
    }
  },
  logout: () => {
    set({ user: null, token: null });
  },
}));
