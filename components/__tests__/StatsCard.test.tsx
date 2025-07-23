import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { StatsCard } from '../StatsCard';
import { StyleSheet } from 'react-native';
import { Package } from 'lucide-react-native';

// Mock del contesto del tema
jest.mock('@/context/ThemeContext', () => ({
  useTheme: () => ({
    isDarkMode: false,
  }),
}));

describe('StatsCard', () => {
  const mockProps = {
    title: 'Prodotti Attivi',
    value: '15',
    icon: <Package size={24} color="#000" />,
    lightBackgroundColor: '#e0f2fe',
    darkBackgroundColor: '#0c4a6e',
    onPress: jest.fn(),
  };

  beforeEach(() => {
    mockProps.onPress.mockClear();
  });

  it('should render the title, value, and icon', () => {
    const { getByText, UNSAFE_getByType } = render(<StatsCard {...mockProps} />);

    expect(getByText('Prodotti Attivi')).toBeTruthy();
    expect(getByText('15')).toBeTruthy();
    expect(UNSAFE_getByType(Package)).toBeTruthy();
  });

  it('should be pressable and call onPress when provided', () => {
    const { getByText } = render(<StatsCard {...mockProps} />);

    fireEvent.press(getByText('Prodotti Attivi'));
    expect(mockProps.onPress).toHaveBeenCalledTimes(1);
  });

  it('should not be pressable if onPress is not provided', () => {
    const { getByText } = render(
      <StatsCard
        title="Not Pressable"
        value="10"
        icon={<Package />}
        lightBackgroundColor="#fff"
        darkBackgroundColor="#000"
      />
    );
    
    const card = getByText('Not Pressable').parent?.parent;
    expect(card?.props.onPress).toBeUndefined();
  });

  it('should apply the correct background color for light mode', () => {
    const { getByTestId } = render(<StatsCard {...mockProps} />);
    const card = getByTestId('stats-card');
    
    const style = StyleSheet.flatten(card.props.style);
    expect(style.backgroundColor).toBe(mockProps.lightBackgroundColor);
  });
});
