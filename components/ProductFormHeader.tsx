
import React from 'react';
import { Text, TextInput, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { formStateLogger } from '@/utils/FormStateLogger';
import { useTheme } from '@/context/ThemeContext';

interface ProductFormHeaderProps {
  isEditMode: boolean;
  imageUrl: string | null;
  barcode: string;
  name: string;
  brand: string;
  selectedCategory: string;
  purchaseDate: string;
  expirationDate: string;
  notes: string;
  setName: (value: string) => void;
  setBrand: (value: string) => void;
  navigatingToPhotoCapture: React.MutableRefObject<boolean>;
}

const ProductFormHeader = React.memo(({
  isEditMode,
  imageUrl,
  barcode,
  name,
  brand,
  selectedCategory,
  purchaseDate,
  expirationDate,
  notes,
  setName,
  setBrand,
  navigatingToPhotoCapture
}: ProductFormHeaderProps) => {
  const { isDarkMode } = useTheme();
  const styles = getStyles(isDarkMode);

  return (
    <>
      <Text style={styles.title}>{isEditMode ? 'Modifica Prodotto' : 'Inserimento Manuale'}</Text>
      {!imageUrl && (
        <TouchableOpacity
          style={styles.takePhotoButton}
          onPress={() => {
            const currentFormData = {
              name: name,
              brand: brand,
              selectedCategory: selectedCategory,
              purchaseDate: purchaseDate,
              expirationDate: expirationDate,
              notes: notes,
              barcode: barcode,
              fromManualEntry: 'true'
            };
            formStateLogger.logNavigation('TAKE_PHOTO', 'manual-entry', 'photo-capture', currentFormData);
            navigatingToPhotoCapture.current = true;
            router.push({
              pathname: '/photo-capture',
              params: currentFormData
            });
            setTimeout(() => {
              navigatingToPhotoCapture.current = false;
            }, 500);
          }}
        >
          <Text style={styles.takePhotoButtonText}>Scatta Foto Prodotto</Text>
        </TouchableOpacity>
      )}
      {imageUrl && (
        <TouchableOpacity
          onPress={() => {
            const currentFormData = {
              name: name,
              brand: brand,
              selectedCategory: selectedCategory,
              purchaseDate: purchaseDate,
              expirationDate: expirationDate,
              notes: notes,
              barcode: barcode,
              fromManualEntry: 'true'
            };
            navigatingToPhotoCapture.current = true;
            router.push({
              pathname: '/photo-capture',
              params: currentFormData
            });
            setTimeout(() => {
              navigatingToPhotoCapture.current = false;
            }, 500);
          }}
        >
          <Text style={styles.label}>Immagine Prodotto (clicca per modificare)</Text>
          <Image source={{ uri: imageUrl }} style={styles.productImagePreview} />
        </TouchableOpacity>
      )}
      {barcode && !imageUrl && (
        <>
          <Text style={styles.label}>Codice a Barre Scansionato</Text>
          <TextInput style={[styles.input, styles.disabledInput]} value={barcode} editable={false} />
        </>
      )}

      <Text style={styles.label}>Nome Prodotto*</Text>
      <TextInput
        style={styles.input}
        value={name}
        onChangeText={setName}
        placeholder="Es. Latte Parzialmente Scremato"
        placeholderTextColor={isDarkMode ? '#8b949e' : '#64748b'}
      />

      <Text style={styles.label}>Marca</Text>
      <TextInput
        style={styles.input}
        value={brand}
        onChangeText={setBrand}
        placeholder="Es. Granarolo"
        placeholderTextColor={isDarkMode ? '#8b949e' : '#64748b'}
      />


    </>
  );
});

const getStyles = (isDarkMode: boolean) => StyleSheet.create({
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: isDarkMode ? '#c9d1d9' : '#1e293b',
  },
  takePhotoButton: {
    backgroundColor: isDarkMode ? '#21262d' : '#e2e8f0',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: isDarkMode ? '#30363d' : '#cbd5e1',
  },
  takePhotoButtonText: {
    textAlign: 'center',
    color: isDarkMode ? '#58a6ff' : '#3b82f6',
    fontWeight: '500',
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
    color: isDarkMode ? '#c9d1d9' : '#1e293b',
  },
  productImagePreview: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 16,
    resizeMode: 'contain',
  },
  input: {
    borderWidth: 1,
    borderColor: isDarkMode ? '#30363d' : '#cbd5e1',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
    backgroundColor: isDarkMode ? '#21262d' : '#ffffff',
    color: isDarkMode ? '#c9d1d9' : '#1e293b',
  },
  disabledInput: {
    backgroundColor: isDarkMode ? '#161b22' : '#f1f5f9',
    color: isDarkMode ? '#8b949e' : '#64748b',
  },
  placeholder: {
    color: isDarkMode ? '#8b949e' : '#64748b',
  },
});

export default ProductFormHeader;
