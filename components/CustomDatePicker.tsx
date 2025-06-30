import React from 'react';
import { Modal, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Calendar } from 'react-native-calendars';
import { useTheme } from '@/context/ThemeContext';

interface CustomDatePickerProps {
  value: Date;
  onChange: (event: DateTimePickerEvent, date?: Date) => void;
  onClose: () => void;
  minimumDate?: Date;
  maximumDate?: Date;
}

export function CustomDatePicker({ value, onChange, onClose, minimumDate, maximumDate }: CustomDatePickerProps) {
  const { isDarkMode } = useTheme();
  const styles = getStyles(isDarkMode);

  if (Platform.OS === 'web') {
    return (
      <Modal transparent={true} animationType="fade" onRequestClose={onClose}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Select Date</Text>
            <Calendar
              current={value.toISOString().split('T')[0]}
              onDayPress={(day) => {
                onChange({ type: 'set' } as DateTimePickerEvent, new Date(day.timestamp));
              }}
              minDate={minimumDate?.toISOString().split('T')[0]}
              maxDate={maximumDate?.toISOString().split('T')[0]}
              theme={{
                backgroundColor: isDarkMode ? '#161b22' : '#ffffff',
                calendarBackground: isDarkMode ? '#161b22' : '#ffffff',
                textSectionTitleColor: isDarkMode ? '#c9d1d9' : '#1e293b',
                selectedDayBackgroundColor: '#2563EB',
                selectedDayTextColor: '#ffffff',
                todayTextColor: '#2563EB',
                dayTextColor: isDarkMode ? '#c9d1d9' : '#1e293b',
                textDisabledColor: isDarkMode ? '#8b949e' : '#d1d5db',
                dotColor: '#2563EB',
                selectedDotColor: '#ffffff',
                arrowColor: '#2563EB',
                monthTextColor: isDarkMode ? '#c9d1d9' : '#1e293b',
                indicatorColor: '#2563EB',
                textDayFontFamily: 'Inter-Regular',
                textMonthFontFamily: 'Inter-Bold',
                textDayHeaderFontFamily: 'Inter-SemiBold',
              }}
            />
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  }

  return (
    <DateTimePicker
      testID="dateTimePicker"
      value={value}
      mode="date"
      display="default"
      onChange={onChange}
      minimumDate={minimumDate}
      maximumDate={maximumDate}
    />
  );
}

const getStyles = (isDarkMode: boolean) =>
  StyleSheet.create({
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContainer: {
      backgroundColor: isDarkMode ? '#161b22' : '#ffffff',
      padding: 20,
      borderRadius: 10,
      width: '80%',
      alignItems: 'stretch',
    },
    modalTitle: {
      fontSize: 18,
      fontFamily: 'Inter-Bold',
      marginBottom: 15,
      textAlign: 'center',
      color: isDarkMode ? '#c9d1d9' : '#1e293b',
    },
    closeButtonText: {
      color: '#ffffff',
      fontSize: 16,
      fontFamily: 'Inter-Bold',
    },
  });
