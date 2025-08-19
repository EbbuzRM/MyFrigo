import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { Appearance } from 'react-native';
import { StorageService } from '@/services/StorageService';
import { LoggingService } from '@/services/LoggingService';
import { COLORS, getThemeColors } from '@/constants/colors';

// Definizione del tipo di tema
type Theme = 'light' | 'dark';

/**
 * Interfaccia che definisce i colori del tema
 * Utilizzata per garantire consistenza visiva in tutta l'app
 */
interface ThemeColors {
  textPrimary: string;    // Colore principale del testo
  textSecondary: string;  // Colore secondario del testo (per informazioni meno importanti)
  primary: string;        // Colore primario dell'app (per pulsanti, link, ecc.)
  error: string;          // Colore per messaggi di errore
  cardBackground: string; // Sfondo delle card
  background: string;     // Sfondo generale dell'app
}

type ThemeContextType = {
  theme: Theme;
  isDarkMode: boolean;
  setAppTheme: (theme: Theme) => void;
  colors: ThemeColors;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [theme, setTheme] = useState<Theme>('light');
  const [isLoading, setIsLoading] = useState(true);

  // Funzione per ottenere il tema di sistema come fallback
  const getSystemTheme = (): Theme => {
    const systemTheme = Appearance.getColorScheme() || 'light';
    return systemTheme as Theme;
  };

  useEffect(() => {
    const loadThemePreference = async () => {
      setIsLoading(true);
      try {
        LoggingService.info('ThemeContext', 'Loading theme preferences');
        const settings = await StorageService.getSettings();
        const savedTheme = settings.theme;
        
        if (savedTheme && (savedTheme === 'light' || savedTheme === 'dark')) {
          LoggingService.info('ThemeContext', `Using saved theme: ${savedTheme}`);
          setTheme(savedTheme);
        } else {
          // Fallback to system's color scheme if no valid theme is saved
          const systemTheme = getSystemTheme();
          LoggingService.info('ThemeContext', `No valid theme saved, using system theme: ${systemTheme}`);
          setTheme(systemTheme);
        }
      } catch (error) {
        // Error handling with fallback to system theme
        LoggingService.error('ThemeContext', 'Error loading theme preferences', error);
        const fallbackTheme = getSystemTheme();
        LoggingService.info('ThemeContext', `Using fallback system theme: ${fallbackTheme}`);
        setTheme(fallbackTheme);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadThemePreference();
    
    // Listen for system theme changes as additional fallback
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      // Only update if we're using system theme
      if (theme === getSystemTheme()) {
        const newSystemTheme = colorScheme || 'light';
        LoggingService.info('ThemeContext', `System theme changed to: ${newSystemTheme}`);
        setTheme(newSystemTheme as Theme);
      }
    });
    
    return () => {
      subscription.remove();
    };
  }, []);

  const isDarkMode = theme === 'dark';

  // Ottiene i colori dal sistema centralizzato in base al tema corrente
  const themeColors = getThemeColors(isDarkMode);
  
  // Definizione dei colori per il contesto
  const colors: ThemeColors = {
    textPrimary: themeColors.textPrimary,
    textSecondary: themeColors.textSecondary,
    primary: themeColors.PRIMARY,
    error: themeColors.ERROR,
    cardBackground: themeColors.CARD_BACKGROUND,
    background: themeColors.BACKGROUND,
  };

  const setAppTheme = async (newTheme: Theme) => {
    setTheme(newTheme);
    try {
      await StorageService.updateSettings({ theme: newTheme });
      LoggingService.info('ThemeContext', `Theme updated to: ${newTheme}`);
    } catch (error) {
      LoggingService.error('ThemeContext', `Failed to save theme preference: ${newTheme}`, error);
      // We still keep the theme in state even if saving fails
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, isDarkMode, setAppTheme, colors }}>
      {children}
    </ThemeContext.Provider>
  );
};

/**
 * Hook personalizzato per accedere al tema dell'applicazione
 * Fornisce accesso al tema corrente, allo stato dark/light e ai colori
 * @returns {ThemeContextType} Il contesto del tema
 * @throws {Error} Se utilizzato al di fuori di un ThemeProvider
 */
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme deve essere utilizzato all\'interno di un ThemeProvider. Verifica che il componente sia figlio di ThemeProvider.');
  }
  return context;
};
