// notifications.ts — italian catalog for the `notifications` domain.
//
// exports: notificationsIt
// used_by: i18n/catalogs/it/index.ts
// rules:   Semantic keys only — never derived from the italian text.
// agent:   executor | 2026-09-22 | Fase A i18n | base keys (content migrates in Fase B)

export const notificationsIt = {
  title: 'Notifiche',
  permissionDenied: 'Permesso notifiche negato',
  permissionAlertTitle: 'Permessi Notifiche',
  permissionAlertMessage: 'Le notifiche sono disattivate. Per riattivarle, devi modificare le impostazioni del tuo dispositivo.',
  openSettings: 'Apri Impostazioni',
  testUnavailable: 'Test non disponibile',
  testUnavailableWeb: 'Le notifiche non sono supportate sul web.',
  testPermissionDone: 'Test permessi completato',
  testPermissionFailed: 'Test permessi fallito',
  testPermissionGranted: 'Permessi notifiche concessi. Il sistema di notifiche è configurato correttamente.',
  testPermissionDenied: 'Permessi notifiche non concessi. Attivali nelle impostazioni del dispositivo.',
  testPermissionError: 'Errore nel test dei permessi',
  testReadinessFailed: 'Verifica notifiche non riuscita',
  testReadinessNoPermission: 'Permesso notifiche non concesso. Attivalo nelle impostazioni del dispositivo.',
  testReadinessDone: 'Verifica notifiche completata',
  testReadinessDoneMessage: 'Permesso OneSignal verificato. Questo controllo non invia una notifica.',
  testReadinessError: 'Errore nella verifica notifiche',
  testUnexpectedError: 'Si è verificato un errore durante il controllo.',
} satisfies Record<string, string>;
