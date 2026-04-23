import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FlashList } from '@shopify/flash-list';
import { Package, AlertTriangle } from 'lucide-react-native';
import { router } from 'expo-router';
import { ExpirationCard } from '@/components/ExpirationCard';
import { StatsCard } from '@/components/StatsCard';
import { useTheme } from '@/context/ThemeContext';
import { supabase } from '@/services/supabaseClient';
import { useAuth } from '@/context/AuthContext';
import { useSettings } from '@/context/SettingsContext';
import { useProducts } from '@/context/ProductContext';
import { LoggingService } from '@/services/LoggingService';
import { getStyles } from '@/styles/dashboard.styles';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { ProfileMenu } from '@/components/dashboard/ProfileMenu';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { QuickActions } from '@/components/dashboard/QuickActions';
import { useAppLifecycle } from '@/hooks/useAppLifecycle';
import { showNotificationPermissionsAlert } from '@/utils/permissions';
import { DASHBOARD_CONTENT } from '@/constants/content';

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

  const handleCloseMenu = useCallback(() => {
    setMenuVisible(false);
  }, []);

  // Aggiunto listener per l'AppState tramite hook custom
  useAppLifecycle(refreshPermissions);

  const handleBellPress = () => {
    if (permissionStatus === 'denied') {
      showNotificationPermissionsAlert();
    }
  };

  const handleLogout = useCallback(async () => {
    setMenuVisible(false);
    await supabase.auth.signOut();
  }, []);

  // Usa l'hook per la logica sulle date
  const { expiringProducts, expiredCount } = useDashboardStats({
    allProducts,
    notificationDays: settings?.notificationDays
  });

  const styles = useMemo(() => getStyles(isDarkMode), [isDarkMode]);

  const activeProductsCount = useMemo(() => 
    allProducts.filter(p => p.status === 'active').length, 
    [allProducts]
  );

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
        onClose={handleCloseMenu}
        onLogout={handleLogout}
        userName={displayName || ''}
      />
      <DashboardHeader
        permissionStatus={permissionStatus}
        onBellPress={handleBellPress}
        onProfilePress={() => setMenuVisible(true)}
        displayInitials={displayInitials}
      />
      <Text style={styles.subtitle}>{DASHBOARD_CONTENT.SUBTITLE}</Text>

      <QuickActions />

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{DASHBOARD_CONTENT.TITLE_EXPIRING}</Text>
        {expiringProducts.length > 0 ? (
          <FlashList
            data={expiringProducts}
            // @ts-ignore: estimatedItemSize error due to React 19 typing mismatch with FlashList
            estimatedItemSize={120}
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
            <Text style={styles.emptyStateText}>{DASHBOARD_CONTENT.EMPTY_EXPIRING(settings?.notificationDays || 7)}</Text>
          </View>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{DASHBOARD_CONTENT.TITLE_STATS}</Text>
        <View style={styles.statsContainer}>
          <StatsCard
            title={DASHBOARD_CONTENT.STATS_ACTIVE}
            value={activeProductsCount.toString()}
            icon={<Package size={24} color="#2563EB" />}
            lightBackgroundColor="#EFF6FF"
            darkBackgroundColor="#1e293b"
            onPress={() => router.push('/(tabs)/products')}
          />
          <StatsCard
            title={DASHBOARD_CONTENT.STATS_EXPIRED}
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
  const styles = useMemo(() => getStyles(isDarkMode), [isDarkMode]);
  return (
    <SafeAreaView style={styles.container} testID="index-screen">
      <Dashboard />
    </SafeAreaView>
  );
}
