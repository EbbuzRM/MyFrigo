import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react-native';
import { StatsCard } from './StatsCard';
import { useTheme } from '@/context/ThemeContext';

interface HistoryStatsProps {
  totalProducts: number;
  expiredProducts: number;
  consumedProducts: number;
}

export function HistoryStats({ totalProducts, expiredProducts, consumedProducts }: HistoryStatsProps) {
  const { isDarkMode } = useTheme();
  const styles = getStyles(isDarkMode);
  const wastePercentage = totalProducts > 0 ? Math.round((expiredProducts / totalProducts) * 100) : 0;

  return (
    <View style={styles.container}>
      <View style={styles.statsContainer}>
        <StatsCard
          title="Totale Gestiti"
          value={totalProducts.toString()}
          icon={<TrendingUp size={24} color="#2563EB" />}
          backgroundColor="#EFF6FF"
        />
        <StatsCard
          title="Consumati"
          value={consumedProducts.toString()}
          icon={<CheckCircle size={24} color="#10B981" />}
          backgroundColor="#F0FDF4"
        />
        <StatsCard
          title="Sprecati"
          value={expiredProducts.toString()}
          icon={<AlertTriangle size={24} color="#EF4444" />}
          backgroundColor="#FEF2F2"
        />
        <StatsCard
          title="% Spreco"
          value={`${wastePercentage}%`}
          icon={<AlertTriangle size={24} color="#F59E0B" />}
          backgroundColor="#FFFBEB"
        />
      </View>
      
      {wastePercentage > 30 && (
        <View style={styles.suggestionCard}>
          <Text style={styles.suggestionTitle}>💡 Suggerimento</Text>
          <Text style={styles.suggestionText}>
            La percentuale di spreco è alta ({wastePercentage}%). 
            Considera di impostare notifiche più anticipate o di pianificare meglio i tuoi acquisti.
          </Text>
        </View>
      )}
    </View>
  );
}

const getStyles = (isDarkMode: boolean) => StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  suggestionCard: {
    backgroundColor: isDarkMode ? '#161b22' : '#FFFBEB', // Darker background for dark mode
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: isDarkMode ? '#30363d' : '#FEF3C7',
  },
  suggestionTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: isDarkMode ? '#c9d1d9' : '#92400E', // White-ish text for dark mode
    marginBottom: 8,
  },
  suggestionText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: isDarkMode ? '#8b949e' : '#A16207', // Lighter gray text for dark mode
    lineHeight: 20,
  },
});
