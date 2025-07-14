import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ThemeState {
  isDark: boolean;
}

interface ThemeActions {
  toggleTheme: () => void;
  setTheme: (isDark: boolean) => void;
}

type ThemeStore = ThemeState & ThemeActions;

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set, get) => ({
      // Initial state - check system preference
      isDark: typeof window !== 'undefined' 
        ? window.matchMedia('(prefers-color-scheme: dark)').matches 
        : false,

      // Actions
      toggleTheme: () => {
        const { isDark } = get();
        const newTheme = !isDark;
        
        set({ isDark: newTheme });
        updateDOMTheme(newTheme);
        
        // Haptic feedback
        if ('vibrate' in navigator) {
          navigator.vibrate(50);
        }
      },

      setTheme: (isDark: boolean) => {
        set({ isDark });
        updateDOMTheme(isDark);
      },
    }),
    {
      name: 'theme-storage', // unique name for localStorage key
      onRehydrateStorage: () => (state) => {
        // Apply theme to DOM when store is rehydrated
        if (state) {
          updateDOMTheme(state.isDark);
        }
      },
    }
  )
);

// Helper function to update DOM theme attribute
const updateDOMTheme = (isDark: boolean) => {
  if (typeof window === 'undefined') return;
  
  const theme = isDark ? 'dark' : 'light';
  document.documentElement.setAttribute('data-theme', theme);
  
  // Keep class for backward compatibility with existing components
  if (isDark) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
};

// Initialize theme on app start
export const initializeTheme = () => {
  const { isDark } = useThemeStore.getState();
  updateDOMTheme(isDark);
}; 