import { StorageService } from '../StorageService';
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
  const mockSupabase = {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    upsert: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn(),
    auth: {
      getSession: jest.fn(),
    },
    removeChannel: jest.fn(),
    channel: jest.fn(() => ({
      on: jest.fn().mockReturnThis(),
      subscribe: jest.fn((callback) => {
        // Simula una sottoscrizione riuscita
        if (typeof callback === 'function') {
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
describe('StorageService', () => {
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
      (supabase.from('products').select().eq as jest.Mock).mockResolvedValue({
        data: mockProducts,
        error: null,
      });

      // Azione: Chiama la funzione da testare
      const { data, error } = await StorageService.getProducts();

      // Asserzioni: Verifica che le funzioni corrette siano state chiamate
      expect(supabase.from).toHaveBeenCalledWith('products');
      expect(supabase.select).toHaveBeenCalledWith('*');
      expect(supabase.eq).toHaveBeenCalledWith('user_id', 'test-user-id');
      
      // Asserzioni: Verifica che i dati restituiti siano corretti
      expect(error).toBeNull();
      expect(data).toEqual([{ id: '1', name: 'Latte', userId: 'test-user-id' }]); // Nota la conversione a camelCase
    });

    it('should return an empty array if no user is authenticated', async () => {
      // Setup: Simula l'assenza di una sessione
      (supabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: { session: null },
      });

      // Azione
      const { data, error } = await StorageService.getProducts();

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
      (supabase.from('products').upsert as jest.Mock).mockResolvedValue({ error: null });

      const newProduct: Partial<Product> = { name: 'Pane', quantity: 1, unit: 'kg' };

      // Azione
      await StorageService.saveProduct(newProduct);

      // Asserzioni
      expect(supabase.from).toHaveBeenCalledWith('products');
      // Verifica che i dati inviati a upsert contengano l'ID utente e siano in snake_case
      expect(supabase.upsert).toHaveBeenCalledWith(
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
      (supabase.from('products').delete().eq as jest.Mock).mockResolvedValue({ error: null });
      
      const productId = 'product-to-delete';

      // Azione
      await StorageService.deleteProduct(productId);

      // Asserzioni
      expect(supabase.from).toHaveBeenCalledWith('products');
      expect(supabase.delete).toHaveBeenCalled();
      expect(supabase.eq).toHaveBeenCalledWith('id', productId);
    });
  });

  // Test per updateProductStatus
  describe('updateProductStatus', () => {
    it('should update a product status to "consumed" and set consumedDate', async () => {
      // Setup
      (supabase.from('products').update as jest.Mock).mockReturnThis();
      (supabase.eq as jest.Mock).mockResolvedValue({ error: null });

      const productId = 'product-to-consume';

      // Azione
      await StorageService.updateProductStatus(productId, 'consumed');

      // Asserzioni
      expect(supabase.from).toHaveBeenCalledWith('products');
      // Verifica che i dati inviati a update siano corretti e in snake_case
      expect(supabase.update).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'consumed',
          consumed_date: expect.any(String), // Verifichiamo che consumed_date sia una stringa (data ISO)
        })
      );
      expect(supabase.eq).toHaveBeenCalledWith('id', productId);
    });
  });
});
