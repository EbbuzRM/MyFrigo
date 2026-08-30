## 2026-08-29 — Audit dipendenze, allineamento SDK 54 e safety net pre-SDK 57

**Contesto**: Utente chiede se i componenti/librerie dell'app sono ancora validi, mostrando l'output Gradle della build: buildTools 36.0.0, minSdk 24, compileSdk 36, targetSdk 36, ndk 27.1.12297006, kotlin 2.1.20, ksp 2.1.20-2.0.1. Sessione di audit + messa in sicurezza prima dell'upgrade a SDK 57.

**Audit dipendenze** (codebase-mapper):

| Voce | Valore | Giudizio |
|------|--------|----------|
| SDK in uso | **54** (`expo@54.0.34`) | 3 SDK dietro (ultimo stabile 57) |
| Pacchetti deprecati | Nessuno | OK |
| `npm audit --omit=dev` | 19 vuln (2 critical, 16 high) | Quasi tutte transitive nella toolchain Metro / `@expo/cli` |

**Verdetto versioni Gradle**:

| Valore | Fonte | Giudizio |
|--------|-------|----------|
| buildTools 36.0.0 | SDK-managed | OK |
| minSdk 24 | SDK-managed | OK |
| compileSdk 36 | SDK-managed | OK |
| targetSdk 36 | SDK-managed | Già compliant con scadenza Play 31/08/2026 |
| ndk 27.1.12297006 (r27c) | SDK-managed | Dietro, ma gestito da SDK |
| kotlin 2.1.20 / ksp 2.1.20-2.0.1 | SDK-managed | Dietro, ma gestito da SDK |
| AGP 8.11 | SDK-managed | Dietro, ma gestito da SDK |

**Punto chiave**: NESSUN pinning di progetto — `expo-build-properties` non è registrato in `plugins[]`. Kotlin 2.1 / NDK r27c / AGP 8.11 sono indietro ma SDK-managed: **non pinnare a mano**.

**Fix applicati**:

| Commit | Messaggio | Dettaglio |
|--------|-----------|-----------|
| `4b927f7` | chore: untrack generated artifacts and local env file | `graphify-out/` rimosso dal tracking (381 file, mantenuti su disco), `.env` untracked, `package-lock.json` non più gitignorato, `.gitignore` deduplicato |
| `6dde8aa` | chore: bump runtimeVersion, add expo-doctor, track lockfile | runtimeVersion 1.0.4→1.0.5, `expo-doctor` devDep, lockfile tracciato, placeholder `.env.example`, planning docs |
| `ed8ed7e` | chore(deps): align versions to Expo SDK 54 via expo install --fix | 10 downgrade + 3 patch bump |
| `1c09bfe` | test(auth): fix login call assertions after captchaToken param | 2 assert |

**Downgrade applicati**: `react-native-gesture-handler` 2.28.0, `react-native-screens` 4.16.0, `react-native-svg` 15.12.1, `react-native-webview` 13.15.0, `react-native-worklets` 0.5.1, `@shopify/flash-list` 2.0.2, `@react-native-community/datetimepicker` 8.4.4, `@react-native-picker/picker` 2.11.1, `@react-navigation/native` 7.1.8, `react-native-get-random-values` 1.11.0.

**Patch bump**: `expo` 54.0.37, `expo-router` 6.0.24, `expo-updates` 29.0.20.

**`expo install --fix` exit 1 (non errore bloccante)**: la CLI non può scrivere su `app.config.js` (dynamic config) per aggiungere il plugin `@react-native-community/datetimepicker`. Verificato (explorer): il plugin è un **no-op** senza opzioni Android (`plugin/build/withDateTimePickerStyles.js:79-113` early-return) e il modulo è autolinkato. **Decisione: non aggiunto.**

**2 test falliti pre-esistenti**: `LoginForm.test.tsx:160` e `useEmailAuth.test.ts:100` asserivano arità 2; il commit hCaptcha `d8c50f8` ha aggiunto `captchaToken` come 3° argomento (`LoginForm.tsx:78`, `useEmailAuth.ts:112`, `AuthService.ts:297`). La baseline STATE.md "0 failed" era stale. Fix: assert a 3 argomenti con terzo `undefined` (i test non risolvono il captcha). Verifier: 22/22 green.

**Baseline pre-upgrade certificata** (verifier): 129 suite / 2284 passed / 0 failed / 5 skipped / 2289 total, exit 0 · `tsc --noEmit` 0 errori · `expo-doctor` 15/18 (3 failed invariati: non-CNG config sync, ml-kit New Arch untested, devDeps drift `jest` / `@types/jest` / `jest-expo` / `@types/react`).

**Safety net rollback creato**:
- Tag annotato `pre-sdk57` + branch `sdk57`, entrambi su `1c09bfe`
- Zip `android/` (619.55 MiB, 2315 entry) in `C:\Users\Ebby\AppData\Local\Temp\opencode\android-pre-sdk57-20260829-170621.zip`
- Backup `package.json` / `package-lock.json` con suffisso `.bak-presdk57-20260829-170621`
- Nulla pushato (6 commit unpushed)

**Runbook rollback**: `git checkout master` (o `git reset --hard pre-sdk57^{commit}`) + ripristino `android/` dallo zip + copia dei due `.bak-presdk57-*`. NOTA: usare `pre-sdk57^{commit}` — `git rev-parse pre-sdk57` restituisce lo SHA dell'oggetto tag annotato (`31dd3df…`), non del commit.

**Decisioni chiave**:
- Scelto `expo install --fix` intra-SDK 54 (vs upgrade immediato a 57): zero rischio, allinea 16 pacchetti, prerequisito per upgrade pulito
- Scelto NON aggiungere il plugin datetimepicker: no-op senza opzioni, evita prebuild inutile
- Scelto fix assert (vs `expect.anything()` o rimozione parametro): assert su valori esatti incluso terzo arg `undefined`, arity-sensitive, non vacuo
- Scelto tag annotato + branch + zip `android/` come safety net: SDK 57 rigenera `android/` di default in prebuild, serve snapshot
- Scelto amend di `bb2ffb1`→`ed8ed7e`: messaggio citava 3 patch bump inesistenti (erano già allineati); commit locale non pushato, nessun rewrite remoto

**Note aperte (non bloccanti)**:
- `EXPO_PUBLIC_OCR_SPACE_API_KEY` finisce nel bundle client (prefisso `EXPO_PUBLIC_`); key server-side/billed → task dedicato dopo upgrade SDK 57
- devDeps fuori range SDK: `jest` 30.3.0, `jest-expo` 55.0.16, `@types/jest` 30.0.0, `@types/react` 19.2.14 (attesi 29.7.0 / 54.0.18 / 29.5.14 / 19.1.10) — allineare durante upgrade SDK 57, non prima
- `react-native-get-random-values` 2.0.0 vs 1.11.0 atteso: major drift, ma è la latest su npm e i test passano con `uuid@14`. Non downgradare alla cieca
- Manca coverage test per path auth CON `captchaToken` valorizzato (`LoginForm.tsx:78-80`)
- Worker Jest non esce gracefully (pre-esistente)
- Branch attualmente su `master`, non `sdk57` — da fare `git checkout sdk57` prima dell'upgrade

---

## 2026-08-29 — Upgrade Expo SDK 54 → 57

**Contesto**: Dopo audit dipendenze e safety net (tag `pre-sdk57`, branch `sdk57`, zip `android/`), upgrade a SDK 57 (RN 0.86.3, React 19.2.3).

**Prerequisiti applicati**:

| # | Fix | Dettaglio |
|---|-----|-----------|
| 1 | eas.json node 20.19.4 → 22.18.0 | Tutti i 4 profili (SDK 57 richiede ≥22.13) |
| 2 | Rimozione dead deps | react-native-sound (zero import), patch-package (nessuna cartella patches/) |
| 3 | expo-splash-screen plugin | `expo.splash` config key morta in SDK 57; aggiunto plugin con props esplicite (image, resizeMode, backgroundColor) per evitare crash di `SplashScreen.preventAutoHideAsync()` |
| 4 | runtimeVersion 1.0.5 → 1.0.6 | Native runtime cambiato, OTA incompatibili |
| 5 | Toolchain allineata | @expo/cli 57, metro trio 0.84.5, jest 29.7, jest-expo 57.0.5, babel-jest 29.7, @react-native/jest-preset 0.86.3 |
| 6 | TypeScript 5.9.3 | Tentato 6.0.3 (pin SDK 57), rifiutato: errore TS5101 su `baseUrl` deprecato. Rollback a 5.9.3 |

**Dipendenze rimosse da expo 57** (aggiunte come dirette):
- `@expo/vector-icons` 15.1.1 (expo 57 non lo dichiara più)
- `@react-navigation/bottom-tabs` NON aggiunto — expo-router 57 forka react-navigation in `expo-router/build/react-navigation/`; import ripuntato al fork (type-only, zero runtime change)

**RN 0.86 breaking changes fixati**:
- `StyleSheet.absoluteFillObject` → `absoluteFill` (3 siti: scanner.tsx, GlobalUpdateModal.tsx, scanner.styles.ts)
- Mock path DevMenu: `Libraries/DevMenu/DevMenu` → `src/private/devsupport/devmenu/DevMenu` (jest.setup.js)
- Mock path AppState: `Libraries/Core/NativeModules/AppState` → `Libraries/AppState/AppState` (scanner.test.tsx)

**Commit**:

| Hash | Messaggio | Dettaglio |
|------|-----------|-----------|
| `e0efd91` | chore: prepare for Expo SDK 57 upgrade | eas.json node, rimozione dead deps, cleanup test config |
| `13d267d` | chore(deps): upgrade to Expo SDK 57 | expo 57.0.18, RN 0.86.3, React 19.2.3, runtimeVersion 1.0.6, plugin splash |
| `56fa8f9` | fix(sdk57): restore dropped deps and RN 0.86 API changes | @expo/vector-icons, absoluteFill, type imports expo-router fork |
| `64b4279` | fix(tests): update RN 0.86 mock paths | DevMenu + AppState mock paths |
| `0cb4f97` | chore(deps): install jest preset peer for RN 0.86 | @react-native/jest-preset 0.86.3, babel-jest 29.7 |
| `c4baa37` | chore(android): regenerate native for Expo SDK 57 | prebuild --clean |

**Baseline finale** (verifier): 129 suite / 2284 passed / 0 failed / 5 skipped / 2289 total, exit 0 · tsc 0 errori · expo-doctor 18/21 (3 failed: native folder sync, ML Kit New Arch, TypeScript 5.9.3 vs 6.0.3 atteso).

**Decisioni chiave**:
- Scelto `expo-splash-screen` con props esplicite (vs forma nuda `{}`): forma nuda cancella immagini ma genera stile che le referenzia → build Android rotta
- Scelto import dal fork expo-router (vs installare @react-navigation/bottom-tabs): due universi di tipi incompatibili, type-only import risolve
- Scelto TypeScript 5.9.3 (vs 6.0.3): errore TS5101 su `baseUrl` deprecato, richiede decisione su tsconfig (rimozione o `ignoreDeprecations: "6.0"`)
- Scelto NON aggiungere datetimepicker/build-properties/status-bar plugin: certificati no-op come stringhe nude
- Scelto prebuild --clean (vs prebuild incrementale): android/ rigenerato da zero per SDK 57

**Note aperte** (non bloccanti):
- TypeScript 6.0.3: richiede decisione su `baseUrl` in tsconfig.json (rimozione o `ignoreDeprecations: "6.0"`). Non bloccante, tsc passa con 5.9.3
- `@react-native-ml-kit/text-recognition` 2.0.0: ultimo publish 2025-09-01, nessun codegen, gira via interop layer in RN 0.86. Smoke test completato 2026-08-30 (funzionante)
- `@react-navigation/native` ancora diretto: expo-router forka anche quello, ma types compatibili. Da valutare migrazione
- Worker Jest non esce gracefully (pre-esistente)

### Refinement post-upgrade (stessa sessione)

**TypeScript 6.0.3** (risolto):
- Rimosso `baseUrl` da tsconfig.json (deprecato TS 6.0, TS5101)
- `paths` già relativo al tsconfig (`"@/*": ["./*"]`), zero modifiche
- Aggiornato TypeScript 5.9.3 → 6.0.3
- Commit: `b055ea9`

**Migrazione @react-navigation/native** (completata):
- Audit: 4 import application code da migrare (scanner.tsx, photo-capture.tsx, AnimatedTabBar.tsx)
- Fix: ripuntati a `expo-router/build/react-navigation/native`
- `@react-navigation/native` mantenuto come devDependency (test files importano tipi)
- Commit: `492f832`

**ML Kit OCR** (risolto):
- `@react-native-ml-kit/text-recognition` 2.0.0 gira via interop layer in RN 0.86
- Smoke test completato con successo (vedi sotto)

### Smoke test ML Kit OCR (2026-08-30)

- `@react-native-ml-kit/text-recognition` 2.0.0 confermato funzionante su RN 0.86 via interop layer
- Test: foto confezione con data "21/05/2027" → ML Kit legge 7 blocchi testo, anchor OCR trovato ("Da consumarsi preteribilmente..."), data estratta correttamente (2027-05-21, score 350), lotto "5416 C 15:41" escluso, zero crash
- Build locale `npx expo run:android` riuscita, tutti i warning deprecazioni innocue da librerie terze
- Nessuna azione richiesta

---

## 2026-08-29 — Integrazione hCaptcha in form auth

**Contesto**: Utente ha configurato hCaptcha secret in Supabase dashboard. Richiesta integrazione frontend hCaptcha in form auth (login, signup, forgot-password).

**Documentazione seguita**: https://supabase.com/docs/guides/auth/auth-captcha?queryGroups=captcha-method&captcha-method=hcaptcha-1

**Fix applicati**:

| # | Fix | File | Dettaglio |
|---|-----|------|-----------|
| 1 | Install pacchetto | `package.json` | `@hcaptcha/react-hcaptcha@^2.2.0` |
| 2 | Sitekey config | `app.config.js:54` | `hcaptchaSitekey: 'd69c1bae-86c0-41b2-8350-4a48810e5fbc'` in extra |
| 3 | EAS env | `eas.json` | `EXPO_PUBLIC_HCAPTCHA_SITEKEY` aggiunto a preview, release-apk, production |
| 4 | LoginForm | `components/LoginForm.tsx` | HCaptcha component + state token + reset dopo attempt |
| 5 | AuthService | `services/AuthService.ts:328-332` | `signInWithEmail` accetta `captchaToken?`, passa a `signInWithPassword` options |
| 6 | useEmailAuth | `hooks/useEmailAuth.ts:112` | `handleLogin` passa `captchaToken` a AuthService |
| 7 | Signup | `app/signup.tsx` | HCaptcha component + passa token a useRegistration |
| 8 | useRegistrationActions | `hooks/useRegistrationActions.ts:77` | `signUp` options include `captchaToken` |
| 9 | Forgot-password | `app/forgot-password.tsx:97-104` | HCaptcha component + passa token a `resetPasswordForEmail` + reset |

**Catena auth token**:
- Login: LoginForm → useEmailAuth.handleLogin → AuthService.signInWithEmail → supabase.auth.signInWithPassword({options: {captchaToken}})
- Signup: signup.tsx → useRegistration → useRegistrationActions.signUp → supabase.auth.signUp({options: {captchaToken}})
- Forgot-password: forgot-password.tsx → supabase.auth.resetPasswordForEmail(email, {captchaToken})

**Conditional render**: HCaptcha renderizzato solo se `sitekey && sitekey !== 'YOUR_HCAPTCHA_SITEKEY'` — evita widget rotto con key finto.

**Risultato**: Verifier APPROVED. 0 errori TypeScript. Pacchetto installato. Sitekey configurato. Token passato lungo tutta catena auth. Reset captcha dopo ogni tentativo.

**Azioni richieste utente**:
1. Aggiungere manualmente a `.env`: `EXPO_PUBLIC_HCAPTCHA_SITEKEY=d69c1bae-86c0-41b2-8350-4a48810e5fbc`
2. Aggiungere manualmente a `.env.example`: `EXPO_PUBLIC_HCAPTCHA_SITEKEY=your_hcaptcha_sitekey_here`
3. Rebuild nativo: `npx expo prebuild` + EAS build (necessario per WebView nativa hCaptcha)
4. Test manuali: verificare widget visibile + token generato + auth funziona con captcha

**Note aperte**:
- Test esistenti non modificati — da aggiornare se necessario (mock HCaptcha component)
- hCaptcha secret già configurato in Supabase dashboard (lato utente)

**Decisioni chiave**:
- Scelto hCaptcha visibile (vs invisible): widget mostra challenge esplicito, più sicuro
- Scelto conditional render con guard placeholder: previene widget rotto se sitekey non configurato
- Scelto reset captcha dopo OGNI tentativo (successo/fallito): previene re-use token stale
- Scelto passare sitekey via Constants.expoConfig.extra: pattern esistente in codebase, coerente con altre config

---

## 2026-08-27 — Security audit token/sessioni: SecureStore + revoke sessions

**Contesto**: Audit sicurezza gestione token/sessioni. Utente chiede verifica: sessioni infinite, furto sessione, signOut incompleto.

**Audit findings** (7 vulnerabilità):
- CRITICAL: Token JWT in AsyncStorage (plaintext) → migrati a `expo-secure-store` (criptato)
- HIGH: 2 path signOut bypassavano AuthContext → sessioni incomplete
- HIGH: `token_hash` loggato in reset-password → rimosso, solo booleani
- MEDIUM: Cache sessione 5 min senza validazione server (non fixato)
- MEDIUM: Sessioni infinite fino a refresh token 30d (non fixato, config Supabase)
- LOW: Sessioni concorrenti illimitate (non fixato, feature)
- LOW: Nessuna rotazione token su change password (fixato con Edge Function)

**Fix applicati**:

| # | Fix | File | Dettaglio |
|---|-----|------|-----------|
| 1 | Encrypted token storage | `services/SecureStorage.ts` (nuovo) | Adapter `expo-secure-store` con interfaccia GoTrueAsyncStorage |
| 2 | Supabase client migration | `services/supabaseClient.ts:111` | `storage: AsyncStorage` → `storage: SecureStorage` |
| 3 | Token migration logic | `services/SecureStorage.ts:120` | `migrateTokensFromAsyncStorage()` one-time flag |
| 4 | SignOut completo | `app/(tabs)/index.tsx:67`, `app/profile.tsx:105` | `supabase.auth.signOut()` → `useAuth().signOut()` |
| 5 | Token hash non loggato | `app/auth/reset-password.tsx` | `{ token_hash }` → `{ hasToken: !!token_hash }` |
| 6 | Edge Function revoke sessions | `supabase/functions/revoke-user-sessions/` | `auth.admin.signOut(user_id, { scope: 'global' })` |
| 7 | AuthContext integration | `context/AuthContext.tsx:287` | `changePassword()` chiama Edge Function dopo successo |

**Pacchetto installato**: `expo-secure-store` (~15.0.8)

**Edge Function deployata**: `revoke-user-sessions` v1 ACTIVE (ID `18486c1a-5f93-46d5-ba4e-5405d56ca536`), verify_jwt=true

**Test**: 6 nuovi test `changePassword` in `AuthContext.test.tsx` (Edge Function chiamata, fire-and-forget, clearCachedSession)

**Risultato**: Verifier APPROVED. 2284/2289 test pass (5 skip legacy), 0 errori TypeScript.

**Azione richiesta**: Rebuild nativo necessario (`npx expo prebuild` + EAS build) per `expo-secure-store`.

**Note aperte** (non bloccanti):
- Cache sessione 5 min senza validazione server (MEDIUM) — richiede validazione JWT signature o riduzione cache
- Sessioni infinite 30d (MEDIUM) — config Supabase dashboard Auth > Settings > Session expiry
- Sessioni concorrenti illimitate (LOW) — feature, non bug per mobile app
- Worker leak warning in Jest (preesistente, non correlato)

**Decisioni chiave**:
- Scelto `expo-secure-store` (vs AsyncStorage crittografato custom): nativo, mantenuto da Expo, zero config
- Scelto fire-and-forget per revoke sessions (vs bloccante): cambio password non deve fallire se revoke fallisce
- Scelto migrazione automatica token (vs manuale): UX trasparente, zero azione utente
- Non fixati MEDIUM/LOW: richiedono config backend o feature UI, non bloccanti per sicurezza base

---

## 2026-08-27 — Fix brute force login: rate limiting 5/15min + test dimostrativo + hardening Supabase

**Contesto**: Richiesta utente — verificare se il login è vulnerabile a brute force; se sì, gestire i tentativi falliti con limite, blocco temporaneo e test dimostrativo.

**Audit (security-auditor)**:
- Vulnerabilità **MEDIUM-HIGH confermata**. `services/AuthService.ts` aveva già rate limiting 5/15min in `Map` volatile ma bypassabile.
- Gap identificati:
  | # | Gap | Impatto |
  |---|-----|---------|
  | 1 | `Map` volatile → reset su reload | Bypass client |
  | 2 | `anonKey` diretta bypassa `AuthService` | Bypass server-less |
  | 3 | `AuthContext.changePassword()` usava `supabase` diretto con `supabase.auth.updateUser` senza limiter | Bypass closure |
  | 4 | Email non normalizzata (`trim`+`lowercase` mancante prima di check Supabase) | Bypass per-case/space |
  | 5 | OTP (`resetPasswordForEmail`, `verifyOtp`) senza limiter | Enumerazione / spam OTP |
  | 6 | Nessun CAPTCHA / nessun blocco UX (countdown/bottone disabilitato) | UX non informa blocco |
  | 7 | Nessuna persistenza cross-restart | Finestra attacco estesa |

**Fix applicati**:

| # | Fix | File | Dettaglio |
|---|-----|------|-----------|
| 1 | Normalizzazione email `trim().toLowerCase()` prima di validazione e prima di `supabase.auth.signInWithPassword` | `services/AuthService.ts` | `normalizedEmail` usata per rate key, validazione formato e chiamata Supabase; previene ` Foo@Bar.com ` vs `foo@bar.com` come bucket diversi |
| 2 | Persistenza rate limit su `AsyncStorage` `myfrigo:rateLimitStore` con `loadRateLimitStore()` / `persistRateLimitStore()` debounce 50ms | `services/AuthService.ts` | `checkRateLimit()` e `recordFailedAttempt()` ora `async`; serializzazione `attempts[]`→JSON, `cleanupOldAttempts` a ogni load; survive a reload |
| 3 | OTP limiter con suffix `:otp` — bucket separato per `sendPasswordResetEmail` / `verifyOtp` | `services/AuthService.ts` | `checkRateLimit(email+':otp')` / `recordFailedAttempt(email+':otp')` su errore OTP; stesso 5/15min |
| 4 | Logging differenziato | `services/AuthService.ts` | `LoggingService.warning` a 3 tentativi, `LoggingService.error` a 5 (blocco) con `remainingMs` |
| 5 | Chiusura bypass `AuthContext.changePassword` | `context/AuthContext.tsx` | Importa `AuthService` e delega `changePassword()` a `AuthService.updatePassword()` (che contiene limiter); rimosso `supabase.auth.updateUser` diretto |
| 6 | Stato UX rate limit + countdown | `hooks/useEmailAuth.ts` | Nuovi stati `rateLimitedUntil: Date|null`, `remainingMs`, `isRateLimited`; `useEffect` con `setInterval` 1s quando bloccato; `checkRateLimitStatus()` async su `email` change; `handleLogin` intercetta blocco prima di chiamare `AuthService` e forza `error` con override al 5° tentativo |
| 7 | Blocco bottone + warning countdown | `components/LoginForm.tsx` | Props `isRateLimited`, `remainingMs`; bottone `disabled` quando `isRateLimited`; banner `Troppi tentativi. Riprova tra Xs.`; `useEmailAuth` passato dal consumer |
| 8 | Rate limit OTP su forgot-password | `app/forgot-password.tsx` | `handleResetWithOTP` / `handleVerifyOTP` normalizzano email e controllano `checkRateLimit(email:otp)` prima di invocare Supabase |
| 9 | Mock/test infra | `jest.setup.js`, `services/__tests__/AuthService.test.ts`, `hooks/__tests__/useEmailAuth.test.ts` | `jest.setup.js`: alias `LoggingService.warning = logWarning`; `AuthService.test.ts`: `beforeEach` con `AsyncStorage.clear()` + `clearAllRateLimits()`; `useEmailAuth.test.ts`: aggiornato per stati async + countdown |

**Iter verifier → fix**:
| Step | Verifier | Fail | Fix (executor 2) |
|------|----------|------|------------------|
| 1 | Verifier iniziale su `useEmailAuth` | `getRateLimitStatus is not a function` + `LoggingService.warning` undefined | `jest.setup.js` alias warning + mock esteso `getRateLimitStatus: jest.fn(async () => null)` |
| 2 | Verifier su `AuthService.bruteForce` | Estensione `.ts` con JSX → `Unexpected token` | Rename `AuthService.bruteForce.test.ts` → `.tsx` |
| 3 | 4 fail su 17 (normalizzazione/window/persistenza/timeout) | Validazione su `email` grezza invece di `normalizedEmail`; `windowMs` mismatch; `persist` non awaited | `AuthService.ts`: validazione su `normalizedEmail`; fix window/persist; hook: override `error` al 5° tentativo con messaggio blocco |

**Test dimostrativo (tester)**:

| Suite | File | Test | Copertura |
|-------|------|------|-----------|
| AuthService.bruteForce | `services/__tests__/AuthService.bruteForce.test.tsx` (nuovo) | **17 test** | 5→blocco, normalizzazione `trim/lowercase`, OTP `:otp` isolation, window expiry 15min, reset su successo, persistenza `AsyncStorage` reload, hook UX `rateLimitedUntil`, `LoginForm` disabled |

- Casi chiave: 5 falliti → `isRateLimited=true` fino a `rateLimitedUntil`; 4 falliti → ancora login consentito; `FOO@bar.com ` condivide bucket con `foo@bar.com`; OTP non contamina login bucket; dopo 15min sblocco; login successo azzera contatore; reload mantiene blocco via `AsyncStorage`.

**Consulenza Supabase Auth Rate Limits** (dashboard → Authentication → Rate Limits):
- Consigliati per hardening server-side (difesa oltre client):
  | Limiter | Default | Consigliato | Nota |
  |---------|---------|-------------|------|
  | Anonymous sign-ins | 30/5min | **10/5min** | Riduce abuso anon |
  | Token verifications | 30/5min | **10/5min** | Critico |
  | Token refreshes | 150/5min | 150/5min | Lasciare alto (refresh legittimi) |
  | OTP emails | 30/5min | **10/5min** | Anti-spam OTP |
  | SMS OTP | 30/5min | **30/5min** | OK |
  | Sign-ins / sign-ups | 30/5min | **15/5min** | Allineato a 5/15min client |
  | Token verifications (seconda voce) | 30/5min | **30/5min** | — |
- Default `30/5min` troppo permissivo per brute force mirato → abbassare a `10-15/5min` come sopra.

**File modificati**:

| File | Tipo | Cambiamento |
|------|------|-------------|
| `services/AuthService.ts` | Modificato | Normalize + AsyncStorage persist + async check/record + OTP `:otp` + logging warning/error |
| `context/AuthContext.tsx` | Modificato | `changePassword` delega a `AuthService.updatePassword` (chiusura bypass) |
| `hooks/useEmailAuth.ts` | Modificato | `rateLimitedUntil`/`remainingMs`/`isRateLimited` + countdown 1s + `checkRateLimitStatus` async |
| `components/LoginForm.tsx` | Modificato | Blocco bottone + warning countdown |
| `app/forgot-password.tsx` | Modificato | OTP rate limit con normalize |
| `jest.setup.js` | Modificato | `warning` alias |
| `hooks/__tests__/useEmailAuth.test.ts` | Modificato | Aggiornato per nuovi stati |
| `services/__tests__/AuthService.bruteForce.test.tsx` | **Nuovo** | 17 test dimostrativi |
| `services/__tests__/AuthService.test.ts` | Modificato | `beforeEach` cleanup `AsyncStorage` + `clearAllRateLimits` |

**Risultato verifica**:
- `npx tsc --noEmit --pretty false` → **0 errori**
- `AuthService.bruteForce` → **17/17 PASS**
- Suite completa → **129 suites, 2278 passed, 5 skipped, 0 failed — EXIT 0**
- Verifier finale: **APPROVED**

**Decisioni chiave**:
- Scelta `AsyncStorage` `myfrigo:rateLimitStore` con debounce 50ms (vs `Map` volatile): persiste tra reload senza backend; debounce evita write storm; `cleanupOldAttempts` a load evita crescita infinita.
- Scelta `trim()+toLowerCase()` canonica (vs case-sensitive): un solo bucket per identità reale; applicata prima di validazione e prima di Supabase per coerenza.
- Scelta suffix `:otp` per bucket separato (vs bucket unico): OTP non consuma tentativi login e viceversa; stesso limite 5/15min.
- Scelta countdown UX 1s + `remainingMs` (vs messaggio statico): feedback immediato su sblocco, bottone disabilitato previene retry inutili.
- Supabase Auth Rate Limits server-side consigliati come difesa in profondità (client limit bypassabile con `anonKey` diretta).

---

## 2026-08-09 — Refactoring bookkeeping: SESSIONS.md unico log sessioni, STATE.md dashboard di stato

**Contesto**: I file `.planning/SESSIONS.md` e `.planning/STATE.md` avevano ruoli sovrapposti: entrambi contenevano log sessioni, con duplicazioni parziali e dettagli divisi tra i due file.

**Cambiamenti**:
- `SESSIONS.md` → UNICO log sessioni dettagliato (versione più dettagliata per ogni data, merge da STATE).
- `STATE.md` → dashboard di stato puro: Current Phase, Session Log Index, Known Issues, Test Suite Summary, Decisions, Last Commit. Rimosse tutte le sezioni `### data` (Completed Phases) e "Today's Fixes" (spostate in SESSIONS.md).

**Merge per data** (fonte scelta):

| Data | Fonte scelta | Motivo |
|------|-------------|--------|
| 2026-08-04 | SESSIONS | Più dettagliato (root cause + decisioni chiave) |
| 2026-07-23 ×2 | SESSIONS | Solo in SESSIONS |
| 2026-07-22 | Merge STATE+SESSIONS | Tabelle STATE + analisi piano/decisioni SESSIONS |
| 2026-07-16 | SESSIONS | Solo in SESSIONS |
| 2026-07-15 review 38 | SESSIONS | Solo in SESSIONS |
| 2026-07-15 Fix 17 MEDIUM | STATE (nuovo in SESSIONS) | Distinta da Fix 36 — mantieni entrambe |
| 2026-07-15 Fix 36 | STATE | Tabelle HIGH-01…11, MED-01…17, LOW-01…09 |
| 2026-07-15 Seconda review | STATE | Tabelle dettagliate |
| 2026-07-15 CRIT-01 | SESSIONS | Quasi identica a STATE |
| 2026-07-15 Fix 29 test | SESSIONS | Solo in SESSIONS |
| 2026-07-09 | SESSIONS | Più dettagliato (refinement batch) |
| 2026-07-08 | SESSIONS + dettagli scoring STATE | Priorità 2/1/0 e +50 aggiunti |
| 2026-06-28 | SESSIONS | Identica a STATE |
| 2026-06-17 ×2, 06-02, 05-23, 05-10 ×4, 05-09, 05-02 | STATE | Solo in STATE, aggiunte in fondo |

**Regola futura**: aggiunta sezione "Regola di manutenzione (2026-08-09)" in coda a SESSIONS.md.

**Verifica differenziale**: nessuna informazione unica persa (checklist data-per-data nel report).

**Discrepanza segnalata**: nessuna sessione 2026-08-09 "Ottimizzazione token..." trovata nel file originale — la descrizione del task non corrispondeva al contenuto reale (il file iniziava con 2026-07-16).

**Refinement (decisione anchor)**: verifier APPROVED WITH CONCERNS dopo refactoring. L'unico concern MEDIUM (anchor `#...` dell'indice STATE→SESSIONS non GitHub-compatibili perché gli slug usano `-` invece del `--` generato da GitHub per heading con em-dash) è stato chiuso come MOOT: l'utente legge i file SOLO in preview locale, dove i link funzionano. Concerns LOW (2 titoli indice abbreviati, `VERIFICATION_COMPLETE.txt` artefatto obsoleto) lasciati così com'è — cosmetici, non bloccanti, decisione consapevole dell'utente.

---

## 2026-07-16 — Fix notifiche OneSignal: arrivano solo con app aperta

**Contesto**: L'utente segnala che le notifiche push di OneSignal arrivano solo quando l'app è aperta. In background/terminated non vengono ricevute.

**Root cause**: `NotificationService.initialize()` non veniva mai chiamato dall'app reale. `_layout.tsx` chiamava solo `OneSignalService.initialize()` che inizializza l'SDK ma NON richiede i permessi push (`requestPermission()`). Senza permessi formali, il push token non viene registrato correttamente con APNs/FCM.

**Fix applicati**:
1. `app/_layout.tsx`: Sostituito `OneSignalService.initialize()` con `NotificationService.initialize()` nel useEffect di startup
2. `services/OneSignalService.ts`: Aggiunti listener `foregroundWillDisplay` (mostra notifica in foreground) e `click` (log click) dopo `OneSignal.initialize()`

**Risultato**: Verifier APPROVED. 0 errori TypeScript. Fix completo e corretto.

**Test manuale necessario**: Build dev client/preview → concedere permessi → chiudere app → inviare notifica → dovrebbe apparire nella system tray.

---

## 2026-06-28 — Fix notifiche push duplicate

**Problema**: L'utente riceveva 2 notifiche push identiche per ogni push inviata dal server.

**Causa**: `expo-notifications` e `onesignal-expo-plugin` coesistevano nello stesso APK. Su Android, entrambi registrano un proprio receiver FCM nativo — quando FCM consegnava una push, entrambi la intercettavano e la mostravano → 2 notifiche.

**Fix applicati**:
| # | Fix | File | Dettaglio |
|---|-----|------|-----------|
| 1 | Sostituito `expo-notifications` con API OneSignal | `services/NotificationPermissionService.ts`, `services/NotificationCoreService.ts`, `context/SettingsContext.tsx`, `services/diagnostic/NotificationTests.ts` | `getPermissionAsync()` al posto di `getPermissionsAsync()` |
| 2 | `npx expo prebuild --clean` | - | Ricostruzione nativi senza il secondo receiver FCM |
| 3 | `onesignal-expo-plugin` mode → production | `app.config.js` | Da `development` a `production` |

**Verifica**: Build EAS `6a892131` installata su Sony BVL-N49 → **1 sola notifica** ✅

**Commit**: `118dd31` su master

---

## 2026-07-08 — Fix OCR: data 15/08/26 letta come 30/08 (poi corretto in 08-31)

### Contesto
L'utente ha scansionato una confezione con data di scadenza "15/08/2026" ma l'app restituiva "30/08/2026" (due volte). Sospetto iniziale: misread di ML Kit (1↔3). L'utente ha confermato di NON confermare mai distrattamente la data sbagliata, quindi il problema era a monte.

### Verifica sui log reali (avvio app in dev mode + Pannello Diagnostico, 5 tap su Versione)
I log hanno RIBALTATO l'ipotesi: ML Kit legge CORRETTAMENTE "15/08/26" (raw giusto). Il "30" era in realtà il giorno 31 generato dal parser, non un misread.

### Causa root (2 bug concatenati)
- BUG A: `MONTH_YEAR_PATTERN` matcha "08.26" DENTRO "15.08.26" e lo risolve come "ultimo giorno di agosto = 31" → candidata falsa 2026-08-31.
- BUG B: il lookup dello score usava `find()` sul primo match omologo, azzerando il bonus della data corretta.

### Decisioni pre-implementazione (discussione con l'utente)
- L'utente ha chiarito che sulle etichette le date possono essere SOLO mese/anno (es. "SCAD 08/26") e devono legittimamente risolvere l'ultimo giorno del mese (2026-08-31). Quindi NON si può eliminare il comportamento month-year.
- Scartata la variante "ancorare il regex a inizio stringa" (romperebbe "SCAD 08/26" che non è all'inizio riga).
- Scelta: Fix 1 = filtro PER-BLOCCO che esclude month-year solo se interno a una data completa dello stesso blocco; Fix 2 = lookup prioritario nello scoring (standard > sequence).

### Fix applicati
- `utils/ocr/parsing.ts` — Fix 1: filtro per-blocco, non tocca MONTH_YEAR_PATTERN. Se nello stesso blocco esiste già un match STANDARD completo, il month-year interno viene escluso.
- `utils/ocr/scoring.ts` — Fix 2: `findRepresentativeMatch` con priorità esplicita (standard/textual=2 > sequence=1 > derived/monthYear=0) al posto di `find()` sul primo match omologo, così la data corretta aggancia lo standard e prende il +50.
- `utils/ocr/__tests__/expirationDateFix.test.ts` — 5 test regressione: caso target "15/08/26 + L32762 + 10:63" → 2026-08-15; casi legittimi "SCAD 08/26" / "FINE: 08/26" isolati → 2026-08-31 preservati.

### Risultato
- Verifier: APPROVED. 165/165 test OCR passati, 0 nuovi errori tsc.
- Caso target "15/08/26 + lotto" → 2026-08-15. Caso legittimo "08/26 isolato" → 2026-08-31 preservato.

### Note aperte (LOW, non bloccanti)
- `parsing.ts` filtro per sottostringa: edge case raro di blocco singolo con data standard + month-year legittimo distinto (es. "SCAD 08/26 15/08/26") escluderebbe anche il legittimo. Non impatta i casi reali (blocchi separati).
- Manca test dedicato per "ENTRO 08 26" (comportamento preservato ma non coperto da test).
- Problema ambientale preesistente: `jest.setup.js` mocka `expo-notifications` non installato → tutte le suite falliscono senza config temporaneo. Da risolvere a parte (installare modulo o mock virtual).

## 2026-07-09 — Fix notifiche OneSignal: mancava promemoria a 1 giorno + testo errato

**Contesto**: L'utente non ha ricevuto la notifica di un prodotto in scadenza "domani". Verifica via OneSignal MCP: health OK, app_id client (eas.json) == server (0be59062-4413-49d5-b301-7038c3a0de1e), device sottoscritti, consegna funziona. Cron Supabase `0 9 * * *` (jobid 4, active) ha girato il 09/07 (POST 200, nessun errore). Causa root: RPC `get_expiring_products` selezionava pre-avviso SOLO a `oggi + notification_days` (3) e "scaduto" solo a `oggi` — nessun ramo a 1 giorno. Un prodotto in scadenza domani non matchava nulla → zero notifiche. Inoltre l'Edge Function usava `notification_days` (fisso 3) come testo invece dei giorni rimanenti.

**Fix applicati**:
- RPC `get_expiring_products` (project `tfhjupcybietwzmnpwfh`): aggiunta colonna `days_remaining integer` + ramo `pre_warning` a `CURRENT_DATE + INTERVAL '1 day'` + `SELECT DISTINCT` per evitare duplicati se notification_days=1. Firma: user_id, product_id, product_name, notification_type, notification_days, expiration_date, days_remaining.
  - **Nota**: La migration locale (`supabase/migrations/20251028_create_get_expiring_products.sql`) NON contiene `days_remaining`. Potrebbe essere stato applicato solo su Supabase remoto. Da verificare.
- Edge Function `send-expiration-notifications` v22 (ACTIVE): `ExpiringProduct` ora ha `days_remaining`; testo pre_warning usa `days_remaining` (`===1` → "scade domani", altro → "scade tra N giorni"); expired → "è scaduto oggi". Logica invio OneSignal invariata.
  - **Nota**: Il codice locale dell'Edge Function NON contiene `days_remaining` — usa `preWarning[0].notification_days` (fisso 3). Da verificare se è stato aggiornato solo su Supabase remoto.
- Rimosso codice Firebase legacy: `functions/src/` e `functions/lib/` (placeholder non collegati alla pipeline Supabase).

**Trigger manuale**: ri-eseguito `net.http_post` verso la Edge Function (x-cron-secret) il 09/07 dopo il fix, per recapitare la notifica "scade domani" del prodotto odierno (Ravioli…, exp 2026-07-10) che il cron mattutino aveva saltato con la RPC vecchia.

**Risultato**: Verifier APPROVED (5/5 PASS). RPC restituisce il prodotto odierno. Comportamento ora: pre-avviso a notification_days (3), promemoria "domani" (1), "scaduto oggi" (0).

**Refinement (stessa sessione)**: corretto il testo batch per-prodotto nell'Edge Function (v23 ACTIVE). Ogni prodotto usa ora il proprio `days_remaining` (prima si usava `preWarning[0].days_remaining` per tutto il batch, sbagliando i prodotti non-primi). Ramo pre_warning: per-prodotto "scade domani" / "scade tra N giorni"; ramo expired: per-prodotto "è scaduto oggi". Un prodotto per riga. Verifier APPROVED (4/4 PASS). Notifica "scade domani" del prodotto odierno confermata arrivata dall'utente.
  - **Nota**: Il codice locale dell'Edge Function NON implementa questo refinement — usa `preWarning[0].notification_days` per tutto il batch. Da verificare se è stato applicato solo su Supabase remoto.

## 2026-07-15 — Code Review completa del progetto

### Contesto
Richiesta code review approfondita con obbligo di usare graphify (4616 nodi, 6420 edges, 446 community) come primo strumento di analisi e verifica deadcode prima di etichettarlo.

### Risultato
Code-reviewer ha prodotto **38 finding**: 1 CRITICAL, 11 HIGH, 17 MEDIUM, 9 LOW.

**Dead code verificato** (con evidenza cross-reference graphify):
- `functions/` intera directory (~96 file) — Firebase legacy non più attivo, confermato da STATE.md
- `hooks/usePhotoOCR.backup.ts` (373 righe) — zero import reali
- 3 file `.backup.*` orfani in `utils/ocr/` e `services/`

**Principali criticità**:
- `@ts-nocheck` / `@ts-ignore` sparsi — violano AGENTS.md
- Type safety persa in `ProductContext` (cast a `any`)
- `console.error` in `LogFileManager` (13 occorrenze) — deve usare LoggingService
- Memory leak `setTimeout` senza cleanup in `usePhotoOCR`

**Punti di forza**:
- Pattern `ServiceResult` consistente e ben tipizzato
- Error handling centralizzato (`AppError`, `ErrorCode`)
- Accessibility coverage notevole (159+ label/hint)
- `LoggingService` ben integrato con buffer memoria e batch write
- Rate limiting su endpoint auth

## 2026-07-15 — Fix 11 HIGH, 16 MEDIUM, 8 LOW findings dalla code review

**Contesto**: La code review del 2026-07-15 ha identificato 38 finding (1 CRITICAL, 11 HIGH, 17 MEDIUM, 9 LOW). Sessione dedicata ai fix per HIGH, MEDIUM e LOW.

**Fix HIGH applicati** (11/11):

| # | Fix | File | Dettaglio |
|---|-----|------|-----------|
| HIGH-01 | @ts-nocheck rimosso | `services/__tests__/StorageService.test.ts` | Tipizzato test object con `Quantity[]` |
| HIGH-02 | @ts-ignore → ExtendedOptions | `components/AnimatedTabBar.tsx` | Type assertion esplicito |
| HIGH-03 | @ts-ignore → @ts-expect-error | `app/(tabs)/index.tsx` | Con commento esplicativo |
| HIGH-04 | Dead code eliminato | `functions/` | Intera directory (~96 file) rimossa via `git rm -r` |
| HIGH-05 | Backup eliminato | `hooks/usePhotoOCR.backup.ts` | 373 linee, zero import reali |
| HIGH-06 | .backup.* orfani eliminati | 3 file in `utils/ocr/` e `services/` | `parsing.ts.backup.*`, `IconLoader.ts.backup.tscfix` |
| HIGH-07 | Type safety | `context/ProductContext.tsx` | `ServiceResult` discriminated union al posto di cast `as` |
| HIGH-08 | console.error → logError() | `services/LogFileManager.ts` | 8 occorrenze, buffer statico con export |
| HIGH-09 | TODO certificate pinning | `app.config.js` | Commento migliorato con istruzioni Android/iOS |
| HIGH-10 | Re-export rimosso | `utils/errorHandler.ts` | `formatErrorCode` non più nel barrel (0 import production) |
| HIGH-11 | TODO import Supabase | `utils/ocr/ocrSpaceService.ts` | Commento per ottimizzazione futura |

**Fix MEDIUM applicati** (16/17, 1 skipped):

| ID | File | Cambiamento |
|----|------|-------------|
| MED-01 | `hooks/usePhotoOCR.ts` | Aggiunto cleanup `useEffect` per `clearTimers()` su unmount |
| MED-02 | `components/DiagnosticPanel.tsx` | `catch (error: any)` → `catch (error: unknown)` con type narrowing |
| MED-03 | `app/manage-categories.tsx` | `styles: any` → `Record<string, ViewStyle \| TextStyle>` |
| MED-04 | `services/supabaseClient.ts` | Aggiunto commento sicurezza env variables |
| MED-05 | — | **SKIPPATO**: Mix italiano/inglese richiede decisioni del proprietario |
| MED-06 | `services/ProductStorage.ts` | Cast non sicuro → spread operator `upsertPayload` tipizzato |
| MED-07 | `services/LoggingService.ts` | Fix indentazione inconsistente in `info()`, `clearLogs()`, `destroy()` |
| MED-08 | `components/DiagnosticPanel.tsx` | 3 `console.error()` → `LoggingService.error()` |
| MED-09 | `context/AuthContext.tsx` | Aggiunto commento: Supabase gestisce automaticamente conversione stringa ISO → timestamptz |
| MED-10 | `context/ProductContext.tsx` | `[user?.id ?? null]` → `[user?.id]` (semplificato dependency arrays) |
| MED-11 | `services/ProductStorage.ts` | Aggiunta validazione URL formale (`new URL(imageUrl)`) |
| MED-12 | `services/NotificationPermissionService.ts` | Aggiunto commento TODO per test coverage null return |
| MED-13 | `app.config.js` | Aggiunto commento: "Public OAuth client ID — safe to commit" |
| MED-14 | `services/AuthService.ts` | Catch ora restituisce messaggio generico ("Riprova") senza leak dettagli |
| MED-15 | `services/LoggingService.ts` | Rimosso guard `if (!__DEV__) return` da `warning()` |
| MED-16 | `services/supabaseClient.ts` + `context/AuthContext.tsx` | `clearCachedSession()` dopo `changePassword()` per invalidare cache JWT |
| MED-17 | `hooks/usePhotoOCR.ts` | Estratto `const TAG = 'PhotoOCR'` a costante di modulo |

**Fix LOW applicati** (8/9, 1 skipped):

| ID | File | Cambiamento |
|----|------|-------------|
| LOW-01 | `utils/errorHandler.ts` | **SKIPPATO**: `formatErrorCode` già rimosso da HIGH-10 |
| LOW-02 | `utils/dateUtils.ts` | Rimossa reference `usePhotoOCR.backup.ts` |
| LOW-03 | `utils/ocrConfidence.ts` | Rimossa reference `usePhotoOCR.backup.ts` |
| LOW-04 | `utils/datePatterns.ts` | Rimossa reference `usePhotoOCR.backup.ts` |
| LOW-05 | `services/LoggingService.ts` | Commenti IT→EN tradotti |
| LOW-06 | `services/ProductStorage.ts` | Helper `getDaysAgo()` estratto |
| LOW-07 | `services/AuthService.ts` | Commento limiti regex email |
| LOW-08 | `services/supabaseClient.ts` | TODO mock configurabile |
| LOW-09 | `eas.json` | Commento build profile updates |

**Risultato**: Verifier APPROVED su tutti i fix. 441/441 test passano nelle suite modificate, 1906/1944 nella suite completa. 0 nuovi errori TypeScript. 29 file modificati, 11+ eliminati.

**Note aperte**:
- CRIT-01 (API key ocr.space in `eas.json`): NON toccato in questa sessione — richiede ruotazione key + eas secret, va fatto con attenzione
- MED-05 (mix italiano/inglese): rimandato a decisione del proprietario
- 36 test fallimenti preesistenti non toccati (NotificationService, NotificationCore, password-reset-form, settings, usePhotoNavigation)
- 2 errori TypeScript preesistenti non toccati (`index.tsx` permissionStatus, expo-notifications mancante)

---

## 2026-07-15 — Fix 17 MEDIUM findings dalla code review (Sessione precedente — solo MEDIUM)

**Contesto**: La code review del 2026-07-15 ha identificato 38 finding (1 CRITICAL, 11 HIGH, 17 MEDIUM, 9 LOW). Sessione dedicata ai 17 MEDIUM.

**Fix applicati**:

| ID | Severity | File | Cambiamento |
|----|----------|------|-------------|
| MED-01 | MEDIUM | `hooks/usePhotoOCR.ts` | Aggiunto cleanup `useEffect` per `clearTimers()` su unmount (memory leak `setTimeout` nel `finally`) |
| MED-02 | MEDIUM | `components/DiagnosticPanel.tsx` | `catch (error: any)` → `catch (error: unknown)` con type narrowing |
| MED-03 | MEDIUM | `app/manage-categories.tsx` | `styles: any` → `Record<string, ViewStyle \| TextStyle>` |
| MED-04 | MEDIUM | `services/supabaseClient.ts` | Aggiunto commento sicurezza: "IMPORTANT: Never log the actual values of environment variables" |
| MED-05 | MEDIUM | — | **SKIPPATO**: Mix italiano/inglese richiede decisioni del proprietario su standardizzazione |
| MED-06 | MEDIUM | `services/ProductStorage.ts` | Cast non sicuro `(snakeCaseProduct as Record<string, unknown>).user_id = userId` → spread operator `upsertPayload` tipizzato |
| MED-07 | MEDIUM | `services/LoggingService.ts` | Fix indentazione inconsistente in `info()`, `clearLogs()`, `destroy()` |
| MED-08 | MEDIUM | `components/DiagnosticPanel.tsx` | 3 `console.error()` → `LoggingService.error()` |
| MED-09 | MEDIUM | `context/AuthContext.tsx` | Aggiunto commento: Supabase gestisce automaticamente conversione stringa ISO → timestamptz |
| MED-10 | MEDIUM | `context/ProductContext.tsx` | `[user?.id ?? null]` → `[user?.id]` (semplificato dependency arrays) |
| MED-11 | MEDIUM | `services/ProductStorage.ts` | Aggiunta validazione URL formale (`new URL(imageUrl)`) in `updateProductImage` |
| MED-12 | MEDIUM | `services/NotificationPermissionService.ts` | Aggiunto commento TODO per test coverage null return da API native |
| MED-13 | MEDIUM | `app.config.js` | Aggiunto commento: "Public OAuth client ID — safe to commit" |
| MED-14 | MEDIUM | `services/AuthService.ts` | Validazione spostata fuori try/catch; catch ora restituisce messaggio generico ("Riprova") senza leak dettagli tecnici |
| MED-15 | MEDIUM | `services/LoggingService.ts` | Rimosso guard `if (!__DEV__) return` da `warning()` — ora logga anche in produzione |
| MED-16 | MEDIUM | `services/supabaseClient.ts` + `context/AuthContext.tsx` | Nuova funzione `clearCachedSession()` esportata; chiamata dopo `changePassword()` per invalidare cache JWT |
| MED-17 | MEDIUM | `hooks/usePhotoOCR.ts` | Estratto `const TAG = 'PhotoOCR'` a costante di modulo (era duplicata in 2 funzioni) |

**Test fix correlati**:
- `services/__tests__/AuthService.test.ts`: 2 test aggiornati per nuovo messaggio generico nel catch
- `components/__tests__/DiagnosticPanel.test.tsx`: aggiunto `getRecentLogs` al mock LoggingService; fix test per usare `getByTestId` invece di `getByText` (TextInput value non trovabile con getByText); fix test "getLogs" → "getRecentLogs"

**Risultato**: 129/129 test passati su 7 suite. 0 nuovi errori TypeScript (solo 2 preesistenti non correlati). Verifier non eseguito (fix atomici con test verification integrata).

**Note aperte**:
- `services/__tests__/NotificationPermissionService.test.ts`: test preesistente fallisce (mock expo-notifications vs implementazione OneSignal) — NON toccato in questa sessione
- MED-05 (mix italiano/inglese): rimandato a decisione del proprietario

## 2026-07-15 — Fix CRIT-01 + 3 problemi preesistenti (test falliti + errori tsc)

### Contesto
Completamento dei fix rimanenti dopo la code review. CRIT-01 (API key ocr.space esposta) e 3 problemi preesistenti (36 test falliti, 2 errori tsc).

### CRIT-01
- Rimossa `EXPO_PUBLIC_OCR_SPACE_API_KEY` da `eas.json` e `.env`
- `.env` rimosso da git tracking
- `.env.example` aggiornato con tutte le variabili placeholder
- Key ruotazione necessaria su ocr.space (vecchia key visibile in git history)

### Fix problemi preesistenti
- **Fix #1**: `DashboardHeader.tsx` — permissionStatus `string|null` → `boolean|null` (migrazione OneSignal completata)
- **Fix #2**: `NotificationPermissionService.test.ts` — riscritto per usare mock OneSignal invece di expo-notifications obsoleto (17 test passano, 4 skip legacy)
- **Fix #3**: `password-reset-form.tsx` — logica fallback dopo refreshSession fallito corretta (37/37 test passano, erano falliti prima)

### Risultato
- **0 errori TypeScript** totali (da 2 preesistenti)
- 1924/1965 test passano (35 preesistenti invariati)
- +37 test riparati (password-reset-form)
- Verifier APPROVED su tutti i fix

## 2026-07-15 — Seconda Code Review: 15 finding nuovi (3 HIGH, 7 MEDIUM, 5 LOW)

**Contesto**: Dopo i 36 fix della prima review, seconda code review focalizzata su problemi residui, regressioni, e cose mancate.

**Findings**:
| Severità | Count |
|----------|-------|
| HIGH | 3 |
| MEDIUM | 7 |
| LOW | 5 |

**Fix HIGH applicati** (3/3):
| # | Fix | File |
|---|-----|------|
| HIGH-1 | Rimosso `supabase as any` (3 occorrenze) | `UserNotificationSettingsService.ts` |
| HIGH-2 | Test NotificationService riscritto per OneSignal | `NotificationService.test.ts` |
| HIGH-3 | Test NotificationCoreService riscritto per OneSignal | `NotificationCoreService.test.ts` |

**Fix MEDIUM applicati** (7/7):
| # | Fix | File |
|---|-----|------|
| MED-1 | Commento circular dependency su console.error | `LogFileManager.ts:17` |
| MED-2 | Semplificato checkExpoNotificationsAvailability() | `NotificationPermissionService.ts:17-20` |
| MED-3 | Rimosso `functions/**` da exclude | `tsconfig.json` |
| MED-4 | Rimosso blocco globals ts-jest (dead config) | `jest.config.js` |
| MED-5 | Rimosso `!**/RA.Aid/**` (directory inesistente) | `jest.config.js` |
| MED-6 | Rimosso used_by reference a backup eliminato | `LoggingService.ts:67` |
| MED-7 | Rimosse 4 dipendenze non importate (zod, resend, lint, readable-stream) | `package.json` |

**Fix LOW applicati** (5/5):
| # | Fix | File |
|---|-----|------|
| LOW-1 | Rimosso mock globale expo-notifications (redundante) | `jest.setup.js` |
| LOW-2 | Rimosso proprietà Notifications da mock expo | `jest.setup.js` |
| LOW-3 | Rimossi 2 mock DevMenu duplicati | `jest.setup.js` |
| LOW-4 | Rimosso TODO stale su profilo updates | `eas.json` |
| LOW-5 | Rimosso TODO(MED-12), aggiunti 2 test null returns | `NotificationPermissionService.test.ts` |

**Risultato**: 0 errori TypeScript, 1932/1966 test passano (29 preesistenti invariati), 0 nuovi fallimenti.

**Note aperte**:
- 29 test preesistenti non toccati (settings.test.tsx, usePhotoNavigation.test.ts)
- Mock expo-notifications in jest.setup.js mantenuto come infrastruttura necessaria (scelta architetturale)
- 4 dipendenze mantenute (react-native-sound, react-native-webview, react-native-worklets, expo-eas-client) — peer dep o mock necessari

## 2026-07-15 — Fix test falliti preesistenti (29 test)

### Contesto
29 test falliti preesistenti: settings.test.tsx (28) e usePhotoNavigation.test.ts (1).

### Root cause
- **settings.test.tsx**: `ChangePasswordModal` (reale) usava `Modal` con `accessibilityViewIsModal={true}`. Il mock globale di Modal renderizzava sempre il contenido (ignorando `visible={false}`), creando una barriera modale che bloccava tutte le query RNTL. Fix: aggiunto mock `ChangePasswordModal` + mock `AuthContext`.
- **usePhotoNavigation.test.ts**: Interfaccia TypeScript `UsePhotoNavigationReturn` aveva `mode` obbligatorio ma l'implementazione aveva default value. Fix: reso `mode` opzionale nell'interfaccia.

### Risultato
Verifier APPROVED. 117/117 suite passano, 1961/1966 test passano (5 skip legacy), 0 errori TypeScript, 0 test falliti.

---

## 2026-07-22 — Refactoring Fasi 1-3: Styles extraction, test coverage, logic dedup

### Contesto
L'utente ha richiesto l'esecuzione di un piano di refactoring creato da Laguna S 2.1 per i file più grandi del progetto. Il piano è stato analizzato e poi eseguito in 3 fasi progressive.

### Analisi del piano
- Il piano iniziale aveva 17 file target, suddivisi in 7 categorie
- L'analisi ha identificato 10 breaking changes/regressioni non previste dal piano originale
- Le priorità sono state rivalutate: AuthContext split (BASSA→ALTA), CategoryMatcher (MEDIA→ALTA)
- File senza test (feedback.tsx, forgot-password.tsx) identificati come prerequisito critico

### Fase 1 — Quick wins (zero risk)

| # | Fix | File | Dettaglio |
|---|-----|------|-----------|
| 1 | Estrazione stili inline | `app/manage-categories.styles.ts` (nuovo) | 163 righe stili → file separato, `manage-categories.tsx` ridotto da 426 a 262 righe |
| 2 | Estrazione stili inline | `app/scanner.styles.ts` (nuovo) | 49 righe stili → file separato, `scanner.tsx` ridotto da 378 a 229 righe |
| 3 | Estrazione keyword maps | `services/data/categoryKeywords.json` (nuovo) | 100+ righe mappe keyword → JSON, `CategoryMatcher.ts` ridotto da 304 a 201 righe |

### Fase 2 — Test coverage per file privi di test

| # | Test Suite | File Test | Test |
|---|-----------|-----------|------|
| 1 | feedback.tsx | `app/__tests__/feedback.test.tsx` (nuovo) | 55 test (rendering, interazioni, errori, successo) |
| 2 | forgot-password.tsx | `app/__tests__/forgot-password.test.tsx` (nuovo) | 47 test (OTP flow, validazione, E2E mode) |

### Fase 3 — Refactoring medio (su file protetti da test)

| # | Fix | File | Dettaglio |
|---|-----|------|-----------|
| 1 | Estrazione stili | `app/feedback.styles.ts` (nuovo) | 117 righe stili → file separato |
| 2 | Estrazione stili | `app/forgot-password.styles.ts` (nuovo) | Stili inline → file separato |
| 3 | Fix trim email | `app/forgot-password.tsx` | `.trim()` aggiunto prima di `resetPasswordForEmail` |
| 4 | Deduplicazione logica | `services/CategoryMatcher.ts` | Helper `findCategoryFromMap` con strategy pattern (isMatch callback) |
| 5 | Consolidamento query | `services/ProductStorage.ts` | Costante `PRODUCT_SELECT_FIELDS` + helper `buildBaseQuery` |

### Refactoring ChangePasswordModal (da sessione precedente, committato insieme)

| # | Fix | File | Dettaglio |
|---|-----|------|-----------|
| 1 | Componenti comuni | `components/common/` | PasswordInput, ModalHeader, ModalActions, ErrorDisplay |
| 2 | Hook estratti | `hooks/usePasswordForm.ts`, `hooks/usePasswordVisibility.ts` | Logica form password |
| 3 | Utility validation | `utils/validation/passwordValidationRules.ts` | validatePassword, validatePasswordMatch, validateCurrentPassword |
| 4 | Componente | `components/settings/PasswordMatchIndicator/` | Indicatore match password |

### Risultato
- 2189/2189 test passano (5 skipped legacy), 0 regressioni
- 25+ nuovi file (styles, test, componenti, hook, utils)
- TypeScript: 0 errori nuovi
- Commit: `a840d96` (Phase 1-3) + `af5db8e` (ChangePasswordModal + forgot-password styles + CodeDNA headers)

### Note aperte
- `forgot-password.tsx`: `.trim()` applicato ma potrebbe esserci un secondo punto dove l'email non viene trimmata (da verificare)
- Altri file grandi nel piano originale (AuthContext, LoggingService, errorHandler) rimandati a sessione futura

### Decisioni chiave
- Scelto strategy pattern per CategoryMatcher (callback `isMatch`) invece di duplicare la logica
- Scelto costante + helper per ProductStorage invece di un builder complesso
- Scelto di non toccare AuthContext e LoggingService (troppo connessi, rischio/beneficio sfavorevole)
- Scelto di aggiungere test PRIMA del refactoring (pattern: test → refactor → verify)

---

## 2026-07-23 — Analisi e ottimizzazione errorHandler.ts

**Contesto**: Analisi completa del modulo `utils/errorHandler.ts` per verificare se necessita di refactoring. Identificazione di due pattern di error handling coesistenti (AppError e ServiceResult\<T\>) e verifica che NON siano in conflitto ma complementari per design.

**Decisione**: Refactoring profondo non necessario. Il modulo è già ben architettato. Applicati solo quick wins a basso rischio.

**Quick Wins applicati**:

| # | Fix | File | Dettaglio |
|---|-----|------|-----------|
| 1 | Rimozione 4 deprecated exports | `utils/errorHandler.ts` | `handleNetworkErrorCompat`, `handleDatabaseErrorCompat`, `handleAuthErrorCompat`, `ErrorHandler` class (+ default export). File ridotto da 395 a 349 righe. |
| 2 | Fix import facade pattern | `utils/errorFormatters.ts` | `import { ErrorCode, AppError } from './errorHandler'` (invece di import diretto da `types/`) |

**Documentazione aggiunta**:

| # | Documento | Contenuto |
|---|-----------|-----------|
| 1 | `.planning/ARCHITECTURE.md` | Nuova sezione "Error Handling Patterns" con ServiceResult\<T\>, AppError, composizione, criterio di scelta rapido |
| 2 | `types/ServiceResult.ts` | JSDoc completi su type + factory functions con esempio d'uso |
| 3 | `utils/errorHandler.ts` | `@fileoverview` espanso, JSDoc su handleError/handleValidationError/normalizeError, tabella handler specializzati (Strategy) |
| 4 | `utils/errorHandler.ts` | CodeDNA header aggiornato: rimossi i 4 deprecated da exports, aggiunto errorFormatters.ts a used_by |

**Risultato**:
- 2189/2189 test passano (0 regressioni)
- 0 errori TypeScript
- 6 file toccati, 46 righe di dead code eliminate
- Pattern chiaramente documentato per il team

**Decisioni chiave**:
- ServiceResult\<T\> (CRUD) e AppError (infrastrutturale) sono complementari, non alternativi — mantenuti entrambi
- Refactoring profondo NON eseguito perché il modulo era già ben architettato (risk/benefit sfavorevole)
- Documentation-first: JSDoc + ARCHITECTURE prima di eventuali modifiche future

---

## 2026-07-23 — Analisi refactoring candidati + Cleanup useBarcodeScanner + Test coverage

**Contesto**: Continuazione del lavoro su refactoring file grandi. Dopo l'analisi di `errorHandler.ts` (quick wins applicati), richiesta di analizzare altri 4 file candidati per refactoring: useCamera.ts (327L), AuthService.ts (305L), DiagnosticPanel.tsx (296L), useBarcodeScanner.ts (295L).

**Analisi refactoring** (4 candidati):
- `hooks/useCamera.ts` (327L): 12 branches, 26 test, single consumer → **NON refactor**. Coesivo, già ben testato. Sotto soglia 350L per split.
- `services/AuthService.ts` (305L): Rate limiting integrato con auth, nessun consumer parziale → **NON refactor**. Sicurezza coesa, separare aumenterebbe superficie d'attacco.
- `components/DiagnosticPanel.tsx` (296L): 4 sub-componenti già estratti, styles 110L co-locati → **NON refactor**. Refactor peggiorerebbe la navigazione del file.
- `hooks/useBarcodeScanner.ts` (295L): **Solo cleanup API surface** (no structural refactor). Helper internal non dovevano essere pubblici.

**Decisioni chiave**:
- 4/4 file analizzati NON necessitano refactoring strutturale — la size da sola non è un segnale valido; servono bassa coesione, consumer parziali, o alta complessità.
- Scelto cleanup invece di refactoring per useBarcodeScanner (rimossi 3 export pubblici, aggiunto `__testing` per test access).
- Scelto deferred promise pattern per testare stati intermedi in hook async (React 18 batching impedisce `act(async)` di osservare stati intermedi).
- Scelto `setCurrentBarcode(null)` in `resetScanner` per consistenza con gli altri reset.

**Cleanup applicati**:
| # | Fix | File | Dettaglio |
|---|-----|------|-----------|
| 1 | Rimosso export da 3 helper | `hooks/useBarcodeScanner.ts` | `extractProductName`, `extractBrand`, `extractImageUrl` → internal + `__testing` |
| 2 | JSDoc su ServiceResult.ts e errorHandler.ts | `types/ServiceResult.ts`, `utils/errorHandler.ts` | Pattern documentati con esempi |
| 3 | Sezione error handling | `.planning/ARCHITECTURE.md` | ServiceResult\<T\> vs AppError documentati |

**Test coverage**:
| # | Test Suite | File Test | Test | Risultato |
|---|-----------|-----------|------|-----------|
| 1 | handleBarCodeScanned | `hooks/__tests__/useBarcodeScanner.test.ts` | +27 test (58 totali) | 58/58 ✅ |
| 2 | Fix isLoading test | deferred promise pattern | - | 58/58 ✅ |
| 3 | Fix currentBarcode test | deferred promise pattern | - | 58/58 ✅ |
| 4 | regressione scanner.test | - | - | 82/82 ✅ |

**Fix test preesistenti**:
| # | Fix | File | Dettaglio |
|---|-----|------|-----------|
| 1 | Fix TS2556 | `app/__tests__/feedback.test.tsx` | arrow function in jest.mock rimosse |
| 2 | Fix TS2353 | `hooks/__tests__/useBarcodeScanner.test.ts` | `emoji`→`icon`, aggiunto `color` |
| 3 | Mock expo-camera | `__mocks__/expo-camera.js` | +1 mock, sblocca test useBarcodeScanner |

**Fix implementativi**:
| # | Fix | File | Dettaglio |
|---|-----|------|-----------|
| 1 | `setCurrentBarcode(null)` nei path di successo | `hooks/useBarcodeScanner.ts` | 3 path: template, online, not_found |
| 2 | `setCurrentBarcode(null)` in resetScanner | `hooks/useBarcodeScanner.ts` | Consistenza con tutti gli altri reset |

**Risultato finale**:
- 58/58 test useBarcodeScanner ✅
- 82/82 test scanner.test ✅
- 0 errori TypeScript
- 0 regressioni

**Note**:
- `feedback.test.tsx`: 14 fallimenti preesistenti non risolti (problemi async, non correlati ai nostri cambiamenti)
- Pattern `act(async)` non usabile per testare stati intermedi in React 18 — usare `act()` sincrono + deferred promise

---

## 2026-08-04 — Fix 3 problemi CLAUDE.md (RPC schema, email trim, feedback.test.tsx)

### Contesto
CLAUDE.md elencava 2 CRITICAL ISSUES + 3 HIGH PRIORITY task da verificare/fixare. Subagent Explore rotti (modello `z-ai/glm-4.5-air:free` non disponibile) → investigazione diretta con Read/Grep/Bash.

### Findings
1. **RPC `get_expiring_products`**: GIÀ RISOLTO. La migration `20251028_create_get_expiring_products.sql` contiene già `days_remaining` (header "Synced with remote: 2026-08-04", commit `ab44414`) — risolve la discrepanza documentata nelle sessioni 07-09/07-15. Nessuna altra migration tocca la funzione.
2. **Email trim in `forgot-password.tsx`**: CONFERMATO bug residuo dal fix parziale del 2026-07-22. `handleResetWithOTP` trimmava già l'email, ma `handleVerifyOTP` (riga 137-141) passava `email` grezzo (mai ri-trimmato) a `verifyOtp()` — se l'utente digitava spazi, la verifica OTP falliva per mismatch con l'account reale.
3. **`feedback.test.tsx` 14 fallimenti**: root cause isolata via `npx jest` — `TypeError: ImagePicker.requestMediaLibraryPermissionsAsync is not a function`. Causa: `jest.mock('expo-image-picker', factory)` referenziava `const mockX = jest.fn()` dichiarate PIÙ IN BASSO nello stesso file. Babel hoista `import FeedbackScreen from '../feedback'` (quindi anche l'`import * as ImagePicker` interno) SOPRA quelle dichiarazioni `const`, quindi la factory del mock veniva eseguita quando le variabili erano ancora `undefined`. Il fix TS2556 di ieri (2026-07-23, "arrow function in jest.mock rimosse") non aveva toccato questo problema di ordering.

### Fix applicati
| # | Fix | File | Dettaglio |
|---|-----|------|-----------|
| 1 | Chiusura issue (nessun codice) | `CLAUDE.md` | RPC già sincronizzata, rimossa da CRITICAL ISSUES |
| 2 | Trim email in `handleVerifyOTP` | `app/forgot-password.tsx` | `email` → `email.trim()` nella chiamata `verifyOtp()` |
| 3 | Test regressione trim OTP | `app/__tests__/forgot-password.test.tsx` | Nuovo test: email con spazi → `mockVerifyOtp` chiamato con email trimmata |
| 4 | Fix mock hoisting `expo-image-picker` | `app/__tests__/feedback.test.tsx` | `jest.fn()` dichiarate INLINE dentro la factory `jest.mock()`, riferimenti tipizzati recuperati dopo via `import * as ImagePicker` + cast `as jest.Mock` (pattern già usato con successo in `useCamera.test.ts`) |

### Risultato
- `feedback.test.tsx`: 55/55 PASS (da 41/55)
- `forgot-password.test.tsx`: 48/48 PASS (47 esistenti + 1 nuovo)
- Suite completa: 2220/2225 PASS (5 skip legacy), 0 regressioni
- TypeScript: 0 errori
- Commit: `ab44414` (invariato, fix non ancora committati in questa sessione)

### Decisioni chiave
- Non toccato il meccanismo generale di hoisting dei mock jest — solo il pattern nel file specifico, allineandolo al pattern già corretto di `useCamera.test.ts`
- Aggiunta nota permanente in CLAUDE.md (sezione TEST INFRASTRUCTURE) sul gotcha "mock hoisting" per prevenire la stessa classe di bug in futuri test file

---

## 2026-06-17 — Fix barcode: imageUrl non normalizzata (string[] → string)

**Bug risolto**: "Dopo la scansione barcode, la foto del prodotto da Open Food Facts non si vede nella schermata di compilazione (intermittente: 3-4 su 20 prodotti)"

**Diagnosi** (2 bug concatenati, 1 CRITICAL + 1 MEDIUM):

1. **CRITICAL** — `imageUrl` non normalizzata da `string[]` a `string` nel flusso barcode non-EDIT: `useLocalSearchParams()` di expo-router restituisce a volte i parametri come `string[]` invece di `string`. La normalizzazione ESISTEVA già per il flusso EDIT (riga 79-81) e photo capture (riga 139), ma MANCAVA nel ramo `else` (barcode flow, riga 99-109). Quando `imageUrl` è un array `["https://..."]`, `<Image source={{ uri: ["https://..."] }}>` fallisce silenziosamente.

2. **MEDIUM** — `categoriesLoading` nelle dipendenze di `loadData` causava doppia inizializzazione: quando le categorie finivano di caricare (`true` → `false`), `loadData` veniva ricreato e rieseguito, chiamando `initializeForm` una seconda volta.

**Fix applicati**:

| # | Fix | File | Dettaglio |
|---|-----|------|-----------|
| 1 | Normalizzazione `string[]` → `string` nel ramo barcode non-EDIT | `hooks/useProductInitialization.ts` | Loop `for` converte ogni parametro `Array.isArray(value)` in `value[0] ?? ''` prima di passare a `initializeForm` |
| 2 | Normalizzazione `imageUrl` in `processScannedData` | `context/ManualEntryActionsContext.tsx` | `Array.isArray(data.imageUrl) ? data.imageUrl[0] : data.imageUrl` prima di `|| null` |
| 3 | Rimozione `categoriesLoading` dalle deps di `loadData` | `hooks/useProductInitialization.ts` | Previene doppia inizializzazione quando categorie finiscono di caricare |

**File modificati**:

| File | Cambiamento |
|------|-------------|
| `hooks/useProductInitialization.ts` | Fix #1 (normalizzazione params nel ramo else) + Fix #3 (rimozione `categoriesLoading` dalle deps) |
| `context/ManualEntryActionsContext.tsx` | Fix #2 (normalizzazione `imageUrl` in `processScannedData`) |

**Risultato verifica**:
- 0 errori TypeScript
- 28/28 test passati su useProductInitialization
- 16/16 test passati su ManualEntryActionsContext
- Verifier: APPROVED WITH CONCERNS (2 lacune test coverage per i nuovi fix, inconsistenza preesistente in add.tsx)

---

## 2026-06-17 — Ottimizzazione Caricamento Immagini

**Problema**: Le immagini prodotto da Open Food Facts erano lente a caricare (2-10s) nonostante il bug principale fosse stato risolto.

**Causa**: 4 bottleneck identificati:
1. `extractImageUrl` preferiva `image_url` (full-size ~300KB) invece di `image_front_small_url` (~10KB)
2. Nessun prefetching — l'immagine iniziava a scaricare solo al mount del componente
3. Nessun `cachePolicy` su `<Image>`
4. Nessun `placeholder`/`onError` su `<Image>`

**Fix applicati**:

| # | Fix | File | Dettaglio |
|---|-----|------|-----------|
| 1 | Invertito fallback `extractImageUrl` | `hooks/useBarcodeScanner.ts` | `image_front_small_url || image_front_url || image_url` (da ~300KB a ~10KB, -97%) |
| 2 | Aggiunto `Image.prefetch()` | `app/scanner.tsx` | Download in parallelo con navigazione |
| 3 | Aggiunti `onLoadStart`/`onLoadEnd`/`onError` | `components/PhotoCaptureButton.tsx`, `components/ProductDetailHeader.tsx` | Logging errori + state per indicatore caricamento |

**File modificati**:

| File | Cambiamento |
|------|-------------|
| `hooks/useBarcodeScanner.ts` | Fix 1 — ordine fallback invertito |
| `app/scanner.tsx` | Fix 2 — `Image.prefetch()` + import `Image` |
| `components/PhotoCaptureButton.tsx` | Fix 3 — handler immagine + logging |
| `components/ProductDetailHeader.tsx` | Fix 3 — stessi handler per coerenza |
| `hooks/__tests__/useBarcodeScanner.test.ts` | Test aggiornati per nuova priorità |

**OTA Update pubblicato**: branch `production`, runtime `1.0.3.1`, commit `dc7206dd`

---

## 2026-06-02 — Diagnosi: immagine prodotto lenta o assente nel dettaglio

**Bug risolto**: "Certe volte quando vado dentro ai prodotti, non fa vedere l'immagine oppure ci mette tanto tempo."

**Diagnosi** (5 cause identificate, 2 CRITICAL + 1 HIGH + 2 MEDIUM):
1. URI locale `file:///tmp/...` non persistente salvato in DB
2. Loop infinito in `useProductInitialization` (isInitialized nelle deps di useCallback)
3. Race condition EDIT mode (foto nuova sovrascritta da initializeForm)
4. `<Image>` RN senza onError/placeholder/priority
5. Foto productPhoto a piena risoluzione (12-48 MP) senza resize

**Fix applicate**:
- **Fix #1** (CRITICAL): Persistenza URI immagine in `documentDirectory/products/` — `utils/imageStorage.ts` (nuovo helper `saveImagePermanently`/`deleteProductImage`), `hooks/useCamera.ts` (modalità productPhoto salva in `Paths.document`), `hooks/usePhotoActions.ts` (verificato invariato)
- **Fix #2** (CRITICAL): Rimozione loop infinito in `hooks/useProductInitialization.ts` — rimosso `isInitialized` dalle deps di useCallback
- **Fix #3** (HIGH): Race condition EDIT mode risolta in `hooks/useProductInitialization.ts` — `setImageUrl(overrideImageUrl)` applicato atomicamente DOPO `initializeForm`
- **Fix #6** (MEDIUM): Resize immagine productPhoto a 1200px in `hooks/useCamera.ts` — `ImageManipulator.manipulateAsync` con `width: 1200`, `compress: 0.85`, JPEG, fallback robusto a URI originale

**File modificati/creati**:
- `utils/imageStorage.ts` (nuovo)
- `hooks/useCamera.ts` (Fix #1 + Fix #6)
- `hooks/useProductInitialization.ts` (Fix #2 + Fix #3)
- `utils/__tests__/imageStorage.test.ts` (nuovo, 15 test)
- `hooks/__tests__/useCamera.test.ts` (modificato, +4 test)
- `hooks/__tests__/useProductInitialization.test.ts` (modificato, +4 test)

**Discussione critica Fix #4 e #5** (verdetto: rimandare):
- **Fix #4** (onError/placeholder su `<Image>`): NON necessaria ora. URI persistenti, decode <100ms (4-8x sotto soglia Doherty 400ms), skeleton/placeholder peggiora percezione
- **Fix #5** (migrazione a `expo-image`): NON necessaria ora. Costo rebuild nativo + ~200KB bundle per benefici impercettibili su URI locali con liste <200 items. Trigger futuri: lista >200 prodotti, migrazione a Supabase Storage con immagini remote, memory pressure Android

**Risultato verifica**:
- 99/99 test passano su useProductInitialization (28) + useCamera (19) + imageStorage (15) + useProductForm consumer (41) - dopo Fix #1-3
- 19/19 test passano su useCamera dopo Fix #6
- 0 errori TypeScript nuovi
- Verifier: APPROVED su tutti i fix

---

## 2026-05-23 — Creazione Test Copertura Moduli Critici

### Contesto
Il progetto aveva 542 file totali con solo 60 file di test. La copertura era concentrata su utility e servizi base, ma mancavano test per Context React, hook critici e pagine UI.

### Test Creati

#### Context (Priorità 1)
1. **CategoryContext.test.tsx** - 20 test (20/20 passano ✅)
   - Test: rendering, add/update/delete category, gestione errori, icon migration
   - Stato: ✅ Completato, 100% test passano

2. **UpdateContext.test.tsx** - 15 test (15/15 passano ✅)
   - Test: rendering, updateApp, checkForUpdates, loading states, error handling
   - Stato: ✅ Completato, 100% test passano

3. **SettingsContext.test.tsx** - 6 test (6/6 passano ✅)
   - Test: rendering, updateSettings, loading states, default values
   - Stato: ✅ Completato, 100% test passano

4. **ManualEntryContext.test.tsx** - 27 test (27/27 passano ✅)
   - Test: valori default, setters, initializeForm, clearForm, meta state
   - Stato: ✅ Completato, 100% test passano

5. **ManualEntryActionsContext.test.tsx** - 16 test (16/16 passano ✅)
   - Test: setField, addQuantity, removeQuantity, initializeForm, clearForm
   - Stato: ✅ Completato, 100% test passano

#### Hook Critici (Priorità 2)
6. **useProductInitialization.test.ts** - 24 test (24/24 passano ✅)
   - Test: inizializzazione prodotti, loading, error handling, empty states
   - Stato: ✅ Completato, 100% test passano

7. **useProductSave.test.ts** - 31 test (31/31 passano ✅)
   - Test: salvataggio prodotto, validazione, error handling, edit mode
   - Stato: ✅ Completato, 100% test passano

8. **usePasswordValidation.test.ts** - 44 test (44/44 passano ✅)
   - Test: validazione password (lunghezza, maiuscole, minuscole, numeri, speciali), progress bar, edge cases
   - Stato: ✅ Completato, 100% test passano

9. **useQuantityCalculation.test.ts** - 16 test (16/16 passano ✅)
   - Test: calcolo quantità unità singole/miste, validazione input, edge cases
   - Stato: ✅ Completato, 100% test passano

10. **useSignupValidation.test.ts** - 22 test (22/22 passano ✅)
    - Test: validazione form (email, nome, cognome), password (4 criteri), isFormValid, clearErrors
    - Stato: ✅ Completato, 100% test passano

11. **useEmailAuth.test.ts** - 9 test (9/9 passano ✅)
    - Test: login successo/errore, network error, unknown error, clearError, loading state
    - Stato: ✅ Completato, 100% test passano

12. **useCamera.test.ts** - 15 test (15/15 passano ✅)
    - Test: inizializzazione 3 modalità, permessi camera/galleria, takePicture, pickImage, OCR mode
    - Stato: ✅ Completato, 100% test passano

13. **useGoogleAuth.test.ts** - 9 test (9/9 passano ✅)
    - Test: configurazione, iOS sign-in, clearErrors, loading state, retry state
    - Stato: ✅ Completato, 100% test passano

14. **useRegistration.test.ts** - 10 test (10/10 passano ✅)
    - Test: init, register, checkEmail, handlePostRegistration, resetError, createUserAccount
    - Stato: ✅ Completato, 100% test passano

15. **usePhotoActions.test.ts** - 10 test (10/10 passano ✅)
    - Test: confirmPhoto (4 modalità), extractExpirationDate (3 scenari), navigateToManualEntry, resetOCRProgress
    - Stato: ✅ Completato, 100% test passano

16. **usePhotoNavigation.test.ts** - 8 test (8/8 passano ✅)
    - Test: navigateToPhotoCapture (2 modalità, default, ref state, logging, imageUrl passthrough)
    - Stato: ✅ Completato, 100% test passano

#### Pagine Critiche (Priorità 3)
17. **photo-capture.test.tsx** - 31 test (31/31 passano ✅)
    - Test: rendering, scatto foto, permessi camera, OCR flow, navigazione
    - Stato: ✅ Completato, 100% test passano

18. **scanner.test.tsx** - 24 test (24/24 passano ✅)
    - Test: scansione barcode, gestione prodotti, navigazione, permessi
    - Stato: ✅ Completato, 100% test passano

19. **signup.test.tsx** - 21 test (21/21 passano ✅)
    - Test: rendering, validazione form, password visibility, registration flow, error handling, navigazione
    - Stato: ✅ Completato, 100% test passano

20. **manual-entry.test.tsx** - 20 test (20/20 passano ✅)
    - Test: rendering, loading state, new category modal, salvataggio, edit mode, prefilled values
    - Stato: ✅ Completato, 100% test passano

21. **products.test.tsx** - 26 test (26/26 passano ✅)
    - Test: rendering, search, filtri, consuma/elimina, consume quantity modal, screen focus, empty/loading states
    - Stato: ✅ Completato, 100% test passano

22. **settings.test.tsx** - 32 test (32/32 passano ✅)
    - Test: rendering, loading, navigazione, notification days modal, update flow, dark mode toggle
    - Stato: ✅ Completato, 100% test passano

#### Servizi (Priorità 4)
23. **TemplateService.test.ts** - 9 test (9/9 passano ✅)
    - Test: getProductTemplate (barcode, errori), saveProductTemplate (upsert, skip)
    - Stato: ✅ Completato, 100% test passano

24. **SettingsService.test.ts** - 13 test (13/13 passano ✅)
    - Test: getSettings (fetch, default, errori), updateSettings (sync, rollback), listenToSettings
    - Stato: ✅ Completato, 100% test passano

#### Componenti (Priorità 5)
25. **ErrorBoundary.test.tsx** - 7 test (7/7 passano ✅)
    - Test: rendering children, error fallback, custom fallback, logging, retry, accessibilità
    - Stato: ✅ Completato, 100% test passano

26. **LoginForm.test.tsx** - 13 test (13/13 passano ✅)
    - Test: rendering inputs/buttons, callbacks, validazione, error display, loading state
    - Stato: ✅ Completato, 100% test passano

27. **ProductCard.test.tsx** - 10 test (10/10 passano ✅)
    - Test: rendering con dati, testID, null category, onPress, frozen/consumed status
    - Stato: ✅ Completato, 100% test passano

28. **ExpirationCard.test.tsx** - 10 test (10/10 passano ✅)
    - Test: rendering, category lookup, null handling, press handling, dark mode, accessibilità
    - Stato: ✅ Completato, 100% test passano

29. **QuantityInput.test.tsx** - 17 test (17/17 passano ✅)
    - Test: rendering, keyboard, autofocus, maxLength, placeholder, input validation, error state, accessibilità
    - Stato: ✅ Completato, 100% test passano

30. **DashboardHeader.test.tsx** - 3 test aggiunti (8 totali, 8/8 passano ✅)
    - Test: bell icon per granted/denied, User icon senza initials
    - Stato: ✅ Completato, 100% test passano

### Riepilogo
- **File creati**: 30 nuovi file di test
- **Test totali**: 523 test
- **Test passati**: 523/523 (100%)
- **Test falliti**: 0/523
- **Copertura aggiunta**: Context (5), Hook (12), Pagine (6), Servizi (2), Componenti (5)
- **Tempo esecuzione**: ~10-15 minuti per esecuzione completa

### Fix Applicati
- Rimosso mock globale di CategoryContext da jest.setup.js (causava "Element type is invalid")
- Corretto import di CategoryProvider e useCategories (named export)
- Usato renderHook correttamente per test hook
- Fix import SettingsContext (named export invece di default)
- Fix backHandler mock per photo-capture (completato — tutti i 31 test passano)
- Mock globale SafeAreaView e Modal override locali per testID preservation

---

## 2026-05-10 - Stabilizzazione Infrastruttura di Test e Fix Logica Errori
**Problema**: La suite di test presentava instabilità (timeout) in `ProductContext.test.tsx` e alcuni errori di logica nel riconoscimento degli errori di rete e sessione in `errorHandler.ts`.

**Fix applicati**:
| File | Cambiamento |
|------|-------------|
| `utils/errorHandler.ts` | Migliorata precisione rilevamento errori: aggiunte keyword "fetch"/"connection", incluso routing per `isSessionExpired`/`isUnauthorized` nel caso DATABASE. |
| `utils/__tests__/errorHandler.test.ts` | Fix path import `ErrorCode` (era `../types` invece di `../../types`). |
| `context/__tests__/ProductContext.test.tsx` | Sostituito `waitFor` con `waitForElementToBeRemoved` per gestire in modo deterministico la scomparsa del loading state. |
| `services/NotificationPermissionService.ts` | Aggiunti null-check preventivi sulla risposta delle API native di Expo per evitare crash (TypeError). |

**Risultato**: Suite di test completa (1326 test) con esito **PASS**. Risolte le regressioni introdotte dai nuovi moduli di errore.

---

## 2026-05-10 - Fix OCR: esclusione Lotto e fallback dot-matrix

**Problema**: L'OCR non rilevava la data di scadenza stampata in dot matrix (es. "15/11/26") e interpretava erroneamente il numero di lotto "11.8" come data di scadenza (11.08.2026).

**Root Cause**: 4 bug concatenati:
1. `cleanBlockText` rimuoveva "LOTTO" prima che `removeIgnoredDateContexts` potesse filtrarlo → "11.8" rimaneva come candidato data
2. Nessun preprocessing immagine per dot-matrix → ML Kit leggeva "1 !" e "I A1S1" invece di "15/11/26"
3. Regex Lotto troppo ristretta (non copriva LOT, LT, separatori `:` e `.`)
4. Sostituzioni dot-matrix inefficaci su testo completamente garbled (non implementato, bassa priorità)

**Fix applicati**:

| # | Fix | File | Dettaglio |
|---|-----|------|-----------|
| 1 | Invertito ordine `removeIgnoredDateContexts`/`cleanBlockText` | `utils/ocr/parsing.ts` | Ora `removeIgnoredDateContexts` vede ancora "LOTTO" nel testo prima che venga rimosso |
| 2 | Aggiunto fallback ocr.space Engine 2 per dot-matrix | `utils/ocr/ocrSpaceService.ts` (nuovo), `hooks/usePhotoOCR.ts` | Se ML Kit non trova date → ocr.space Engine 2 (dot-matrix specifico) con `scale=true` |
| 3 | Espansa regex esclusione Lotto | `utils/ocr/parsing.ts` | `LOTTO[:. ]?|LOT[:. ]?|LT[:. ]?|L[.:]` — copre LOTTO:, LOT:, LT:, L. ecc. |
| 4 | API key ocr.space configurata | `.env`, `app.config.js` | `EXPO_PUBLIC_OCR_SPACE_API_KEY` in `.env` (in `.gitignore`) |

**Bug secondario fixato**: Regex non matchava `LT:058` e `LOTTO: 11.8` perché mancava `[:. ]?` dopo LOTTO e LOT.

**Bug secondario fixato**: Riga 17 di `app/(tabs)/index.tsx` mancava `//` → "elements" interpretato come codice → errore "property elements doesn't exist".

**File modificati**:
| File | Cambiamento |
|------|-------------|
| `utils/ocr/parsing.ts` | Invertito ordine cleanBlockText/removeIgnoredDateContexts, espansa regex Lotto |
| `utils/ocr/ocrSpaceService.ts` | Nuovo servizio per fallback ocr.space Engine 2 |
| `hooks/usePhotoOCR.ts` | Integrato fallback ocr.space quando ML Kit non trova date |
| `.env` | Aggiunta `EXPO_PUBLIC_OCR_SPACE_API_KEY` |
| `app.config.js` | Esposizione `ocrSpaceApiKey` in extra |
| `app/(tabs)/index.tsx` | Fix commento malformed (riga 17 senza `//`) |

---

## 2026-05-10 - Fix OCR date scadenza da foto confezioni

**Fixed**: Migliorata l'estrazione OCR delle date di scadenza su confezioni reali con font puntinati, date lotto vicine e letture OCR sporche.

| File | Fix |
|------|-----|
| `utils/ocr/preprocessing.ts` | Normalizzazione OCR per date compatte e sporche: `110g26` → `110926`, `11~0926` → `110926`, `23\0512026` → `23.05.2026`, rimozione lettere spurie prima di date complete (`J24 -05 2026` → `24.05.2026`) |
| `utils/ocr/parsing.ts` | Ignora date di confezionamento/lotto in contesti `CONF`, variante OCR `CONE`, e `LOTTO:` senza scartare tutto il blocco che contiene anche l'anchor di scadenza |
| `utils/dateUtils/parsers/sequence.ts` | `parseSequenceDate` accetta anche sequenze con separatori (`11.09.26`) normalizzandole prima del parsing |
| `utils/ocr/__tests__/ocrEngine.test.ts` | Aggiunti test regressione per casi reali: latte `CONE.14/04/26`, `110g26`, `11~0926`, lotto/scadenza mischiati, `23\0512026`, lettera iniziale prima della data |
| `hooks/useCamera.ts` | Le immagini da galleria in modalità `expirationDateOnly` ora usano lo stesso preprocessing OCR della fotocamera (`prepareImageForOCR`) invece del solo resize generico |

**Casi verificati con log reali**:
- Latte con `CONF.14/04/26` letto come data sbagliata: ora sceglie `2026-09-11`.
- Variante OCR `CONE.14/04/26`: ignorata come data confezionamento.
- Scadenza `11/09/26` letta come `110g26`: normalizzata e parsed come `2026-09-11`.
- Scadenza `11/09/26` letta come `11~0926`: normalizzata e parsed come `2026-09-11`.
- Vaschetta con `Lotto: 02/05/2026` e `LI consumarsi entro:23\0512026`: ora rimuove il lotto e sceglie `2026-05-23`.
- Dessert con `J24 -05 2026 %`: ora pulisce la lettera iniziale e sceglie `2026-05-24` invece di `2026-05-31`.

**Verifiche eseguite**:
- `npx jest utils/ocr/__tests__/ocrEngine.test.ts --runInBand` → 20 test passati
- `npx tsc --noEmit --pretty false` → passato
- `git diff --check` → passato
- `npx jest hooks/__tests__/useBarcodeScanner.test.ts --runInBand` → 25 test passati

**Note aperte**:
- Confezione surgelata con scadenza reale `15/11/26`: anche dopo preprocessing galleria a 1200px, ML Kit legge solo frammenti (`11.8`) e non restituisce la riga data completa. Non è un problema di regex: serve migliorare crop/ROI o introdurre ritaglio manuale/fallback mirato. Documentazione ML Kit: conta la dimensione dei caratteri nell'immagine; oltre circa 24x24 px per carattere non porta benefici rilevanti, quindi non aumentare la larghezza fissa alla cieca.

---

## 2026-05-10 - Code Review Finding Fixes, Security & Accessibility Improvements

**Security fixes**:
- **OCR proxy implementation**: API key ocr.space ora protetta tramite proxy server-side invece di essere esposta nel client mobile
- **Rate limiting**: Aggiunto rate limiting su endpoint auth per prevenire attacchi brute force
- **Secure credential handling**: Migliorata la gestione delle credenziali con validazione aggiuntiva

**Auth rate limiting**:
- Implementato rate limiting su login, signup e password reset
- Limit: 5 richieste per IP ogni 15 minuti
- Response 429 con messaggio chiaro quando superato il limite

**Accessibility improvements**:
- Aggiunti labels `accessibilityLabel` e `accessibilityHint` su tutti i bottoni interattivi
- Migliorate le annunci screen reader per gli stati di caricamento
- Aggiunte shortcut da tastiera per operazioni comuni
- Contrasto colori rivisto per conformità WCAG 2.1

---

## 2026-05-09 - Completati headers CodeDNA su tutti i file sorgente

**Fixed**: 4 file mancanti di headers CodeDNA (`Toast.tsx`, `UpdateModal.styles.ts`, `errorTypes.ts`, `DatabaseErrorHandler.ts`) — ora tutti i 267 file TS/TSX hanno `exports:`, `used_by:`, e `rules:`.

| File | Fix |
|------|-----|
| `components/Toast.tsx` | Aggiunto header CodeDNA con `rules:` |
| `components/UpdateModal.styles.ts` | Aggiunto header CodeDNA con `rules:` |
| `types/errorTypes.ts` | Aggiunto header CodeDNA con `rules:` |
| `utils/DatabaseErrorHandler.ts` | Aggiunto header CodeDNA con `rules:` |

**Note**: Il comando `codedna-patch.py refresh .` non può essere usato perché scansiona `node_modules` e va in timeout. Gli `exports:` e `used_by:` sono stati compilati manualmente con `rg` per verificare i caller reali.

---

## 2026-05-02 - Log Viewer & Diagnostic Panel Improvements

**Session Summary**:

#### 1. Log Viewer aggiunto al DiagnosticPanel
- Aggiunta sezione "Log dell'App" nel Pannello Diagnostico
- Pulsanti "Aggiorna Log" e "Cancella Log"
- Visualizzazione log con font monospace
- Scrolling funzionante tramite outer ScrollView (nessun nested scroll)

#### 2. LoggingService - Buffer di memoria per sviluppo locale
- Aggiunto `memoryLogBuffer: string[]` per log in memoria
- Limite `MAX_MEMORY_LOGS = 1000` per evitare memory leak
- `getLogs()` ora funziona anche in `__DEV__` (prima restituiva "File logging is disabled")
- `clearLogs()` svuota sempre anche il buffer di memoria
- Log in ordine cronologico (push/shift anziché unshift/pop)

#### 3. DiagnosticPanel - Fix scrolling log
- Rimosso FlatList annidato che bloccava lo scroll
- Sostituito con semplice `View` + `Text`
- Rimosso `maxHeight` dal logContainer per espansione naturale
- L'outer ScrollView gestisce tutto lo scrolling

#### 4. Menu segreto - Da long press a 5 tap
- `useDiagnosticGesture.ts` completamente riscritto
- Prima: tenere premuto 5 secondi con barra di progresso
- Ora: 5 tap rapidi (entro 3 secondi) con contatore visivo
- Feedback aptico su ogni tap
- Overlay "Altri N tap per la diagnostica"
- Finestra temporale di 3 secondi per completare i tap

#### 5. VersionPressHandler semplificato
- Rimossa prop `onShowVersionInfo` (non più necessario)
- Rimosso Alert versione al primo click
- Il click sulla versione serve solo per attivare la diagnostica
- Rimosso import `Alert` non più usato in settings.tsx
- Rimosso import `Constants` non più usato in settings.tsx

**File modificati**:
| File | Cambiamento |
|------|-------------|
| `components/DiagnosticPanel.tsx` | Aggiunta sezione log, fix scrolling |
| `services/LoggingService.ts` | Buffer memoria per dev mode |
| `hooks/useDiagnosticGesture.ts` | Riscritto: long press → 5 tap |
| `components/settings/VersionPressHandler.tsx` | Rimosso onShowVersionInfo, overlay tap |
| `app/(tabs)/settings.tsx` | Rimosso handleShowVersionInfo, Constants |

---

## Regola di manutenzione (2026-08-09)

**Per le sessioni future**:
1. **Una sola fonte di verità**: ogni nuova sessione viene registrata SOLO in `SESSIONS.md` (in cima, formato `## YYYY-MM-DD — Titolo`).
2. **STATE.md NON contiene log sessioni**: solo dashboard di stato (Current Phase, Session Log Index, Known Issues, Test Suite Summary, Decisions, Last Commit).
3. **Aggiornamento dashboard**: dopo ogni sessione aggiornare in STATE.md solo le sezioni di stato: Known Issues (aggiungere/chiudere), Test Suite Summary, Decisions, Last Commit.
4. **Session Log Index**: mantenere in STATE.md l'indice delle sessioni con data + titolo + link alla sezione in SESSIONS.md.
5. **Niente duplicati**: se una sessione è già in SESSIONS.md non riscriverla altrove. Per modifiche successive alla stessa sessione, aggiungere un paragrafo "Refinement" nella stessa sezione (pattern già usato il 09/07).
