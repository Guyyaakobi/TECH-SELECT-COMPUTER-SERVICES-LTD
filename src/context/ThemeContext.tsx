import React, { createContext, useContext, useState, useEffect } from 'react';

export type Theme = 'dark' | 'light';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'dark',
  setTheme: () => {},
  toggleTheme: () => {},
  isDark: true,
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window !== 'undefined') {
      const isManual = localStorage.getItem('tech_select_theme_manual');
      const savedTheme = localStorage.getItem('tech_select_theme') as Theme | null;
      if (isManual && (savedTheme === 'light' || savedTheme === 'dark')) {
        return savedTheme;
      }
    }
    return 'dark';
  });

  const applyTheme = (t: Theme) => {
    const root = document.documentElement;
    if (t === 'light') {
      root.classList.remove('dark');
      root.classList.add('light');
      root.setAttribute('data-theme', 'light');
      root.style.colorScheme = 'light';
    } else {
      root.classList.remove('light');
      root.classList.add('dark');
      root.setAttribute('data-theme', 'dark');
      root.style.colorScheme = 'dark';
    }
  };

  useEffect(() => {
    applyTheme(theme);
    localStorage.setItem('tech_select_theme', theme);
  }, [theme]);

  const setTheme = (newTheme: Theme) => {
    localStorage.setItem('tech_select_theme_manual', 'true');
    setThemeState(newTheme);
  };

  const toggleTheme = () => {
    localStorage.setItem('tech_select_theme_manual', 'true');
    setThemeState((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme, isDark: theme === 'dark' }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
