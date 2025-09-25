import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Svg, Rect, Text as SvgText } from 'react-native-svg';
import { useTheme } from '@/context/ThemeContext';

import type {
   MostConsumedProduct as Product,
   ChartData
 } from '@/services/StatisticsService';

interface StatisticsSectionProps {
   mostConsumed: Product[];
   mostWasted: Product[];
   chartData: ChartData;
 }
const StatisticsSection: React.FC<StatisticsSectionProps> = ({
   mostConsumed,
   mostWasted,
   chartData,
 }) => {
   const { isDarkMode, colors } = useTheme();
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      paddingHorizontal: 20,
      paddingTop: 10,
      paddingBottom: 30,
    },
    sectionBase: {
      marginBottom: 20,
      padding: 16,
      borderRadius: 8,
      backgroundColor: colors.cardBackground,
      borderWidth: 1,
      borderColor: colors.textSecondary,
    },
    title: {
      fontSize: 18,
      fontWeight: 'bold',
      marginBottom: 8,
      color: colors.textPrimary,
    },
    statItem: {
      paddingVertical: 4,
    },
    savingsText: {
      fontSize: 16,
      fontWeight: '500',
      color: colors.textPrimary,
    },
    chartContainer: {
      height: 200,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.cardBackground,
      borderRadius: 8,
      padding: 10,
      borderWidth: 1,
      borderColor: colors.textSecondary,
    },
  });
  // sectionStyle is now handled directly in styles

  return (
    <View style={styles.container}>
      {/* Prodotti Più Consumati */}
      <View style={styles.sectionBase}>
        <Text style={styles.title}>Prodotti Più Consumati</Text>
        {mostConsumed.map(product => (
          <View key={product.id} style={styles.statItem}>
            <Text style={{ color: colors.textPrimary }}>{product.name} - {product.quantity} volte</Text>
          </View>
        ))}
      </View>

      {/* Cibi Più Sprecati */}
      <View style={styles.sectionBase}>
        <Text style={styles.title}>Cibi Più Sprecati (Scaduti e Non Consumati)</Text>
        {mostWasted.map(product => (
          <View key={product.id} style={styles.statItem}>
            <Text style={{ color: colors.textPrimary }}>{product.name} - {product.quantity} volte</Text>
          </View>
        ))}
      </View>

      {/* Visualizzazioni Grafiche */}
      <View style={styles.sectionBase}>
        <Text style={styles.title}>Visualizzazioni Grafiche</Text>
        <View style={styles.chartContainer}>
          {chartData.labels.length > 0 ? (
            <SimpleBarChart data={chartData} />
          ) : (
            <Text style={{ color: colors.textSecondary }}>Nessun dato disponibile per il grafico</Text>
          )}
        </View>
      </View>


      {/* Spazio finale per evitare che il contenuto venga tagliato */}
      <View style={{ height: 10 }} />
    </View>
  );
};

// Componente per il grafico a barre semplice
const SimpleBarChart: React.FC<{ data: ChartData }> = ({ data }) => {
  const { isDarkMode, colors } = useTheme();

  if (!data.labels.length || !data.datasets.length) {
    return <Text style={{ color: colors.textSecondary }}>Nessun dato disponibile</Text>;
  }

  const chartWidth = 300;
  const chartHeight = 150;
  const barWidth = Math.max(20, (chartWidth - 40) / data.labels.length - 5);
  const maxValue = Math.max(...data.datasets.flatMap(dataset => dataset.data));

  return (
    <View style={{ alignItems: 'center' }}>
      <Svg width={chartWidth} height={chartHeight}>
        {/* Sfondo del grafico */}
        <Rect
          x={0}
          y={0}
          width={chartWidth}
          height={chartHeight}
          fill={colors.cardBackground}
          rx={4}
        />

        {/* Griglia verticale */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio, index) => (
          <Rect
            key={`grid-${index}`}
            x={30}
            y={chartHeight - 30 - (chartHeight - 40) * ratio}
            width={chartWidth - 40}
            height={1}
            fill={colors.textSecondary}
          />
        ))}

        {/* Barre del grafico */}
        {data.labels.map((label, index) => {
          const x = 40 + index * (barWidth + 5);
          const consumedHeight = data.datasets[0]?.data[index] ?
            ((data.datasets[0].data[index] / maxValue) * (chartHeight - 40)) : 0;
          const expiredHeight = data.datasets[1]?.data[index] ?
            ((data.datasets[1].data[index] / maxValue) * (chartHeight - 40)) : 0;
          const activeHeight = data.datasets[2]?.data[index] ?
            ((data.datasets[2].data[index] / maxValue) * (chartHeight - 40)) : 0;

          return (
            <React.Fragment key={`bar-${index}`}>
              {/* Barra attivi (blu) - base */}
              <Rect
                x={x}
                y={chartHeight - 30 - activeHeight}
                width={barWidth}
                height={activeHeight}
                fill="#3B82F6"
                rx={2}
              />
              {/* Barra scaduti (rosso) - sopra attivi */}
              <Rect
                x={x}
                y={chartHeight - 30 - activeHeight - expiredHeight}
                width={barWidth}
                height={expiredHeight}
                fill="#EF4444"
                rx={2}
              />
              {/* Barra consumati (verde) - sopra scaduti */}
              <Rect
                x={x}
                y={chartHeight - 30 - activeHeight - expiredHeight - consumedHeight}
                width={barWidth}
                height={consumedHeight}
                fill="#10B981"
                rx={2}
              />

              {/* Etichetta mese */}
              <SvgText
                x={x + barWidth / 2}
                y={chartHeight - 10}
                fontSize="10"
                fill={colors.textSecondary}
                textAnchor="middle"
              >
                {label}
              </SvgText>
            </React.Fragment>
          );
        })}

        {/* Legenda */}
        <SvgText x={chartWidth - 80} y={15} fontSize="8" fill={colors.textSecondary}>Consumati</SvgText>
        <SvgText x={chartWidth - 80} y={25} fontSize="8" fill={colors.textSecondary}>Scaduti</SvgText>
        <SvgText x={chartWidth - 80} y={35} fontSize="8" fill={colors.textSecondary}>Attivi</SvgText>
      </Svg>

      <View style={{ flexDirection: 'row', marginTop: 10 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 15 }}>
          <View style={{ width: 12, height: 12, backgroundColor: '#10B981', marginRight: 5, borderRadius: 2 }} />
          <Text style={{ fontSize: 12, color: colors.textPrimary }}>Consumati</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 15 }}>
          <View style={{ width: 12, height: 12, backgroundColor: '#EF4444', marginRight: 5, borderRadius: 2 }} />
          <Text style={{ fontSize: 12, color: colors.textPrimary }}>Scaduti</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={{ width: 12, height: 12, backgroundColor: '#3B82F6', marginRight: 5, borderRadius: 2 }} />
          <Text style={{ fontSize: 12, color: colors.textPrimary }}>Attivi</Text>
        </View>
      </View>
    </View>
  );
};

export default StatisticsSection;
