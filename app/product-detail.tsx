import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Image, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';
import { useCategories } from '@/context/CategoryContext';
import { useExpirationStatus } from '@/hooks/useExpirationStatus';
import { StorageService } from '@/services/StorageService';
import { Product } from '@/types/Product';
import { ArrowLeft, Calendar, Package, Trash2, CheckCircle, Camera, Edit } from 'lucide-react-native';
import { LoggingService } from '@/services/LoggingService';

export default function ProductDetailScreen() {
  const { isDarkMode } = useTheme();
  const styles = getStyles(isDarkMode);
  const { getCategoryById } = useCategories();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  const expirationInfo = product ? useExpirationStatus(product.expirationDate) : null;
  const categoryInfo = product && product.category ? getCategoryById(product.category) : null;

  useEffect(() => {
    if (id) {
      loadProduct();
    }
  }, [id]);

  const loadProduct = async () => {
    try {
      setLoading(true);
      const productData = await StorageService.getProductById(id!);
      setProduct(productData);
    } catch (error) {
      LoggingService.error('ProductDetail', 'Error loading product:', error);
      Alert.alert('Errore', 'Impossibile caricare i dettagli del prodotto.');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleConsume = async () => {
    if (!product) return;

    Alert.alert(
      'Conferma Consumo',
      `Sei sicuro di voler segnare "${product.name}" come consumato?`,
      [
        { text: 'Annulla', style: 'cancel' },
        {
          text: 'Conferma',
          style: 'default',
          onPress: async () => {
            try {
              await StorageService.updateProductStatus(product.id, 'consumed');
              Alert.alert('Prodotto Consumato', 'Il prodotto è stato spostato nello storico.', [
                { text: 'OK', onPress: () => router.back() }
              ]);
            } catch (error) {
              LoggingService.error('ProductDetail', 'Error consuming product:', error);
              Alert.alert('Errore', 'Si è verificato un errore durante l\'operazione.');
            }
          }
        }
      ]
    );
  };

  const handleDelete = async () => {
    if (!product) return;

    Alert.alert(
      'Elimina Prodotto',
      `Sei sicuro di voler eliminare definitivamente "${product.name}"?`,
      [
        { text: 'Annulla', style: 'cancel' },
        {
          text: 'Elimina',
          style: 'destructive',
          onPress: async () => {
            try {
              await StorageService.deleteProduct(product.id);
              Alert.alert('Prodotto Eliminato', 'Il prodotto è stato eliminato definitivamente.', [
                { text: 'OK', onPress: () => router.back() }
              ]);
            } catch (error) {
              LoggingService.error('ProductDetail', 'Error deleting product:', error);
              Alert.alert('Errore', 'Si è verificato un errore durante l\'eliminazione.');
            }
          }
        }
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={24} color={isDarkMode ? '#c9d1d9' : '#1e293b'} />
          </TouchableOpacity>
          <Text style={styles.title}>Caricamento...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!product) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={24} color={isDarkMode ? '#c9d1d9' : '#1e293b'} />
          </TouchableOpacity>
          <Text style={styles.title}>Prodotto non trovato</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!categoryInfo) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={24} color={isDarkMode ? '#c9d1d9' : '#1e293b'} />
          </TouchableOpacity>
          <Text style={styles.title}>Categoria non trovata</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!expirationInfo) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={24} color={isDarkMode ? '#c9d1d9' : '#1e293b'} />
          </TouchableOpacity>
          <Text style={styles.title}>Errore data scadenza</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={isDarkMode ? '#c9d1d9' : '#1e293b'} />
        </TouchableOpacity>
        <Text style={styles.title}>Dettagli Prodotto</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.productCard}>
          <View style={styles.productHeader}>
            <View style={[styles.categoryIcon, { backgroundColor: categoryInfo ? categoryInfo.color + '20' : '#808080' }]}>
              {categoryInfo && categoryInfo.localIcon ? (
                <Image source={categoryInfo.localIcon} style={styles.categoryImage} />
              ) : categoryInfo && categoryInfo.icon && categoryInfo.icon.startsWith('http') ? (
                <Image source={{ uri: categoryInfo.icon }} style={styles.categoryImage} />
              ) : (
                <Text style={styles.categoryEmoji}>{categoryInfo ? categoryInfo.icon || '?' : '?'}</Text>
              )}
            </View>
            <View style={styles.productInfo}>
              <Text style={styles.productName}>{typeof product.name === 'string' ? product.name : 'Nome non disponibile'}</Text>
              {typeof product.brand === 'string' && product.brand.length > 0 && (
                <Text style={styles.brandName}>{product.brand}</Text>
              )}
              <View style={[styles.categoryBadge, { backgroundColor: (categoryInfo && typeof categoryInfo.color === 'string' ? categoryInfo.color : '#808080') + '33' }]}>
                <Text style={[styles.categoryName, { color: categoryInfo && typeof categoryInfo.color === 'string' ? categoryInfo.color : '#808080' }]}>
                  {categoryInfo && typeof categoryInfo.name === 'string' ? categoryInfo.name : 'Categoria sconosciuta'}
                </Text>
              </View>
            </View>
          </View>

          <View style={[styles.statusBadge, { backgroundColor: expirationInfo.backgroundColor }]}>
            <Text style={[styles.statusText, { color: expirationInfo.color }]}>
              {expirationInfo.text}
            </Text>
          </View>
        </View>

        <View style={styles.detailsSection}>
          <View style={styles.detailRow}>
            <Package size={20} color={isDarkMode ? '#8b949e' : '#64748B'} />
            <Text style={styles.detailLabel}>Quantità:</Text>
            <Text style={styles.detailValue}>
              {typeof product.quantity === 'number' ? product.quantity : 0} {typeof product.unit === 'string' ? product.unit : ''}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Calendar size={20} color={isDarkMode ? '#8b949e' : '#64748B'} />
            <Text style={styles.detailLabel}>Scadenza:</Text>
            <View style={styles.detailValueContainer}>
              <Text style={styles.detailValue}>
                {typeof product.expirationDate === 'string' && product.expirationDate.length > 0
                  ? new Date(product.expirationDate).toLocaleDateString('it-IT', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric'
                    })
                  : 'Data non disponibile'}
              </Text>
              <TouchableOpacity
                style={styles.captureButton}
                onPress={() => {
                  router.push({
                    pathname: '/photo-capture',
                    params: {
                      captureMode: 'expirationDateOnly',
                      id: product.id,
                      name: product.name || '',
                      brand: product.brand || '',
                      selectedCategory: product.category || '',
                      quantity: (product.quantity || 0).toString(),
                      unit: product.unit || '',
                      purchaseDate: product.purchaseDate || '',
                      expirationDate: product.expirationDate || '',
                      notes: product.notes || '',
                      barcode: product.barcode || '',
                      imageUrl: product.imageUrl || '',
                      addedMethod: product.addedMethod || 'manual'
                    }
                  });
                }}
              >
                <Camera size={16} color="#ffffff" />
                <Text style={styles.captureButtonText}>Riscatta foto</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.detailRow}>
            <Calendar size={20} color={isDarkMode ? '#8b949e' : '#64748B'} />
            <Text style={styles.detailLabel}>Acquistato:</Text>
            <Text style={styles.detailValue}>
              {typeof product.purchaseDate === 'string' && product.purchaseDate.length > 0
                ? new Date(product.purchaseDate).toLocaleDateString('it-IT', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric'
                  })
                : 'Data non disponibile'}
            </Text>
          </View>

          {product.notes && (
            <View style={styles.notesSection}>
              <Text style={styles.notesLabel}>Note:</Text>
              <Text style={styles.notesText}>{typeof product.notes === 'string' ? product.notes : ''}</Text>
            </View>
          )}
        </View>

        <View style={styles.actionsSection}>
          {product.status === 'active' && (
            <>
              <TouchableOpacity
                style={styles.editButton}
                onPress={() => {
                  router.push({
                    pathname: '/manual-entry',
                    params: {
                      productId: product.id
                    }
                  });
                }}
              >
                <Edit size={20} color="#ffffff" />
                <Text style={styles.editButtonText}>Modifica Prodotto</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.consumeButton} onPress={handleConsume}>
                <CheckCircle size={20} color="#ffffff" />
                <Text style={styles.consumeButtonText}>Segna come Consumato</Text>
              </TouchableOpacity>
            </>
          )}

          <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
            <Trash2 size={20} color="#ffffff" />
            <Text style={styles.deleteButtonText}>Elimina Prodotto</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const getStyles = (isDarkMode: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: isDarkMode ? '#0d1117' : '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: isDarkMode ? '#30363d' : '#e2e8f0',
  },
  backButton: {
    padding: 8,
    marginRight: 16,
  },
  title: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: isDarkMode ? '#c9d1d9' : '#1e293b',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  productCard: {
    backgroundColor: isDarkMode ? '#161b22' : '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: isDarkMode ? '#30363d' : '#e2e8f0',
  },
  productHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  categoryIcon: {
    width: 60,
    height: 60,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  categoryImage: {
    width: 40,
    height: 40,
    borderRadius: 8,
  },
  categoryEmoji: {
    fontSize: 32,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: isDarkMode ? '#c9d1d9' : '#1e293b',
    marginBottom: 4,
  },
  brandName: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: isDarkMode ? '#8b949e' : '#64748B',
    marginBottom: 8,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  categoryName: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
  },
  detailsSection: {
    backgroundColor: isDarkMode ? '#161b22' : '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: isDarkMode ? '#30363d' : '#e2e8f0',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  detailLabel: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: isDarkMode ? '#8b949e' : '#64748B',
    marginLeft: 12,
    flex: 1,
  },
  detailValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailValue: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: isDarkMode ? '#c9d1d9' : '#1e293b',
  },
  captureButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3b82f6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  captureButtonText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#ffffff',
  },
  notesSection: {
    marginTop: 8,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: isDarkMode ? '#30363d' : '#e2e8f0',
  },
  notesLabel: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: isDarkMode ? '#8b949e' : '#64748B',
    marginBottom: 8,
  },
  notesText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: isDarkMode ? '#c9d1d9' : '#1e293b',
    lineHeight: 24,
  },
  actionsSection: {
    gap: 12,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3b82f6',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  editButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#ffffff',
  },
  consumeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#16a34a',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  consumeButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#ffffff',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#dc2626',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  deleteButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#ffffff',
  },
});
