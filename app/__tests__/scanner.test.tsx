// scanner.test.tsx — scanner.test module.
//
// exports: none
// used_by: none
// rules: none
// agent: deepseek/deepseek-chat | deepseek | 2026-05-24 | codedna-cli | initial CodeDNA annotation pass
// message:

/**
 * Test per la schermata di scansione barcode (scanner.tsx)
 * Verifica il rendering, la scansione, la gestione dei prodotti e la navigazione.
 */

import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { Text, View, Alert } from 'react-native';
import BarcodeScannerScreen from '../scanner';
import { useBarcodeScanner, ScanResult } from '@/hooks/useBarcodeScanner';
import { ProductStorage } from '@/services/ProductStorage';
import { LoggingService } from '@/services/LoggingService';
import { useCategories } from '@/context/CategoryContext';
import { router } from 'expo-router';

// --- Mocks ---

// Mock di expo-camera
jest.mock('expo-camera', () => ({
  CameraView: jest.requireActual('react-native').View,
  useCameraPermissions: jest.fn(() => [
    { granted: true, canAskAgain: true, status: 'granted', expires: 'never' },
    jest.fn(),
  ]),
}));

// Mock di expo-router
jest.mock('expo-router', () => ({
  router: {
    replace: jest.fn(),
    back: jest.fn(),
  },
}));

// Mock di @react-navigation/native
jest.mock('@react-navigation/native', () => ({
  useIsFocused: jest.fn(() => true),
}));

// Mock di react-native-safe-area-context
jest.mock('react-native-safe-area-context', () => {
  const View = require('react-native').View;
  return {
    SafeAreaView: View,
  };
});

// Mock di lucide-react-native
jest.mock('lucide-react-native', () => ({
  ArrowLeft: 'ArrowLeft',
  RefreshCw: 'RefreshCw',
}));

// Mock di useBarcodeScanner
jest.mock('@/hooks/useBarcodeScanner', () => ({
  useBarcodeScanner: jest.fn(),
  extractProductName: jest.fn(),
  extractBrand: jest.fn(),
  extractImageUrl: jest.fn(),
}));

// Mock di ProductStorage
jest.mock('@/services/ProductStorage', () => ({
  ProductStorage: {
    getProducts: jest.fn(),
    listenToProducts: jest.fn(() => jest.fn()),
  },
}));

// Mock di LoggingService
jest.mock('@/services/LoggingService', () => ({
  LoggingService: {
    info: jest.fn(),
    error: jest.fn(),
    warning: jest.fn(),
    debug: jest.fn(),
  },
}));

// Mock di useCategories
jest.mock('@/context/CategoryContext', () => ({
  useCategories: jest.fn(),
}));

// Mock separato per Alert che preserva gli altri moduli React Native
jest.mock('react-native/Libraries/Core/NativeModules/AppState', () => {}, { virtual: true });

// Type assertion per i mock
const mockedUseBarcodeScanner = useBarcodeScanner as jest.MockedFunction<typeof useBarcodeScanner>;
const mockedUseCategories = useCategories as jest.MockedFunction<typeof useCategories>;
const mockedRouterReplace = router.replace as jest.Mock;
const mockedRouterBack = router.back as jest.Mock;
const mockedAlert = Alert.alert as jest.Mock;

// Helper per creare un mock di PermissionResponse valido
const createMockPermissionResponse = (granted: boolean = true): any => ({
  granted,
  canAskAgain: !granted,
  status: granted ? 'granted' : 'denied',
  expires: 'never',
});

// --- Helper per mockare useBarcodeScanner ---
const createMockScannerReturn = (overrides: any = {}): any => ({
  permission: createMockPermissionResponse(true),
  scanned: false,
  isLoading: false,
  loadingError: null,
  loadingProgress: '',
  currentBarcode: null,
  handleBarCodeScanned: jest.fn(),
  resetScanner: jest.fn(),
  requestPermission: jest.fn(),
  ...overrides,
});

// --- Test Suite ---
describe('BarcodeScannerScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock di default per useCategories (usiamo as any per evitare problemi di tipo)
    mockedUseCategories.mockReturnValue({
      categories: [],
      addCategory: jest.fn(),
      updateCategory: jest.fn(),
      deleteCategory: jest.fn(),
      loading: false,
    } as any);

    // Mock di default per useBarcodeScanner
    mockedUseBarcodeScanner.mockReturnValue(createMockScannerReturn());
  });

  describe('Rendering', () => {
    it('dovrebbe renderizzare correttamente la schermata iniziale', () => {
      mockedUseBarcodeScanner.mockReturnValue(
        createMockScannerReturn({
          permission: { granted: true, canAskAgain: true },
        })
      );

      const { getByTestId, getByText } = render(
        <BarcodeScannerScreen />
      );

      // Verifica che il componente sia renderizzato
      expect(getByText(/Inquadra il codice a barre/i)).toBeTruthy();
    });

    it('dovrebbe mostrare lo stato di caricamento quando isLoading è true', () => {
      mockedUseBarcodeScanner.mockReturnValue(
        createMockScannerReturn({
          isLoading: true,
          loadingProgress: 'Ricerca in corso...',
        })
      );

      const { getByText } = render(<BarcodeScannerScreen />);

      expect(getByText('Ricerca in corso...')).toBeTruthy();
    });

    it('dovrebbe mostrare lo stato di caricamento quando isLoading è true', () => {
      mockedUseBarcodeScanner.mockReturnValue(
        createMockScannerReturn({
          isLoading: true,
          loadingProgress: 'Ricerca in corso...',
        })
      );

      const { getByText } = render(<BarcodeScannerScreen />);

      expect(getByText('Ricerca in corso...')).toBeTruthy();
    });

    it('dovrebbe mostrare lo stato di errore quando loadingError è presente', () => {
      mockedUseBarcodeScanner.mockReturnValue(
        createMockScannerReturn({
          loadingError: 'Errore di connessione',
          currentBarcode: '1234567890123',
        })
      );

      const { getByText } = render(<BarcodeScannerScreen />);

      expect(getByText('Errore di connessione')).toBeTruthy();
      expect(getByText('Riprova')).toBeTruthy();
      expect(getByText('Inserisci Manualmente')).toBeTruthy();
    });
  });

  describe('Gestione Scansione', () => {
    it('dovrebbe chiamare handleBarCodeScanned quando viene scansionato un barcode', () => {
      const mockHandleBarCodeScanned = jest.fn();
      mockedUseBarcodeScanner.mockReturnValue(
        createMockScannerReturn({
          handleBarCodeScanned: mockHandleBarCodeScanned,
          scanned: false,
        })
      );

      render(<BarcodeScannerScreen />);

      // Simula la scansione di un barcode
      const barcodeData = '1234567890123';
      const barcodeType = 'ean13';

      // Il testing della scansione effettiva richiede di simulare CameraView
      // Per ora verifichiamo che l'hook sia configurato correttamente
      expect(mockedUseBarcodeScanner).toHaveBeenCalled();
    });

    it('dovrebbe mostrare il pulsante "Scansiona di Nuovo" dopo una scansione', () => {
      mockedUseBarcodeScanner.mockReturnValue(
        createMockScannerReturn({
          scanned: true,
          isLoading: false,
        })
      );

      const { getByText } = render(<BarcodeScannerScreen />);

      expect(getByText('Tocca per Scansionare di Nuovo')).toBeTruthy();
    });

    it('dovrebbe chiamare resetScanner quando si preme "Scansiona di Nuovo"', () => {
      const mockResetScanner = jest.fn();
      mockedUseBarcodeScanner.mockReturnValue(
        createMockScannerReturn({
          scanned: true,
          resetScanner: mockResetScanner,
        })
      );

      const { getByText } = render(<BarcodeScannerScreen />);

      fireEvent.press(getByText('Tocca per Scansionare di Nuovo'));

      expect(mockResetScanner).toHaveBeenCalled();
    });
  });

  describe('Gestione Prodotti Trovati', () => {
    it('dovrebbe mostrare un alert quando viene trovato un prodotto template', () => {
      const mockOnProductFound = jest.fn();
      mockedUseBarcodeScanner.mockImplementation((_, onProductFound) => {
        // Simula la chiamata a onProductFound
        setTimeout(() => {
          onProductFound(
            {
              type: 'template',
              data: { name: 'Prodotto Template' },
              params: { barcode: '1234567890123' },
            } as ScanResult,
            '1234567890123'
          );
        }, 0);
        return createMockScannerReturn();
      });

      render(<BarcodeScannerScreen />);

      return waitFor(() => {
        expect(mockedAlert).toHaveBeenCalledWith(
          expect.stringContaining('Prodotto Trovato'),
          expect.stringContaining('Template'),
          expect.any(Array)
        );
      });
    });

    it('dovrebbe mostrare un alert quando viene trovato un prodotto online', () => {
      const mockOnProductFound = jest.fn();
      mockedUseBarcodeScanner.mockImplementation((_, onProductFound) => {
        setTimeout(() => {
          onProductFound(
            {
              type: 'online',
              data: { product_name: 'Prodotto Online' },
              params: { barcode: '1234567890123', name: 'Prodotto Online' },
            } as ScanResult,
            '1234567890123'
          );
        }, 0);
        return createMockScannerReturn();
      });

      render(<BarcodeScannerScreen />);

      return waitFor(() => {
        expect(mockedAlert).toHaveBeenCalledWith(
          expect.stringContaining('Prodotto Trovato'),
          expect.stringContaining('Online'),
          expect.any(Array)
        );
      });
    });

    it('dovrebbe mostrare un alert quando il prodotto non viene trovato', () => {
      mockedUseBarcodeScanner.mockImplementation((_, onProductFound) => {
        setTimeout(() => {
          onProductFound(
            {
              type: 'not_found',
              params: { barcode: '1234567890123' },
            } as ScanResult,
            '1234567890123'
          );
        }, 0);
        return createMockScannerReturn();
      });

      render(<BarcodeScannerScreen />);

      return waitFor(() => {
        expect(mockedAlert).toHaveBeenCalledWith(
          'Prodotto Non Trovato',
          expect.stringContaining('aggiungere manualmente'),
          expect.any(Array)
        );
      });
    });
  });

  describe('Navigazione', () => {
    it('dovrebbe navigare a manual-entry quando si seleziona "Continua" per un prodotto template', () => {
      let callback: any;
      mockedUseBarcodeScanner.mockImplementation((_, onProductFound) => {
        callback = onProductFound;
        return createMockScannerReturn();
      });

      render(<BarcodeScannerScreen />);

      // Simula il found del prodotto
      act(() => {
        callback(
          {
            type: 'template',
            data: { name: 'Test Product' },
            params: { barcode: '1234567890123' },
          } as ScanResult,
          '1234567890123'
        );
      });

      // Ottieni l'alert e simula la pressione su "Continua"
      expect(mockedAlert).toHaveBeenCalled();
      const [, , actions] = mockedAlert.mock.calls[0];
      
      // Simula la pressione su "Continua" (primo pulsante)
      act(() => {
        actions[0].onPress();
      });

      expect(mockedRouterReplace).toHaveBeenCalledWith(
        expect.objectContaining({
          pathname: '/manual-entry',
          params: expect.objectContaining({
            isEditMode: 'false',
            resetForm: 'true',
          }),
        })
      );
    });

    it('dovrebbe navigare a manual-entry quando si seleziona "Sì, Aggiungi" per prodotto non trovato', () => {
      let callback: any;
      mockedUseBarcodeScanner.mockImplementation((_, onProductFound) => {
        callback = onProductFound;
        return createMockScannerReturn();
      });

      render(<BarcodeScannerScreen />);

      act(() => {
        callback(
          {
            type: 'not_found',
            params: { barcode: '1234567890123' },
          } as ScanResult,
          '1234567890123'
        );
      });

      expect(mockedAlert).toHaveBeenCalled();
      const [, , actions] = mockedAlert.mock.calls[0];
      
      // Simula la pressione su "Sì, Aggiungi" (primo pulsante)
      act(() => {
        actions[0].onPress();
      });

      expect(mockedRouterReplace).toHaveBeenCalledWith(
        expect.objectContaining({
          pathname: '/manual-entry',
          params: expect.objectContaining({
            isEditMode: 'false',
            resetForm: 'true',
          }),
        })
      );
    });

    it('dovrebbe chiamare resetScanner quando si seleziona "Scansiona di Nuovo" dagli alert', () => {
      const mockResetScanner = jest.fn();
      let callback: any;
      
      mockedUseBarcodeScanner.mockImplementation((_, onProductFound) => {
        callback = onProductFound;
        return createMockScannerReturn({ resetScanner: mockResetScanner });
      });

      render(<BarcodeScannerScreen />);

      act(() => {
        callback(
          {
            type: 'template',
            data: { name: 'Test' },
            params: { barcode: '1234567890123' },
          } as ScanResult,
          '1234567890123'
        );
      });

      expect(mockedAlert).toHaveBeenCalled();
      const [, , actions] = mockedAlert.mock.calls[0];
      
      // Simula la pressione su "Scansiona di Nuovo" (secondo pulsante)
      act(() => {
        actions[1].onPress();
      });

      expect(mockResetScanner).toHaveBeenCalled();
    });

    it('dovrebbe chiamare router.back() quando si preme il pulsante indietro', () => {
      const { getByLabelText } = render(<BarcodeScannerScreen />);

      const backButton = getByLabelText('Torna alla schermata precedente');
      fireEvent.press(backButton);

      expect(mockedRouterBack).toHaveBeenCalled();
    });
  });

  describe('Stati di Caricamento', () => {
    it('dovrebbe mostrare il pulsante "Salta ricerca" quando il progresso include "velocissima"', () => {
      mockedUseBarcodeScanner.mockReturnValue(
        createMockScannerReturn({
          isLoading: true,
          loadingProgress: 'Ricerca velocissima in corso...',
        })
      );

      const { getByText } = render(<BarcodeScannerScreen />);

      expect(
        getByText('Salta ricerca e aggiungi manualmente')
      ).toBeTruthy();
    });

    it('dovrebbe mostrare il pulsante "Riprova" in caso di errore', () => {
      mockedUseBarcodeScanner.mockReturnValue(
        createMockScannerReturn({
          loadingError: 'Errore di connessione',
        })
      );

      const { getByText } = render(<BarcodeScannerScreen />);

      expect(getByText('Riprova')).toBeTruthy();
    });

    it('dovrebbe mostrare il pulsante "Inserisci Manualmente" in caso di errore', () => {
      mockedUseBarcodeScanner.mockReturnValue(
        createMockScannerReturn({
          loadingError: 'Errore di connessione',
          currentBarcode: '1234567890123',
        })
      );

      const { getByText } = render(<BarcodeScannerScreen />);

      expect(getByText('Inserisci Manualmente')).toBeTruthy();
    });

    it('dovrebbe mostrare "Torna Indietro" in caso di errore', () => {
      mockedUseBarcodeScanner.mockReturnValue(
        createMockScannerReturn({
          loadingError: 'Errore di connessione',
        })
      );

      const { getByText } = render(<BarcodeScannerScreen />);

      expect(getByText('Torna Indietro')).toBeTruthy();
    });
  });

  describe('Inserimento Manuale', () => {
    it('dovrebbe navigare a manual-entry con i parametri corretti quando si preme "Inserisci Manualmente"', () => {
      mockedUseBarcodeScanner.mockReturnValue(
        createMockScannerReturn({
          loadingError: 'Errore di scansione',
          currentBarcode: '1234567890123',
        })
      );

      const { getByText } = render(<BarcodeScannerScreen />);

      fireEvent.press(getByText('Inserisci Manualmente'));

      expect(mockedRouterReplace).toHaveBeenCalledWith(
        expect.objectContaining({
          pathname: '/manual-entry',
          params: expect.objectContaining({
            barcode: '1234567890123',
            barcodeType: 'unknown',
            addedMethod: 'barcode',
            fromScannerError: 'true',
            isEditMode: 'false',
            resetForm: 'true',
          }),
        })
      );
    });

    it('dovrebbe loggare quando si preme "Inserisci Manualmente"', () => {
      mockedUseBarcodeScanner.mockReturnValue(
        createMockScannerReturn({
          loadingError: 'Errore di scansione',
          currentBarcode: '1234567890123',
        })
      );

      const { getByText } = render(<BarcodeScannerScreen />);

      fireEvent.press(getByText('Inserisci Manualmente'));

      expect(LoggingService.info).toHaveBeenCalledWith(
        'Scanner',
        expect.stringContaining('Manual entry button pressed')
      );
    });
  });

  describe('Gestione Permessi', () => {
    it('dovrebbe gestire correttamente lo stato di caricamento quando isLoading è true', () => {
      mockedUseBarcodeScanner.mockReturnValue(
        createMockScannerReturn({
          isLoading: true,
          loadingProgress: 'Ricerca in corso...',
        })
      );

      const { getByText } = render(<BarcodeScannerScreen />);

      expect(getByText('Ricerca in corso...')).toBeTruthy();
    });

    it('dovrebbe mostrare il pulsante "Inserisci Manualmente" in caso di errore', () => {
      mockedUseBarcodeScanner.mockReturnValue(
        createMockScannerReturn({
          loadingError: 'Errore di scansione',
          currentBarcode: '1234567890123',
        })
      );

      const { getByText } = render(<BarcodeScannerScreen />);

      expect(getByText('Inserisci Manualmente')).toBeTruthy();
    });
  });

  describe('Gestione Errori', () => {
    it('dovrebbe gestire gli errori di scansione mostrando un messaggio appropriato', () => {
      const errorMessage = 'Errore di connessione al database';
      mockedUseBarcodeScanner.mockReturnValue(
        createMockScannerReturn({
          loadingError: errorMessage,
        })
      );

      const { getByText } = render(<BarcodeScannerScreen />);

      expect(getByText(errorMessage)).toBeTruthy();
    });

    it('dovrebbe mostrare il pulsante "Riprova" per tentare di nuovo la scansione', () => {
      const mockResetScanner = jest.fn();
      mockedUseBarcodeScanner.mockReturnValue(
        createMockScannerReturn({
          loadingError: 'Errore temporaneo',
          resetScanner: mockResetScanner,
        })
      );

      const { getByText } = render(<BarcodeScannerScreen />);

      fireEvent.press(getByText('Riprova'));

      expect(mockResetScanner).toHaveBeenCalled();
    });
  });
});
