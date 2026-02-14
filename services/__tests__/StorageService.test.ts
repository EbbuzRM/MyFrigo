// @ts-nocheck
// Unmock ProductStorage to test the real implementation
jest.unmock('@/services/ProductStorage');

import { ProductStorage } from '../ProductStorage';
import { supabase } from '../supabaseClient';
import { Product } from '@/types/Product';

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
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({
          data: mockProducts,
          error: null,
        }),
      };
      (supabase.from as jest.Mock).mockReturnValue(mockQueryBuilder);

      // Azione: Chiama la funzione da testare
      const result = await ProductStorage.getProducts();

      // Asserzioni: Verifica che le funzioni corrette siano state chiamate
      expect(supabase.from).toHaveBeenCalledWith('products');
      expect(mockQueryBuilder.select).toHaveBeenCalledWith('*');
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('user_id', 'test-user-id');

      // Asserzioni: Verifica che i dati restituiti siano corretti
      expect(result.success).toBe(true);
      expect(result.error).toBeNull();
      expect(result.data).toEqual(mockProducts);
    });

    it('should return an error if no user is authenticated', async () => {
      // Setup: Simula l'assenza di una sessione
      (supabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: { session: null },
      });

      // Azione
      const result = await ProductStorage.getProducts();

      // Asserzioni
      expect(result.success).toBe(false);
      expect(result.error).not.toBeNull();
      expect(supabase.from).not.toHaveBeenCalled();
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
      const result = await ProductStorage.saveProduct(newProduct);

      // Asserzioni
      expect(result.success).toBe(true);
      expect(supabase.from).toHaveBeenCalledWith('products');
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
      const result = await ProductStorage.deleteProduct(productId);

      // Asserzioni
      expect(result.success).toBe(true);
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
      const result = await ProductStorage.updateProductStatus(productId, 'consumed');

      // Asserzioni
      expect(result.success).toBe(true);
      expect(supabase.from).toHaveBeenCalledWith('products');
      expect(mockQueryBuilder.update).toHaveBeenCalled();
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('id', productId);
    });
  });
});
