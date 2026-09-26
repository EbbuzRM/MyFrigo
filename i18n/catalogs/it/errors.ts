// errors.ts — italian catalog for the `errors` domain.
//
// exports: errorsIt
// used_by: i18n/catalogs/it/index.ts
// rules:   Semantic keys only — never derived from the italian text.
//          Technical log messages stay outside the catalogs (language-independent).
// agent:   executor | 2026-09-22 | Fase A i18n | base keys (content migrates in Fase B)

export const errorsIt = {
  generic: 'Si è verificato un errore',
  network: 'Errore di rete. Controlla la connessione.',
} satisfies Record<string, string>;
