import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { SettingsCard } from '../SettingsCard';
import { Text, Switch } from 'react-native';
import { Home } from 'lucide-react-native';

// Mock del contesto del tema, necessario perché il componente lo usa
jest.mock('@/context/ThemeContext', () => ({
  useTheme: () => ({
    isDarkMode: false,
  }),
}));

describe('SettingsCard', () => {
  it('should render the title and icon correctly', () => {
    const { getByText, queryAllByTestId } = render(
      <SettingsCard 
        title="Test Title" 
        icon={<Home testID="test-icon" />} 
      />
    );

    // Verifica che il titolo sia presente
    expect(getByText('Test Title')).toBeTruthy();
    // Verifica che almeno un elemento con il testID dell'icona sia presente
    expect(queryAllByTestId('test-icon').length).toBeGreaterThan(0);
  });

  it('should render the description when provided', () => {
    const { getByText } = render(
      <SettingsCard 
        title="Test Title" 
        description="Test Description" 
        icon={<Home />} 
      />
    );

    // Verifica che la descrizione sia presente
    expect(getByText('Test Description')).toBeTruthy();
  });

  it('should call onPress when the card is pressed', () => {
    const onPressMock = jest.fn();
    const { getByText } = render(
      <SettingsCard 
        title="Clickable Card" 
        icon={<Home />} 
        onPress={onPressMock} 
      />
    );

    // Simula il tocco sulla card
    fireEvent.press(getByText('Clickable Card'));

    // Verifica che la funzione onPress sia stata chiamata una volta
    expect(onPressMock).toHaveBeenCalledTimes(1);
  });

  it('should render a custom control when provided', () => {
    const { getByTestId } = render(
      <SettingsCard 
        title="Card with Control" 
        icon={<Home />} 
        control={<Switch testID="test-switch" value={true} />} 
      />
    );

    // Verifica che il controllo personalizzato (lo Switch) sia presente
    expect(getByTestId('test-switch')).toBeTruthy();
  });

  it('should not be pressable if onPress is not provided', () => {
    const { getByText } = render(
      <SettingsCard 
        title="Not Pressable" 
        icon={<Home />} 
      />
    );
    
    // react-native-testing-library lancia un errore se si tenta di premere un elemento non cliccabile,
    // ma qui verifichiamo che non ci siano handler di pressione in modo implicito.
    // La logica interna del componente usa un TouchableOpacity solo se onPress è definito.
    // Un test più robusto potrebbe verificare il tipo di componente radice (View vs TouchableOpacity),
    // ma questo va oltre lo scopo di un test di base.
    const card = getByText('Not Pressable').parent?.parent;
    expect(card?.props.onPress).toBeUndefined();
  });
});
