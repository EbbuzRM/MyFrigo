// CategoryService.test.ts — CategoryService test module.
//
// exports: none
// used_by: none
// rules:   none

jest.mock('../supabaseClient', () => {
  const mockSupabase = {
    from: jest.fn(),
    auth: {
      getSession: jest.fn(),
    },
  };
  return { supabase: mockSupabase };
});

jest.mock('../LoggingService', () => ({
  LoggingService: {
    info: jest.fn(),
    warning: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    log: jest.fn(),
  },
}));

jest.mock('../../utils/caseConverter', () => ({
  convertCategoryToCamelCase: jest.fn((data) => ({
    id: data.id,
    name: data.name,
    icon: data.icon,
    localIcon: data.local_icon,
    color: data.color,
    isDefault: data.is_default,
  })),
  convertCategoryToSnakeCase: jest.fn((data) => ({
    id: data.id,
    name: data.name,
    icon: data.icon,
    local_icon: data.localIcon,
    color: data.color,
    is_default: data.isDefault,
  })),
  convertCategoriesToCamelCase: jest.fn((dataArr) =>
    dataArr.map((data: Record<string, unknown>) => ({
      id: data.id,
      name: data.name,
      icon: data.icon,
      localIcon: data.local_icon,
      color: data.color,
      isDefault: data.is_default,
    }))
  ),
}));

import { CategoryService } from '../CategoryService';
import { supabase } from '../supabaseClient';
import { LoggingService } from '../LoggingService';
import { convertCategoryToCamelCase, convertCategoryToSnakeCase, convertCategoriesToCamelCase } from '../../utils/caseConverter';

describe('CategoryService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ── getCustomCategories ────────────────────────────────────────────
  describe('getCustomCategories', () => {
    it('should return custom categories from Supabase', async () => {
      const mockData = [
        { id: 'cat1', name: 'Custom Cat', icon: '🏷️', local_icon: null, color: '#FF0000', is_default: false },
      ];
      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data: mockData, error: null }),
      };
      (supabase.from as jest.Mock).mockReturnValue(mockQueryBuilder);

      const result = await CategoryService.getCustomCategories();

      expect(supabase.from).toHaveBeenCalledWith('categories');
      expect(mockQueryBuilder.select).toHaveBeenCalled();
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('is_default', false);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('cat1');
    });

    it('should return empty array when no data', async () => {
      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data: null, error: null }),
      };
      (supabase.from as jest.Mock).mockReturnValue(mockQueryBuilder);

      const result = await CategoryService.getCustomCategories();

      expect(result).toEqual([]);
    });

    it('should parse localIcon JSON string into object', async () => {
      const mockData = [
        {
          id: 'cat2',
          name: 'With Icon',
          icon: null,
          local_icon: '{"uri": "file:///icon.png"}',
          color: '#00FF00',
          is_default: false,
        },
      ];
      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data: mockData, error: null }),
      };
      (supabase.from as jest.Mock).mockReturnValue(mockQueryBuilder);

      const result = await CategoryService.getCustomCategories();

      expect(result[0].localIcon).toEqual({ uri: 'file:///icon.png' });
    });

    it('should set localIcon to undefined when JSON parse fails', async () => {
      const mockData = [
        {
          id: 'cat3',
          name: 'Bad Icon',
          icon: null,
          local_icon: 'not-valid-json',
          color: '#0000FF',
          is_default: false,
        },
      ];
      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data: mockData, error: null }),
      };
      (supabase.from as jest.Mock).mockReturnValue(mockQueryBuilder);

      const result = await CategoryService.getCustomCategories();

      expect(result[0].localIcon).toBeUndefined();
      expect(LoggingService.error).toHaveBeenCalledWith(
        'CategoryService',
        expect.stringContaining('Failed to parse localIcon'),
        expect.anything()
      );
    });

    it('should return empty array and log error on Supabase error', async () => {
      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data: null, error: new Error('DB error') }),
      };
      (supabase.from as jest.Mock).mockReturnValue(mockQueryBuilder);

      const result = await CategoryService.getCustomCategories();

      expect(result).toEqual([]);
      expect(LoggingService.error).toHaveBeenCalled();
    });
  });

  // ── getAllCategories ────────────────────────────────────────────────
  describe('getAllCategories', () => {
    it('should return default categories when user is not logged in', async () => {
      (supabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: { session: null },
      });
      const mockData = [
        { id: 'd1', name: 'Default', icon: '📦', local_icon: null, color: '#AAA', is_default: true },
      ];
      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ data: mockData, error: null }),
      };
      (supabase.from as jest.Mock).mockReturnValue(mockQueryBuilder);

      const result = await CategoryService.getAllCategories();

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('d1');
    });

    it('should return both default and user categories when logged in', async () => {
      (supabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: { session: { user: { id: 'user-1' } } },
      });
      const mockData = [
        { id: 'd1', name: 'Default', icon: '📦', local_icon: null, color: '#AAA', is_default: true },
        { id: 'c1', name: 'Custom', icon: '🏷️', local_icon: null, color: '#BBB', is_default: false },
      ];
      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        or: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data: mockData, error: null }),
      };
      (supabase.from as jest.Mock).mockReturnValue(mockQueryBuilder);

      const result = await CategoryService.getAllCategories();

      expect(result).toHaveLength(2);
    });

    it('should return empty array and log error on exception', async () => {
      (supabase.auth.getSession as jest.Mock).mockRejectedValue(new Error('Session error'));

      const result = await CategoryService.getAllCategories();

      expect(result).toEqual([]);
      expect(LoggingService.error).toHaveBeenCalled();
    });
  });

  // ── addCategory ────────────────────────────────────────────────────
  describe('addCategory', () => {
    it('should insert a category and return it', async () => {
      const inputCategory = {
        id: 'new-cat',
        name: 'Nuova',
        color: '#FF0000',
        icon: '🎉',
      };
      const returnedData = {
        id: 'new-cat',
        name: 'Nuova',
        icon: '🎉',
        local_icon: null,
        color: '#FF0000',
        is_default: false,
      };
      const mockQueryBuilder = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: returnedData, error: null }),
      };
      (supabase.from as jest.Mock).mockReturnValue(mockQueryBuilder);

      const result = await CategoryService.addCategory(inputCategory as any);

      expect(result.id).toBe('new-cat');
      expect(convertCategoryToSnakeCase).toHaveBeenCalled();
    });

    it('should throw on Supabase error', async () => {
      const inputCategory = { id: 'fail-cat', name: 'Fail', color: '#000' };
      const mockQueryBuilder = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: new Error('Insert failed') }),
      };
      (supabase.from as jest.Mock).mockReturnValue(mockQueryBuilder);

      await expect(CategoryService.addCategory(inputCategory as any)).rejects.toThrow('Insert failed');
      expect(LoggingService.error).toHaveBeenCalled();
    });
  });

  // ── updateCategory ────────────────────────────────────────────────
  describe('updateCategory', () => {
    it('should update icon for a category', async () => {
      const mockQueryBuilder = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ error: null }),
      };
      (supabase.from as jest.Mock).mockReturnValue(mockQueryBuilder);

      await CategoryService.updateCategory({ id: 'cat-1', icon: '🆕' });

      expect(supabase.from).toHaveBeenCalledWith('categories');
      expect(mockQueryBuilder.update).toHaveBeenCalled();
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('id', 'cat-1');
    });

    it('should update localIcon with JSON stringification', async () => {
      const mockQueryBuilder = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ error: null }),
      };
      (supabase.from as jest.Mock).mockReturnValue(mockQueryBuilder);

      await CategoryService.updateCategory({ id: 'cat-1', localIcon: { uri: 'file.png' } });

      expect(mockQueryBuilder.update).toHaveBeenCalledWith(
        expect.objectContaining({ local_icon: JSON.stringify({ uri: 'file.png' }) })
      );
    });

    it('should log info and do nothing when no icon or localIcon to update', async () => {
      (supabase.from as jest.Mock).mockReturnValue({
        update: jest.fn().mockReturnThis(),
        eq: jest.fn(),
      });

      await CategoryService.updateCategory({ id: 'cat-1', name: 'SoloNome' });

      expect(LoggingService.info).toHaveBeenCalledWith(
        'CategoryService',
        expect.stringContaining('No icon or localIcon')
      );
    });

    it('should throw on Supabase update error', async () => {
      const mockQueryBuilder = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ error: new Error('Update failed') }),
      };
      (supabase.from as jest.Mock).mockReturnValue(mockQueryBuilder);

      await expect(
        CategoryService.updateCategory({ id: 'cat-1', icon: '🆕' })
      ).rejects.toThrow('Update failed');
    });
  });

  // ── deleteCategory ────────────────────────────────────────────────
  describe('deleteCategory', () => {
    it('should delete a category by id', async () => {
      const mockQueryBuilder = {
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ error: null }),
      };
      (supabase.from as jest.Mock).mockReturnValue(mockQueryBuilder);

      await CategoryService.deleteCategory('cat-to-delete');

      expect(supabase.from).toHaveBeenCalledWith('categories');
      expect(mockQueryBuilder.delete).toHaveBeenCalled();
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('id', 'cat-to-delete');
    });

    it('should throw on Supabase error', async () => {
      const mockQueryBuilder = {
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ error: new Error('Delete failed') }),
      };
      (supabase.from as jest.Mock).mockReturnValue(mockQueryBuilder);

      await expect(CategoryService.deleteCategory('cat-id')).rejects.toThrow('Delete failed');
      expect(LoggingService.error).toHaveBeenCalled();
    });
  });
});
