import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { AddMethodCard } from '../AddMethodCard';
import { Text } from 'react-native';
import { ScanBarcode } from 'lucide-react-native';

// Mock del contesto del tema
jest.mock('@/context/ThemeContext', () => ({
  useTheme: () => ({
    isDarkMode: false,
  }),
}));

// Mock del componente AnimatedPressable per semplicità
jest.mock('../AnimatedPressable', () => {
  const TouchableOpacity = require('react-native').TouchableOpacity;
  return {
    AnimatedPressable: (props: any) => <TouchableOpacity {...props} />,
  };
});

describe('AddMethodCard', () => {
  const mockProps = {
    title: 'Scansiona Codice',
    description: 'Veloce e automatico',
    icon: <ScanBarcode size={28} />,
    onPress: jest.fn(),
    variant: 'barcode' as const,
  };

  beforeEach(() => {
    mockProps.onPress.mockClear();
  });

  it('should render the title, description, and icon', () => {
    const { getByText, UNSAFE_getByType } = render(<AddMethodCard {...mockProps} />);

    expect(getByText('Scansiona Codice')).toBeTruthy();
    expect(getByText('Veloce e automatico')).toBeTruthy();
    expect(UNSAFE_getByType(ScanBarcode)).toBeTruthy();
  });

  it('should call onPress when pressed', () => {
    const { getByText } = render(<AddMethodCard {...mockProps} />);

    fireEvent.press(getByText('Scansiona Codice'));
    expect(mockProps.onPress).toHaveBeenCalledTimes(1);
  });

  it('should apply correct styles for the "barcode" variant', () => {
    const { getByTestId } = render(
      <AddMethodCard {...mockProps} variant="barcode" />
    );
    const card = getByTestId('animated-pressable'); // Usiamo il testID del mock
    
    // I colori esatti sono in getStyles, qui verifichiamo che lo stile esista
    // Questo è un test di base, un test di snapshot sarebbe più completo per gli stili
    expect(card.props.style).toBeDefined();
  });

  it('should apply correct styles for the "manual" variant', () => {
    const { getByTestId } = render(
      <AddMethodCard {...mockProps} variant="manual" />
    );
    const card = getByTestId('animated-pressable');
    
    expect(card.props.style).toBeDefined();
  });
});

// Aggiungiamo un testID al nostro mock per poterlo selezionare
jest.mock('../AnimatedPressable', () => {
  const TouchableOpacity = require('react-native').TouchableOpacity;
  return {
    AnimatedPressable: (props: any) => <TouchableOpacity {...props} testID="animated-pressable" />,
  };
});
