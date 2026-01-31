import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';

export interface ValidationCheckProps {
  isValid: boolean;
  text: string;
  validColor?: string;
  invalidColor?: string;
  iconSize?: number;
  testID?: string;
}

export const ValidationCheck: React.FC<ValidationCheckProps> = ({
  isValid,
  text,
  validColor = '#28a745',
  invalidColor = '#6c757d',
  iconSize = 16,
  testID,
}) => {
  return (
    <View style={styles.container} testID={testID}>
      <FontAwesome
        name={isValid ? 'check-circle' : 'circle-o'}
        size={iconSize}
        color={isValid ? validColor : invalidColor}
        testID={`${testID}-icon`}
      />
      <Text style={[styles.text, { color: isValid ? validColor : invalidColor }]} testID={`${testID}-text`}>
        {text}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  text: {
    marginLeft: 8,
    fontSize: 14,
  },
});

export default ValidationCheck;
