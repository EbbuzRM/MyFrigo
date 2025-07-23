import { toCamelCase, toSnakeCase, convertObjectKeys } from '../caseConverter';

// Test per toCamelCase
describe('toCamelCase', () => {
  it('should convert a snake_case string to camelCase', () => {
    const snakeCaseString = 'hello_world_example';
    const expectedCamelCase = 'helloWorldExample';
    expect(toCamelCase(snakeCaseString)).toBe(expectedCamelCase);
  });

  it('should handle already camelCased strings', () => {
    const camelCaseString = 'alreadyCamelCased';
    expect(toCamelCase(camelCaseString)).toBe(camelCaseString);
  });

  it('should handle single words', () => {
    const singleWord = 'hello';
    expect(toCamelCase(singleWord)).toBe(singleWord);
  });
});

// Test per toSnakeCase
describe('toSnakeCase', () => {
  it('should convert a camelCase string to snake_case', () => {
    const camelCaseString = 'helloWorldExample';
    const expectedSnakeCase = 'hello_world_example';
    expect(toSnakeCase(camelCaseString)).toBe(expectedSnakeCase);
  });

  it('should handle already snake_cased strings', () => {
    const snakeCaseString = 'already_snake_cased';
    expect(toSnakeCase(snakeCaseString)).toBe(snakeCaseString);
  });

  it('should handle single words', () => {
    const singleWord = 'hello';
    expect(toSnakeCase(singleWord)).toBe(singleWord);
  });
});

// Test per convertObjectKeys
describe('convertObjectKeys', () => {
  it('should convert all keys of an object to camelCase', () => {
    const snakeCaseObject = {
      first_name: 'John',
      last_name: 'Doe',
      user_details: {
        phone_number: '123-456-7890',
      },
    };
    const expectedCamelCaseObject = {
      firstName: 'John',
      lastName: 'Doe',
      userDetails: {
        phoneNumber: '123-456-7890',
      },
    };
    expect(convertObjectKeys(snakeCaseObject, toCamelCase)).toEqual(expectedCamelCaseObject);
  });

  it('should convert all keys of an object to snake_case', () => {
    const camelCaseObject = {
      firstName: 'Jane',
      lastName: 'Doe',
      userDetails: {
        phoneNumber: '098-765-4321',
      },
    };
    const expectedSnakeCaseObject = {
      first_name: 'Jane',
      last_name: 'Doe',
      user_details: {
        phone_number: '098-765-4321',
      },
    };
    expect(convertObjectKeys(camelCaseObject, toSnakeCase)).toEqual(expectedSnakeCaseObject);
  });

  it('should handle arrays of objects', () => {
    const snakeCaseArray = [
      { user_id: 1, display_name: 'User One' },
      { user_id: 2, display_name: 'User Two' },
    ];
    const expectedCamelCaseArray = [
      { userId: 1, displayName: 'User One' },
      { userId: 2, displayName: 'User Two' },
    ];
    expect(convertObjectKeys(snakeCaseArray, toCamelCase)).toEqual(expectedCamelCaseArray);
  });
});
