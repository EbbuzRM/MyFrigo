import React from 'react';
import { View, StyleSheet } from 'react-native';
import { TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react-native';
import { StatsCard } from './StatsCard';
import { useTheme } from '@/context/ThemeContext';
import { router } from 'expo-router';
import { Product } from '@/types/Product';

interface HistoryStatsProps {
  totalProducts: number;
  expiredProducts: number;
  consumedProducts: number;
  allProducts: Product[];
}

export function HistoryStats({ totalProducts, expiredProducts, consumedProducts, allProducts }: HistoryStatsProps) {
  const { } = useTheme();
  const wastePercentage = totalProducts > 0 ? Math.round((expiredProducts / totalProducts) * 100) : 0;

  const handlePress = (type: 'consumed' | 'expired' | 'all', title: string) => {
    let productList: Product[] = [];
    if (type === 'all') {
      productList = allProducts;
    } else if (type === 'consumed') {
      productList = allProducts.filter(p => p.status === 'consumed');
    } else {
      productList = allProducts.filter(p => p.status !== 'consumed');
    }
    
    router.push({ 
      pathname: '/history-detail', 
      params: { 
        products: JSON.stringify(productList), 
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
          title="Totale Gestiti"
          value={totalProducts.toString()}
          icon={<TrendingUp size={24} color="#2563EB" />}
          lightBackgroundColor="#EFF6FF"
          darkBackgroundColor="#1e293b"
          onPress={() => handlePress('all', 'Storico Completo')}
        />
        <StatsCard
          title="Consumati"
          value={consumedProducts.toString()}
          icon={<CheckCircle size={24} color="#10B981" />}
          lightBackgroundColor="#F0FDF4"
          darkBackgroundColor="#162d21"
          onPress={() => handlePress('consumed', 'Prodotti Consumati')}
        />
        <StatsCard
          title="Sprecati"
          value={expiredProducts.toString()}
          icon={<AlertTriangle size={24} color="#EF4444" />}
          lightBackgroundColor="#FEF2F2"
          darkBackgroundColor="#2a1212"
          onPress={() => handlePress('expired', 'Prodotti Scaduti')}
        />
        <StatsCard
          title="% Spreco"
          value={`${wastePercentage}%`}
          icon={<AlertTriangle size={24} color="#F59E0B" />}
          lightBackgroundColor="#FFFBEB"
          darkBackgroundColor="#302a0f"
        />
      </View>
    </View>
  );
}
