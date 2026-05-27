// ProductStorage.test.ts — ProductStorage.test module.
//
// exports: none
// used_by: none
// rules:   none
// agent:   deepseek/deepseek-chat | deepseek | 2026-05-09 | codedna-cli | initial CodeDNA annotation pass
// message: 

// Unmock ProductStorage to test the real implementation
jest.unmock('@/services/ProductStorage');

// Mock dependencies first
jest.mock('../../utils/caseConverter');
jest.mock('../LoggingService');
jest.mock('expo-crypto', () => ({
  randomUUID: jest.fn(() => 'mock-uuid-123'),
}));
jest.mock('../../utils/dateUtils', () => ({
  toLocalISOString: jest.fn((date) => date.toISOString()),
  getLocalISODate: jest.fn(() => '2025-01-15'),
}));

// Mock Supabase with a chainable builder
const createMockQueryBuilder = (data: any = null, error: any = null) => {
  const mock: any = {
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    upsert: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    neq: jest.fn().mockReturnThis(),
    in: jest.fn().mockReturnThis(),
    lt: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    single: jest.fn().mockReturnThis(),
    maybeSingle: jest.fn().mockReturnThis(),
  };
  
  // Make it a thenable that resolves to { data, error }
  mock.then = (resolve: any) => resolve({ data, error });
  
  return mock;
};

jest.mock('../supabaseClient', () => ({
  supabase: {
    auth: {
      getSession: jest.fn(() => Promise.resolve({ data: { session: { user: { id: 'user-123' } } }})),
    },
    from: jest.fn(() => createMockQueryBuilder()),
    channel: jest.fn(() => ({
      on: jest.fn().mockReturnThis(),
      subscribe: jest.fn().mockReturnThis(),
    })),
    removeChannel: jest.fn(),
  },
  getCachedSession: jest.fn(() => Promise.resolve({ data: { session: { user: { id: 'user-123' } } } })),
}));

// Import after mocks are set up
import { ProductStorage } from '../ProductStorage';
import { supabase, getCachedSession } from '../supabaseClient';
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
    (getCachedSession as jest.Mock).mockResolvedValue({
      data: { session: { user: { id: 'user-123' } } },
      error: null,
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('getProducts', () => {
    it('should fetch products for authenticated user', async () => {
      const mockData = [mockProductSnakeCase];
      const mockQueryBuilder = createMockQueryBuilder(mockData);
      (supabase.from as jest.Mock).mockReturnValue(mockQueryBuilder);
      (caseConverter.convertProductsToCamelCase as jest.Mock).mockReturnValue([mockProduct]);

      const result = await ProductStorage.getProducts();

      expect(result.data).toEqual([mockProduct]);
      expect(result.error).toBeNull();
      expect(supabase.from).toHaveBeenCalledWith('products');
      expect(mockQueryBuilder.select).toHaveBeenCalledWith('id, name, brand, category, purchase_date, expiration_date, status, quantities, is_frozen, consumed_date');
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('user_id', 'user-123');
    });

    it('should return empty array when user is not authenticated', async () => {
      (getCachedSession as jest.Mock).mockResolvedValue({
        data: { session: null },
        error: null,
      });

      const result = await ProductStorage.getProducts();

      expect(result.success).toBe(false);
      expect(result.data).toBeNull();
      expect(result.error).toBe('Utente non autenticato');
    });

    it('should handle database errors gracefully', async () => {
      const mockError = new Error('Database error');
      const mockQueryBuilder = createMockQueryBuilder(null, mockError);
      (supabase.from as jest.Mock).mockReturnValue(mockQueryBuilder);

      const result = await ProductStorage.getProducts();

      expect(result.data).toBeNull();
      expect(result.error).toBe('Database error');
      expect(supabase.from).toHaveBeenCalledWith('products');
      expect(mockQueryBuilder.select).toHaveBeenCalledWith('id, name, brand, category, purchase_date, expiration_date, status, quantities, is_frozen, consumed_date');
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('user_id', 'user-123');
      expect(LoggingService.error).toHaveBeenCalled();
    });

    it('should sort products by expiration date', async () => {
      const product1 = { ...mockProductSnakeCase, expiration_date: '2025-12-31' };
      const product2 = { ...mockProductSnakeCase, id: 'id-2', expiration_date: '2025-01-15' };
      const product3 = { ...mockProductSnakeCase, id: 'id-3', expiration_date: '2025-06-15' };

      // Mock returns data sorted by supabase (ascending order)
      const mockQueryBuilder = createMockQueryBuilder([product2, product3, product1]);
      (supabase.from as jest.Mock).mockReturnValue(mockQueryBuilder);

      const camelCaseProducts = [
        { ...mockProduct, expirationDate: '2025-01-15' },
        { ...mockProduct, id: 'id-2', expirationDate: '2025-06-15' },
        { ...mockProduct, id: 'id-3', expirationDate: '2025-12-31' },
      ];
      (caseConverter.convertProductsToCamelCase as jest.Mock).mockReturnValue(camelCaseProducts);

      const result = await ProductStorage.getProducts();

      expect(result.data?.[0].expirationDate).toBe('2025-01-15');
      expect(result.data?.[1].expirationDate).toBe('2025-06-15');
      expect(result.data?.[2].expirationDate).toBe('2025-12-31');
      expect(supabase.from).toHaveBeenCalledWith('products');
      expect(mockQueryBuilder.select).toHaveBeenCalledWith('id, name, brand, category, purchase_date, expiration_date, status, quantities, is_frozen, consumed_date');
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('user_id', 'user-123');
    });
  });

   describe('getProductById', () => {
     it('should fetch a single product by ID', async () => {
       const mockQueryBuilder = createMockQueryBuilder(mockProductSnakeCase);
       (supabase.from as jest.Mock).mockReturnValue(mockQueryBuilder);
       (caseConverter.convertProductToCamelCase as jest.Mock).mockReturnValue(mockProduct);

       const result = await ProductStorage.getProductById('test-id');

       expect(result.data).toEqual(mockProduct);
       expect(supabase.from).toHaveBeenCalledWith('products');
       expect(mockQueryBuilder.select).toHaveBeenCalledWith('id, name, brand, category, purchase_date, expiration_date, status, quantities, is_frozen, consumed_date, notes, image_url');
       expect(mockQueryBuilder.eq).toHaveBeenCalledWith('id', 'test-id');
       expect(mockQueryBuilder.single).toHaveBeenCalled();
     });

    it('should return null when product not found', async () => {
      (supabase.from as jest.Mock).mockReturnValue(createMockQueryBuilder(null));
      (caseConverter.convertProductToCamelCase as jest.Mock).mockReturnValue(null);

      const result = await ProductStorage.getProductById('test-id');

      expect(result.data).toBeNull();
    });

    it('should handle errors in getProductById', async () => {
      const mockError = new Error('Product not found');
      (supabase.from as jest.Mock).mockReturnValue(createMockQueryBuilder(null, mockError));

      const result = await ProductStorage.getProductById('test-id');

      expect(result.data).toBeNull();
      expect(result.error).toBe('Product not found');
      expect(LoggingService.error).toHaveBeenCalled();
    });

    it('should validate productId', async () => {
      const result = await ProductStorage.getProductById('');
      expect(result.success).toBe(false);
      expect(result.error).toBe('ID Prodotto è richiesto');
    });
  });

  describe('saveProduct', () => {
    it('should insert a new product', async () => {
      const mockQueryBuilder = createMockQueryBuilder();
      (supabase.from as jest.Mock).mockReturnValue(mockQueryBuilder);
      (caseConverter.convertProductToSnakeCase as jest.Mock).mockReturnValue(mockProductSnakeCase);

      const productToSave = { ...mockProduct };
      delete (productToSave as any).id;

      const result = await ProductStorage.saveProduct(productToSave as any);

      expect(result.success).toBe(true);
      expect(supabase.from).toHaveBeenCalledWith('products');
      expect(mockQueryBuilder.upsert).toHaveBeenCalled();
    });

    it('should update an existing product', async () => {
      const mockQueryBuilder = createMockQueryBuilder();
      (supabase.from as jest.Mock).mockReturnValue(mockQueryBuilder);
      (caseConverter.convertProductToSnakeCase as jest.Mock).mockReturnValue(mockProductSnakeCase);

      const result = await ProductStorage.saveProduct(mockProduct as any);

      expect(result.success).toBe(true);
      expect(supabase.from).toHaveBeenCalledWith('products');
      expect(mockQueryBuilder.upsert).toHaveBeenCalled();
    });

    it('should throw error when save fails', async () => {
      const mockError = new Error('Save failed');
      (supabase.from as jest.Mock).mockReturnValue(createMockQueryBuilder(null, mockError));
      (caseConverter.convertProductToSnakeCase as jest.Mock).mockReturnValue(mockProductSnakeCase);

      const result = await ProductStorage.saveProduct(mockProduct as any);
      expect(result.success).toBe(false);
       expect(result.error).toBe('Save failed');
    });

    it('should throw error when user is not authenticated', async () => {
       (getCachedSession as jest.Mock).mockResolvedValue({
         data: { session: null },
         error: null,
       });

       const result = await ProductStorage.saveProduct(mockProduct as any);
       expect(result.success).toBe(false);
       expect(result.error).toBe('Utente non autenticato');
     });
   });

   describe('deleteProduct', () => {
    it('should delete a product by ID', async () => {
      const mockQueryBuilder = createMockQueryBuilder();
      (supabase.from as jest.Mock).mockReturnValue(mockQueryBuilder);

      await ProductStorage.deleteProduct('test-id');

      expect(supabase.from).toHaveBeenCalledWith('products');
      expect(mockQueryBuilder.delete).toHaveBeenCalled();
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('id', 'test-id');
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('user_id', 'user-123');
    });

    it('should throw error when delete fails', async () => {
      const mockError = new Error('Delete failed');
      (supabase.from as jest.Mock).mockReturnValue(createMockQueryBuilder(null, mockError));

      const result = await ProductStorage.deleteProduct('test-id');
      expect(result.success).toBe(false);
       expect(result.error).toBe('Delete failed');
    });
  });

  describe('updateProductStatus', () => {
    it('should update product status to consumed and set consumed date', async () => {
      const mockQueryBuilder = createMockQueryBuilder();
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
      (supabase.from as jest.Mock).mockReturnValue(createMockQueryBuilder(null, mockError));

      const result = await ProductStorage.updateProductStatus('test-id', 'consumed');
      expect(result.success).toBe(false);
       expect(result.error).toBe('Update failed');
    });
  });

  describe('getExpiredProducts', () => {
     it('should fetch expired products for authenticated user', async () => {
       const mockData = [mockProductSnakeCase];
       const mockQueryBuilder = createMockQueryBuilder(mockData);
       (supabase.from as jest.Mock).mockReturnValue(mockQueryBuilder);
       (caseConverter.convertProductsToCamelCase as jest.Mock).mockReturnValue([mockProduct]);

       const result = await ProductStorage.getExpiredProducts();

       expect(result.data).toEqual([mockProduct]);
       expect(supabase.from).toHaveBeenCalledWith('products');
       expect(mockQueryBuilder.select).toHaveBeenCalledWith('id, name, brand, category, purchase_date, expiration_date, status, quantities, is_frozen, consumed_date');
       expect(mockQueryBuilder.eq).toHaveBeenNthCalledWith(1, 'user_id', 'user-123');
       expect(mockQueryBuilder.eq).toHaveBeenNthCalledWith(2, 'status', 'active');
       expect(mockQueryBuilder.eq).toHaveBeenNthCalledWith(3, 'is_frozen', false);
       expect(mockQueryBuilder.lt).toHaveBeenCalledWith('expiration_date', expect.any(String));
       expect(mockQueryBuilder.order).toHaveBeenCalledWith('expiration_date', { ascending: true });
     });

     it('should return empty array when user is not authenticated', async () => {
       (getCachedSession as jest.Mock).mockResolvedValue({
         data: { session: null },
         error: null,
       });

       const result = await ProductStorage.getExpiredProducts();

       expect(result.success).toBe(false);
     });
   });

  describe('getTrulyExpiredProducts', () => {
    it('should fetch truly expired products', async () => {
      const mockData = [mockProductSnakeCase];
      const mockQueryBuilder = createMockQueryBuilder(mockData);
      (supabase.from as jest.Mock).mockReturnValue(mockQueryBuilder);
      (caseConverter.convertProductsToCamelCase as jest.Mock).mockReturnValue([mockProduct]);

      const result = await ProductStorage.getTrulyExpiredProducts();

       expect(result.data).toEqual([mockProduct]);
       expect(supabase.from).toHaveBeenCalledWith('products');
       expect(mockQueryBuilder.select).toHaveBeenCalledWith('id, name, brand, category, purchase_date, expiration_date, status, quantities, is_frozen, consumed_date');
       expect(mockQueryBuilder.eq).toHaveBeenNthCalledWith(1, 'user_id', 'user-123');
       expect(mockQueryBuilder.eq).toHaveBeenNthCalledWith(2, 'status', 'expired');
     });

    it('should return empty array when no truly expired products', async () => {
      (supabase.from as jest.Mock).mockReturnValue(createMockQueryBuilder([]));
      (caseConverter.convertProductsToCamelCase as jest.Mock).mockReturnValue([]);

      const result = await ProductStorage.getTrulyExpiredProducts();

      expect(result.data).toEqual([]);
    });
  });

  describe('moveProductsToHistory', () => {
    it('should move products to history', async () => {
      const mockQueryBuilder = createMockQueryBuilder();
      (supabase.from as jest.Mock).mockReturnValue(mockQueryBuilder);

      await ProductStorage.moveProductsToHistory(['id-1', 'id-2']);

      expect(supabase.from).toHaveBeenCalledWith('products');
      expect(mockQueryBuilder.update).toHaveBeenCalledWith({ status: 'expired' });
      expect(mockQueryBuilder.in).toHaveBeenCalledWith('id', ['id-1', 'id-2']);
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('user_id', 'user-123');
    });

    it('should do nothing when no product IDs provided', async () => {
      await ProductStorage.moveProductsToHistory([]);

      expect(supabase.from).not.toHaveBeenCalled();
    });

    it('should throw error when move fails', async () => {
      const mockError = new Error('Move failed');
      (supabase.from as jest.Mock).mockReturnValue(createMockQueryBuilder(null, mockError));

      const result = await ProductStorage.moveProductsToHistory(['id-1']);
      expect(result.success).toBe(false);
      expect(result.error).toBe('Move failed');
    });
  });

  describe('getHistory', () => {
    it('should fetch consumed products history', async () => {
      const mockData = [mockProductSnakeCase];
      const mockQueryBuilder = createMockQueryBuilder(mockData);
      (supabase.from as jest.Mock).mockReturnValue(mockQueryBuilder);
      (caseConverter.convertProductsToCamelCase as jest.Mock).mockReturnValue([mockProduct]);

      const result = await ProductStorage.getHistory();

       expect(result.data).toEqual([mockProduct]);
       expect(supabase.from).toHaveBeenCalledWith('products');
       expect(mockQueryBuilder.select).toHaveBeenCalledWith('id, name, brand, category, purchase_date, expiration_date, status, quantities, is_frozen, consumed_date');
       expect(mockQueryBuilder.eq).toHaveBeenNthCalledWith(1, 'user_id', 'user-123');
       expect(mockQueryBuilder.eq).toHaveBeenNthCalledWith(2, 'status', 'consumed');
       expect(mockQueryBuilder.order).toHaveBeenCalledWith('consumed_date', { ascending: false });
     });

     it('should return empty array when user is not authenticated', async () => {
       (getCachedSession as jest.Mock).mockResolvedValue({
         data: { session: null },
         error: null,
       });

       const result = await ProductStorage.getHistory();

       expect(result.success).toBe(false);
     });
   });

  describe('restoreConsumedProduct', () => {
    it('should restore a consumed product to active status', async () => {
      const mockQueryBuilder = createMockQueryBuilder();
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
      (supabase.from as jest.Mock).mockReturnValue(createMockQueryBuilder(null, mockError));

      const result = await ProductStorage.restoreConsumedProduct('test-id');
      expect(result.success).toBe(false);
      expect(result.error).toBe('Restore failed');
    });
  });

  describe('Error Handling and Logging', () => {
    it('should log errors when operations fail', async () => {
      const mockError = new Error('Test error');
      const mockQueryBuilder = createMockQueryBuilder(null, mockError);
      (supabase.from as jest.Mock).mockReturnValue(mockQueryBuilder);

      await ProductStorage.getProducts();

      expect(LoggingService.error).toHaveBeenCalled();
      expect(supabase.from).toHaveBeenCalledWith('products');
      expect(mockQueryBuilder.select).toHaveBeenCalledWith('id, name, brand, category, purchase_date, expiration_date, status, quantities, is_frozen, consumed_date');
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('user_id', 'user-123');
    });

    it('should log info messages for successful operations', async () => {
      const mockQueryBuilder = createMockQueryBuilder();
      (supabase.from as jest.Mock).mockReturnValue(mockQueryBuilder);

      await ProductStorage.moveProductsToHistory(['id-1']);

      expect(LoggingService.info).toHaveBeenCalled();
      expect(supabase.from).toHaveBeenCalledWith('products');
    });
  });
});
