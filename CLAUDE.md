# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Stack

- React Native 0.86.3, React 19.2.3, Expo SDK 57 (`expo` ^57.0.17), TypeScript ~6.0 (strict)
- Expo Router (file-based routing, `app/`)
- Backend: Supabase (PostgreSQL, Auth, Storage, Edge Functions in Deno) — project ref `tfhjupcybietwzmnpwfh`
- Push: OneSignal (`react-native-onesignal` SDK, `onesignal-expo-plugin`). `expo-notifications` was removed (caused duplicates).
- Auth: Supabase email/OTP + Google Sign-in (`@react-native-google-signin`) + hCaptcha (`@hcaptcha/react-native-hcaptcha`) on signup
- OCR: `@react-native-ml-kit/text-recognition` primary, `ocr.space` Engine 2 fallback (via `ocr-proxy` Edge Function)
- Lists: `@shopify/flash-list`. Animation: `react-native-reanimated` v4 + `react-native-worklets`
- Native dirs (`android/`, `ios/`) are checked in — this is a bare/prebuild workflow, not managed. Regenerate with `npx expo prebuild`.

## Commands

```bash
npm test                               # full Jest suite (large — 2000+ tests)
npm test -- path/to/file.test.tsx      # single file
npm test -- -t "OCR"                   # by test name pattern
npm run type-check                     # tsc --noEmit  (must be 0 errors)
npm run lint          / npm run lint:fix
npm run format        / npm run format:check   # prettier
npm start  (expo start)  /  npm run start:clear  (reset metro cache)
npm run android  /  npm run ios         # native run (needs local toolchain)

eas build --platform android --profile preview      # internal APK/AAB
eas build --platform android --profile production   # store, autoIncrement
eas update --branch preview                         # OTA
```

EAS profiles: `development`, `preview`, `release-apk`, `production`. Public env (`EXPO_PUBLIC_*`) lives in `eas.json`; `.env` is git-ignored (`.env.example` has placeholders).

### graphify (knowledge graph — see AGENTS.md, MANDATORY per project rule)

`graphify-out/` holds an AST knowledge graph. Per `AGENTS.md`, run graphify **before** grep/rg for any codebase question. Falls back to grep only if the graph is insufficient.

```bash
python -m graphify query "<question>"        # BFS context search
python -m graphify query "<...>" --dfs        # path-style search
python -m graphify path "NodeA" "NodeB"
python -m graphify explain "NodeName"
python -m graphify update .                   # rescan after code changes (AST only, no API cost)
```

## Architecture

Layered: **Presentation** (`app/` screens, `components/`, `hooks/`) → **State** (`context/` — React Context) → **Business Logic** (`services/`) → **Data** (Supabase client, `utils/`). Deeper detail in `.planning/ARCHITECTURE.md`.

### Directory map

| Path | Contents |
|------|----------|
| `app/` | Expo Router screens. `app/_layout.tsx` = root; `app/(tabs)/` = 5-tab navigator; rest are standalone (auth, scanner, photo-capture, manual-entry, etc.) |
| `context/` | 11 providers. Hierarchy fixed in `components/AppProviders.tsx`: `Auth → Settings → Product → Category → ManualEntry → Update`, all wrapped by `ThemeProvider` + `ErrorBoundary` in `_layout.tsx` |
| `services/` | Singletons/facades. CRUD returns `ServiceResult<T>`. |
| `hooks/` | `use[Feature]` custom hooks; `hooks/barcode/` splits barcode lookup (cache / OpenFoodFacts / local DB) |
| `utils/` | case conversion (camel↔snake for Supabase rows), date parsing (`datePatterns.ts`, `dateUtils/`), OCR (`ocr*.ts`, `utils/ocr/`), error handlers |
| `types/` | `ServiceResult.ts`, `errorTypes.ts` (`AppError`), `errorCodes.ts` (`ErrorCode` enum), `supabase.ts` (`Database` types), `Product.ts` |
| `supabase/` | `migrations/` (timestamped SQL), `functions/` (Deno Edge Functions) |
| `constants/` | `colors.ts`, `auth.ts`, filters, quantities |

### Error handling — two patterns, do not mix roles

- **`ServiceResult<T>`** — public API of services, CRUD. Discriminated union: `{success:true,data:T,error:null} | {success:false,data:null,error:string}`. Factories `createSuccessResult` / `createErrorResult`.
- **`AppError`** — infrastructure: categorize + log + localize. Facade `utils/errorHandler.ts` routes to `NetworkErrorHandler` / `DatabaseErrorHandler` / `AuthErrorHandler`; formatting in `errorFormatters.ts`.
- Services use `AppError` internally for logging, expose `ServiceResult<T>` (its `.error` string often = `AppError.message`).

### Data flow

- Products: screen → `ProductContext` → `ProductStorage` (Supabase CRUD + realtime subscriptions, `listenToProducts`). Rows converted camelCase via `utils/caseConverter`.
- Expiration notifications: Supabase daily cron → RPC `get_expiring_products` (returns `days_remaining`) → Edge Function `send-expiration-notifications` → OneSignal batch.
- OCR: photo → `usePhotoOCR` → ML Kit → parse/score pipeline → if 0 dates, `ocr-proxy` Edge Function (ocr.space Engine 2) → `ManualEntryContext`.

### God nodes (high fan-in — changes ripple widely)

- **`LoggingService`** — central logging. Memory buffer (max 1000, FIFO) in `__DEV__`, `LogFileManager` file writes in prod. `LoggingService.destroy()` on app unmount (timer leak). DiagnosticPanel: Settings → 5 taps on version.
- **`useTheme` / `ThemeContext`** — dark mode, color palette, font scaling; consumed by 100+ components.
- **`ProductStorage`** — Supabase facade for products; all errors typed via `ErrorCode`.
- **`Product` type** — shared shape across the app.

### OCR pipeline stages

1. `prepareImageForOCR` (preprocess/normalize) → 2. `recognizeText` (ML Kit) → 3. `parseExpirationDates` (regex + scoring) → 4. `findRepresentativeMatch` (priority: standard > sequence > monthYear) → 5. `ocr.space` fallback if 0 dates → 6. `scoring.ts` (confidence + spatial anchoring) → 7. `DateMatch[]` with 0-100 confidence.

## Conventions

- Naming: PascalCase components, camelCase hooks/utils, SCREAMING_SNAKE constants.
- Path alias: `@/*` → repo root (both `tsconfig.json` and jest `moduleNameMapper`).
- Every `.ts/.tsx` carries a CodeDNA header comment (`exports` / `used_by` / `rules`). Preserve and update it when editing. Guide: `CODEDNA-GUIDE.md`.
- Commits: Conventional (`feat/fix/docs/refactor/chore`), atomic per task, no force-push.
- After code changes: run `python -m graphify update .`.
- Language: codebase mixes Italian (user-facing strings, comments) and English (identifiers). Standardization is a pending owner decision — match the file you're in.

## Testing

- Jest + `jest-expo` preset + React Native Testing Library. Config `jest.config.js`, global mocks `jest.setup.js`. `testMatch`: `**/__tests__/**/*.(test|spec).*`.
- Patterns: AAA, factory functions, deferred promise for React act() batching.
- **Mock hoisting gotcha**: `jest.mock(mod, factory)` runs before any `const mockX = jest.fn()` later in the file (Babel hoists imports above). Declare `jest.fn()` inline inside the factory, then grab typed refs via `import * as X from 'module'; const mockFn = X.fn as jest.Mock` AFTER the mock. Working examples: `app/__tests__/feedback.test.tsx`, `hooks/__tests__/useCamera.test.ts`.

## Security

- Supabase anon key + OneSignal app_id + hCaptcha sitekey are public/safe. Service-role key and OneSignal REST key are server-side only (Edge Functions / Supabase secrets), never in client.
- Auth endpoints rate-limited 5 req/IP per 15 min.
- After password change: `clearCachedSession()` to invalidate JWT cache.
- RLS enforced on all user tables; migrations in `supabase/migrations/` include security-hardening passes.

## Reference docs

- `.planning/ARCHITECTURE.md` — layers, data-flow diagrams, pattern rationale (13+ documented abstractions)
- `.planning/STATE.md`, `.planning/SESSIONS.md` — milestone log, fix history, decision rationale (session-specific status lives here, not in this file)
- `.planning/{STACK,STRUCTURE,INTEGRATIONS,TESTING,CONVENTIONS}.md`
- `graphify-out/<date>/GRAPH_REPORT.md` — god nodes ranked by betweenness, communities
- `AGENTS.md` — graphify-first mandate (applies to all agents)
