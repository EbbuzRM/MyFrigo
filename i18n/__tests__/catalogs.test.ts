// catalogs.test.ts — it/en catalog equivalence (Fase A i18n).
//
// exports: none
// used_by: jest
// rules:   Same domains, same keys, equivalent interpolations, complete plural
//          forms, and no raw key ever exposed as a visible value.
// agent:   executor | 2026-09-22 | Fase A i18n | TDD

import { enCatalogs } from '../catalogs/en';
import { itCatalogs } from '../catalogs/it';
import { TRANSLATION_DOMAINS, type TranslationDomain } from '../types';

type LocalizedCatalogs = Record<TranslationDomain, Record<string, string>>;

const INTERPOLATION_PATTERN = /\{\{\s*([A-Za-z0-9_]+)\s*\}\}/g;

const catalogs: ReadonlyArray<[string, LocalizedCatalogs]> = [
  ['it', itCatalogs],
  ['en', enCatalogs],
];

function sortedKeys(catalogsForLanguage: LocalizedCatalogs, domain: TranslationDomain): string[] {
  return Object.keys(catalogsForLanguage[domain]).sort();
}

function interpolationParams(value: string): string[] {
  const params = new Set<string>();
  for (const match of value.matchAll(INTERPOLATION_PATTERN)) {
    params.add(match[1]);
  }
  return [...params].sort();
}

describe('catalog structure', () => {
  it.each(catalogs)('exposes exactly the planned domains in %s', (language, catalogsForLanguage) => {
    expect(Object.keys(catalogsForLanguage).sort()).toEqual([...TRANSLATION_DOMAINS].sort());
  });

  it.each(catalogs)('has at least one key per domain in %s', (language, catalogsForLanguage) => {
    for (const domain of TRANSLATION_DOMAINS) {
      expect(sortedKeys(catalogsForLanguage, domain).length).toBeGreaterThan(0);
    }
  });
});

describe('it/en key equivalence', () => {
  it('has the same keys per domain in both languages', () => {
    const mismatches: string[] = [];
    for (const domain of TRANSLATION_DOMAINS) {
      const itKeys = sortedKeys(itCatalogs, domain);
      const enKeys = sortedKeys(enCatalogs, domain);
      if (JSON.stringify(itKeys) !== JSON.stringify(enKeys)) {
        mismatches.push(`${domain}: it=[${itKeys.join(', ')}] en=[${enKeys.join(', ')}]`);
      }
    }
    expect(mismatches).toEqual([]);
  });

  it('uses equivalent interpolation parameters in both languages', () => {
    const mismatches: string[] = [];
    for (const domain of TRANSLATION_DOMAINS) {
      const enValues = new Map(Object.entries(enCatalogs[domain]));
      for (const [key, itValue] of Object.entries(itCatalogs[domain])) {
        const itParams = interpolationParams(itValue);
        const enParams = interpolationParams(enValues.get(key) ?? '');
        if (JSON.stringify(itParams) !== JSON.stringify(enParams)) {
          mismatches.push(`${domain}.${key}: it=[${itParams.join(', ')}] en=[${enParams.join(', ')}]`);
        }
      }
    }
    expect(mismatches).toEqual([]);
  });

  it('never exposes a raw key as a visible value', () => {
    const rawValues: string[] = [];
    for (const [language, catalogsForLanguage] of catalogs) {
      for (const domain of TRANSLATION_DOMAINS) {
        for (const [key, value] of Object.entries(catalogsForLanguage[domain])) {
          const fullKey = `${domain}.${key}`;
          if (value.trim() === '' || value === key || value === fullKey) {
            rawValues.push(`${language}:${fullKey} -> "${value}"`);
          }
        }
      }
    }
    expect(rawValues).toEqual([]);
  });
});

describe('plural forms', () => {
  it.each(catalogs)('pairs every _one form with _other in %s', (language, catalogsForLanguage) => {
    const incomplete: string[] = [];
    for (const domain of TRANSLATION_DOMAINS) {
      const keys = new Set(sortedKeys(catalogsForLanguage, domain));
      for (const key of keys) {
        if (key.endsWith('_one') && !keys.has(`${key.slice(0, -'_one'.length)}_other`)) {
          incomplete.push(`${language}:${domain}.${key}`);
        }
        if (key.endsWith('_other') && !keys.has(`${key.slice(0, -'_other'.length)}_one`)) {
          incomplete.push(`${language}:${domain}.${key}`);
        }
      }
    }
    expect(incomplete).toEqual([]);
  });

  it.each(catalogs)('keeps {{count}} in every plural form in %s', (language, catalogsForLanguage) => {
    const missingCount: string[] = [];
    for (const domain of TRANSLATION_DOMAINS) {
      for (const [key, value] of Object.entries(catalogsForLanguage[domain])) {
        if ((key.endsWith('_one') || key.endsWith('_other')) && !value.includes('{{count}}')) {
          missingCount.push(`${language}:${domain}.${key}`);
        }
      }
    }
    expect(missingCount).toEqual([]);
  });

  it('ships at least one plural and one interpolation key (guards vacuous parity tests)', () => {
    const hasPlural = TRANSLATION_DOMAINS.some((domain) =>
      Object.keys(itCatalogs[domain]).some((key) => key.endsWith('_other')),
    );
    const hasInterpolation = TRANSLATION_DOMAINS.some((domain) =>
      Object.values(itCatalogs[domain]).some((value) => interpolationParams(value).length > 0),
    );
    expect(hasPlural).toBe(true);
    expect(hasInterpolation).toBe(true);
  });
});
