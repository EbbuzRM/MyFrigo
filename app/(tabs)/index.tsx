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
import { useFocusEffect } from 'expo-router'; // Import useFocusEffect
import { ExpirationCard } from '@/components/ExpirationCard';
import { StatsCard } from '@/components/StatsCard';

export default function Dashboard() {
  const [products, setProducts] = useState<Product[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  // useEffect(() => { // Replaced by useFocusEffect
  //   loadProducts();
  // }, []);

  useFocusEffect(
    React.useCallback(() => {
      setLoading(true); // Show loading indicator on focus
      loadProducts();
      return () => {
        // Optional: cleanup if needed when screen loses focus
      };
    }, [])
  );

  const loadProducts = async () => {
    try {
      const storedProducts = await StorageService.getProducts();
      setProducts(storedProducts);
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadProducts();
    setRefreshing(false);
  };

  const getExpiringProducts = () => {
    const now = new Date();
    const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
    
    return products.filter(product => {
      const expirationDate = new Date(product.expirationDate);
      return expirationDate <= threeDaysFromNow && expirationDate >= now;
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

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Caricamento...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
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
            backgroundColor="#EFF6FF"
          />
          <StatsCard
            title="In Scadenza"
            value={stats.expiring.toString()}
            icon={<AlertTriangle size={24} color="#F59E0B" />}
            backgroundColor="#FFFBEB"
          />
          <StatsCard
            title="Scaduti"
            value={stats.expired.toString()}
            icon={<Calendar size={24} color="#EF4444" />}
            backgroundColor="#FEF2F2"
          />
          <StatsCard
            title="Buoni"
            value={stats.healthy.toString()}
            icon={<TrendingUp size={24} color="#10B981" />}
            backgroundColor="#F0FDF4"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Prodotti in Scadenza</Text>
          {expiringProducts.length > 0 ? (
            expiringProducts.map((product) => (
              <ExpirationCard key={product.id} product={product} />
            ))
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>
                Nessun prodotto in scadenza nei prossimi 3 giorni
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
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
    color: '#64748B',
  },
  header: {
    padding: 20,
    paddingBottom: 10,
  },
  title: {
    fontSize: 28,
    fontFamily: 'Inter-Bold',
    color: '#1e293b',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#64748B',
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
    fontSize: 20,
    fontFamily: 'Inter-SemiBold',
    color: '#1e293b',
    marginBottom: 16,
  },
  emptyState: {
    backgroundColor: '#ffffff',
    padding: 32,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  emptyStateText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#64748B',
    textAlign: 'center',
  },
});
