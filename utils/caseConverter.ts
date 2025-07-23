
import { camelCase, snakeCase } from 'lodash';

const isObject = (obj: any): obj is object => obj !== null && typeof obj === 'object' && !Array.isArray(obj);

export const convertObjectKeys = (obj: any, converter: (key: string) => string): any => {
  if (Array.isArray(obj)) {
    return obj.map(item => convertObjectKeys(item, converter));
  }

  if (isObject(obj)) {
    const newObj: { [key: string]: any } = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        const newKey = converter(key);
        newObj[newKey] = convertObjectKeys((obj as any)[key], converter);
      }
    }
    return newObj;
  }

  return obj;
};

export const toCamelCase = (str: string): string => {
    return camelCase(str);
};

export const toSnakeCase = (str: string): string => {
    return snakeCase(str);
};
