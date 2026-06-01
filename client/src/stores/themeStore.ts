import { create } from 'zustand';

export type Theme = 'dark' | 'light';

interface ThemeState {
  theme: Theme;
  toggleTheme: () => void;
}

const getInitialTheme = (): Theme => {
  if (typeof window === 'undefined') return 'dark';
  const stored = localStorage.getItem('vt_theme') as Theme | null;
  return stored === 'light' ? 'light' : 'dark';
};

const applyTheme = (theme: Theme) => {
  document.documentElement.setAttribute('data-theme', theme);
};

// Apply on load immediately
const initialTheme = getInitialTheme();
if (typeof document !== 'undefined') {
  applyTheme(initialTheme);
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: initialTheme,

  toggleTheme: () => {
    const next = get().theme === 'dark' ? 'light' : 'dark';
    localStorage.setItem('vt_theme', next);
    applyTheme(next);
    set({ theme: next });
  },
}));
