# GSD State

Last updated: 2026-08-29

## Current Phase
Post-Upgrade SDK 57

## Session Log Index

Log sessioni dettagliato: **`.planning/SESSIONS.md`** (unica fonte di verità).

| Data | Titolo | Link SESSIONS.md |
|------|--------|------------------|
| 2026-08-29 | Upgrade Expo SDK 54 → 57 | `#2026-08-29--upgrade-expo-sdk-54--57` |
| 2026-08-29 | Integrazione hCaptcha in form auth | `#2026-08-29--integrazione-hcaptcha-in-form-auth` |
| 2026-08-27 | Security audit token/sessioni: SecureStore + revoke sessions | `#2026-08-27-security-audit-tokensessioni-securestore--revoke-sessions` |
| 2026-08-27 | Fix brute force login: rate limiting 5/15min + test dimostrativo + hardening Supabase | `#2026-08-27-fix-brute-force-login-rate-limiting-515min--test-dimostrativo--hardening-supabase` |
| 2026-08-09 | Refactoring bookkeeping: SESSIONS.md unico log, STATE.md dashboard | `#2026-08-09-refactoring-bookkeeping-sessionsmd-unico-log-sessioni-statemd-dashboard-di-stato` |
| 2026-08-04 | Fix 3 problemi CLAUDE.md (RPC schema, email trim, feedback.test.tsx) | `#2026-08-04-fix-3-problemi-claudemd-rpc-schema-email-trim-feedbacktesttsx` |
| 2026-07-23 | Analisi e ottimizzazione errorHandler.ts | `#2026-07-23-analisi-e-ottimizzazione-errorhandlerts` |
| 2026-07-23 | Analisi refactoring candidati + Cleanup useBarcodeScanner + Test coverage | `#2026-07-23-analisi-refactoring-candidati--cleanup-usebarcodescanner--test-coverage` |
| 2026-07-22 | Refactoring Fasi 1-3: Styles extraction, test coverage, logic dedup | `#2026-07-22-refactoring-fasi-1-3-styles-extraction-test-coverage-logic-dedup` |
| 2026-07-16 | Fix notifiche OneSignal: arrivano solo con app aperta | `#2026-07-16-fix-notifiche-onesignal-arrivano-solo-con-app-aperta` |
| 2026-07-15 | Code Review completa del progetto (38 finding) | `#2026-07-15-code-review-completa-del-progetto` |
| 2026-07-15 | Fix 11 HIGH, 16 MEDIUM, 8 LOW findings dalla code review | `#2026-07-15-fix-11-high-16-medium-8-low-findings-dalla-code-review` |
| 2026-07-15 | Fix 17 MEDIUM findings dalla code review (solo MEDIUM) | `#2026-07-15-fix-17-medium-findings-dalla-code-review-sessione-precedente-solo-medium` |
| 2026-07-15 | Fix CRIT-01 + 3 problemi preesistenti (test falliti + errori tsc) | `#2026-07-15-fix-crit-01--3-problemi-preesistenti-test-falliti--errori-tsc` |
| 2026-07-15 | Seconda Code Review: 15 finding nuovi (3 HIGH, 7 MEDIUM, 5 LOW) | `#2026-07-15-seconda-code-review-15-finding-nuovi-3-high-7-medium-5-low` |
| 2026-07-15 | Fix test falliti preesistenti (29 test) | `#2026-07-15-fix-test-falliti-preesistenti-29-test` |
| 2026-07-09 | Fix notifiche OneSignal: mancava promemoria a 1 giorno + testo errato | `#2026-07-09-fix-notifiche-onesignal-mancava-promemoria-a-1-giorno--testo-errato` |
| 2026-07-08 | Fix OCR: data 15/08/26 letta come 30/08 (poi corretto in 08-31) | `#2026-07-08-fix-ocr-data-150826-letta-come-3008-poi-corretto-in-08-31` |
| 2026-06-28 | Fix notifiche push duplicate | `#2026-06-28-fix-notifiche-push-duplicate` |
| 2026-06-17 | Fix barcode: imageUrl non normalizzata (string[] → string) | `#2026-06-17-fix-barcode-imageurl-non-normalizzata-string-string` |
| 2026-06-17 | Ottimizzazione Caricamento Immagini | `#2026-06-17-ottimizzazione-caricamento-immagini` |
| 2026-06-02 | Diagnosi: immagine prodotto lenta o assente nel dettaglio | `#2026-06-02-diagnosi-immagine-prodotto-lenta-o-assente-nel-dettaglio` |
| 2026-05-23 | Creazione Test Copertura Moduli Critici | `#2026-05-23-creazione-test-copertura-moduli-critici` |
| 2026-05-10 | Stabilizzazione Infrastruttura di Test e Fix Logica Errori | `#2026-05-10-stabilizzazione-infrastruttura-di-test-e-fix-logica-errori` |
| 2026-05-10 | Fix OCR: esclusione Lotto e fallback dot-matrix | `#2026-05-10-fix-ocr-esclusione-lotto-e-fallback-dot-matrix` |
| 2026-05-10 | Fix OCR date scadenza da foto confezioni | `#2026-05-10-fix-ocr-date-scadenza-da-foto-confezioni` |
| 2026-05-10 | Code Review Finding Fixes, Security & Accessibility Improvements | `#2026-05-10-code-review-finding-fixes-security--accessibility-improvements` |
| 2026-05-09 | Completati headers CodeDNA su tutti i file sorgente | `#2026-05-09-completati-headers-codedna-su-tutti-i-file-sorgente` |
| 2026-05-02 | Log Viewer & Diagnostic Panel Improvements | `#2026-05-02-log-viewer--diagnostic-panel-improvements` |

## Known Issues

### Aperti (non bloccanti)
- **5 test skipped legacy**: NotificationPermissionService.test.ts (4 skip), altri (1 skip). Non bloccanti.
- **`PhotoCaptureButton.tsx:95-148`**: `<Image>` RN standard senza onError/placeholder/priority (Fix #4 rimandata 2026-06-02, non bloccante).
- **`expo-image` non installato** (Fix #5 rimandata 2026-06-02, non bloccante finché lista prodotti <200 e immagini restano locali).
- **Note aperte OCR fix 2026-07-08 (LOW)**:
  - `parsing.ts` filtro per sottostringa: edge case raro di blocco singolo con data standard + month-year legittimo distinto (es. "SCAD 08/26 15/08/26") escluderebbe anche il legittimo. Non impatta i casi reali (blocchi separati).
  - Manca test dedicato per "ENTRO 08 26" (comportamento preservato ma non coperto da test).
- **`EXPO_PUBLIC_OCR_SPACE_API_KEY` embedded in client bundle** (EXPO_PUBLIC_ prefix ships it in JS bundle; ocr.space key is server-side/billed). Deferred: dedicated task after SDK 57 upgrade.

### Risolti
- **2026-08-30**: ML Kit OCR confermato funzionante su RN 0.86 via interop layer. Smoke test: 7 blocchi testo letti, data "21/05/2027" estratta correttamente, anchor OCR trovato, lotto escluso, zero crash.
- **2026-08-04**: `feedback.test.tsx` 14 fallimenti (mock hoisting `expo-image-picker`); `forgot-password.tsx` trim mancante in `handleVerifyOTP`; RPC `get_expiring_products` chiusa (già sincronizzata con prod, `days_remaining` presente, commit `ab44414`).
- **2026-07-16**: `NotificationService.initialize()` ora chiamato in `_layout.tsx` (era `OneSignalService.initialize()` che non richiedeva permessi push).
- **2026-06-28**: `expo-notifications` rimosso per risolvere notifiche duplicate; `onesignal-expo-plugin` mode → production.
- **2026-07-15**: `DashboardHeader.tsx` permissionStatus `boolean|null`; `jest.setup.js` mock `expo-notifications` con `{ virtual: true }`; `password-reset-form.tsx` 37/37 test riparati; `settings.test.tsx` 32/32 test riparati; `usePhotoNavigation.test.ts` 8/8 test riparati; **0 errori TypeScript**; **0 test falliti**.

## Test Suite Summary
- **Ultimo (2026-08-29, post-TS 6.0.3)**: 2284/2289 test passano (129 suites, 5 skipped legacy), 0 falliti, 0 errori TypeScript.
- expo-doctor: 18/21 (3 failed: native folder sync, ML Kit New Arch, TypeScript 6.0.3 risolto).
- Test riparati nel tempo: settings (28), usePhotoNavigation (1), password-reset-form (37), feedback (14), forgot-password (1 nuovo regressione).
- Test coperti di recente: AuthService.bruteForce (17 nuovo), imageStorage (15), useCamera (19), useProductInitialization (28), useProductForm consumer (41), useBarcodeScanner (58), scanner (82).
- Helper di test: `installMockCameraRef` per mocking atomico di cameraRef con cleanup automatico.

## Decisions
- Scelto ocr.space Engine 2 come fallback (vs preprocessing nativo): Engine 2 è specificamente ottimizzato per dot-matrix OCR, zero impatto su ML Kit primario.
- Scelto fallback trasparente (vs sostituzione): ML Kit rimane primario, ocr.space solo quando ML Kit non trova date.
- Scelto `[:. ]?` dopo ogni keyword Lotto nella regex: copre i separatori più comuni (: . spazio) dopo LOTTO/LOT/LT.
- Scelto 5 tap (vs long press) per attivazione diagnostica: più veloce e intuitivo.
- Scelto buffer in memoria per log in dev: permette di vedere i log senza file system.
- Scelto View+Text (vs FlatList/ScrollView) per log viewer: evita nested scroll issues.
- Scelto filtro per-blocco (vs ancorare regex a inizio stringa) per Fix 1: ancorare romperebbe "SCAD 08/26" che non è all'inizio riga. Le date solo mese/anno sono legittime e devono risolvere l'ultimo giorno del mese.
- Scelto `virtual: true` su mock expo-notifications (vs installare il modulo): l'utente non vuole la dipendenza installata.
- Scelto `AsyncStorage` `myfrigo:rateLimitStore` con debounce 50ms + `cleanupOldAttempts` (vs `Map` volatile): persiste tra reload senza backend; `checkRateLimit`/`recordFailedAttempt` async con serializzazione JSON.
- Scelto `trim()+toLowerCase()` canonica su email (vs case-sensitive): un bucket per identità reale; applicata prima di validazione e di `supabase.auth.signInWithPassword`.
- Scelto suffix `:otp` per bucket OTP separato (vs bucket unico): `sendPasswordResetEmail`/`verifyOtp` non consumano tentativi login; stesso limite 5/15min.
- Scelto countdown UX 1s `remainingMs` + `isRateLimited`/`rateLimitedUntil` (vs messaggio statico): bottone disabilitato + banner `Riprova tra Xs` previene retry inutili.
- Scelto delega `AuthContext.changePassword()` → `AuthService.updatePassword()` (vs `supabase.auth.updateUser` diretto): chiude bypass limiter su closure.
- Supabase Auth Rate Limits server-side consigliati come difesa in profondità: `10,30,150,10,30,15,30` (vs default `30/5min` troppo permissivo; `sign-ins 15/5min`, `token verifications 10/5min`).
- Scelto `expo-splash-screen` con props esplicite (vs forma nuda `{}`): forma nuda cancella immagini ma genera stile che le referenzia → build Android rotta.
- Scelto import type-only dal fork expo-router (vs installare @react-navigation/bottom-tabs): due universi di tipi incompatibili, type-only import risolve.
- Scelto TypeScript 5.9.3 (vs 6.0.3 pin SDK 57): errore TS5101 su `baseUrl` deprecato, richiede decisione su tsconfig.
- Scelto rimuovere baseUrl da tsconfig.json (vs ignoreDeprecations): paths già relativo al tsconfig, zero impatto funzionale, allinea a best practice TS 6.0.
- Scelto mantenere @react-navigation/native come devDependency (vs rimuovere): test files importano tipi, non va nel bundle production.
- Scelto migrare import application code a expo-router/build/react-navigation/native (vs lasciare @react-navigation/native): Expo Router 56+ ha forkato React Navigation, import diretti non supportati.
- Scelto NON aggiungere datetimepicker/build-properties/status-bar plugin: certificati no-op come stringhe nude.
- Scelto prebuild --clean (vs prebuild incrementale): android/ rigenerato da zero per SDK 57.

## Last Commit
Hash: 492f832
Message: "fix(navigation): complete migration to expo-router fork"
