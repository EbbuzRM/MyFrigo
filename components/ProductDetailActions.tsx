// ProductDetailActions.tsx — ProductDetailActions module.
//
// exports: ProductDetailActions
// used_by: none
// rules:   - Accessibility attributes (accessibilityLabel, accessibilityRole, accessibilityHint, accessibilityState) must be preserved on all interactive elements in this component.
//          - The `disabled` prop must consistently disable all user interactions and visually style all action buttons accordingly.
//          - All action buttons must maintain their existing icon+text layout structure and styling pattern.
// agent:   deepseek/deepseek-chat | deepseek | 2026-05-09 | codedna-cli | initial CodeDNA annotation pass
// message: 

import React, { memo } from 'react';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
  const { isDarkMode } = useTheme();
  const styles = getStyles(isDarkMode);

  return (
    <View style={styles.actionsSection}>
      <TouchableOpacity
        style={[styles.editButton, disabled && styles.buttonDisabled]}
        onPress={onEdit}
        disabled={disabled}
        accessibilityLabel={t('products.editProduct')}
        accessibilityRole="button"
        accessibilityHint={t('products.editProductHint')}
        accessibilityState={{ disabled }}
      >
        <Edit size={20} color="#ffffff" />
        <Text style={styles.editButtonText}>{t('products.editProduct')}</Text>
      </TouchableOpacity>

{canConsume && (
         <TouchableOpacity
           testID="consume-button"
           style={[styles.consumeButton, disabled && styles.buttonDisabled]}
           onPress={onConsume}
           disabled={disabled}
           accessibilityLabel={t('products.consumeProduct')}
           accessibilityRole="button"
           accessibilityHint={t('products.consumeProductHint')}
           accessibilityState={{ disabled }}
         >
          <CheckCircle size={20} color="#ffffff" />
          <Text style={styles.consumeButtonText}>{t('products.consumeProduct')}</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity
        style={[styles.deleteButton, disabled && styles.buttonDisabled]}
        onPress={onDelete}
        disabled={disabled}
        accessibilityLabel={t('products.deleteProduct')}
        accessibilityRole="button"
        accessibilityHint={t('products.deleteProductHint')}
        accessibilityState={{ disabled }}
      >
        <Trash2 size={20} color="#ffffff" />
        <Text style={styles.deleteButtonText}>{t('products.deleteProduct')}</Text>
      </TouchableOpacity>
    </View>
  );
});

const getStyles = (_isDarkMode: boolean) => StyleSheet.create({
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
