import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { CheckCircle, X, Info } from 'lucide-react-native';
import { Product } from '@/types/Product';
import { LoggingService } from '@/services/LoggingService';

interface ConsumeQuantityModalProps {
  visible: boolean;
  product: Product;
  onConfirm: (consumedQuantity: number) => void;
  onCancel: () => void;
}

export const ConsumeQuantityModal: React.FC<ConsumeQuantityModalProps> = ({
  visible,
  product,
  onConfirm,
  onCancel,
}) => {
  const { isDarkMode } = useTheme();
  const styles = getStyles(isDarkMode);
  const [inputQuantity, setInputQuantity] = useState('');
  const [error, setError] = useState('');

  const quantities = Array.isArray(product.quantities) ? product.quantities : [];
  const hasPz = quantities.some(q => q.unit === 'pz');
  const hasConf = quantities.some(q => q.unit === 'conf');

  let totalQuantity;
  let unit;

  if (hasPz && hasConf) {
    totalQuantity = quantities
      .filter(q => q.unit === 'pz')
      .reduce((sum, q) => sum + q.quantity, 0);
    unit = 'pz';
  } else {
    totalQuantity = quantities.reduce((sum, q) => sum + q.quantity, 0);
    unit = quantities.length > 0 ? quantities[0]?.unit || 'unità' : 'unità';
  }

  React.useEffect(() => {
    if (visible) {
      setInputQuantity('');
      setError('');
    }
  }, [visible]);

  const validateInput = (): boolean => {
    const num = parseInt(inputQuantity, 10);
    if (isNaN(num) || num < 1 || num > totalQuantity) {
      setError(`Inserisci un numero tra 1 e ${totalQuantity} (${unit}).`);
      return false;
    }
    if (num === 0) {
      setError('La quantità deve essere almeno 1.');
      return false;
    }
    setError('');
    return true;
  };

  const handleConfirm = () => {
    if (!validateInput()) return;
    const consumedQty = parseInt(inputQuantity, 10);
    LoggingService.info('ConsumeQuantityModal', `Confermato consumo di ${consumedQty} ${unit} per ${product.name} (totale: ${totalQuantity})`);
    onConfirm(consumedQty);
  };

  const handleCancel = () => {
    LoggingService.info('ConsumeQuantityModal', 'Annullato consumo per ' + product.name);
    onCancel();
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleCancel}
    >
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, { backgroundColor: isDarkMode ? '#161b22' : '#ffffff' }]}>
            <View style={styles.header}>
              <Info size={24} color={isDarkMode ? '#c9d1d9' : '#1e293b'} />
              <Text style={[styles.title, { color: isDarkMode ? '#c9d1d9' : '#1e293b' }]}>
                Consuma {product.name}
              </Text>
              <TouchableOpacity onPress={handleCancel} style={styles.closeButton}>
                <X size={24} color={isDarkMode ? '#8b949e' : '#64748b'} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.description, { color: isDarkMode ? '#8b949e' : '#64748b' }]}>
              Hai {totalQuantity} {unit} disponibili. Quante unità vuoi consumare?
            </Text>

            <View style={styles.inputContainer}>
              <TextInput
                style={[styles.input, { backgroundColor: isDarkMode ? '#21262d' : '#f8f9fa', color: isDarkMode ? '#c9d1d9' : '#1e293b' }]}
                value={inputQuantity}
                onChangeText={setInputQuantity}
                placeholder={`Es. ${totalQuantity > 1 ? '1-' + totalQuantity : totalQuantity}`}
                placeholderTextColor={isDarkMode ? '#8b949e' : '#64748b'}
                keyboardType="numeric"
                maxLength={String(totalQuantity).length}
              />
              {error ? (
                <Text style={[styles.error, { color: '#ef4444' }]}>{error}</Text>
              ) : null}
            </View>

            <View style={styles.buttonsContainer}>
              <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={handleCancel}>
                <Text style={styles.buttonText}>Annulla</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.button,
                  styles.confirmButton,
                  (!inputQuantity || error) && styles.confirmButtonDisabled,
                ]}
                onPress={handleConfirm}
                disabled={!inputQuantity || !!error}
              >
                <CheckCircle size={20} color="#ffffff" />
                <Text style={styles.buttonText}>Conferma</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const getStyles = (isDarkMode: boolean) => StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 20,
  },
  modalContent: {
    width: '90%',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  title: {
    flex: 1,
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    textAlign: 'center',
    marginLeft: 8,
  },
  closeButton: {
    padding: 4,
  },
  description: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  },
  inputContainer: {
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: isDarkMode ? '#30363d' : '#e2e8f0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
  },
  error: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    marginTop: 4,
    textAlign: 'center',
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  cancelButton: {
    backgroundColor: isDarkMode ? '#21262d' : '#f8f9fa',
    borderWidth: 1,
    borderColor: isDarkMode ? '#30363d' : '#e2e8f0',
  },
  confirmButton: {
    backgroundColor: '#16a34a',
  },
  confirmButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  buttonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#ffffff',
  },
});
