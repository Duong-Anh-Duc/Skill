import { create } from 'zustand';

interface AppState {
  userId: string;
  darkMode: boolean;
  setUserId: (id: string) => void;
  toggleDarkMode: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  userId: localStorage.getItem('oauth_userId') || 'user_123',
  darkMode: localStorage.getItem('oauth_darkMode') === 'true',
  setUserId: (id) => {
    localStorage.setItem('oauth_userId', id);
    set({ userId: id });
  },
  toggleDarkMode: () =>
    set((state) => {
      const next = !state.darkMode;
      localStorage.setItem('oauth_darkMode', String(next));
      return { darkMode: next };
    }),
}));
