import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { TestResult, DiagnosticTest } from '@/hooks/useDiagnosticTests';

export interface DiagnosticState {
  isRunning: boolean;
  results: TestResult[];
  availableTests: DiagnosticTest[];
  lastRun?: Date;
  error?: string;
}

type DiagnosticAction =
  | { type: 'SET_RUNNING'; payload: boolean }
  | { type: 'ADD_RESULT'; payload: TestResult }
  | { type: 'SET_RESULTS'; payload: TestResult[] }
  | { type: 'SET_AVAILABLE_TESTS'; payload: DiagnosticTest[] }
  | { type: 'SET_ERROR'; payload: string | undefined }
  | { type: 'RESET' };

const initialState: DiagnosticState = {
  isRunning: false,
  results: [],
  availableTests: [],
  lastRun: undefined,
  error: undefined,
};

function diagnosticReducer(state: DiagnosticState, action: DiagnosticAction): DiagnosticState {
  switch (action.type) {
    case 'SET_RUNNING':
      return { ...state, isRunning: action.payload };

    case 'ADD_RESULT':
      return {
        ...state,
        results: [...state.results, action.payload],
        lastRun: new Date(),
        error: undefined
      };

    case 'SET_RESULTS':
      return {
        ...state,
        results: action.payload,
        lastRun: action.payload.length > 0 ? new Date() : state.lastRun,
        error: undefined
      };

    case 'SET_AVAILABLE_TESTS':
      return { ...state, availableTests: action.payload };

    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
        isRunning: false
      };

    case 'RESET':
      return {
        ...initialState,
        availableTests: state.availableTests
      };

    default:
      return state;
  }
}

interface DiagnosticContextType {
  state: DiagnosticState;
  setRunning: (running: boolean) => void;
  addResult: (result: TestResult) => void;
  setResults: (results: TestResult[]) => void;
  setAvailableTests: (tests: DiagnosticTest[]) => void;
  setError: (error: string | undefined) => void;
  reset: () => void;
  runTest: (testId: string) => Promise<void>;
  runAllTests: () => Promise<void>;
}

const DiagnosticContext = createContext<DiagnosticContextType | undefined>(undefined);

interface DiagnosticProviderProps {
  children: ReactNode;
  onRunTest?: (testId: string) => Promise<void>;
  onRunAllTests?: () => Promise<void>;
}

export const DiagnosticProvider: React.FC<DiagnosticProviderProps> = ({
  children,
  onRunTest,
  onRunAllTests
}) => {
  const [state, dispatch] = useReducer(diagnosticReducer, initialState);

  const setRunning = (running: boolean) => {
    dispatch({ type: 'SET_RUNNING', payload: running });
  };

  const addResult = (result: TestResult) => {
    dispatch({ type: 'ADD_RESULT', payload: result });
  };

  const setResults = (results: TestResult[]) => {
    dispatch({ type: 'SET_RESULTS', payload: results });
  };

  const setAvailableTests = (tests: DiagnosticTest[]) => {
    dispatch({ type: 'SET_AVAILABLE_TESTS', payload: tests });
  };

  const setError = (error: string | undefined) => {
    dispatch({ type: 'SET_ERROR', payload: error });
  };

  const reset = () => {
    dispatch({ type: 'RESET' });
  };

  const runTest = async (testId: string) => {
    if (onRunTest) {
      await onRunTest(testId);
    }
  };

  const runAllTests = async () => {
    if (onRunAllTests) {
      await onRunAllTests();
    }
  };

  const contextValue: DiagnosticContextType = {
    state,
    setRunning,
    addResult,
    setResults,
    setAvailableTests,
    setError,
    reset,
    runTest,
    runAllTests,
  };

  return (
    <DiagnosticContext.Provider value={contextValue}>
      {children}
    </DiagnosticContext.Provider>
  );
};

export const useDiagnosticContext = (): DiagnosticContextType => {
  const context = useContext(DiagnosticContext);
  if (context === undefined) {
    throw new Error('useDiagnosticContext must be used within a DiagnosticProvider');
  }
  return context;
};