import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  FlatList,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Image,
  TextInput
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/context/ThemeContext';
import { useProductForm } from '@/hooks/useProductForm';
import ProductFormHeader from '@/components/ProductFormHeader';
import ProductFormFooter from '@/components/ProductFormFooter';
import { ProductCategory } from '@/types/Product';
import { LoggingService } from '@/services/LoggingService';

const getStyles = (isDarkMode: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: isDarkMode ? '#0d1117' : '#f8f9fa',
  },
  contentContainer: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: isDarkMode ? '#ffffff' : '#000000',
    marginTop: 10,
  },
  rowStyle: {
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  categoryItem: {
    width: '23%',
    aspectRatio: 1,
    padding: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: isDarkMode ? '#30363d' : '#cbd5e1',
    backgroundColor: isDarkMode ? '#21262d' : '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryItemSpacer: {
    width: '23%',
    aspectRatio: 1,
  },
  categoryItemSelected: {
    borderColor: isDarkMode ? '#58a6ff' : '#3b82f6',
    backgroundColor: isDarkMode ? '#0d419d' : '#dbeafe',
  },
  iconContainer: {
    width: 50,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  categoryIcon: {
    fontSize: 32,
  },
  categoryImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
  },
  categoryName: {
    fontSize: 11,
    textAlign: 'center',
    color: isDarkMode ? '#c9d1d9' : '#1e293b',
    fontFamily: 'Inter-Regular',
    width: '100%',
    marginBottom: 4,
    paddingHorizontal: 2,
    fontWeight: '500',
  },
  categoryNameNoIcon: {
    fontSize: 14,
    textAlign: 'center',
    fontWeight: 'bold',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    textAlignVertical: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: isDarkMode ? '#21262d' : '#ffffff',
    padding: 20,
    borderRadius: 12,
    width: '80%',
    maxWidth: 300,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
    color: isDarkMode ? '#c9d1d9' : '#1e293b',
  },
  modalInput: {
    borderWidth: 1,
    borderColor: isDarkMode ? '#30363d' : '#cbd5e1',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
    backgroundColor: isDarkMode ? '#0d1117' : '#f8f9fa',
    color: isDarkMode ? '#c9d1d9' : '#1e293b',
  },
  modalButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  modalButtonCancel: {
    backgroundColor: isDarkMode ? '#30363d' : '#e2e8f0',
  },
  modalButtonConfirm: {
    backgroundColor: isDarkMode ? '#238636' : '#10b981',
  },
  modalButtonTextCancel: {
    color: isDarkMode ? '#c9d1d9' : '#1e293b',
    textAlign: 'center',
    fontWeight: '500',
  },
  modalButtonTextConfirm: {
    color: '#ffffff',
    textAlign: 'center',
    fontWeight: '500',
  },
  placeholder: {
    color: isDarkMode ? '#8b949e' : '#64748b',
  },
});

export default function ManualEntryScreen() {
  const { isDarkMode } = useTheme();
  const styles = getStyles(isDarkMode);
  const {
    name, setName,
    brand, setBrand,
    selectedCategory,
    quantities, addQuantity, removeQuantity, updateQuantity,
    purchaseDate,
    expirationDate,
    notes, setNotes,
    barcode,
    imageUrl,
    isEditMode,
    originalProductId,
    showPurchaseDatePicker, setShowPurchaseDatePicker,
    showExpirationDatePicker, setShowExpirationDatePicker,
    isCategoryModalVisible, setIsCategoryModalVisible,
    newCategoryNameInput, setNewCategoryNameInput,
    navigatingToPhotoCapture,
    isLoading, // Aggiunto
    categoriesLoading,
    categoryData,
    handleAddNewCategory,
    handleCategoryChange,
    onChangePurchaseDate,
    onChangeExpirationDate,
    handleSaveProduct,
    isFrozen, setIsFrozen,
  } = useProductForm();

  const renderCategoryItem = useCallback(({ item }: { item: ProductCategory & { spacer?: boolean } }) => {
    if (item.spacer) {
      return <View style={styles.categoryItemSpacer} />;
    }

    const hasIcon = (item.localIcon || (item.icon && item.icon !== '+')) && !item.iconNotFound;

    return (
      <TouchableOpacity
        style={[
          styles.categoryItem,
          selectedCategory === item.id && styles.categoryItemSelected,
        ]}
        onPress={() => handleCategoryChange(item.id)}
      >
        {hasIcon ? (
          <View style={styles.iconContainer}>
            {item.localIcon ? (
              <Image source={item.localIcon} style={styles.categoryImage} />
            ) : item.icon && item.icon.startsWith('http') ? (
              <Image source={{ uri: item.icon }} style={styles.categoryImage} />
            ) : (
              <Text style={styles.categoryIcon}>{item.icon}</Text>
            )}
          </View>
        ) : null}
        <Text
          style={[styles.categoryName, !hasIcon && styles.categoryNameNoIcon]}
          numberOfLines={2}
        >
          {item.name}
        </Text>
      </TouchableOpacity>
    );
  }, [selectedCategory, handleCategoryChange, styles]);

  if (isLoading || categoriesLoading) {
    LoggingService.info('ManualEntryScreen', `Loading state - isLoading: ${isLoading}, categoriesLoading: ${categoriesLoading}`);
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={isDarkMode ? '#ffffff' : '#000000'} />
          <Text style={styles.loadingText}>Caricamento dati prodotto...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} testID="manual-entry-screen">
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer} keyboardShouldPersistTaps="handled">
        <ProductFormHeader
          productData={{
            name,
            brand,
            selectedCategory,
            isEditMode,
            originalProductId,
          }}
          formActions={{
            setName,
            setBrand,
          }}
          photoConfig={{
            imageUrl,
            barcode,
            navigatingToPhotoCapture,
          }}
          formData={{
            purchaseDate,
            expirationDate,
            notes,
          }}
          isFrozen={isFrozen}
          setIsFrozen={setIsFrozen}
        />
        <FlatList
          data={categoryData}
          renderItem={renderCategoryItem}
          keyExtractor={item => item.id}
          numColumns={4}
          columnWrapperStyle={styles.rowStyle}
          scrollEnabled={false}
        />
        <ProductFormFooter
          formData={{
            name,
            brand,
            selectedCategory,
            purchaseDate,
            expirationDate,
            notes,
            barcode,
            imageUrl,
          }}
          dateHandlers={{
            setShowPurchaseDatePicker,
            setShowExpirationDatePicker,
            onChangePurchaseDate,
            onChangeExpirationDate,
          }}
          quantityHandlers={{
            updateQuantity,
            addQuantity,
            removeQuantity,
          }}
          quantities={quantities}
          setNotes={setNotes}
          handleSaveProduct={handleSaveProduct}
          isEditMode={isEditMode}
          showPurchaseDatePicker={showPurchaseDatePicker}
          showExpirationDatePicker={showExpirationDatePicker}
          loading={categoriesLoading}
        />
      </ScrollView>
      <Modal transparent={true} animationType="fade" visible={isCategoryModalVisible} onRequestClose={() => setIsCategoryModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Aggiungi Nuova Categoria</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Nome della nuova categoria"
              value={newCategoryNameInput}
              onChangeText={setNewCategoryNameInput}
              autoFocus
              placeholderTextColor={styles.placeholder.color}
            />
            <View style={styles.modalButtonContainer}>
              <TouchableOpacity style={[styles.modalButton, styles.modalButtonCancel]} onPress={() => setIsCategoryModalVisible(false)}>
                <Text style={styles.modalButtonTextCancel}>Annulla</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, styles.modalButtonConfirm]} onPress={handleAddNewCategory}>
                <Text style={styles.modalButtonTextConfirm}>OK</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
