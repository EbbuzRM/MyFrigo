import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { CustomDatePicker } from '../CustomDatePicker';
import { Platform } from 'react-native';

// --- Mocks ---

// Mock del contesto del tema
jest.mock('@/context/ThemeContext', () => ({
  useTheme: () => ({ isDarkMode: false }),
}));

// Mock del componente DateTimePicker
jest.mock('@react-native-community/datetimepicker', () => {
  const React = require('react');
  const { View, Text, TouchableOpacity } = require('react-native');
  
  // Un finto DateTimePicker che possiamo controllare
  const MockDateTimePicker = (props: any) => {
    const { value, onChange } = props;
    
    const simulateChange = () => {
      // Simula l'utente che sceglie una data (es. il giorno dopo)
      const newDate = new Date(value);
      newDate.setDate(newDate.getDate() + 1);
      onChange({ type: 'set' }, newDate);
    };

    return (
      <View>
        <Text testID="mock-picker-date">{value.toDateString()}</Text>
        <TouchableOpacity testID="mock-picker-change-button" onPress={simulateChange}>
          <Text>Change Date</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return {
    __esModule: true,
    default: MockDateTimePicker,
  };
});

describe('CustomDatePicker', () => {
  
  // Assicura che i test vengano eseguiti in un ambiente nativo simulato
  beforeAll(() => {
    Platform.OS = 'ios';
  });

  const today = new Date();
  const onChangeMock = jest.fn();
  const onCloseMock = jest.fn();

  beforeEach(() => {
    onChangeMock.mockClear();
    onCloseMock.mockClear();
  });

  it('should render the DateTimePicker with the correct initial value', () => {
    const { getByTestId } = render(
      <CustomDatePicker
        value={today}
        onChange={onChangeMock}
        onClose={onCloseMock}
      />
    );

    // Verifica che il nostro finto picker mostri la data corretta
    expect(getByTestId('mock-picker-date').props.children).toBe(today.toDateString());
  });

  it('should call onChange when the date is changed in the picker', () => {
    const { getByTestId } = render(
      <CustomDatePicker
        value={today}
        onChange={onChangeMock}
        onClose={onCloseMock}
      />
    );

    const changeButton = getByTestId('mock-picker-change-button');
    fireEvent.press(changeButton);

    // Verifica che la nostra funzione mock sia stata chiamata
    expect(onChangeMock).toHaveBeenCalledTimes(1);
    
    // Verifica che sia stata chiamata con una nuova data
    const expectedNewDate = new Date(today);
    expectedNewDate.setDate(expectedNewDate.getDate() + 1);
    
    // Compara i timestamp per evitare problemi di fuso orario
    expect(onChangeMock.mock.calls[0][1].getTime()).toBe(expectedNewDate.getTime());
  });
});
