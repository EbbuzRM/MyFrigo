import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { Appearance } from 'react-native';
import { StorageService } from '@/services/StorageService';

type Theme = 'light' | 'dark';
type ThemeContextType = {
  theme: Theme;
  isDarkMode: boolean;
  setAppTheme: (theme: Theme) => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [theme, setTheme] = useState<Theme>('light');

  useEffect(() => {
    const loadThemePreference = async () => {
      const settings = await StorageService.getSettings();
      const savedTheme = settings.theme;
      if (savedTheme && (savedTheme === 'light' || savedTheme === 'dark')) {
        setTheme(savedTheme);
      } else {
        // Fallback to system's color scheme if no valid theme is saved
        const systemTheme = Appearance.getColorScheme() || 'light';
        setTheme(systemTheme);
      }
    };
    loadThemePreference();
  }, []);

  const isDarkMode = theme === 'dark';

  const setAppTheme = async (newTheme: Theme) => {
    setTheme(newTheme);
    await StorageService.updateSettings({ theme: newTheme });
  };

  return (
    <ThemeContext.Provider value={{ theme, isDarkMode, setAppTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
