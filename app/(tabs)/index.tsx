import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  FlatList,
  Modal,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plus, ScanBarcode, Package, AlertTriangle, User, Settings, LogOut } from 'lucide-react-native';
import { StorageService } from '@/services/StorageService';
import { Product } from '@/types/Product';
import { useFocusEffect, router } from 'expo-router';
import { ExpirationCard } from '@/components/ExpirationCard';
import { StatsCard } from '@/components/StatsCard';
import { useTheme } from '@/context/ThemeContext';
import { useCategories } from '@/context/CategoryContext';
import { supabase } from '@/services/supabaseClient';

function ProfileMenu({ isVisible, onClose, onLogout, userName }) {
  const { isDarkMode } = useTheme();
  const styles = getStyles(isDarkMode);

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose}
    >
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <View style={styles.menuContainer}>
          <Text style={styles.menuEmail}>{userName}</Text>
          <View style={styles.menuDivider} />
          <TouchableOpacity style={styles.menuItem} onPress={() => { router.push('/(tabs)/settings'); onClose(); }}>
            <Settings size={20} color={isDarkMode ? '#c9d1d9' : '#4b5563'} />
            <Text style={styles.menuItemText}>Impostazioni</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem} onPress={onLogout}>
            <LogOut size={20} color="#EF4444" />
            <Text style={[styles.menuItemText, { color: '#EF4444' }]}>Logout</Text>
          </TouchableOpacity>
        </View>
      </Pressable>
    </Modal>
  );
}


function Dashboard() {
  const { isDarkMode } = useTheme();
  const { } = useCategories();
  const [products, setProducts] = useState<Product[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [menuVisible, setMenuVisible] = useState(false);
  const [user, setUser] = useState<any | null>(null);
  const [userName, setUserName] = useState('');

  const fetchUser = useCallback(async () => {
    const { data: { user: supabaseUser } } = await supabase.auth.getUser();
    setUser(supabaseUser);
    let displayUserName = supabaseUser?.email || '';
    if (supabaseUser?.user_metadata) {
      if (supabaseUser.user_metadata.full_name) {
        displayUserName = supabaseUser.user_metadata.full_name;
      } else if (supabaseUser.user_metadata.name) {
        displayUserName = supabaseUser.user_metadata.name;
      }
    }
    setUserName(displayUserName);
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const storedProducts = await StorageService.getProducts();
      setProducts(storedProducts.filter(p => p.status === 'active'));
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchUser();
      loadData();
    }, [fetchUser, loadData])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleLogout = async () => {
    setMenuVisible(false);
    await supabase.auth.signOut();
    // The onAuthStateChange listener in _layout will handle navigation
  };

  const expiringProducts = products
    .filter(p => {
      const now = new Date();
      const expirationDate = new Date(p.expiration_date);
      const daysUntil = (expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
      return daysUntil >= 0 && daysUntil <= 7;
    })
    .sort((a, b) => new Date(a.expiration_date).getTime() - new Date(b.expiration_date).getTime());

  const expiredCount = products.filter(p => new Date(p.expiration_date) < new Date()).length;
  
  const styles = getStyles(isDarkMode);

  if (loading && products.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Caricamento...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.scrollView}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <ProfileMenu 
        isVisible={menuVisible} 
        onClose={() => setMenuVisible(false)}
        onLogout={handleLogout}
        userName={userName}
      />
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>La Tua Dispensa</Text>
          <Text style={styles.subtitle}>Tutto sotto controllo</Text>
        </View>
        <TouchableOpacity style={styles.profileButton} onPress={() => setMenuVisible(true)}>
            {userName ? (
                <Text style={styles.profileButtonText}>
                    {userName.charAt(0).toUpperCase()}
                </Text>
            ) : (
                <User size={24} color={isDarkMode ? '#c9d1d9' : '#1e293b'} />
            )}
        </TouchableOpacity>
      </View>

      <View style={styles.ctaContainer}>
        <TouchableOpacity style={styles.ctaButton} onPress={() => router.push('/add')}>
          <Plus size={20} color="#ffffff" />
          <Text style={styles.ctaButtonText}>Aggiungi</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.ctaButton, styles.ctaSecondaryButton]} onPress={() => router.push('/scanner')}>
          <ScanBarcode size={20} color={isDarkMode ? '#ffffff' : '#3b82f6'} />
          <Text style={[styles.ctaButtonText, styles.ctaSecondaryButtonText]}>Scansiona</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>In Scadenza a Breve</Text>
        {expiringProducts.length > 0 ? (
          <FlatList
            data={expiringProducts}
            renderItem={({ item }) => (
              <View style={{ width: 300, marginRight: 16 }}>
                <ExpirationCard
                  product={item}
                  onPress={() => router.push({ pathname: '/manual-entry', params: { productId: item.id } })}
                />
              </View>
            )}
            keyExtractor={item => item.id.toString()}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingLeft: 20 }}
          />
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>Nessun prodotto in scadenza nei prossimi 7 giorni. Ottimo!</Text>
          </View>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Statistiche Rapide</Text>
        <View style={styles.statsContainer}>
          <StatsCard
            title="Prodotti Attivi"
            value={products.length.toString()}
            icon={<Package size={24} color="#2563EB" />}
            lightBackgroundColor="#EFF6FF"
            darkBackgroundColor="#1e293b"
            onPress={() => router.push('/(tabs)/products')}
          />
          <StatsCard
            title="Prodotti Scaduti"
            value={expiredCount.toString()}
            icon={<AlertTriangle size={24} color="#EF4444" />}
            lightBackgroundColor="#FEF2F2"
            darkBackgroundColor="#2a1212"
            onPress={() => router.push({ pathname: '/(tabs)/products', params: { filter: 'expired' } })}
          />
        </View>
      </View>
    </ScrollView>
  );
}

export default function DashboardScreen() {
  const { isDarkMode } = useTheme();
  const styles = getStyles(isDarkMode);
  return (
    <SafeAreaView style={styles.container}>
      <Dashboard />
    </SafeAreaView>
  );
}

const getStyles = (isDarkMode: boolean) => StyleSheet.create({
  // ... (previous styles)
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  profileButton: {
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor: isDarkMode ? '#161b22' : '#e2e8f0',
      justifyContent: 'center',
      alignItems: 'center',
  },
  profileButtonText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: isDarkMode ? '#c9d1d9' : '#1e293b',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: 80,
    paddingRight: 20,
  },
  menuContainer: {
    backgroundColor: isDarkMode ? '#1e1e1e' : '#ffffff',
    borderRadius: 12,
    padding: 10,
    width: 250,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  menuEmail: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: isDarkMode ? '#8b949e' : '#64748B',
    padding: 10,
    textAlign: 'center',
  },
  menuDivider: {
    height: 1,
    backgroundColor: isDarkMode ? '#30363d' : '#e2e8f0',
    marginVertical: 5,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 10,
  },
  menuItemText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: isDarkMode ? '#c9d1d9' : '#1e293b',
    marginLeft: 15,
  },
  container: {
    flex: 1,
    backgroundColor: isDarkMode ? '#0d1117' : '#f8f9fa',
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
  ctaContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  ctaButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563EB',
    paddingVertical: 12,
    borderRadius: 12,
    marginRight: 8,
  },
  ctaSecondaryButton: {
    backgroundColor: isDarkMode ? '#161b22' : '#ffffff',
    borderWidth: 1,
    borderColor: isDarkMode ? '#30363d' : '#e2e8f0',
    marginLeft: 8,
    marginRight: 0,
  },
  ctaButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    marginLeft: 8,
  },
  ctaSecondaryButtonText: {
    color: isDarkMode ? '#ffffff' : '#3b82f6',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 22,
    fontFamily: 'Inter-Bold',
    color: isDarkMode ? '#c9d1d9' : '#1e293b',
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
  },
  emptyState: {
    backgroundColor: isDarkMode ? '#161b22' : '#ffffff',
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
    marginHorizontal: 20,
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
