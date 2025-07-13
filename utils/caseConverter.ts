
import { camelCase, snakeCase } from 'lodash';

const isObject = (obj: any): obj is object => obj !== null && typeof obj === 'object' && !Array.isArray(obj);

const convertKeys = (obj: any, converter: (key: string) => string): any => {
  if (!isObject(obj)) {
    if (Array.isArray(obj)) {
      return obj.map(item => convertKeys(item, converter));
    }
    return obj;
  }

  const newObj: { [key: string]: any } = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const newKey = converter(key);
      newObj[newKey] = convertKeys((obj as any)[key], converter);
    }
  }
  return newObj;
};

export const snakeToCamel = (obj: any): any => {
  return convertKeys(obj, camelCase);
};

export const camelToSnake = (obj: any): any => {
  return convertKeys(obj, snakeCase);
};
