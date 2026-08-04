# CLAUDE.MD

## 🔴 STATUS
- Phase: Active Dev (2026-08-04)
- Commit: ab44414
- Tests: 2220/2225 PASS (5 skip legacy)
- TypeScript: 0 errors

## 📍 COMPLETED JULY
1. ✅ Refactoring phases 1-3 (styles extraction, test coverage, logic dedup)
2. ✅ Code review: 36 fixes (11 HIGH + 17 MEDIUM + 8 LOW)
3. ✅ OCR: date 15/08 fix + dot-matrix fallback (ocr.space)
4. ✅ Push notifications: OneSignal duplicate fix + RPC days_remaining
5. ✅ Test suite: 2189/2189 PASS (30 new test files created)

## 📍 COMPLETED AUGUST
1. ✅ RPC `get_expiring_products` schema synced with prod (`days_remaining` column present, commit `ab44414`)
2. ✅ `forgot-password.tsx`: `handleVerifyOTP` now trims email before `verifyOtp` call, regression test added
3. ✅ `feedback.test.tsx`: fixed `expo-image-picker` mock hoisting bug (jest.fn() now declared inline in factory), 14 failures resolved — 55/55 PASS

## 🏗️ ARCHITECTURE
- Stack: React Native 0.81.5, Expo 54.0.34, Supabase (PostgreSQL), OneSignal
- Pattern: **ServiceResult\<T\>** (CRUD ops) + **AppError** (infrastructure errors)
- OCR Pipeline: ML Kit primary → ocr.space fallback (dot-matrix Engine 2)
- Image Storage: Persistent `documentDirectory/products/` (resize 1200px, compress 0.85)
- God nodes: LoggingService (124 edges), useTheme (116), Product (35), ProductStorage (32)
- Layer model: Presentation → State (Context) → Business Logic (Services) → Data (Supabase)

## 🔴 CRITICAL ISSUES (OPEN)
- None open. See COMPLETED AUGUST for recent closures.

## HIGH PRIORITY (NEXT)
- None queued.

## 🎮 CONVENTIONS

**Naming**: PascalCase (components), camelCase (hooks/utils), SCREAMING_SNAKE (constants).
**Error handling**: ServiceResult\<T\> for CRUD, AppError for infra.
**Testing**: Mock globals (jest.setup.js), deferred promise for React 18 act() batching.
**CodeDNA**: 267 TS/TSX files, all have headers (exports/used_by/rules).
**Commits**: Conventional (feat/fix/docs/refactor), no force-push, atomic per task.

## 🔧 QUICK REFERENCE

```bash
# Test
npm test                              # all suites
npm test useBarcodeScanner           # single file
npm test -- --testNamePattern="OCR"  # by pattern

# Graphify (ALWAYS first for codebase questions)
python -m graphify query "topic"     # BFS search
python -m graphify query --dfs "A → B"  # path search
python -m graphify explain "topic" 
python -m graphify update .          # rescan (no API cost)

# Build
eas build --platform android         # dev
eas build --platform ios --build-type preview  # TestFlight

# Lint
npm run lint                          # ESLint + Prettier
```

## 📚 KEY MODULES (God nodes)

### LoggingService (124 edges)
- Memory buffer (1000 logs max), batch write to file
- DiagnosticPanel access via 5 taps on Settings → Version
- `clearLogs()` clears memory + file; `getRecentLogs()` retrieves buffer

### useTheme (116 edges)
- Dark mode context, color palette, scale font size
- Consumed by 116+ components; god node — changes affect most screens

### ProductStorage (32 edges)
- Supabase facade: CRUD, real-time subscriptions, query builder
- Returns ServiceResult\<T\>; all errors typed via ErrorCode

### OCR Pipeline (7 stages)
1. `prepareImageForOCR` — preprocess, normalize text
2. `recognizeText` (ML Kit) — extract text blocks
3. `parseExpirationDates` — regex patterns + scoring
4. `findRepresentativeMatch` — priority: standard > sequence > monthYear
5. Fallback: `ocr.space` Engine 2 (dot-matrix) if ML Kit returns 0 dates
6. `scoring.ts` — confidence + spatial anchoring
7. Result: DateMatch[] with 0-100 confidence

## 🚀 DEPLOYMENT
- EAS profiles: `preview`,`production`.
- OTA runtime: 1.0.3.1 (latest)
- OneSignal: app_id `0be59062-4413-49d5-b301-7038c3a0de1e`, mode=production
- Notifications: 9 AM cron (Supabase) → RPC `get_expiring_products` → Edge Function v23 → OneSignal batch

## 📖 DOCS
- `ARCHITECTURE.md` — layer model, data flow diagrams, pattern rationale
- `STATE.md` — milestone log, fix history, decisions + rationale
- `SESSIONS.md` — "why" behind key decisions, trade-offs explored
- `GRAPH_REPORT.md` — 5319 nodes, 517 communities, god nodes ranked by betweenness
- This file (`CLAUDE.md`) — executor quick ref

## 🔐 SECURITY NOTES
- `.env` removed from git; `.env.example` has placeholders
- Supabase anon key (public) safe; service role key server-side only (Edge Functions)
- OneSignal app_id public; API key server-side only
- Rate limiting: 5 req/IP per 15 min on auth endpoints
- Password: `clearCachedSession()` after change to invalidate JWT cache

## 🧪 TEST INFRASTRUCTURE
- Framework: Jest + React Native Testing Library
- Global mocks: `jest.setup.js` (SafeAreaView, Modal, expo modules, Analytics)
- Patterns: AAA (Arrange-Act-Assert), factory functions, deferred promise for async
- Coverage: 2220/2225 tests PASS, 5 preexisting skip (legacy)
- Failing: usePhotoNavigation (1 interface mismatch)
- **Mock hoisting gotcha**: `jest.mock(module, factory)` runs BEFORE any `const mockX = jest.fn()` declared later in the same file (Babel hoists imports above them). Declare `jest.fn()` inline inside the factory, then grab typed refs via `import * as X from 'module'; const mockFn = X.fn as jest.Mock` AFTER the mock — see `feedback.test.tsx` / `useCamera.test.ts` for the working pattern.

## 🐛 KNOWN ISSUES (LOW)
- expo-image migration deferred (only if product list >200 items)
- Italian/English standardization (owner decision pending)
- OCR edge case: "ENTRO 08 26" not covered by test (behavior preserved)
- jest.setup: mock expo-notifications kept as infra (virtual: true)


## LAST SYNC
- Updated: 2026-07-23 (errorHandler analysis + useBarcodeScanner cleanup)
- Graph: 5319 nodes, 517 communities (built from commit c335edb)
- Stale if: new commits without `python -m graphify update .`
