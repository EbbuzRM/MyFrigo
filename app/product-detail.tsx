import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Image, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';
import { useCategories } from '@/context/CategoryContext';
import { useExpirationStatus } from '@/hooks/useExpirationStatus';
import { StorageService } from '@/services/StorageService';
import { Product } from '@/types/Product';
import { ArrowLeft, Calendar, Package, Trash2, CheckCircle, Edit } from 'lucide-react-native';
import { LoggingService } from '@/services/LoggingService';
import { ConsumeQuantityModal } from '@/components/ConsumeQuantityModal';
import { Toast } from '@/components/Toast';

export default function ProductDetailScreen() {
  const { isDarkMode } = useTheme();
  const styles = getStyles(isDarkMode);
  const { getCategoryById } = useCategories();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');

  const expirationInfo = useExpirationStatus(product?.expirationDate);
  const categoryInfo = product && product.category ? getCategoryById(product.category) : null;

  useEffect(() => {
    if (id) {
      loadProduct();
    }
  }, [id]);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToastMessage(message);
    setToastType(type);
    setToastVisible(true);
  };

  const hideToast = () => {
    setToastVisible(false);
  };

  const loadProduct = async () => {
    try {
      setLoading(true);
      const productData = await StorageService.getProductById(id!); 
      setProduct(productData);
    } catch (error) {
      LoggingService.error('ProductDetail', 'Error loading product:', error);
      showToast('Impossibile caricare i dettagli del prodotto.', 'error');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleConsume = () => {
    if (!product) return;
    // Se c'è una sola quantità e il valore è 1, consuma direttamente.
    // Altrimenti, apri il modale per scegliere la quantità.
    if (!Array.isArray(product.quantities) || product.quantities.length === 0) {
      LoggingService.error('ProductDetail', 'Product quantities is not an array or empty');
      showToast('Errore: quantità del prodotto non disponibile.', 'error');
      return;
    }

    // A questo punto siamo sicuri che product.quantities esiste
    const quantities = product.quantities;
    const totalQuantity = quantities.reduce((sum, q) => sum + q.quantity, 0);
    if (quantities.length === 1 && totalQuantity === 1) {
      handleModalConfirm(1);
    } else {
      setIsModalVisible(true);
    }
  };

  const handleModalConfirm = async (consumedQuantity: number) => {
    if (!product) return;
    try {
      // Verifica che le quantità esistano
      if (!Array.isArray(product.quantities) || product.quantities.length === 0) {
        LoggingService.error('ProductDetail', 'Product quantities is not an array or empty');
        showToast('Errore: quantità del prodotto non disponibile.', 'error');
        return;
      }

      LoggingService.info('ProductDetail', `Consuming ${consumedQuantity} from product ${product.id}`);

      // Crea una copia delle quantità per aggiornare
      const updatedQuantities = product.quantities.map(q => ({ ...q }));
      let remainingToConsume = consumedQuantity;

      // Riduci le quantità in ordine
      for (let i = 0; i < updatedQuantities.length && remainingToConsume > 0; i++) {
        const quantity = updatedQuantities[i];
        if (quantity.quantity > 0) {
          const consumeFromThis = Math.min(remainingToConsume, quantity.quantity);
          quantity.quantity -= consumeFromThis;
          remainingToConsume -= consumeFromThis;
          LoggingService.info('ProductDetail', `Reduced quantity ${i} by ${consumeFromThis}, remaining: ${quantity.quantity}`);
        }
      }

      // Calcola il totale rimanente
      const totalRemaining = updatedQuantities.reduce((sum, q) => sum + q.quantity, 0);
      LoggingService.info('ProductDetail', `Total remaining quantity: ${totalRemaining}`);

      // Aggiorna il prodotto
      const updatedProduct = { ...product, quantities: updatedQuantities };

      if (totalRemaining <= 0) {
        // Se completamente consumato, sposta nello storico
        updatedProduct.status = 'consumed';
        updatedProduct.consumedDate = new Date().toISOString();
        LoggingService.info('ProductDetail', `Product ${product.id} fully consumed, moving to history`);
        showToast('Prodotto consumato e spostato nello storico.', 'success');
      } else {
        // Parzialmente consumato, rimane attivo
        LoggingService.info('ProductDetail', `Product ${product.id} partially consumed, remaining: ${totalRemaining}`);
        showToast('Quantità del prodotto aggiornata.', 'success');
      }

      await StorageService.saveProduct(updatedProduct);
      router.back();
    } catch (error) {
      LoggingService.error('ProductDetail', 'Error during partial consumption:', error);
      showToast('Si è verificato un errore durante l\'operazione.', 'error');
    } finally {
      setIsModalVisible(false);
    }
  };

  const handleModalCancel = () => {
    setIsModalVisible(false);
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
              showToast('Prodotto eliminato definitivamente.', 'success');
              router.back();
            } catch (error) {
              LoggingService.error('ProductDetail', 'Error deleting product:', error);
              showToast('Si è verificato un errore durante l\'eliminazione.', 'error');
            }
          }
        }
      ]
    );
  };


  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={isDarkMode ? '#c9d1d9' : '#1e293b'} />
        </TouchableOpacity>
        <Text style={styles.title}>Caricamento...</Text>
      </SafeAreaView>
    );
  }

  if (!product) {
    return (
      <SafeAreaView style={styles.container}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={isDarkMode ? '#c9d1d9' : '#1e293b'} />
        </TouchableOpacity>
        <Text style={styles.title}>Prodotto non trovato</Text>
      </SafeAreaView>
    );
  }

  if (!categoryInfo) {
    return (
      <SafeAreaView style={styles.container}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={isDarkMode ? '#c9d1d9' : '#1e293b'} />
        </TouchableOpacity>
        <Text style={styles.title}>Categoria non trovata</Text>
      </SafeAreaView>
    );
  }

  if (!expirationInfo) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={isDarkMode ? '#c9d1d9' : '#1e293b'} />
        </TouchableOpacity>
        <Text style={styles.title}>Errore data scadenza</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} testID="product-detail-screen">
      <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 50 }} showsVerticalScrollIndicator={false}>
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
              <Text style={styles.productName} testID="product-name">{typeof product.name === 'string' ? product.name : 'Nome non disponibile'}</Text>
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

          {product.imageUrl && (
            <Image source={{ uri: product.imageUrl }} style={styles.productImage} />
          )}

          <View style={[styles.statusBadge, { backgroundColor: expirationInfo.backgroundColor }]}>
            <Text style={[styles.statusText, { color: expirationInfo.color }]}>
              {expirationInfo.text}
            </Text>
          </View>
        </View>

        <View style={styles.detailsSection}>
          {product.quantities && product.quantities.length > 0 && product.quantities.map((q, index) => (
            <View style={styles.detailRow} key={index}>
              <Package size={20} color={isDarkMode ? '#8b949e' : '#64748B'} />
              <Text style={styles.detailLabel}>Quantità {product.quantities.length > 1 ? index + 1 : ''}:</Text>
              <Text style={styles.detailValue}>
                {q.quantity} {q.unit}
              </Text>
            </View>
          ))}

          <View style={styles.detailRow}>
            <Calendar size={20} color={isDarkMode ? '#8b949e' : '#64748B'} />
            <Text style={styles.detailLabel}>Scadenza:</Text>
            <Text style={styles.detailValue} numberOfLines={1}>
              {typeof product.expirationDate === 'string' && product.expirationDate.length > 0
                ? new Date(product.expirationDate).toLocaleDateString('it-IT', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric'
                  })
                : 'Data non disponibile'}
            </Text>
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
          {product.status === 'active' && product.quantities && product.quantities.length > 0 && (
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

      {product && (
        <ConsumeQuantityModal
          visible={isModalVisible}
          product={product}
          onConfirm={handleModalConfirm}
          onCancel={handleModalCancel}
        />
      )}

      <Toast
        message={toastMessage}
        visible={toastVisible}
        onDismiss={hideToast}
        type={toastType}
      />
    </SafeAreaView>
  );
}

const getStyles = (isDarkMode: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: isDarkMode ? '#0d1117' : '#f8f9fa',
    paddingBottom: 8,
  },
  backButton: {
    padding: 8,
    marginRight: 16,
  },
  title: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: isDarkMode ? '#c9d1d9' : '#1e293b',
  },
  content: {
    flex: 1,
    padding: 8,
    paddingBottom: 15,
  },
  productCard: {
    backgroundColor: isDarkMode ? '#161b22' : '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: isDarkMode ? '#30363d' : '#e2e8f0',
  },
  productImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginBottom: 12,
    resizeMode: 'cover',
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
    padding: 16,
    marginBottom: 16,
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
    flex: 1,
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
    gap: 8,
    marginTop: 10,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3b82f6',
    paddingVertical: 8,
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
    paddingVertical: 8,
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
    paddingVertical: 8,
    borderRadius: 12,
    gap: 8,
  },
  deleteButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#ffffff',
  },
});
