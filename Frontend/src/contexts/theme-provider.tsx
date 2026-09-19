import { createContext, useContext, useEffect, useState } from 'react';
import { type ThemeId, defaultThemeId, getTheme, themes } from '../config/themes';
import { applyThemedFavicon } from '../helpers/favicon-helper';

const STORAGE_KEY = 'vd-theme';

interface ThemeContextValue {
  themeId: ThemeId;
  setThemeId: (id: ThemeId) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function readStoredThemeId(): ThemeId {
  const stored = localStorage.getItem(STORAGE_KEY);
  return themes.some((t) => t.id === stored) ? (stored as ThemeId) : defaultThemeId;
}

function applyTheme(id: ThemeId) {
  const theme = getTheme(id);
  const root = document.documentElement;
  for (const [key, value] of Object.entries(theme.vars)) {
    root.style.setProperty(key, value);
  }
  applyThemedFavicon(theme.vars['--color-primary-mid'], theme.vars['--color-primary-dark']);
}

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [themeId, setThemeIdState] = useState<ThemeId>(readStoredThemeId);

  useEffect(() => {
    applyTheme(themeId);
  }, [themeId]);

  function setThemeId(id: ThemeId) {
    localStorage.setItem(STORAGE_KEY, id);
    setThemeIdState(id);
  }

  return <ThemeContext.Provider value={{ themeId, setThemeId }}>{children}</ThemeContext.Provider>;
};

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}

export default ThemeProvider;
