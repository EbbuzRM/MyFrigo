// ConsumeActions.tsx — ConsumeActions module.
//
// exports: ConsumeActions
// used_by: components\ConsumeQuantityModal.tsx
// rules:   - All style props (containerStyle, buttonStyle, cancelButtonStyle, confirmButtonStyle, disabledButtonStyle, buttonTextStyle, cancelButtonTextStyle) must remain as required external props and cannot be hardcoded inline
//          - Accessibility attributes (accessibilityLabel, accessibilityRole, accessibilityState) must be preserved on all interactive elements, including disabled state indication
//          - The `onCancel` and `onConfirm` callbacks must remain memoized via useCallback with correct dependency arrays
// agent:   deepseek/deepseek-chat | deepseek | 2026-05-09 | codedna-cli | initial CodeDNA annotation pass
// message: 

import React, { useCallback, useMemo } from 'react';
import { TouchableOpacity, Text, View, ViewStyle, TextStyle } from 'react-native';
import { CheckCircle } from 'lucide-react-native';

interface ConsumeActionsProps {
  onCancel: () => void;
  onConfirm: () => void;
  isConfirmDisabled: boolean;
  containerStyle: ViewStyle;
  buttonStyle: ViewStyle;
  cancelButtonStyle: ViewStyle;
  confirmButtonStyle: ViewStyle;
  disabledButtonStyle: ViewStyle;
  buttonTextStyle: TextStyle;
  cancelButtonTextStyle: TextStyle;
}

export const ConsumeActions = React.memo(({
  onCancel, onConfirm, isConfirmDisabled,
  containerStyle, buttonStyle, cancelButtonStyle, confirmButtonStyle, disabledButtonStyle,
  buttonTextStyle, cancelButtonTextStyle,
}: ConsumeActionsProps) => {
  const handleConfirm = useCallback(() => !isConfirmDisabled && onConfirm(), [onConfirm, isConfirmDisabled]);
  const confirmButtonStyles = useMemo(() => [buttonStyle, confirmButtonStyle, isConfirmDisabled && disabledButtonStyle],
    [buttonStyle, confirmButtonStyle, disabledButtonStyle, isConfirmDisabled]);

  return (
    <View style={containerStyle}>
      <TouchableOpacity style={[buttonStyle, cancelButtonStyle]} onPress={onCancel} accessible accessibilityLabel="Annulla" accessibilityRole="button" activeOpacity={0.7} testID="cancel-button">
        <Text style={cancelButtonTextStyle}>Annulla</Text>
      </TouchableOpacity>
      <TouchableOpacity style={confirmButtonStyles} onPress={handleConfirm} disabled={isConfirmDisabled} accessible accessibilityLabel="Conferma" accessibilityRole="button" accessibilityState={{ disabled: isConfirmDisabled }} activeOpacity={0.7} testID="confirm-button">
        <CheckCircle size={20} color="#ffffff" />
        <Text style={buttonTextStyle}>Conferma</Text>
      </TouchableOpacity>
    </View>
  );
});

ConsumeActions.displayName = 'ConsumeActions';
