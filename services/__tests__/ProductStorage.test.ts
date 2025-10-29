// Mock dependencies first
jest.mock('../supabaseClient', () => {
  const mockQueryBuilder = {
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    upsert: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn().mockReturnThis(),
    lt: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    in: jest.fn().mockReturnThis(),
  };
  
  const mockSupabase = {
    from: jest.fn(() => mockQueryBuilder),
    auth: {
      getSession: jest.fn(),
    },
  };
  return {
    supabase: mockSupabase,
  };
});
jest.mock('../../utils/caseConverter');
jest.mock('../LoggingService');
jest.mock('expo-crypto', () => ({
  randomUUID: jest.fn(() => 'mock-uuid-123'),
}));

// Import after mocks are set up
import { ProductStorage } from '../ProductStorage';
import { supabase } from '../supabaseClient';
import * as caseConverter from '../../utils/caseConverter';
import { LoggingService } from '../LoggingService';

describe('ProductStorage', () => {
  const mockProduct = {
    id: 'test-id',
    name: 'Test Product',
    category: 'dairy',
    expirationDate: '2025-12-31',
    quantity: 5,
    unit: 'pieces',
    notes: 'Test notes',
    userId: 'user-123',
    status: 'active' as const,
  };

  const mockProductSnakeCase = {
    id: 'test-id',
    name: 'Test Product',
    category: 'dairy',
    expiration_date: '2025-12-31',
    quantity: 5,
    unit: 'pieces',
    notes: 'Test notes',
    user_id: 'user-123',
    status: 'active',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (supabase.auth.getSession as jest.Mock).mockResolvedValue({
      data: { session: { user: { id: 'user-123' } } },
    });
  });

  describe('getProducts', () => {
    it('should fetch products for authenticated user', async () => {
      const mockData = [mockProductSnakeCase];
      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ data: mockData, error: null }),
      };
      (supabase.from as jest.Mock).mockReturnValue(mockQueryBuilder);
      (caseConverter.convertProductsToCamelCase as jest.Mock).mockReturnValue([mockProduct]);

      const result = await ProductStorage.getProducts();

      expect(result.data).toEqual([mockProduct]);
      expect(result.error).toBeNull();
      expect(supabase.from).toHaveBeenCalledWith('products');
      expect(mockQueryBuilder.select).toHaveBeenCalledWith('*');
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('user_id', 'user-123');
    });

    it('should return empty array when user is not authenticated', async () => {
      (supabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: { session: null },
      });

      const result = await ProductStorage.getProducts();

      expect(result.data).toEqual([]);
      expect(result.error).toBeNull();
    });

    it('should handle database errors gracefully', async () => {
      const mockError = new Error('Database error');
      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ data: null, error: mockError }),
      };
      (supabase.from as jest.Mock).mockReturnValue(mockQueryBuilder);

      const result = await ProductStorage.getProducts();

      expect(result.data).toBeNull();
      expect(result.error).toEqual(mockError);
      expect(supabase.from).toHaveBeenCalledWith('products');
      expect(mockQueryBuilder.select).toHaveBeenCalledWith('*');
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('user_id', 'user-123');
      expect(LoggingService.error).toHaveBeenCalled();
    });

    it('should sort products by expiration date', async () => {
      const product1 = { ...mockProductSnakeCase, expiration_date: '2025-12-31' };
      const product2 = { ...mockProductSnakeCase, id: 'id-2', expiration_date: '2025-01-15' };
      const product3 = { ...mockProductSnakeCase, id: 'id-3', expiration_date: '2025-06-15' };

      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ data: [product1, product2, product3], error: null }),
      };
      (supabase.from as jest.Mock).mockReturnValue(mockQueryBuilder);

      const camelCaseProducts = [
        { ...mockProduct, expirationDate: '2025-12-31' },
        { ...mockProduct, id: 'id-2', expirationDate: '2025-01-15' },
        { ...mockProduct, id: 'id-3', expirationDate: '2025-06-15' },
      ];
      (caseConverter.convertProductsToCamelCase as jest.Mock).mockReturnValue(camelCaseProducts);

      const result = await ProductStorage.getProducts();

      expect(result.data?.[0].expirationDate).toBe('2025-01-15');
      expect(result.data?.[1].expirationDate).toBe('2025-06-15');
      expect(result.data?.[2].expirationDate).toBe('2025-12-31');
      expect(supabase.from).toHaveBeenCalledWith('products');
      expect(mockQueryBuilder.select).toHaveBeenCalledWith('*');
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('user_id', 'user-123');
    });
  });

  describe('getProductById', () => {
    it('should fetch a single product by ID', async () => {
      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockProductSnakeCase, error: null }),
      };
      (supabase.from as jest.Mock).mockReturnValue(mockQueryBuilder);
      (caseConverter.convertProductToCamelCase as jest.Mock).mockReturnValue(mockProduct);

      const result = await ProductStorage.getProductById('test-id');

      expect(result).toEqual(mockProduct);
      expect(supabase.from).toHaveBeenCalledWith('products');
      expect(mockQueryBuilder.select).toHaveBeenCalledWith('*');
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('id', 'test-id');
      expect(mockQueryBuilder.single).toHaveBeenCalled();
    });

    it('should return null when product not found', async () => {
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: null, error: new Error('Not found') }),
          }),
        }),
      });

      const result = await ProductStorage.getProductById('non-existent-id');

      expect(result).toBeNull();
    });
  });

  describe('saveProduct', () => {
    it('should save a new product with generated ID', async () => {
      const productToSave = { ...mockProduct } as any;
      delete productToSave.id;

      const mockQueryBuilder = {
        upsert: jest.fn().mockResolvedValue({ error: null }),
      };
      (supabase.from as jest.Mock).mockReturnValue(mockQueryBuilder);
      (caseConverter.convertProductToSnakeCase as jest.Mock).mockReturnValue(mockProductSnakeCase);

      await ProductStorage.saveProduct(productToSave);

      expect(supabase.from).toHaveBeenCalledWith('products');
      expect(mockQueryBuilder.upsert).toHaveBeenCalledWith(mockProductSnakeCase);
    });

    it('should update an existing product', async () => {
      const mockQueryBuilder = {
        upsert: jest.fn().mockResolvedValue({ error: null }),
      };
      (supabase.from as jest.Mock).mockReturnValue(mockQueryBuilder);
      (caseConverter.convertProductToSnakeCase as jest.Mock).mockReturnValue(mockProductSnakeCase);

      await ProductStorage.saveProduct(mockProduct as any);

      expect(supabase.from).toHaveBeenCalledWith('products');
      expect(mockQueryBuilder.upsert).toHaveBeenCalledWith(mockProductSnakeCase);
    });

    it('should throw error when save fails', async () => {
      const mockError = new Error('Save failed');
      (supabase.from as jest.Mock).mockReturnValue({
        upsert: jest.fn().mockResolvedValue({ error: mockError }),
      });
      (caseConverter.convertProductToSnakeCase as jest.Mock).mockReturnValue(mockProductSnakeCase);

      await expect(ProductStorage.saveProduct(mockProduct as any)).rejects.toThrow('Save failed');
    });

    it('should throw error when user is not authenticated', async () => {
      (supabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: { session: null },
      });

      await expect(ProductStorage.saveProduct(mockProduct as any)).rejects.toThrow('User not authenticated');
    });
  });

  describe('deleteProduct', () => {
    it('should delete a product by ID', async () => {
      const mockQueryBuilder = {
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ error: null }),
      };
      (supabase.from as jest.Mock).mockReturnValue(mockQueryBuilder);

      await ProductStorage.deleteProduct('test-id');

      expect(supabase.from).toHaveBeenCalledWith('products');
      expect(mockQueryBuilder.delete).toHaveBeenCalled();
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('id', 'test-id');
    });

    it('should throw error when delete fails', async () => {
      const mockError = new Error('Delete failed');
      (supabase.from as jest.Mock).mockReturnValue({
        delete: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ error: mockError }),
        }),
      });

      await expect(ProductStorage.deleteProduct('test-id')).rejects.toThrow('Delete failed');
    });
  });

  describe('updateProductStatus', () => {
    it('should update product status to consumed and set consumed date', async () => {
      const mockQueryBuilder = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ error: null }),
      };
      (supabase.from as jest.Mock).mockReturnValue(mockQueryBuilder);
      (caseConverter.convertProductToSnakeCase as jest.Mock).mockReturnValue({
        status: 'consumed',
        consumed_date: expect.any(String),
      });

      await ProductStorage.updateProductStatus('test-id', 'consumed');

      expect(supabase.from).toHaveBeenCalledWith('products');
      expect(mockQueryBuilder.update).toHaveBeenCalledWith({
        status: 'consumed',
        consumed_date: expect.any(String),
      });
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('id', 'test-id');
    });

    it('should throw error when update fails', async () => {
      const mockError = new Error('Update failed');
      (supabase.from as jest.Mock).mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ error: mockError }),
        }),
      });

      await expect(ProductStorage.updateProductStatus('test-id', 'consumed')).rejects.toThrow('Update failed');
    });
  });

  describe('getExpiredProducts', () => {
    it('should fetch expired products for authenticated user', async () => {
      const mockData = [mockProductSnakeCase];
      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        lt: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data: mockData, error: null }),
      };
      (supabase.from as jest.Mock).mockReturnValue(mockQueryBuilder);
      (caseConverter.convertProductsToCamelCase as jest.Mock).mockReturnValue([mockProduct]);

      const result = await ProductStorage.getExpiredProducts();

      expect(result).toEqual([mockProduct]);
      expect(supabase.from).toHaveBeenCalledWith('products');
      expect(mockQueryBuilder.select).toHaveBeenCalledWith('*');
      expect(mockQueryBuilder.eq).toHaveBeenNthCalledWith(1, 'user_id', 'user-123');
      expect(mockQueryBuilder.eq).toHaveBeenNthCalledWith(2, 'status', 'active');
      expect(mockQueryBuilder.lt).toHaveBeenCalledWith('expiration_date', expect.any(String));
      expect(mockQueryBuilder.order).toHaveBeenCalledWith('expiration_date', { ascending: true });
    });

    it('should return empty array when user is not authenticated', async () => {
      (supabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: { session: null },
      });

      const result = await ProductStorage.getExpiredProducts();

      expect(result).toEqual([]);
    });
  });

  describe('getTrulyExpiredProducts', () => {
    it('should fetch truly expired products', async () => {
      const mockData = [mockProductSnakeCase];
      // Create a more sophisticated mock that can handle multiple eq calls
      const eqMock = jest.fn();
      const mockQueryBuilder: any = {
        select: jest.fn().mockReturnThis(),
        eq: eqMock,
      };
      
      // Configure the eq mock to return different values based on call count
      eqMock.mockImplementation(function(field: string, value: any) {
        if (eqMock.mock.calls.length === 1) {
          // First call: eq('user_id', 'user-123')
          return mockQueryBuilder;
        } else if (eqMock.mock.calls.length === 2) {
          // Second call: eq('status', 'expired')
          return { data: mockData, error: null };
        }
        return mockQueryBuilder;
      });
      
      (supabase.from as jest.Mock).mockReturnValue(mockQueryBuilder);
      (caseConverter.convertProductsToCamelCase as jest.Mock).mockReturnValue([mockProduct]);

      const result = await ProductStorage.getTrulyExpiredProducts();

      expect(result).toEqual([mockProduct]);
      expect(supabase.from).toHaveBeenCalledWith('products');
      expect(mockQueryBuilder.select).toHaveBeenCalledWith('*');
      expect(eqMock).toHaveBeenNthCalledWith(1, 'user_id', 'user-123');
      expect(eqMock).toHaveBeenNthCalledWith(2, 'status', 'expired');
    });

    it('should return empty array when no truly expired products', async () => {
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({ data: [], error: null }),
          }),
        }),
      });
      (caseConverter.convertProductsToCamelCase as jest.Mock).mockReturnValue([]);

      const result = await ProductStorage.getTrulyExpiredProducts();

      expect(result).toEqual([]);
    });
  });

  describe('moveProductsToHistory', () => {
    it('should move products to history', async () => {
      const mockQueryBuilder = {
        update: jest.fn().mockReturnThis(),
        in: jest.fn().mockResolvedValue({ error: null }),
      };
      (supabase.from as jest.Mock).mockReturnValue(mockQueryBuilder);

      await ProductStorage.moveProductsToHistory(['id-1', 'id-2']);

      expect(supabase.from).toHaveBeenCalledWith('products');
      expect(mockQueryBuilder.update).toHaveBeenCalledWith({ status: 'expired' });
      expect(mockQueryBuilder.in).toHaveBeenCalledWith('id', ['id-1', 'id-2']);
    });

    it('should do nothing when no product IDs provided', async () => {
      await ProductStorage.moveProductsToHistory([]);

      expect(supabase.from).not.toHaveBeenCalled();
    });

    it('should throw error when move fails', async () => {
      const mockError = new Error('Move failed');
      (supabase.from as jest.Mock).mockReturnValue({
        update: jest.fn().mockReturnValue({
          in: jest.fn().mockResolvedValue({ error: mockError }),
        }),
      });

      await expect(ProductStorage.moveProductsToHistory(['id-1'])).rejects.toThrow('Move failed');
    });
  });

  describe('getHistory', () => {
    it('should fetch consumed products history', async () => {
      const mockData = [mockProductSnakeCase];
      const eqMock = jest.fn();
      const mockQueryBuilder: any = {
        select: jest.fn().mockReturnThis(),
        eq: eqMock,
        order: jest.fn().mockResolvedValue({ data: mockData, error: null }),
      };
      (supabase.from as jest.Mock).mockReturnValue(mockQueryBuilder);
      
      // Configure eq mock to handle multiple calls
      eqMock.mockImplementation(function(field: string, value: any) {
        if (eqMock.mock.calls.length === 1) {
          // First call: eq('user_id', 'user-123')
          return mockQueryBuilder;
        } else if (eqMock.mock.calls.length === 2) {
          // Second call: eq('status', 'consumed')
          return mockQueryBuilder;
        }
        return mockQueryBuilder;
      });
      
      (caseConverter.convertProductsToCamelCase as jest.Mock).mockReturnValue([mockProduct]);

      const result = await ProductStorage.getHistory();

      expect(result).toEqual([mockProduct]);
      expect(supabase.from).toHaveBeenCalledWith('products');
      expect(mockQueryBuilder.select).toHaveBeenCalledWith('*');
      expect(eqMock).toHaveBeenNthCalledWith(1, 'user_id', 'user-123');
      expect(eqMock).toHaveBeenNthCalledWith(2, 'status', 'consumed');
      expect(mockQueryBuilder.order).toHaveBeenCalledWith('consumed_date', { ascending: false });
    });

    it('should return empty array when user is not authenticated', async () => {
      (supabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: { session: null },
      });

      const result = await ProductStorage.getHistory();

      expect(result).toEqual([]);
    });
  });

  describe('restoreConsumedProduct', () => {
    it('should restore a consumed product to active status', async () => {
      const mockQueryBuilder = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ error: null }),
      };
      (supabase.from as jest.Mock).mockReturnValue(mockQueryBuilder);
      (caseConverter.convertProductToSnakeCase as jest.Mock).mockReturnValue({
        status: 'active',
      });

      await ProductStorage.restoreConsumedProduct('test-id');

      expect(supabase.from).toHaveBeenCalledWith('products');
      expect(mockQueryBuilder.update).toHaveBeenCalledWith({
        status: 'active',
      });
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('id', 'test-id');
    });

    it('should throw error when restore fails', async () => {
      const mockError = new Error('Restore failed');
      (supabase.from as jest.Mock).mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ error: mockError }),
        }),
      });

      await expect(ProductStorage.restoreConsumedProduct('test-id')).rejects.toThrow('Restore failed');
    });
  });

  describe('Error Handling and Logging', () => {
    it('should log errors when operations fail', async () => {
      const mockError = new Error('Test error');
      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ data: null, error: mockError }),
      };
      (supabase.from as jest.Mock).mockReturnValue(mockQueryBuilder);

      await ProductStorage.getProducts();

      expect(LoggingService.error).toHaveBeenCalled();
      expect(supabase.from).toHaveBeenCalledWith('products');
      expect(mockQueryBuilder.select).toHaveBeenCalledWith('*');
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('user_id', 'user-123');
    });

    it('should log info messages for successful operations', async () => {
      const mockQueryBuilder = {
        upsert: jest.fn().mockResolvedValue({ error: null }),
      };
      (supabase.from as jest.Mock).mockReturnValue(mockQueryBuilder);
      (caseConverter.convertProductToSnakeCase as jest.Mock).mockReturnValue(mockProductSnakeCase);

      await ProductStorage.saveProduct(mockProduct as any);

      expect(LoggingService.info).toHaveBeenCalled();
      expect(supabase.from).toHaveBeenCalledWith('products');
      expect(mockQueryBuilder.upsert).toHaveBeenCalledWith(mockProductSnakeCase);
    });
  });
});
