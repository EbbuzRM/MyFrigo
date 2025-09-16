import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useColorScheme } from 'react-native';
import { COLORS } from '../constants/colors';

interface Product {
  id: string;
  name: string;
  quantity: number;
}

interface EconomicSavings {
  total: number;
  currency: string;
}

interface ChartData {
  labels: string[];
  datasets: {
    data: number[];
    color: (opacity: number) => string;
  }[];
}

interface Gamification {
  badges: string[];
  points: number;
}

interface StatisticsSectionProps {
  mostConsumed: Product[];
  mostWasted: Product[];
  savings: EconomicSavings;
  chartData: ChartData;
  gamification: Gamification;
}

const StatisticsSection: React.FC<StatisticsSectionProps> = ({
  mostConsumed,
  mostWasted,
  savings,
  chartData,
  gamification,
}) => {
  const colorScheme = useColorScheme();
  const colors = COLORS[colorScheme === 'dark' ? 'DARK' : 'LIGHT'];

  return (
    <ScrollView style={styles.container}>
      {/* Most Consumed Products */}
      <View style={styles.section}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Most Consumed Products</Text>
        {mostConsumed.map(product => (
          <View key={product.id} style={styles.statItem}>
            <Text>{product.name} - {product.quantity} times</Text>
          </View>
        ))}
      </View>

      {/* Most Wasted Foods */}
      <View style={styles.section}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Most Wasted Foods (Scaduti e Non Consumati)</Text>
        {mostWasted.map(product => (
          <View key={product.id} style={styles.statItem}>
            <Text>{product.name} - {product.quantity} times</Text>
          </View>
        ))}
      </View>

      {/* Economic Savings */}
      <View style={styles.section}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Economic Savings Estimation</Text>
        <Text style={styles.savingsText}>{savings.currency}{savings.total}</Text>
      </View>

      {/* Chart Visualizations */}
      <View style={styles.section}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Chart Visualizations</Text>
        <View style={styles.chartContainer}>
          <Text>Chart implementation placeholder</Text>
        </View>
      </View>

      {/* Gamification Elements */}
      <View style={styles.section}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Gamification</Text>
        <Text>Points: {gamification.points}</Text>
        <Text>Badges: {gamification.badges.join(', ')}</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  statItem: {
    paddingVertical: 4,
  },
  savingsText: {
    fontSize: 16,
    fontWeight: '500',
  },
  chartContainer: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default StatisticsSection;
