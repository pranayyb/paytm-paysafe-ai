import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import secureStorage from '@utils/secureStorage';

export type UserMode = 'user' | 'merchant';

interface AuthState {
  isLoggedIn: boolean;
  phone: string | null;
  token: string | null;
  mode: UserMode | null;
  isLoading: boolean;
  setPhone: (phone: string) => void;
  loginSuccess: (token: string, mode: UserMode) => void;
  logout: () => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isLoggedIn: false,
      phone: null,
      token: null,
      mode: null,
      isLoading: false,
      setPhone: (phone) => set({ phone }),
      loginSuccess: (token, mode) => set({ isLoggedIn: true, token, mode }),
      logout: () => set({ isLoggedIn: false, phone: null, token: null, mode: null }),
      setLoading: (isLoading) => set({ isLoading }),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => secureStorage),
      partialize: (state) => ({
        isLoggedIn: state.isLoggedIn,
        phone: state.phone,
        token: state.token,
        mode: state.mode,
      }),
    },
  ),
);
