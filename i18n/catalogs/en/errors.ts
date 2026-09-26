// errors.ts — english catalog for the `errors` domain.
//
// exports: errorsEn
// used_by: i18n/catalogs/en/index.ts
// rules:   Must expose exactly the same keys as `errorsIt` — enforced at
//          compile time by the `satisfies` constraint (missing/extra keys fail tsc).
// agent:   executor | 2026-09-22 | Fase A i18n | base keys (content migrates in Fase B)

import { errorsIt } from '../it/errors';

export const errorsEn = {
  generic: 'Something went wrong',
  network: 'Network error. Check your connection.',
} satisfies Record<keyof typeof errorsIt, string>;
