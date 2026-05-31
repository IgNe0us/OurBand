import { create } from 'zustand';

interface ChatState {
  totalUnreadCount: number;
  lastMessageTick: number;
  latestMessage: any | null;
  setTotalUnreadCount: (count: number) => void;
  incrementUnreadCount: () => void;
  decrementUnreadCount: (amount: number) => void;
  tickLastMessage: (msg?: any) => void;
}

export const useChatStore = create<ChatState>((set) => ({
  totalUnreadCount: 0,
  lastMessageTick: 0,
  latestMessage: null,
  setTotalUnreadCount: (count) => set({ totalUnreadCount: Math.max(0, count) }),
  incrementUnreadCount: () => set((state) => ({ totalUnreadCount: state.totalUnreadCount + 1 })),
  decrementUnreadCount: (amount) => set((state) => ({ totalUnreadCount: Math.max(0, state.totalUnreadCount - amount) })),
  tickLastMessage: (msg) => set((state) => ({ 
    lastMessageTick: state.lastMessageTick + 1,
    latestMessage: msg || state.latestMessage 
  })),
}));
