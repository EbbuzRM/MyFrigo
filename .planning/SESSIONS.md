## 2026-05-21 — Code Review Completa + Fix Critical/High/Medium/Low + Rotazione Chiavi

### Contesto
L'utente ha richiesto una code review completa del progetto MyFrigo (Expo/React Native + Supabase). La review è stata eseguita in parallelo da gsd-code-reviewer e gsd-security-auditor.

### Decisioni Chiave

**1. Priorità ai Critical prima di tutto**
- RLS policy "Allow all" su products era la vulnerabilità più grave → migration applicata immediatamente
- SECURITY DEFINER functions eseguibili da anon → revoca EXECUTE
- Secrets hardcoded in eas.json → rimossi, sostituiti con placeholder
- Edge Function senza auth → aggiunta auth Bearer token + cron secret
- IDOR in deleteProduct/moveProductsToHistory → aggiunto filtro user_id

**2. Rotazione chiavi Supabase**
- Le vecchie anon/service_role keys erano deprecate → l'utente ha generato nuove publishable/secret keys
- EAS Secrets configurati per tutti i profili (release-apk, production, preview)
- Edge Function aggiornata per usare SUPABASE_SECRET_KEYS (built-in automatico) invece di SERVICE_ROLE_KEY manuale
- Git history pulita con git-filter-repo + force push

**3. Password validation incoerente**
- Il validatore richiedeva 8 caratteri ma la UI ne mostrava 6 → allineata tutta la UI a 8
- isNotCommon era nel validatore ma non nella UI → aggiunto a tutti i componenti
- Messaggi errore in inglese e raw Supabase → creati mapSupabaseError + messaggi in italiano

**4. Warning e Performance**
- `_photo-capture.styles.ts` in cartella `app/` interpretato come route → spostato in `styles/`
- CategoryMatcher chiamato 4x per carattere → rimosso useEffect morto + aggiunto debounce 500ms

**5. Errori TypeScript**
- 29 errori in 5 file di test → tutti risolti
- 2 file di test duplicati/placeholder rimossi

### Risultato
- 0 errori TypeScript
- App funzionante con nuove chiavi Supabase
- Tutti i warning dai log risolti
- Git history pulita dalle chiavi esposte

### Commit della sessione
- `ee0528a` — fix IDOR ProductStorage
- `e6383a8` — secrets rimossi da eas.json + .env.example
- `53b679b` — fix JWT expiration check
- `e2a2298` — fix rate limiter memory leak
- `2363855` — fix ProductContext deps
- `6fdfcab` — fix XSS email
- `7ee1d77` — remove jest.fn() from production
- `0a8ded4` — OneSignal fallback rimosso + allowBackup false
- `9142c0a` — ErrorBoundary retry button + errorInfo sanitizzato
- `5d22e2e` — console.log production wrappati
- `bf14258` — MANUAL_ACTIONS.md aggiornato
- `02b1836` — move photo-capture styles out of app/
- `f6803e1` — remove duplicate category guess useEffect + debounce
- `a516fe1` — fix usePhotoOCR.test.tsx imports
- `145c048` — fix AuthLogger.test.ts (16 errori)
- `b6e5029` — fix caseConverter.test.ts
- `0db807f` — fix NetworkErrorHandler.test.ts
- `6398b36` — fix ocrKeywords.test.ts
- `0f8128f` — remove duplicate test files
- `3e0a534` — rotate Supabase keys to new publishable/secret format
- `7b478d8` — use built-in SUPABASE_SECRET_KEYS in edge function
- `ea42214` — remove backup files from git tracking
- `e8c20d1` — add preview profile to eas.json
- `4f827f0` — add scripts for key rotation, EAS secrets, edge function secrets
- Force push: `e9b984b` → `0f8128f` (git history riscritta)
