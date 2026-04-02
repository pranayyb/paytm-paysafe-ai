import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import secureStorage from '@utils/secureStorage';

export interface Transaction {
  id: string;
  type: 'sent' | 'received' | 'recharge' | 'bill';
  amount: number;
  counterparty: string;
  status: 'success' | 'failed' | 'pending';
  timestamp: number;
  reference: string;
}

interface WalletState {
  balance: number;
  transactions: Transaction[];
  isRefreshing: boolean;
  addMoney: (amount: number) => void;
  deductMoney: (amount: number) => void;
  addTransaction: (txn: Transaction) => void;
  setRefreshing: (v: boolean) => void;
}

export const useWalletStore = create<WalletState>()(
  persist(
    (set) => ({
      balance: 2450.0,
      transactions: [
        {
          id: '1',
          type: 'received',
          amount: 500,
          counterparty: 'Rahul Sharma',
          status: 'success',
          timestamp: Date.now() - 3600000,
          reference: 'TXN123456',
        },
        {
          id: '2',
          type: 'sent',
          amount: 250,
          counterparty: 'Zomato',
          status: 'success',
          timestamp: Date.now() - 86400000,
          reference: 'TXN123457',
        },
        {
          id: '3',
          type: 'recharge',
          amount: 199,
          counterparty: 'Jio - 9876543210',
          status: 'success',
          timestamp: Date.now() - 172800000,
          reference: 'TXN123458',
        },
        {
          id: '4',
          type: 'bill',
          amount: 1200,
          counterparty: 'MSEB Electricity',
          status: 'success',
          timestamp: Date.now() - 259200000,
          reference: 'TXN123459',
        },
        {
          id: '5',
          type: 'sent',
          amount: 100,
          counterparty: 'Priya Singh',
          status: 'failed',
          timestamp: Date.now() - 345600000,
          reference: 'TXN123460',
        },
      ],
      isRefreshing: false,
      addMoney: (amount) => set((state) => ({ balance: state.balance + amount })),
      deductMoney: (amount) =>
        set((state) => ({ balance: Math.max(0, state.balance - amount) })),
      addTransaction: (txn) =>
        set((state) => ({ transactions: [txn, ...state.transactions] })),
      setRefreshing: (isRefreshing) => set({ isRefreshing }),
    }),
    {
      name: 'wallet-storage',
      storage: createJSONStorage(() => secureStorage),
      partialize: (state) => ({
        balance: state.balance,
        transactions: state.transactions,
      }),
    },
  ),
);
