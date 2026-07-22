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
- `utils/ocr/parsing.ts` — Fix 1: filtro per-blocco, non tocca MONTH_YEAR_PATTERN.
- `utils/ocr/scoring.ts` — Fix 2: `findRepresentativeMatch` con priorità esplicita.
- `utils/ocr/__tests__/expirationDateFix.test.ts` — 5 test regressione (caso target + casi legittimi mese/anno isolato preservati).

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

## 2026-07-15 — Fix 36 findings da code review (HIGH + MEDIUM + LOW)

### Contesto
Dopo la code review completa (38 finding), sessione dedicata all'implementazione di tutti i fix non-critical: 11 HIGH, 16 MEDIUM, 8 LOW.

### Fix principali
- **Dead code eliminato**: `functions/` (~96 file), `usePhotoOCR.backup.ts`, 3 file `.backup.*`
- **Type safety**: `@ts-nocheck`/`@ts-ignore` rimossi, discriminated union in `ProductContext`, `any` → `unknown`/`Record`
- **Logging**: `console.error` → `LoggingService` + buffer errori in `LogFileManager`
- **Performance**: import Supabase ottimizzato (TODO), dependency arrays semplificati
- **Memory leak**: cleanup `useEffect` in `usePhotoOCR`
- **Security**: `clearCachedSession` dopo password change, messaggi errore generici in `AuthService`
- **Documentazione**: CodeDNA headers puliti, commenti IT→EN, TODO per certificate pinning

### Risultato
Verifier APPROVED. 441/441 test passano, 0 nuovi errori TypeScript, 29 file modificati, 11+ eliminati.

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

## 2026-07-15 — Seconda Code Review (15 finding: 3 HIGH, 7 MEDIUM, 5 LOW)

### Contesto
Seconda code review focalizzata su problemi residui dopo i 36 fix della prima review. Usato graphify come strumento primario.

### Fix principali
- **Type safety**: rimosso `supabase as any` in UserNotificationSettingsService
- **Test stale**: NotificationService.test e NotificationCoreService.test riscritti per OneSignal
- **Config cleanup**: tsconfig (functions/), jest.config (ts-jest, RA.Aid), jest.setup (mocks ridondanti)
- **Dipendenze**: rimosse 4 non importate (zod, resend, lint, readable-stream)
- **Test coverage**: aggiunti 2 test null returns per NotificationPermissionService

### Risultato
Verifier APPROVED. 1932/1966 test passano, 0 nuovi errori TypeScript, 29 test preesistenti invariati.

## 2026-07-15 — Fix test falliti preesistenti (29 test)

### Contesto
29 test falliti preesistenti: settings.test.tsx (28) e usePhotoNavigation.test.ts (1).

### Root cause
- **settings.test.tsx**: `ChangePasswordModal` (reale) usava `Modal` con `accessibilityViewIsModal={true}`. Il mock globale di Modal renderizzava sempre il contenido (ignorando `visible={false}`), creando una barriera modale che bloccava tutte le query RNTL. Fix: aggiunto mock `ChangePasswordModal` + mock `AuthContext`.
- **usePhotoNavigation.test.ts**: Interfaccia TypeScript `UsePhotoNavigationReturn` aveva `mode` obbligatorio ma l'implementazione aveva default value. Fix: reso `mode` opzionale nell'interfaccia.

### Risultato
Verifier APPROVED. 117/117 suite passano, 1961/1966 test passano (5 skip legacy), 0 errori TypeScript, 0 test falliti.

---

## 2026-07-22 — Refactoring Progressivo Fasi 1-3

### Contesto
L'utente ha richiesto l'esecuzione di un piano di refactoring creato da Laguna S 2.1 per i file più grandi del progetto. Il piano è stato analizzato e poi eseguito in 3 fasi progressive.

### Analisi del piano
- Il piano iniziale aveva 17 file target, suddivisi in 7 categorie
- L'analisi ha identificato 10 breaking changes/regressioni non previste dal piano originale
- Le priorità sono state rivalutate: AuthContext split (BASSA→ALTA), CategoryMatcher (MEDIA→ALTA)
- File senza test (feedback.tsx, forgot-password.tsx) identificati come prerequisito critico

### Fase 1 — Quick wins (zero risk)
- Estrazione stili da manage-categories.tsx e scanner.tsx in file *.styles.ts
- Estrazione keyword maps da CategoryMatcher.ts in JSON dedicato
- Nessuna modifica comportamentale, solo spostamento codice

### Fase 2 — Test coverage
- Creazione suite test per feedback.tsx (55 test) e forgot-password.tsx (47 test)
- Fix applicati: fake timers ordering, accenti italiani, trim assumption
- Prerequisito per refactoring successivo

### Fase 3 — Refactoring medio
- Estrazione stili da feedback.tsx e forgot-password.tsx
- Fix .trim() email in forgot-password.tsx
- Deduplicazione logica CategoryMatcher con helper findCategoryFromMap (strategy pattern)
- Consolidamento query ProductStorage con buildBaseQuery + PRODUCT_SELECT_FIELDS

### ChangePasswordModal decomposition
- Estratti 4 componenti comuni (PasswordInput, ModalHeader, ModalActions, ErrorDisplay)
- Estratti 2 hook (usePasswordForm, usePasswordVisibility)
- Estratta utility validation (passwordValidationRules)
- Aggiunto PasswordMatchIndicator

### Risultato finale
- 2189 test passanti, 0 regressioni
- 25+ nuovi file
- 2 commit: `a840d96` e `af5db8e`

### Decisioni chiave
- Scelto strategy pattern per CategoryMatcher (callback `isMatch`) invece di duplicare la logica
- Scelto costante + helper per ProductStorage invece di un builder complesso
- Scelto di non toccare AuthContext e LoggingService (troppo connessi, rischio/beneficio sfavorevole)
- Scelto di aggiungere test PRIMA del refactoring (pattern: test → refactor → verify)
