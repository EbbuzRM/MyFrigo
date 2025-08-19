import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { Lightbulb, TrendingDown, Zap } from 'lucide-react-native';
import { LoggingService } from '@/services/LoggingService';

LoggingService.info('SuggestionCard', '[DEBUG] Rendering components/SuggestionCard.tsx');

interface SuggestionCardProps {
  title: string;
  text: string;
  type: 'info' | 'warning' | 'positive';
}

/**
 * @component SuggestionCard
 * @description Visualizza un suggerimento personalizzato per l'utente nella schermata dello storico.
 * Lo stile e l'icona cambiano in base al tipo di suggerimento (informativo, di avvertimento o positivo).
 * @param {string} title - Il titolo del suggerimento.
 * @param {string} text - Il testo del suggerimento.
 * @param {'info' | 'warning' | 'positive'} type - Il tipo di suggerimento, che ne determina lo stile.
 */
export function SuggestionCard({ title, text, type }: SuggestionCardProps) {
  const { isDarkMode } = useTheme();

  const getThemeStyles = () => {
    const base = {
      info: {
        icon: <Lightbulb size={24} color={isDarkMode ? '#60a5fa' : '#2563eb'} />,
        background: isDarkMode ? '#1e293b' : '#eff6ff',
        borderColor: isDarkMode ? '#2563eb' : '#dbeafe',
        titleColor: isDarkMode ? '#93c5fd' : '#1d4ed8',
        textColor: isDarkMode ? '#d1d5db' : '#374151',
      },
      warning: {
        icon: <TrendingDown size={24} color={isDarkMode ? '#f87171' : '#dc2626'} />,
        background: isDarkMode ? '#2a1212' : '#fee2e2',
        borderColor: isDarkMode ? '#5b2121' : '#fecaca',
        titleColor: isDarkMode ? '#fca5a5' : '#b91c1c',
        textColor: isDarkMode ? '#d1d5db' : '#4b5563',
      },
      positive: {
        icon: <Zap size={24} color={isDarkMode ? '#4ade80' : '#16a34a'} />,
        background: isDarkMode ? '#142e1f' : '#f0fdf4',
        borderColor: isDarkMode ? '#1c4b2a' : '#bbf7d0',
        titleColor: isDarkMode ? '#86efac' : '#15803d',
        textColor: isDarkMode ? '#d1d5db' : '#374151',
      },
    };
    return base[type];
  };

  const themeStyles = getThemeStyles();
  const styles = getStyles(isDarkMode, themeStyles);

  return (
    <View style={styles.card}>
      <View style={styles.iconContainer}>{themeStyles.icon}</View>
      <View style={styles.textContainer}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.text}>{text}</Text>
      </View>
    </View>
  );
}

const getStyles = (isDarkMode: boolean, themeStyles: { background: string; borderColor: string; titleColor: string; textColor: string }) => StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: themeStyles.background,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: themeStyles.borderColor,
    marginTop: 16,
    alignItems: 'center',
  },
  iconContainer: {
    marginRight: 16,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: themeStyles.titleColor,
    marginBottom: 4,
  },
  text: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: themeStyles.textColor,
    lineHeight: 20,
  },
});
