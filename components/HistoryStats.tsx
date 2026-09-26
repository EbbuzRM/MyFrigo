// HistoryStats.tsx — HistoryStats module.
//
// exports: HistoryStats
// used_by: app\(tabs)\history.tsx
// rules:   - Route navigation must use `expo-router` with filter type params ('consumed', 'expired', 'all'), never pass product data arrays as navigation parameters
//          - StatsCard components must follow the established props interface pattern (title, value, icon, themed backgrounds, onPress handlers)
//          - All color values must use hex codes and respect the theme system through the `useTheme()` context
// agent:   deepseek/deepseek-chat | deepseek | 2026-05-09 | codedna-cli | initial CodeDNA annotation pass
// message: 

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { StatsCard } from './StatsCard';
import { router } from 'expo-router';
import { Product } from '@/types/Product';

interface HistoryStatsProps {
  totalProducts: number;
  expiredProducts: number;
  consumedProducts: number;
  allProducts: Product[];
}

export function HistoryStats({ totalProducts, expiredProducts, consumedProducts, allProducts: _allProducts }: HistoryStatsProps) {
  const { t } = useTranslation();
  const wastePercentage = totalProducts > 0 ? Math.round((expiredProducts / totalProducts) * 100) : 0;

  const handlePress = (type: 'consumed' | 'expired' | 'all', title: string) => {
    // Invece di passare l'intera lista di prodotti, passiamo solo il tipo di filtro
    router.push({
      pathname: '/history-detail',
      params: {
        filterType: type,
        title
      }
    });
  };

  const styles = StyleSheet.create({
    container: {
      paddingHorizontal: 20,
      marginBottom: 16,
    },
    statsContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.statsContainer}>
        <StatsCard
          title={t('history.statsTotal')}
          value={totalProducts.toString()}
          icon={<TrendingUp size={24} color="#2563EB" />}
          lightBackgroundColor="#EFF6FF"
          darkBackgroundColor="#1e293b"
          onPress={() => handlePress('all', t('history.historyAllTitle'))}
        />
        <StatsCard
          title={t('history.statsConsumed')}
          value={consumedProducts.toString()}
          icon={<CheckCircle size={24} color="#10B981" />}
          lightBackgroundColor="#F0FDF4"
          darkBackgroundColor="#162d21"
          onPress={() => handlePress('consumed', t('history.consumedTitle'))}
        />
        <StatsCard
          title={t('history.statsWasted')}
          value={expiredProducts.toString()}
          icon={<AlertTriangle size={24} color="#EF4444" />}
          lightBackgroundColor="#FEF2F2"
          darkBackgroundColor="#2a1212"
          onPress={() => handlePress('expired', t('history.expiredTitle'))}
        />
        <StatsCard
          title={t('history.statsWasteRate')}
          value={`${wastePercentage}%`}
          icon={<AlertTriangle size={24} color="#F59E0B" />}
          lightBackgroundColor="#FFFBEB"
          darkBackgroundColor="#302a0f"
        />
      </View>
    </View>
  );
}
