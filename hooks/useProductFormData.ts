import { useState, useCallback, useRef } from 'react';
import { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { LoggingService } from '@/services/LoggingService';

export interface UseProductFormDataReturn {
  // Loading state
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;

  // Date picker states
  showPurchaseDatePicker: boolean;
  setShowPurchaseDatePicker: (show: boolean) => void;
  showExpirationDatePicker: boolean;
  setShowExpirationDatePicker: (show: boolean) => void;

  // Category modal state
  isCategoryModalVisible: boolean;
  setIsCategoryModalVisible: (visible: boolean) => void;
  newCategoryNameInput: string;
  setNewCategoryNameInput: (name: string) => void;

  // Navigation ref
  navigatingToPhotoCapture: React.MutableRefObject<boolean>;

  // Date handlers - return the date string if set, null otherwise
  onChangePurchaseDate: (event: DateTimePickerEvent, selectedDate?: Date) => string | null;
  onChangeExpirationDate: (event: DateTimePickerEvent, selectedDate?: Date) => string | null;

  // Constants
  ADD_NEW_CATEGORY_ID: string;
}

export const useProductFormData = (): UseProductFormDataReturn => {
  const [isLoading, setIsLoading] = useState(true);
  const [showPurchaseDatePicker, setShowPurchaseDatePicker] = useState(false);
  const [showExpirationDatePicker, setShowExpirationDatePicker] = useState(false);
  const [isCategoryModalVisible, setIsCategoryModalVisible] = useState(false);
  const [newCategoryNameInput, setNewCategoryNameInput] = useState('');
  const navigatingToPhotoCapture = useRef(false);

  const ADD_NEW_CATEGORY_ID = 'add_new_category_sentinel_value';

  const onChangePurchaseDate = useCallback((event: DateTimePickerEvent, selectedDate?: Date) => {
    LoggingService.info('useProductFormData', `onChangePurchaseDate called with event.type: ${event.type}`);
    setShowPurchaseDatePicker(false);
    if (event.type === 'set' && selectedDate) {
      const dateString = selectedDate.toISOString().split('T')[0];
      LoggingService.info('useProductFormData', `Purchase date selected: ${dateString}`);
      return dateString;
    }
    return null;
  }, []);

  const onChangeExpirationDate = useCallback((event: DateTimePickerEvent, selectedDate?: Date) => {
    LoggingService.info('useProductFormData', `onChangeExpirationDate called with event.type: ${event.type}`);
    setShowExpirationDatePicker(false);
    if (event.type === 'set' && selectedDate) {
      const dateString = selectedDate.toISOString().split('T')[0];
      LoggingService.info('useProductFormData', `Expiration date selected: ${dateString}`);
      return dateString;
    }
    return null;
  }, []);

  return {
    isLoading,
    setIsLoading,
    showPurchaseDatePicker,
    setShowPurchaseDatePicker,
    showExpirationDatePicker,
    setShowExpirationDatePicker,
    isCategoryModalVisible,
    setIsCategoryModalVisible,
    newCategoryNameInput,
    setNewCategoryNameInput,
    navigatingToPhotoCapture,
    onChangePurchaseDate,
    onChangeExpirationDate,
    ADD_NEW_CATEGORY_ID,
  };
};
