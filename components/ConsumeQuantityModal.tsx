import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { Modal, View, Text, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { X, Info } from 'lucide-react-native';
import { Product } from '@/types/Product';
import { LoggingService } from '@/services/LoggingService';
import { useQuantityCalculation } from '@/hooks/useQuantityCalculation';
import { getConsumeQuantityModalStyles } from './ConsumeQuantityModal.styles';
import { QuantityInput } from './QuantityInput';
import { QuantityValidationMessage } from './QuantityValidationMessage';
import { ConsumeActions } from './ConsumeActions';

interface ConsumeQuantityModalProps {
  visible: boolean;
  product: Product;
  onConfirm: (consumedQuantity: number) => void;
  onCancel: () => void;
}

export const ConsumeQuantityModal: React.FC<ConsumeQuantityModalProps> = React.memo(({
  visible, product, onConfirm, onCancel,
}) => {
  const { isDarkMode } = useTheme();
  const styles = useMemo(() => getConsumeQuantityModalStyles(isDarkMode), [isDarkMode]);
  const [inputQuantity, setInputQuantity] = useState('');
  const [error, setError] = useState('');
  const { totalQuantity, unit, validateInput } = useQuantityCalculation(product.quantities);

  useEffect(() => { if (visible) { setInputQuantity(''); setError(''); } }, [visible]);

  const handleInputChange = useCallback((text: string) => {
    setInputQuantity(text);
    setError(validateInput(text).error);
  }, [validateInput]);

  const handleConfirm = useCallback(() => {
    const result = validateInput(inputQuantity);
    if (!result.isValid) { setError(result.error); return; }
    const consumedQty = parseInt(inputQuantity, 10);
    LoggingService.info('ConsumeQuantityModal', `Confermato consumo di ${consumedQty} ${unit} per ${product.name}`);
    onConfirm(consumedQty);
  }, [inputQuantity, validateInput, unit, product.name, onConfirm]);

  const handleCancel = useCallback(() => {
    LoggingService.info('ConsumeQuantityModal', 'Annullato consumo per ' + product.name);
    onCancel();
  }, [onCancel, product.name]);

  const isConfirmDisabled = useMemo(() => !inputQuantity || !!error, [inputQuantity, error]);
  if (!visible) return null;

  const colors = {
    title: isDarkMode ? '#c9d1d9' : '#1e293b', desc: isDarkMode ? '#8b949e' : '#64748b',
    icon: isDarkMode ? '#c9d1d9' : '#1e293b', closeIcon: isDarkMode ? '#8b949e' : '#64748b',
    placeholder: isDarkMode ? '#8b949e' : '#64748b',
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleCancel} statusBarTranslucent>
      <KeyboardAvoidingView style={styles.overlay} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.header}>
              <Info size={24} color={colors.icon} />
              <Text style={[styles.title, { color: colors.title }]}>Consuma {product.name}</Text>
              <TouchableOpacity onPress={handleCancel} style={styles.closeButton} accessible accessibilityLabel="Chiudi" accessibilityRole="button">
                <X size={24} color={colors.closeIcon} />
              </TouchableOpacity>
            </View>
            <Text style={[styles.description, { color: colors.desc }]}>
              Hai {totalQuantity} {unit} disponibili. Quante unità vuoi consumare?
            </Text>
            <QuantityInput value={inputQuantity} onChangeText={handleInputChange} totalQuantity={totalQuantity}
              hasError={!!error} maxLength={String(totalQuantity).length} isDarkMode={isDarkMode}
              inputStyle={styles.input} containerStyle={styles.inputContainer} placeholderTextColor={colors.placeholder} />
            <QuantityValidationMessage error={error} errorStyle={styles.error} />
            <ConsumeActions onCancel={handleCancel} onConfirm={handleConfirm} isConfirmDisabled={isConfirmDisabled}
              containerStyle={styles.buttonsContainer} buttonStyle={styles.button} cancelButtonStyle={styles.cancelButton}
              confirmButtonStyle={styles.confirmButton} disabledButtonStyle={styles.confirmButtonDisabled}
              buttonTextStyle={styles.buttonText} cancelButtonTextStyle={styles.cancelButtonText} />
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
});

ConsumeQuantityModal.displayName = 'ConsumeQuantityModal';
