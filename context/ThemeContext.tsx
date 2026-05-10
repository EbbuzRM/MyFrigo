// ThemeContext.tsx — ThemeContext module.
//
// exports: ThemeProvider | useTheme
// used_by: app\(tabs)\add.tsx
//         app\(tabs)\history.tsx
//         app\(tabs)\index.tsx
//         app\(tabs)\products.tsx
//         app\(tabs)\settings.tsx
//         app\_layout.tsx
//         app\consumed-list.tsx
//         app\feedback.tsx
//         app\history-detail.tsx
//         app\login.tsx
//         app\manage-categories.tsx
//         app\manual-entry.tsx
//         app\photo-capture.tsx
//         components\AddMethodCard.tsx
//         components\AnimatedTabBar.tsx
//         components\AnimatedTabItem.tsx
//         components\BrandInput.tsx
//         components\CategoryFilter.tsx
//         components\CategorySelector.tsx
//         components\ConsumeQuantityModal.tsx
//         components\CustomDatePicker.tsx
//         components\DiagnosticPanel.tsx
//         components\EmailVerificationBanner.tsx
//         components\ExpirationCard.tsx
//         components\GoogleLoginButton.tsx
//         components\HistoryCard.tsx
//         components\HistoryCardDetails.tsx
//         components\HistoryCardHeader.tsx
//         components\HistoryStats.tsx
//         components\LoginForm.tsx
//         components\PasswordValidationDisplay.tsx
//         components\ProductCard.tsx
//         components\ProductDetailActions.tsx
//         components\ProductDetailHeader.tsx
//         components\ProductDetailInfo.tsx
//         components\ProductDetailSkeleton.tsx
//         components\ProductFormFooter.tsx
//         components\ProductFormHeader.tsx
//         components\ProductNameInput.tsx
//         components\QuantityButton.tsx
//         components\QuantityInputRow.tsx
//         components\QuantityUnitSelector.tsx
//         components\SettingsCard.tsx
//         components\StatsCard.tsx
//         components\SuggestionCard.tsx
//         components\Toast.tsx
//         components\UpdateModal.tsx
//         components\__tests__\QuantityButton.test.tsx
//         components\dashboard\DashboardHeader.tsx
//         components\dashboard\ProfileMenu.tsx
//         components\dashboard\QuickActions.tsx
//         components\dashboard\__tests__\DashboardHeader.test.tsx
//         components\dashboard\__tests__\ProfileMenu.test.tsx
//         components\dashboard\__tests__\QuickActions.test.tsx
//         components\diagnostic\AuthTestSection.tsx
//         components\diagnostic\DatabaseTestSection.tsx
//         components\diagnostic\DiagnosticControls.tsx
//         components\diagnostic\DiagnosticWrapper.tsx
//         components\diagnostic\PerformanceTestSection.tsx
//         components\diagnostic\__tests__\DiagnosticControls.test.tsx
//         components\diagnostic\__tests__\DiagnosticWrapper.test.tsx
//         components\products\EmptyProductState.tsx
//         components\products\ProductList.tsx
//         components\products\ProductsHeader.tsx
//         components\products\SearchBar.tsx
//         components\products\StatusFilterBar.tsx
//         components\settings\DiagnosticSettingsSection.tsx
//         components\settings\NotificationDaysModal.tsx
//         components\settings\SettingsSection.tsx
//         components\settings\UpdateSettingsSection.tsx
//         components\settings\VersionPressHandler.tsx
//         hooks\useExpirationStatus.ts
//         hooks\useSettingsSections.ts
// rules:   - Module must maintain a single shared ThemeContext instance; do not create duplicate providers or nested ThemeProviders.
//          - All theme-dependent components listed in `used_by` must consume theme via `useTheme` hook only, never by directly accessing context or importing theme values.
// agent:   deepseek/deepseek-chat | deepseek | 2026-05-09 | codedna-cli | initial CodeDNA annotation pass
// message: 

import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { Appearance } from 'react-native';
import { SettingsService } from '@/services/SettingsService';
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
  success: string;        // Colore per azioni di successo
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
        const settings = await SettingsService.getSettings();
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
        LoggingService.error('ThemeContext', `Error loading theme preferences: ${error}`);
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
    success: themeColors.SUCCESS,
    cardBackground: themeColors.CARD_BACKGROUND,
    background: themeColors.BACKGROUND,
  };

  const setAppTheme = async (newTheme: Theme) => {
    setTheme(newTheme);
    try {
      await SettingsService.updateSettings({ theme: newTheme });
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
