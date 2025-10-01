import React from 'react';
import { render, act, waitFor } from '@testing-library/react-native';
import { Text, View } from 'react-native';
import { ProductProvider, useProducts } from '../ProductContext';
import { ProductStorage } from '@/services/ProductStorage';
import { useAuth } from '../AuthContext';
import { useSettings } from '../SettingsContext';
import { Product } from '@/types/Product';

// --- Mocks ---

// Mock del LoggingService
jest.mock('@/services/LoggingService', () => ({
  LoggingService: {
    info: jest.fn(),
    error: jest.fn(),
    warning: jest.fn(),
  },
}));

// Mock del servizio di storage
jest.mock('@/services/ProductStorage', () => ({
  ProductStorage: {
    getProducts: jest.fn(),
    listenToProducts: jest.fn(() => jest.fn()), // Ritorna una funzione di unsubscribe fittizia
  },
}));

// Mock di expo-notifications
jest.mock('expo-notifications', () => ({
  cancelAllScheduledNotificationsAsync: jest.fn(),
}));

// Mock dell'event emitter
const mockEventEmitter = {
  on: jest.fn(),
  off: jest.fn(),
};

// Mock di NotificationService per evitare errori di ambiente nativo
jest.mock('@/services/NotificationService', () => ({
  NotificationService: {
    scheduleExpirationNotification: jest.fn(),
    cancelNotification: jest.fn(),
    scheduleMultipleNotifications: jest.fn(),
  },
  eventEmitter: mockEventEmitter,
}));

// Mock del contesto di autenticazione
jest.mock('../AuthContext', () => ({
  useAuth: jest.fn(),
}));

// Mock del contesto delle impostazioni
jest.mock('../SettingsContext', () => ({
  useSettings: jest.fn(),
}));

// Type assertion per i mock
const mockedGetProducts = ProductStorage.getProducts as jest.Mock;
const mockedUseAuth = useAuth as jest.Mock;
const mockedUseSettings = useSettings as jest.Mock;

// --- Componente di Test ---
// Un piccolo componente che usa il nostro hook e visualizza i dati del contesto
const TestComponent = () => {
  const { products, loading } = useProducts();
  if (loading) {
    return <Text>Loading...</Text>;
  }
  return (
    <View>
      {products.map((p) => (
        <Text key={p.id}>{p.name}</Text>
      ))}
    </View>
  );
};

// --- Test Suite ---
describe('ProductContext', () => {
  
  beforeEach(() => {
    // Reset dei mock prima di ogni test
    jest.clearAllMocks();
    // Fornisce un valore di default per i settings
    mockedUseSettings.mockReturnValue({
      settings: {
        notificationsEnabled: true,
        notificationDays: 3,
        notificationTime: '09:00'
      }
    });
  });

  it('should start with loading true and fetch products when a user is present', async () => {
    // Setup: Simula un utente loggato
    mockedUseAuth.mockReturnValue({ user: { id: 'test-user' } });
    
    // Setup: Simula la risposta del servizio
    const mockProducts: Product[] = [{ id: '1', name: 'Latte' } as Product];
    mockedGetProducts.mockResolvedValue({ data: mockProducts, error: null });

    // Renderizza il provider con il componente di test
    const { getByText, queryByText } = render(
      <ProductProvider>
        <TestComponent />
      </ProductProvider>
    );

    // Asserzione: Inizialmente, dovremmo vedere lo stato di caricamento
    expect(getByText('Loading...')).toBeTruthy();

    // Asserzione: Attende che il caricamento sia finito e che i prodotti siano visualizzati
    await waitFor(() => {
      expect(queryByText('Loading...')).toBeNull();
      expect(getByText('Latte')).toBeTruthy();
    });

    // Verifica che getProducts sia stato chiamato
    expect(mockedGetProducts).toHaveBeenCalledTimes(1);
  });

  it('should handle errors during product fetching', async () => {
    // Setup: Simula un utente loggato
    mockedUseAuth.mockReturnValue({ user: { id: 'test-user' } });
    
    // Setup: Simula un errore dal servizio
    mockedGetProducts.mockResolvedValue({ data: null, error: new Error('Fetch failed') });

    // Renderizza
    const { getByText, queryByText } = render(
      <ProductProvider>
        <TestComponent />
      </ProductProvider>
    );

    // Asserzione: Inizia in caricamento
    expect(getByText('Loading...')).toBeTruthy();

    // Asserzione: Attende che il caricamento finisca, ma non ci devono essere prodotti
    await waitFor(() => {
      expect(queryByText('Loading...')).toBeNull();
      // Verifichiamo che non ci siano prodotti renderizzati
      expect(queryByText('Latte')).toBeNull(); // Nessun prodotto renderizzato
    }, { timeout: 3000 }); // Aumentiamo il timeout per dare tempo al caricamento
  });

  it('should not fetch products if there is no user', () => {
    // Setup: Nessun utente
    mockedUseAuth.mockReturnValue({ user: null });

    // Renderizza
    const { queryByText } = render(
      <ProductProvider>
        <TestComponent />
      </ProductProvider>
    );

    // Asserzione: Non dovrebbe essere in stato di caricamento e non dovrebbe chiamare il servizio
    expect(queryByText('Loading...')).toBeNull();
    expect(mockedGetProducts).not.toHaveBeenCalled();
  });
});
