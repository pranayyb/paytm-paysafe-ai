import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import secureStorage from '@utils/secureStorage';

interface AuthState {
  isLoggedIn: boolean;
  phone: string | null;
  token: string | null;
  isLoading: boolean;
  setPhone: (phone: string) => void;
  loginSuccess: (token: string) => void;
  logout: () => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isLoggedIn: false,
      phone: null,
      token: null,
      isLoading: false,
      setPhone: (phone) => set({ phone }),
      loginSuccess: (token) => set({ isLoggedIn: true, token }),
      logout: () => set({ isLoggedIn: false, phone: null, token: null }),
      setLoading: (isLoading) => set({ isLoading }),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => secureStorage),
      partialize: (state) => ({
        isLoggedIn: state.isLoggedIn,
        phone: state.phone,
        token: state.token,
      }),
    },
  ),
);
