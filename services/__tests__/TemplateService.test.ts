// TemplateService.test.ts — TemplateService test module.
//
// exports: none
// used_by: none
// rules:   none

jest.mock('../supabaseClient', () => {
  const mockFrom = jest.fn();
  return {
    supabase: {
      from: mockFrom,
    },
  };
});

jest.mock('../../utils/caseConverter', () => ({
  convertTemplateToCamelCase: jest.fn((data: any) => ({ ...data, _converted: 'camel' })),
  convertTemplateToSnakeCase: jest.fn((data: any) => ({ ...data, _converted: 'snake' })),
}));

import { TemplateService, ProductTemplate } from '../TemplateService';
import { supabase } from '../supabaseClient';
import { convertTemplateToCamelCase, convertTemplateToSnakeCase } from '../../utils/caseConverter';
import { LoggingService } from '../LoggingService';

describe('TemplateService', () => {
  const mockBarcode = '8001234567890';
  const mockProductTemplate: ProductTemplate = {
    barcode: mockBarcode,
    name: 'Latte',
    brand: 'Parmalat',
    category: 'Latticini',
    imageUrl: 'https://example.com/latte.jpg',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ── getProductTemplate ──────────────────────────────────────────────
  describe('getProductTemplate', () => {
    it('should fetch template by barcode and return converted data', async () => {
      const mockDbData = { barcode: mockBarcode, name: 'Latte' };
      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockDbData, error: null }),
      };

      (supabase.from as jest.Mock).mockReturnValue(mockQueryBuilder);
      (convertTemplateToCamelCase as jest.Mock).mockReturnValue(mockProductTemplate);

      const result = await TemplateService.getProductTemplate(mockBarcode);

      expect(supabase.from).toHaveBeenCalledWith('barcode_templates');
      expect(mockQueryBuilder.select).toHaveBeenCalledWith('*');
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('barcode', mockBarcode);
      expect(result).toEqual(mockProductTemplate);
    });

    it('should return null when PGRST116 error (row not found)', async () => {
      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116', message: 'No rows found' } }),
      };

      (supabase.from as jest.Mock).mockReturnValue(mockQueryBuilder);

      const result = await TemplateService.getProductTemplate(mockBarcode);

      expect(result).toBeNull();
      expect(LoggingService.error).not.toHaveBeenCalled();
    });

    it('should log error and return null on database error', async () => {
      const dbError = new Error('Database connection failed');
      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockRejectedValue(dbError),
      };

      (supabase.from as jest.Mock).mockReturnValue(mockQueryBuilder);

      const result = await TemplateService.getProductTemplate(mockBarcode);

      expect(result).toBeNull();
      expect(LoggingService.error).toHaveBeenCalledWith(
        'TemplateService',
        expect.stringContaining(mockBarcode),
        dbError
      );
    });

    it('should return null when data is null without error', async () => {
      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: null }),
      };

      (supabase.from as jest.Mock).mockReturnValue(mockQueryBuilder);

      const result = await TemplateService.getProductTemplate(mockBarcode);

      expect(result).toBeNull();
    });
  });

  // ── saveProductTemplate ─────────────────────────────────────────────
  describe('saveProductTemplate', () => {
    const mockProduct = {
      id: 'prod-1',
      barcode: mockBarcode,
      name: 'Latte',
      brand: 'Parmalat',
      category: 'Latticini',
      imageUrl: 'https://example.com/latte.jpg',
      expirationDate: '2026-12-31',
      purchaseDate: '2026-05-01',
      quantity: 1,
      status: 'active' as const,
      notes: '',
      userId: 'user-1',
      createdAt: '2026-05-01',
      updatedAt: '2026-05-01',
      isFrozen: false,
      quantities: [{ quantity: 1, unit: 'pz' }],
      addedMethod: 'barcode' as const,
    };

    it('should save product template with upsert', async () => {
      const mockQueryBuilder = {
        upsert: jest.fn().mockResolvedValue({ error: null }),
      };

      (supabase.from as jest.Mock).mockReturnValue(mockQueryBuilder);
      (convertTemplateToSnakeCase as jest.Mock).mockReturnValue({ barcode: mockBarcode, name: 'Latte', _converted: 'snake' });

      await TemplateService.saveProductTemplate(mockProduct);

      expect(supabase.from).toHaveBeenCalledWith('barcode_templates');
      expect(convertTemplateToSnakeCase).toHaveBeenCalledWith({
        barcode: mockBarcode,
        name: mockProduct.name,
        brand: mockProduct.brand,
        category: mockProduct.category,
        imageUrl: mockProduct.imageUrl,
      });
      expect(mockQueryBuilder.upsert).toHaveBeenCalled();
      expect(LoggingService.info).toHaveBeenCalledWith(
        'TemplateService',
        expect.stringContaining(mockBarcode)
      );
    });

    it('should skip save when product has no barcode', async () => {
      await TemplateService.saveProductTemplate({ ...mockProduct, barcode: '' });

      expect(supabase.from).not.toHaveBeenCalled();
      expect(LoggingService.error).not.toHaveBeenCalled();
    });

    it('should skip save when barcode is null/undefined', async () => {
      const { barcode, ...productWithoutBarcode } = mockProduct;
      await TemplateService.saveProductTemplate(productWithoutBarcode as any);

      expect(supabase.from).not.toHaveBeenCalled();
    });

    it('should log error and not throw on database error during save', async () => {
      const dbError = new Error('Upsert failed');
      const mockQueryBuilder = {
        upsert: jest.fn().mockResolvedValue({ error: dbError }),
      };

      (supabase.from as jest.Mock).mockReturnValue(mockQueryBuilder);
      (convertTemplateToSnakeCase as jest.Mock).mockReturnValue({ barcode: mockBarcode });

      await expect(TemplateService.saveProductTemplate(mockProduct)).resolves.toBeUndefined();
      expect(LoggingService.error).toHaveBeenCalledWith(
        'TemplateService',
        expect.stringContaining(mockBarcode),
        dbError
      );
    });

    it('should log error on rejected promise', async () => {
      const dbError = new Error('Network failure');
      const mockQueryBuilder = {
        upsert: jest.fn().mockRejectedValue(dbError),
      };

      (supabase.from as jest.Mock).mockReturnValue(mockQueryBuilder);
      (convertTemplateToSnakeCase as jest.Mock).mockReturnValue({ barcode: mockBarcode });

      await expect(TemplateService.saveProductTemplate(mockProduct)).resolves.toBeUndefined();
      expect(LoggingService.error).toHaveBeenCalledWith(
        'TemplateService',
        expect.stringContaining(mockBarcode),
        dbError
      );
    });
  });
});

