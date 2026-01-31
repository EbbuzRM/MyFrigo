import React, { useCallback } from 'react';
import { TouchableOpacity, Text, ActivityIndicator, AccessibilityProps } from 'react-native';
import { getStyles } from './ProductFormFooter.styles';

interface FormActionButtonsProps extends AccessibilityProps {
  onSave: () => void;
  isEditMode: boolean;
  isLoading: boolean;
  isDarkMode: boolean;
}

export const FormActionButtons: React.FC<FormActionButtonsProps> = React.memo(
  ({ onSave, isEditMode, isLoading, isDarkMode, accessible = true, accessibilityLabel }) => {
    const styles = getStyles(isDarkMode);

    const handleSave = useCallback(() => {
      if (!isLoading) {
        onSave();
      }
    }, [onSave, isLoading]);

    const buttonText = isEditMode ? 'Aggiorna Prodotto' : 'Salva Prodotto';

    return (
      <TouchableOpacity
        style={[styles.saveButton, isLoading && styles.saveButtonDisabled]}
        onPress={handleSave}
        disabled={isLoading}
        accessible={accessible}
        accessibilityLabel={accessibilityLabel || buttonText}
        accessibilityRole="button"
        accessibilityState={{ disabled: isLoading }}
        accessibilityHint={isEditMode ? 'Updates the existing product' : 'Saves the new product'}
      >
        {isLoading ? (
          <ActivityIndicator color="#ffffff" accessible={false} />
        ) : (
          <Text style={styles.saveButtonText}>{buttonText}</Text>
        )}
      </TouchableOpacity>
    );
  }
);

FormActionButtons.displayName = 'FormActionButtons';
