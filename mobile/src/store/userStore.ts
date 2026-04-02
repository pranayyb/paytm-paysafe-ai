import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import secureStorage from '@utils/secureStorage';

interface UserState {
  name: string;
  email: string | null;
  avatarUri: string | null;
  kycStatus: 'none' | 'pending' | 'verified';
  updateProfile: (partial: Partial<Omit<UserState, 'updateProfile'>>) => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      name: 'Arjun Mehta',
      email: null,
      avatarUri: null,
      kycStatus: 'verified',
      updateProfile: (partial) => set(partial),
    }),
    {
      name: 'user-storage',
      storage: createJSONStorage(() => secureStorage),
      partialize: (state) => ({
        name: state.name,
        email: state.email,
        avatarUri: state.avatarUri,
        kycStatus: state.kycStatus,
      }),
    },
  ),
);
