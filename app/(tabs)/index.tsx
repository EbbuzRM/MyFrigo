import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Modal,
  Pressable,
  Alert,
  Linking,
  AppState,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FlashList } from '@shopify/flash-list';
import { Plus, ScanBarcode, Package, AlertTriangle, User, Settings, LogOut, Bell, BellOff } from 'lucide-react-native';
import { router } from 'expo-router';
import { ExpirationCard } from '@/components/ExpirationCard';
import { StatsCard } from '@/components/StatsCard';
import { useTheme } from '@/context/ThemeContext';
import { supabase } from '@/services/supabaseClient';
import { useAuth } from '@/context/AuthContext';
import { useSettings } from '@/context/SettingsContext';
import { useProducts } from '@/context/ProductContext';
import { LoggingService } from '@/services/LoggingService';

function ProfileMenu({ isVisible, onClose, onLogout, userName }: { isVisible: boolean; onClose: () => void; onLogout: () => void; userName: string }) {
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
          <TouchableOpacity style={styles.menuItem} onPress={onLogout} testID="logout-button">
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
  const { user, profile } = useAuth();
  const { settings, permissionStatus, refreshPermissions, loading: settingsLoading } = useSettings();
  const { products: allProducts, loading: productsLoading, refreshProducts } = useProducts();
  const [refreshing, setRefreshing] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshProducts();
    setRefreshing(false);
  }, [refreshProducts]);

  // Aggiunto listener per l'AppState per aggiornare i permessi quando l'utente torna all'app
  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (nextAppState === 'active') {
        LoggingService.info('Dashboard', 'App has come to the foreground, refreshing permissions...');
        refreshPermissions();
      }
    });

    return () => {
      subscription.remove();
    };
  }, [refreshPermissions]);

  const handleBellPress = () => {
    if (permissionStatus === 'denied') {
      Alert.alert(
        "Permessi Notifiche",
        "Le notifiche sono disattivate. Per riattivarle, devi modificare le impostazioni del tuo dispositivo.",
        [
          { text: "Annulla", style: "cancel" },
          { text: "Apri Impostazioni", onPress: () => Linking.openSettings() }
        ]
      );
    }
  };

  const handleLogout = async () => {
    setMenuVisible(false);
    await supabase.auth.signOut();
  };

  const expiringProducts = allProducts
    .filter(p => {
      if (!settings || !p.expirationDate) return false;
      const today = new Date();
      const startOfTodayUTC = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
      const expirationParts = p.expirationDate.split('-').map(Number);
      const startOfExpirationUTC = Date.UTC(expirationParts[0], expirationParts[1] - 1, expirationParts[2]);
      const diffDays = (startOfExpirationUTC - startOfTodayUTC) / (1000 * 60 * 60 * 24);
      return diffDays >= 0 && diffDays <= settings.notificationDays && !p.consumedDate && !p.isFrozen;
    })
    .sort((a, b) => new Date(a.expirationDate).getTime() - new Date(b.expirationDate).getTime());

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiredCount = allProducts.filter(p => {
    const expirationDate = new Date(p.expirationDate);
    expirationDate.setHours(0, 0, 0, 0);
    return p.status === 'active' && expirationDate < today && !p.isFrozen;
  }).length;

  const styles = getStyles(isDarkMode);

  const displayName = profile?.first_name && profile?.last_name
    ? `${profile.first_name} ${profile.last_name}`
    : user?.email;

  const displayInitials = profile?.first_name && profile?.last_name
    ? `${profile.first_name.charAt(0)}${profile.last_name.charAt(0)}`.toUpperCase()
    : user?.email?.charAt(0).toUpperCase();

  if ((productsLoading || settingsLoading) && allProducts.length === 0) {
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
        userName={displayName || ''}
      />
      <View style={styles.header}>
        <TouchableOpacity style={styles.titleContainer} onPress={handleBellPress} disabled={permissionStatus !== 'denied'}>
          <Text style={styles.title}>La Tua Dispensa</Text>
          <View style={styles.notificationIconContainer}>
            {permissionStatus === 'granted'
              ? <Bell size={18} color={isDarkMode ? '#4ade80' : '#16a34a'} style={styles.notificationIcon} />
              : <BellOff size={18} color={isDarkMode ? '#f87171' : '#dc2626'} style={styles.notificationIcon} />
            }
          </View>
        </TouchableOpacity>
        <TouchableOpacity style={styles.profileButton} onPress={() => setMenuVisible(true)} testID="profile-button">
          {displayInitials ? (
            <Text style={styles.profileButtonText}>{displayInitials}</Text>
          ) : (
            <User size={24} color={isDarkMode ? '#c9d1d9' : '#1e293b'} />
          )}
        </TouchableOpacity>
      </View>
      <Text style={styles.subtitle}>Tutto sotto controllo</Text>

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
          <FlashList
            data={expiringProducts}
            renderItem={({ item }) => (
              <View style={{ width: 300, marginRight: 16 }}>
                <ExpirationCard
                  product={item}
                  onPress={() => router.push(`/manual-entry?productId=${item.id}`)}
                />
              </View>
            )}
            keyExtractor={(item) => item.id.toString()}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingLeft: 20 }}
          />
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>Nessun prodotto in scadenza nei prossimi {settings?.notificationDays || 7} giorni. Ottimo!</Text>
          </View>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Statistiche Rapide</Text>
        <View style={styles.statsContainer}>
          <StatsCard
            title="Prodotti Attivi"
            value={allProducts.filter(p => p.status === 'active').length.toString()}
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
    <SafeAreaView style={styles.container} testID="index-screen">
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
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  notificationIconContainer: {
    marginTop: 4, // Allinea l'icona verticalmente con il titolo
  },
  notificationIcon: {
    // Stile per l'icona stessa
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: isDarkMode ? '#8b949e' : '#64748B',
    paddingHorizontal: 20, // Aggiunto per allineare
    paddingBottom: 20, // Spostato qui
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
