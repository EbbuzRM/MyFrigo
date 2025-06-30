import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AlertTriangle, Calendar, Package, TrendingUp } from 'lucide-react-native';
import { StorageService } from '@/services/StorageService';
import { Product } from '@/types/Product';
import { useFocusEffect, router } from 'expo-router'; // Import useFocusEffect and router
import { ExpirationCard } from '@/components/ExpirationCard';
import { StatsCard } from '@/components/StatsCard';
import { useTheme } from '@/context/ThemeContext';

function Dashboard() {
  const { isDarkMode } = useTheme();
  const [products, setProducts] = useState<Product[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notificationDays, setNotificationDays] = useState(3); // Default value

  const loadData = async () => {
    try {
      const storedProducts = await StorageService.getProducts();
      const settings = await StorageService.getSettings();
      setProducts(storedProducts);
      setNotificationDays(settings.notificationDays || 3);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      setLoading(true);
      loadData();
      return () => {};
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const getExpiringProducts = () => {
    const now = new Date();
    const notificationPeriod = new Date(now.getTime() + notificationDays * 24 * 60 * 60 * 1000);
    
    return products.filter(product => {
      const expirationDate = new Date(product.expirationDate);
      return expirationDate <= notificationPeriod && expirationDate >= now;
    }).sort((a, b) => new Date(a.expirationDate).getTime() - new Date(b.expirationDate).getTime());
  };

  const getExpiredProducts = () => {
    const now = new Date();
    return products.filter(product => new Date(product.expirationDate) < now);
  };

  const getStats = () => {
    const total = products.length;
    const expiring = getExpiringProducts().length;
    const expired = getExpiredProducts().length;
    const healthy = total - expiring - expired;

    return { total, expiring, expired, healthy };
  };

  const stats = getStats();
  const expiringProducts = getExpiringProducts();
  const styles = getStyles(isDarkMode);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Caricamento...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.scrollView}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.title}>Dashboard</Text>
        <Text style={styles.subtitle}>Gestione intelligente degli alimenti</Text>
      </View>

      <View style={styles.statsContainer}>
        <StatsCard
          title="Totale Prodotti"
          value={stats.total.toString()}
          icon={<Package size={24} color="#2563EB" />}
          lightBackgroundColor="#ffffff"
          darkBackgroundColor="#1e1e1e"
          onPress={() => router.push({ pathname: '/(tabs)/products', params: { filter: 'all' } })}
        />
        <StatsCard
          title="In Scadenza"
          value={stats.expiring.toString()}
          icon={<AlertTriangle size={24} color="#F59E0B" />}
          lightBackgroundColor="#ffffff"
          darkBackgroundColor="#1e1e1e"
          onPress={() => router.push({ pathname: '/(tabs)/products', params: { filter: 'expiring' } })}
        />
        <StatsCard
          title="Scaduti"
          value={stats.expired.toString()}
          icon={<Calendar size={24} color="#EF4444" />}
          lightBackgroundColor="#ffffff"
          darkBackgroundColor="#1e1e1e"
          onPress={() => router.push({ pathname: '/(tabs)/products', params: { filter: 'expired' } })}
        />
        <StatsCard
          title="Buoni"
          value={stats.healthy.toString()}
          icon={<TrendingUp size={24} color="#10B981" />}
          lightBackgroundColor="#ffffff"
          darkBackgroundColor="#1e1e1e"
          onPress={() => router.push({ pathname: '/(tabs)/products', params: { filter: 'all' } })}
        />
      </View>

      <View style={{...styles.section, paddingTop: 30}}>
        <Text style={styles.sectionTitle}>Prodotti in Scadenza</Text>
        {expiringProducts.length > 0 ? (
          expiringProducts.map((product) => (
            <ExpirationCard 
              key={product.id} 
              product={product} 
              onPress={() => router.push({ pathname: '/manual-entry', params: { productId: product.id } })}
            />
          ))
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>
              Nessun prodotto in scadenza nei prossimi {notificationDays} giorni
            </Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

function DashboardWrapper() {
  const { isDarkMode } = useTheme();
  const styles = getStyles(isDarkMode);

  return (
    <SafeAreaView style={styles.container}>
      <Dashboard />
    </SafeAreaView>
  );
}

export default DashboardWrapper;

const getStyles = (isDarkMode: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: isDarkMode ? '#0d1117' : '#ffffff',
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: isDarkMode ? '#c9d1d9' : '#64748B',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 10, // Riduci il padding superiore
    paddingBottom: 10,
  },
  title: {
    fontSize: 28,
    fontFamily: 'Inter-Bold',
    color: isDarkMode ? '#c9d1d9' : '#1e293b',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: isDarkMode ? '#8b949e' : '#64748B',
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 22,
    fontFamily: 'Inter-Bold',
    color: isDarkMode ? '#c9d1d9' : '#1e293b',
    marginBottom: 16,
  },
  emptyState: {
    backgroundColor: isDarkMode ? '#161b22' : '#ffffff',
    padding: 32,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: isDarkMode ? '#30363d' : '#f1f5f9',
  },
  emptyStateText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: isDarkMode ? '#8b949e' : '#64748B',
    textAlign: 'center',
  },
});