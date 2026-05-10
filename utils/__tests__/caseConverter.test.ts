import { 
  toCamelCase, 
  toSnakeCase, 
  convertObjectKeys, 
  convertProductToCamelCase,
  convertProductToSnakeCase
} from '../caseConverter';

jest.mock('@/services/LoggingService', () => ({
  LoggingService: {
    info: jest.fn(),
    error: jest.fn(),
    warning: jest.fn(),
  },
}));

describe('caseConverter', () => {
  describe('toCamelCase', () => {
    it('should convert snake_case to camelCase', () => {
      expect(toCamelCase('test_string')).toBe('testString');
      expect(toCamelCase('another_test_string')).toBe('anotherTestString');
      expect(toCamelCase('id')).toBe('id');
    });
  });

  describe('toSnakeCase', () => {
    it('should convert camelCase to snake_case', () => {
      expect(toSnakeCase('testString')).toBe('test_string');
      expect(toSnakeCase('anotherTestString')).toBe('another_test_string');
      expect(toSnakeCase('id')).toBe('id');
    });
  });

  describe('convertObjectKeys', () => {
    it('should convert keys of a simple object', () => {
      const input = { first_name: 'John', last_name: 'Doe' };
      const expected = { firstName: 'John', lastName: 'Doe' };
      expect(convertObjectKeys(input, toCamelCase)).toEqual(expected);
    });

    it('should convert keys recursively', () => {
      const input = { 
        user_info: { 
          first_name: 'John', 
          hobbies: ['coding', 'reading'] 
        } 
      };
      const expected = { 
        userInfo: { 
          firstName: 'John', 
          hobbies: ['coding', 'reading'] 
        } 
      };
      expect(convertObjectKeys(input, toCamelCase)).toEqual(expected);
    });

    it('should handle arrays of objects', () => {
      const input = [
        { item_id: 1, item_name: 'A' },
        { item_id: 2, item_name: 'B' }
      ];
      const expected = [
        { itemId: 1, itemName: 'A' },
        { itemId: 2, itemName: 'B' }
      ];
      expect(convertObjectKeys(input, toCamelCase)).toEqual(expected);
    });
  });

  describe('convertProductToCamelCase', () => {
    it('should convert product keys and parse quantities JSON', () => {
      const input = {
        id: '1',
        product_name: 'Milk',
        quantities: '[{"quantity": 1, "unit": "l"}]'
      };
      const result = convertProductToCamelCase(input);
      expect(result.productName).toBe('Milk');
      expect(result.quantities).toEqual([{ quantity: 1, unit: 'l' }]);
    });

    it('should handle null quantities', () => {
      const input = { id: '1', quantities: null };
      const result = convertProductToCamelCase(input);
      expect(result.quantities).toEqual([]);
    });

    it('should handle invalid quantities JSON', () => {
      const input = { id: '1', quantities: 'invalid json' };
      const result = convertProductToCamelCase(input);
      expect(result.quantities).toEqual([]);
    });

    it('should return empty object for null input', () => {
      // @ts-ignore
      expect(convertProductToCamelCase(null)).toEqual({});
    });
  });

  describe('convertProductToSnakeCase', () => {
    it('should convert product keys to snake_case', () => {
      const input = {
        id: '1',
        productName: 'Milk',
        expiryDate: '2024-12-31'
      };
      const expected = {
        id: '1',
        product_name: 'Milk',
        expiry_date: '2024-12-31'
      };
      expect(convertProductToSnakeCase(input)).toEqual(expected);
    });
  });
});
