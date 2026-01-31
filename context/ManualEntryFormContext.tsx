import React, { createContext, useContext, ReactNode, useReducer, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import 'react-native-get-random-values';

/**
 * Represents a single quantity entry
 */
export interface Quantity {
  id: string;
  quantity: string;
  unit: string;
}

/**
 * Form field state interface
 */
export interface FormState {
  name: string;
  brand: string;
  selectedCategory: string;
  quantities: Quantity[];
  purchaseDate: string;
  expirationDate: string;
  notes: string;
  barcode: string;
  imageUrl: string | null;
  isFrozen: boolean;
}

/**
 * Reducer action types
 */
export type FormAction =
  | { type: 'SET_FIELD'; field: keyof Omit<FormState, 'quantities'>; value: string | null | boolean }
  | { type: 'ADD_QUANTITY' }
  | { type: 'REMOVE_QUANTITY'; id: string }
  | { type: 'UPDATE_QUANTITY'; id: string; field: 'quantity' | 'unit'; value: string }
  | { type: 'SET_QUANTITIES'; quantities: Quantity[] }
  | { type: 'INITIALIZE'; state: Partial<FormState> }
  | { type: 'CLEAR' };

const getInitialState = (): FormState => ({
  name: '',
  brand: '',
  selectedCategory: '',
  quantities: [{ id: uuidv4(), quantity: '1', unit: 'pz' }],
  purchaseDate: new Date().toISOString().split('T')[0],
  expirationDate: '',
  notes: '',
  barcode: '',
  imageUrl: null,
  isFrozen: false,
});

function formReducer(state: FormState, action: FormAction): FormState {
  switch (action.type) {
    case 'SET_FIELD':
      return { ...state, [action.field]: action.value };

    case 'ADD_QUANTITY':
      return {
        ...state,
        quantities: [...state.quantities, { id: uuidv4(), quantity: '1', unit: 'pz' }],
      };

    case 'REMOVE_QUANTITY':
      return {
        ...state,
        quantities: state.quantities.filter(q => q.id !== action.id),
      };

    case 'UPDATE_QUANTITY':
      return {
        ...state,
        quantities: state.quantities.map(q =>
          q.id === action.id ? { ...q, [action.field]: action.value } : q
        ),
      };

    case 'SET_QUANTITIES':
      return { ...state, quantities: action.quantities };

    case 'INITIALIZE':
      return { ...getInitialState(), ...action.state };

    case 'CLEAR':
      return getInitialState();

    default:
      return state;
  }
}

interface FormContextValue {
  state: FormState;
  dispatch: React.Dispatch<FormAction>;
}

const FormContext = createContext<FormContextValue | undefined>(undefined);

export const ManualEntryFormProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(formReducer, getInitialState());

  return (
    <FormContext.Provider value={{ state, dispatch }}>
      {children}
    </FormContext.Provider>
  );
};

export const useManualEntryForm = (): FormContextValue => {
  const context = useContext(FormContext);
  if (!context) {
    throw new Error('useManualEntryForm must be used within ManualEntryFormProvider');
  }
  return context;
};

export type { FormContextValue };
