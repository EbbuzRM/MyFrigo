import { productsEn } from './catalogs/en/products';
import { productsIt } from './catalogs/it/products';
import type { SupportedLanguage } from './types';

const unitKeys = {
  pz: ['unitPz', 'unitPzDescription'],
  kg: ['unitKg', 'unitKgDescription'],
  g: ['unitG', 'unitGDescription'],
  L: ['unitL', 'unitLDescription'],
  ml: ['unitMl', 'unitMlDescription'],
  conf: ['unitConf', 'unitConfDescription'],
  barattolo: ['unitBarattolo', 'unitBarattoloDescription'],
  bottiglia: ['unitBottiglia', 'unitBottigliaDescription'],
  vasetto: ['unitVasetto', 'unitVasettoDescription'],
} as const;

export function getUnitLabel(unit: string, language: SupportedLanguage, description = false): string {
  if (!Object.prototype.hasOwnProperty.call(unitKeys, unit)) return unit;
  const keys = unitKeys[unit as keyof typeof unitKeys];
  const key = description ? keys[1] : keys[0];
  return language === 'it' ? productsIt[key] : productsEn[key];
}
