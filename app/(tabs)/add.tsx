// add.tsx — add module.
//
// exports: AddProduct
// used_by: none
// rules:   - This module uses router.replace() to navigate to manual-entry after barcode scanning; do not change navigation strategy without updating scanner.tsx and manual-entry.tsx flow.
//          - All forwarded barcode parameters (barcode, barcodeType, productName, brand, imageUrl) must be preserved as-is when routing to manual-entry.
//          - The add screen must remain a lightweight pass-through/dumb component only responsible for parameter forwarding and should not contain form logic.
// agent:   deepseek/deepseek-chat | deepseek | 2026-05-09 | codedna-cli | initial CodeDNA annotation pass
// message: 

import React, { useEffect, useCallback, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Barcode, Keyboard } from 'lucide-react-native';
import { router, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { AddMethodCard } from '@/components/AddMethodCard';
import { RecentsPicker } from '@/components/RecentsPicker';
import { useTheme } from '@/context/ThemeContext';
import { LoggingService } from '@/services/LoggingService';
import { ProductStorage } from '@/services/ProductStorage';
import { Product } from '@/types/Product';
import { recentProductQueue, RecentQueueItem } from '@/utils/recentProductQueue';
import { getLocalISODate } from '@/utils/dateUtils';

// Helper: map Product -> RecentQueueItem for clone
function toQueueItem(p: Product): RecentQueueItem {
  return {
    name: p.name,
    brand: p.brand,
    barcode: p.barcode,
    imageUrl: p.imageUrl ?? null,
    selectedCategory: p.category,
    notes: p.notes,
    isFrozen: p.isFrozen,
  };
}

function toManualEntryParams(item: RecentQueueItem): Record<string, string> {
  const params: Record<string, string> = {
    name: item.name,
    purchaseDate: getLocalISODate(),
    resetForm: 'true',
  };
  if (item.brand) params.brand = item.brand;
  if (item.barcode) params.barcode = item.barcode;
  if (item.imageUrl) params.imageUrl = item.imageUrl;
  if (item.selectedCategory) params.selectedCategory = item.selectedCategory;
  if (item.notes) params.notes = item.notes;
  if (item.isFrozen) params.isFrozen = String(item.isFrozen);
  return params;
}

// Componente per l'aggiunta di prodotti
const AddProduct = () => {
  LoggingService.info('DEBUG_CRASH', 'AddProduct component mounting');
  const { isDarkMode } = useTheme();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();

  const [recents, setRecents] = useState<Product[]>([]);
  const [recentsLoading, setRecentsLoading] = useState(false);
  const [recentsError, setRecentsError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const requestIdRef = useRef(0);

  useEffect(() => {
    // Check if we have barcode data, implying we came from the scanner
    if (params.barcode && typeof params.barcode === 'string') {
      // Prepare all parameters to forward to the manual entry screen
      const forwardParams: { [key: string]: string | undefined | string[] } = {
        barcode: params.barcode,
        resetForm: 'true',
      };
      if (params.barcodeType && typeof params.barcodeType === 'string') {
        forwardParams.barcodeType = params.barcodeType;
      }
      if (params.productName && typeof params.productName === 'string') {
        forwardParams.productName = params.productName;
      }
      if (params.brand && typeof params.brand === 'string') {
        forwardParams.brand = params.brand;
      }
      if (params.imageUrl && typeof params.imageUrl === 'string') {
        forwardParams.imageUrl = params.imageUrl;
      }
      // Add any other params you might have passed from scanner.tsx

      // Navigate to manual-entry with all collected parameters
      // Using replace to prevent going back to this intermediate 'add' screen
      router.replace({ pathname: '/manual-entry', params: forwardParams });
    }
  }, [params]);

  const fetchRecents = useCallback(async () => {
    setRecentsLoading(true);
    setRecentsError(null);
    const currentId = ++requestIdRef.current;
    const result = await ProductStorage.getRecentProducts(10);
    if (currentId !== requestIdRef.current) return;
    if (result.success) {
      setRecents(result.data ?? []);
    } else {
      setRecentsError(result.error ?? 'Errore caricamento recents');
    }
    setRecentsLoading(false);
  }, []);

  const fetchSearch = useCallback(async (q: string) => {
    setRecentsLoading(true);
    setRecentsError(null);
    const currentId = ++requestIdRef.current;
    const result = await ProductStorage.searchRecentProducts(q, 10);
    if (currentId !== requestIdRef.current) return;
    if (result.success) {
      setRecents(result.data ?? []);
    } else {
      setRecentsError(result.error ?? 'Errore ricerca');
    }
    setRecentsLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchRecents();
      // cancel debounce on blur
      return () => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        requestIdRef.current++;
      };
    }, [fetchRecents])
  );

  const handleSearchChange = useCallback(
    (text: string) => {
      setSearchQuery(text);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      const trimmed = text.trim();
      if (trimmed.length === 0) {
        debounceRef.current = setTimeout(() => fetchRecents(), 300);
        return;
      }
      if (trimmed.length === 1) {
        // hint only, no query
        return;
      }
      // >=2
      debounceRef.current = setTimeout(() => fetchSearch(trimmed), 300);
    },
    [fetchRecents, fetchSearch]
  );

  const hintText = searchQuery.trim().length === 1 ? 'Digita ancora…' : null;

  const handleToggle = useCallback((product: Product) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(product.id)) next.delete(product.id);
      else {
        if (next.size >= 10) return next;
        next.add(product.id);
      }
      return next;
    });
  }, []);

  const handleContinue = useCallback(() => {
    const selected = recents.filter((p) => selectedIds.has(p.id)).slice(0, 10);
    if (selected.length === 0) return;
    const items = selected.map(toQueueItem);
    recentProductQueue.clear();
    recentProductQueue.push(items);
    const first = recentProductQueue.peekNext();
    if (!first) return;
    const entryParams = toManualEntryParams(first);
    router.replace({ pathname: '/manual-entry', params: entryParams });
  }, [recents, selectedIds]);

  const handleBarcodeScanner = () => {
    router.push('/scanner');
  };

  const handleManualEntry = () => {
    router.push('/manual-entry?isEditMode=false&resetForm=true');
  };

  const styles = getStyles(isDarkMode);

  return (
    <SafeAreaView style={styles.container} testID="add-product-screen">
      <ScrollView style={{ flex: 1, marginBottom: 60 + insets.bottom }} contentContainerStyle={{ gap: 16, paddingBottom: 20 }} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.title}>Aggiungi Prodotto</Text>
          <Text style={styles.subtitle}>
            Scegli il metodo per aggiungere un nuovo prodotto alla tua dispensa
          </Text>
        </View>

        <View style={styles.methodsContainer}>
          <AddMethodCard
            testID="barcode-scanner-button"
            title="Scansiona Codice a Barre"
            description="Usa la fotocamera per una scansione rapida"
            icon={<Barcode size={28} />}
            onPress={handleBarcodeScanner}
            variant="barcode"
          />

          <AddMethodCard
            testID="manual-entry-button"
            title="Inserimento Manuale"
            description="Aggiungi i dettagli del prodotto manualmente"
            icon={<Keyboard size={28} />}
            onPress={handleManualEntry}
            variant="manual"
          />
        </View>

        <RecentsPicker
          products={recents}
          selectedIds={selectedIds}
          onToggle={handleToggle}
          onContinue={handleContinue}
          searchQuery={searchQuery}
          onSearchChange={handleSearchChange}
          loading={recentsLoading}
          error={recentsError}
          hintText={hintText}
        />

        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>Suggerimenti</Text>
          <View style={styles.tipContainer}>
            <Text style={styles.tipText}>
              • Puoi inserire la data di scadenza anche da un'immagine della galleria.Assicurati che l'etichetta sia ben illuminata e si consiglia di utilizzare la modalità macro.
            </Text>
            <Text style={styles.tipText}>
              • L'inserimento manuale ti permette il controllo completo sui dettagli
            </Text>
            <Text style={styles.tipText}>

            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

// Esportazione predefinita del componente
export default AddProduct;

const getStyles = (isDarkMode: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: isDarkMode ? '#0d1117' : '#ffffff',
    padding: 20,
    gap: 24,
  },
  header: {
    // No specific padding needed if container has it
  },
  title: {
    fontSize: 28,
    fontFamily: 'Inter-Bold',
    color: isDarkMode ? '#c9d1d9' : '#1e293b',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: isDarkMode ? '#8b949e' : '#64748B',
    lineHeight: 20,
  },
  methodsContainer: {
    gap: 14,
  },
  infoSection: {
    // No specific padding needed if container has it
  },
  infoTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: isDarkMode ? '#c9d1d9' : '#1e293b',
    marginBottom: 8,
  },
  tipContainer: {
    backgroundColor: isDarkMode ? '#161b22' : '#ffffff',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: isDarkMode ? '#30363d' : '#e2e8f0',
    gap: 8,
  },
  tipText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: isDarkMode ? '#8b949e' : '#64748B',
    lineHeight: 20,
  },
});

