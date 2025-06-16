import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { Appearance } from 'react-native';
import { StorageService, AppSettings } from '@/services/StorageService';

type Theme = AppSettings['theme']; // 'light' | 'dark' | 'auto'
type ThemeContextType = {
  theme: Theme;
  isDarkMode: boolean;
  setAppTheme: (theme: Theme) => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [theme, setTheme] = useState<Theme>('auto'); // Default to 'auto'

  useEffect(() => {
    const loadThemePreference = async () => {
      const settings = await StorageService.getSettings();
      setTheme(settings.theme);
    };
    loadThemePreference();
  }, []);

  const systemColorScheme = Appearance.getColorScheme(); // 'light' or 'dark' or null
  const isDarkMode = theme === 'auto' ? systemColorScheme === 'dark' : theme === 'dark';

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
