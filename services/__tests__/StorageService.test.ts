// @ts-nocheck
import { ProductStorage } from '../ProductStorage';
import { supabase } from '../supabaseClient';
import { Product } from '@/types/Product';
import { randomUUID } from 'expo-crypto';

// --- Mock delle dipendenze esterne ---

// Mock di NotificationService per evitare errori di ambiente nativo
jest.mock('../NotificationService', () => ({
  NotificationService: {
    scheduleMultipleNotifications: jest.fn(),
  },
}));

// Mock completo del client Supabase
jest.mock('../supabaseClient', () => {
  const mockQueryBuilder = {
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    upsert: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn(),
    returns: jest.fn().mockReturnThis(),
  };
  
  const mockSupabase = {
    from: jest.fn(() => mockQueryBuilder),
    auth: {
      getSession: jest.fn(),
    },
    removeChannel: jest.fn(),
    channel: jest.fn(() => ({
      on: jest.fn().mockReturnThis(),
      subscribe: jest.fn((callback?: (status: string) => void) => {
        if (callback && typeof callback === 'function') {
          callback('SUBSCRIBED');
        }
        return {
          unsubscribe: jest.fn(),
        };
      }),
    })),
  };
  return {
    supabase: mockSupabase,
  };
});

// Mock di expo-crypto
jest.mock('expo-crypto', () => ({
  randomUUID: jest.fn(() => 'mock-uuid'),
}));

// --- Test Suite ---
describe('ProductStorage', () => {
  // Pulisce tutti i mock dopo ogni test per garantire l'isolamento
  afterEach(() => {
    jest.clearAllMocks();
  });

  // Test per getProducts
  describe('getProducts', () => {
    it('should fetch products for the current user', async () => {
      // Setup: Simula una sessione utente valida
      (supabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: { session: { user: { id: 'test-user-id' } } },
      });
      
      // Setup: Simula la risposta del database
      const mockProducts = [{ id: '1', name: 'Latte', user_id: 'test-user-id' }];
      const mockQueryBuilder = supabase.from('products');
      (mockQueryBuilder.select as jest.Mock).mockReturnValue(mockQueryBuilder);
      (mockQueryBuilder.eq as jest.Mock).mockResolvedValue({
        data: mockProducts,
        error: null,
      });

      // Azione: Chiama la funzione da testare
       const { data, error } = await ProductStorage.getProducts();

      // Asserzioni: Verifica che le funzioni corrette siano state chiamate
      expect(supabase.from).toHaveBeenCalledWith('products');
      expect(mockQueryBuilder.select).toHaveBeenCalledWith('*');
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('user_id', 'test-user-id');
      
      // Asserzioni: Verifica che i dati restituiti siano corretti
      expect(error).toBeNull();
      expect(data).toEqual([{ id: '1', name: 'Latte', userId: 'test-user-id', quantities: [] }]); // Nota la conversione a camelCase
    });

    it('should return an empty array if no user is authenticated', async () => {
      // Setup: Simula l'assenza di una sessione
      (supabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: { session: null },
      });

      // Azione
       const { data, error } = await ProductStorage.getProducts();

      // Asserzioni
      expect(error).toBeNull();
      expect(data).toEqual([]);
      expect(supabase.from).not.toHaveBeenCalled(); // Non dovrebbe nemmeno provare a chiamare il db
    });
  });

  // Test per saveProduct
  describe('saveProduct', () => {
    it('should upsert a product with the user ID', async () => {
      // Setup
      (supabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: { session: { user: { id: 'test-user-id' } } },
      });
      const mockQueryBuilder = supabase.from('products');
      (mockQueryBuilder.upsert as jest.Mock).mockResolvedValue({ error: null });

      const newProduct: Partial<Product> = { name: 'Pane', quantity: 1, unit: 'kg' };

      // Azione
       await ProductStorage.saveProduct(newProduct);

      // Asserzioni
      expect(supabase.from).toHaveBeenCalledWith('products');
      // Verifica che i dati inviati a upsert contengano l'ID utente e siano in snake_case
      expect(mockQueryBuilder.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Pane',
          quantity: 1,
          unit: 'kg',
          user_id: 'test-user-id',
          id: 'mock-uuid', // Verifica che l'UUID mockato sia stato usato
          status: 'active',
        })
      );
    });
  });
  
  // Test per deleteProduct
  describe('deleteProduct', () => {
    it('should delete a product by its ID', async () => {
      // Setup
      const mockQueryBuilder = supabase.from('products');
      (mockQueryBuilder.delete as jest.Mock).mockReturnValue(mockQueryBuilder);
      (mockQueryBuilder.eq as jest.Mock).mockResolvedValue({ error: null });
      
      const productId = 'product-to-delete';

      // Azione
       await ProductStorage.deleteProduct(productId);

      // Asserzioni
      expect(supabase.from).toHaveBeenCalledWith('products');
      expect(mockQueryBuilder.delete).toHaveBeenCalled();
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('id', productId);
    });
  });

  // Test per updateProductStatus
  describe('updateProductStatus', () => {
    it('should update a product status to "consumed" and set consumedDate', async () => {
      // Setup
      const mockQueryBuilder = supabase.from('products');
      (mockQueryBuilder.update as jest.Mock).mockReturnValue(mockQueryBuilder);
      (mockQueryBuilder.eq as jest.Mock).mockResolvedValue({ error: null });

      const productId = 'product-to-consume';

      // Azione
       await ProductStorage.updateProductStatus(productId, 'consumed');

      // Asserzioni
      expect(supabase.from).toHaveBeenCalledWith('products');
      // Verifica che i dati inviati a update siano corretti e in snake_case
      expect(mockQueryBuilder.update).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'consumed',
          consumed_date: expect.any(String), // Verifichiamo che consumed_date sia una stringa (data ISO)
        })
      );
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('id', productId);
    });
  });
});
