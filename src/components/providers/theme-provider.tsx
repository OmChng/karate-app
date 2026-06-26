'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

const THEME_STORAGE_KEY = 'sensei-theme';
const FONT_SIZE_STORAGE_KEY = 'sensei-font-size';

type StoredTheme = 'light' | 'dark';
type ThemeChoice = StoredTheme | 'system';
type FontSizeChoice = 'default' | 'large';

interface ThemeContextValue {
  theme: ThemeChoice;
  resolvedTheme: StoredTheme;
  fontSize: FontSizeChoice;
  largeText: boolean;
  toggleTheme: () => void;
  toggleLargeText: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function getSystemTheme(): StoredTheme {
  if (typeof window === 'undefined') return 'dark';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyTheme(theme: StoredTheme) {
  document.documentElement.classList.toggle('dark', theme === 'dark');
  document.documentElement.style.colorScheme = theme;
}

function applyFontSize(fontSize: FontSizeChoice) {
  document.documentElement.classList.toggle('large-text', fontSize === 'large');
}

function readStoredTheme(): StoredTheme | null {
  try {
    const value = window.localStorage.getItem(THEME_STORAGE_KEY);
    return value === 'light' || value === 'dark' ? value : null;
  } catch {
    return null;
  }
}

function readStoredFontSize(): FontSizeChoice {
  try {
    return window.localStorage.getItem(FONT_SIZE_STORAGE_KEY) === 'large' ? 'large' : 'default';
  } catch {
    return 'default';
  }
}

function resolveTheme(theme: ThemeChoice): StoredTheme {
  return theme === 'system' ? getSystemTheme() : theme;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<ThemeChoice>('dark');
  const [resolvedTheme, setResolvedTheme] = useState<StoredTheme>('dark');
  const [fontSize, setFontSize] = useState<FontSizeChoice>('default');

  const syncTheme = useCallback((nextTheme: ThemeChoice) => {
    const resolved = resolveTheme(nextTheme);
    setTheme(nextTheme);
    setResolvedTheme(resolved);
    applyTheme(resolved);
  }, []);

  const syncFontSize = useCallback((nextFontSize: FontSizeChoice) => {
    setFontSize(nextFontSize);
    applyFontSize(nextFontSize);
  }, []);

  useEffect(() => {
    syncTheme(readStoredTheme() ?? 'dark');
    syncFontSize(readStoredFontSize());
  }, [syncFontSize, syncTheme]);

  useEffect(() => {
    if (theme !== 'system') return;

    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => syncTheme('system');
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, [syncTheme, theme]);

  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key === THEME_STORAGE_KEY) {
        syncTheme(readStoredTheme() ?? 'dark');
      }
      if (event.key === FONT_SIZE_STORAGE_KEY) {
        syncFontSize(readStoredFontSize());
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [syncFontSize, syncTheme]);

  const toggleTheme = useCallback(() => {
    const nextTheme: StoredTheme = resolvedTheme === 'dark' ? 'light' : 'dark';
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
    } catch {
      // The visual toggle should still work if storage is unavailable.
    }
    syncTheme(nextTheme);
  }, [resolvedTheme, syncTheme]);

  const toggleLargeText = useCallback(() => {
    const nextFontSize: FontSizeChoice = fontSize === 'large' ? 'default' : 'large';
    try {
      window.localStorage.setItem(FONT_SIZE_STORAGE_KEY, nextFontSize);
    } catch {
      // The visual toggle should still work if storage is unavailable.
    }
    syncFontSize(nextFontSize);
  }, [fontSize, syncFontSize]);

  const value = useMemo(
    () => ({
      theme,
      resolvedTheme,
      fontSize,
      largeText: fontSize === 'large',
      toggleTheme,
      toggleLargeText,
    }),
    [fontSize, resolvedTheme, theme, toggleLargeText, toggleTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const value = useContext(ThemeContext);
  if (!value) {
    throw new Error('useTheme must be used inside ThemeProvider');
  }
  return value;
}
