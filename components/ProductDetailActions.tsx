import React, { memo } from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { Edit, CheckCircle, Trash2 } from 'lucide-react-native';

interface ProductDetailActionsProps {
  canConsume: boolean;
  onEdit: () => void;
  onConsume: () => void;
  onDelete: () => void;
  disabled?: boolean;
}

export const ProductDetailActions: React.FC<ProductDetailActionsProps> = memo(({
  canConsume,
  onEdit,
  onConsume,
  onDelete,
  disabled = false
}) => {
  const { isDarkMode } = useTheme();
  const styles = getStyles(isDarkMode);

  return (
    <View style={styles.actionsSection}>
      <TouchableOpacity
        style={[styles.editButton, disabled && styles.buttonDisabled]}
        onPress={onEdit}
        disabled={disabled}
        accessibilityLabel="Modifica prodotto"
        accessibilityRole="button"
        accessibilityHint="Apri la schermata di modifica del prodotto"
      >
        <Edit size={20} color="#ffffff" />
        <Text style={styles.editButtonText}>Modifica Prodotto</Text>
      </TouchableOpacity>

      {canConsume && (
        <TouchableOpacity
          style={[styles.consumeButton, disabled && styles.buttonDisabled]}
          onPress={onConsume}
          disabled={disabled}
          accessibilityLabel="Segna come consumato"
          accessibilityRole="button"
          accessibilityHint="Segna il prodotto come consumato o apri la schermata per scegliere la quantità"
        >
          <CheckCircle size={20} color="#ffffff" />
          <Text style={styles.consumeButtonText}>Segna come Consumato</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity
        style={[styles.deleteButton, disabled && styles.buttonDisabled]}
        onPress={onDelete}
        disabled={disabled}
        accessibilityLabel="Elimina prodotto"
        accessibilityRole="button"
        accessibilityHint="Elimina definitivamente il prodotto"
      >
        <Trash2 size={20} color="#ffffff" />
        <Text style={styles.deleteButtonText}>Elimina Prodotto</Text>
      </TouchableOpacity>
    </View>
  );
});

const getStyles = (isDarkMode: boolean) => StyleSheet.create({
  actionsSection: {
    gap: 8,
    marginTop: 10,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3b82f6',
    paddingVertical: 12,
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
    paddingVertical: 12,
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
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  deleteButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#ffffff',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});