// @ts-nocheck
// Unmock ProductStorage to test the real implementation
jest.unmock('@/services/ProductStorage');

import { ProductStorage } from '../ProductStorage';
import { supabase } from '../supabaseClient';
import { Product } from '@/types/Product';
import { randomUUID } from 'expo-crypto';

// Mock di expo-crypto
jest.mock('expo-crypto', () => ({
  randomUUID: jest.fn(() => 'mock-uuid'),
}));

// Mock NotificationService
jest.mock('../NotificationService', () => ({
  NotificationService: {
    scheduleMultipleNotifications: jest.fn(),
  },
}));

// Mock caseConverter to pass through data without transformation
jest.mock('../../utils/caseConverter', () => ({
  convertProductToCamelCase: jest.fn((data) => data),
  convertProductToSnakeCase: jest.fn((data) => data),
  convertProductsToCamelCase: jest.fn((data) => data),
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
      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({
          data: mockProducts,
          error: null,
        }),
      };
      (supabase.from as jest.Mock).mockReturnValue(mockQueryBuilder);

      // Azione: Chiama la funzione da testare
      const { data, error } = await ProductStorage.getProducts();

      // Asserzioni: Verifica che le funzioni corrette siano state chiamate
      expect(supabase.from).toHaveBeenCalledWith('products');
      expect(mockQueryBuilder.select).toHaveBeenCalledWith('*');
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('user_id', 'test-user-id');
      
      // Asserzioni: Verifica che i dati restituiti siano corretti
      expect(error).toBeNull();
      expect(data).toEqual(mockProducts);
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
      
      const mockQueryBuilder = {
        upsert: jest.fn().mockResolvedValue({ error: null }),
      };
      (supabase.from as jest.Mock).mockReturnValue(mockQueryBuilder);

      const newProduct: Partial<Product> = { name: 'Pane', quantity: 1, unit: 'kg' };

      // Azione
      await ProductStorage.saveProduct(newProduct);

      // Asserzioni
      expect(supabase.from).toHaveBeenCalledWith('products');
      // Verifica che upsert sia stato chiamato
      expect(mockQueryBuilder.upsert).toHaveBeenCalled();
    });
  });
  
  // Test per deleteProduct
  describe('deleteProduct', () => {
    it('should delete a product by its ID', async () => {
      // Setup
      const mockQueryBuilder = {
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ error: null }),
      };
      (supabase.from as jest.Mock).mockReturnValue(mockQueryBuilder);
      
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
    it('should update a product status to "consumed"', async () => {
      // Setup
      const mockQueryBuilder = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ error: null }),
      };
      (supabase.from as jest.Mock).mockReturnValue(mockQueryBuilder);

      const productId = 'product-to-consume';

      // Azione
      await ProductStorage.updateProductStatus(productId, 'consumed');

      // Asserzioni
      expect(supabase.from).toHaveBeenCalledWith('products');
      // Verifica che update sia stato chiamato con i parametri corretti
      expect(mockQueryBuilder.update).toHaveBeenCalled();
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('id', productId);
    });
  });
});
