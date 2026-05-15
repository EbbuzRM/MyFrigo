# Azioni Manuali Richieste

> Data creazione: 2026-05-15
> Progetto: MyFrigo (tfhjupcybietwzmnpwfh)

---

## Fix Completati

### Critical (7/7) ✅
| # | Finding | Commit |
|---|---------|--------|
| 1 | RLS "Allow all" su products rimossa | migration applicata |
| 2 | SECURITY DEFINER revocati da anon | migration applicata |
| 3 | Secrets rimossi da eas.json | `e6383a8` |
| 4 | Edge Function auth aggiunta | commit separato |
| 5 | IDOR deleteProduct() fixato | `ee0528a` |
| 6 | IDOR moveProductsToHistory() fixato | `ee0528a` |
| 7 | .env.example creato + backup gitignore | `e6383a8` |

### High (9/9) ✅
| # | Finding | Commit |
|---|---------|--------|
| 1 | Session caching JWT expiration check | `53b679b` |
| 2 | Rate limiter memory leak fix | `e2a2298` |
| 3 | ProductContext deps array fix | `2363855` |
| 4 | OCR API key → proxy Edge Function | commit separato |
| 5 | Password policy rafforzata (8 char + requisiti) | commit separato |
| 6 | Email enumeration fixata | commit separato |
| 7 | Email logging rimosso | commit separato |
| 8 | XSS email sanitizzazione | `6fdfcab` |
| 9 | Indici products.user_id creati | migration applicata |

### Script di supporto creati
| Script | Scopo |
|--------|-------|
| `scripts/Rotate-SupabaseKeys.ps1` | Guida rotazione chiavi Supabase |
| `scripts/Setup-EASSecrets.ps1` | Configura EAS Secrets per tutti i profili |
| `scripts/Setup-EdgeFunctionSecrets.ps1` | Genera e configura secret Edge Function |

---

## Azioni Manuali Rimanenti

---

## 1. Ruotare le chiavi Supabase esposte

**Priorità**: 🔴 CRITICAL
**Motivo**: Le chiavi Supabase sono state esposte nel git history per mesi.

**Link dashboard**: https://supabase.com/dashboard/project/tfhjupcybietwzmnpwfh/settings/api

### Istruzioni
1. Vai al link sopra
2. Clicca **Regenerate** sulla chiave **anon/public**
3. Copia la nuova chiave
4. Aggiorna il file `.env` locale:
   ```
   EXPO_PUBLIC_SUPABASE_ANON_KEY=<nuova_chiave>
   ```
5. Aggiorna anche le EAS Secrets (vedi punto 2)

### Script di supporto
```powershell
powershell -ExecutionPolicy Bypass -File scripts\Rotate-SupabaseKeys.ps1
```

---

## 2. Configurare EAS Secrets (tutti i profili)

**Priorità**: 🔴 CRITICAL
**Motivo**: eas.json non deve contenere secrets reali. I profili `release-apk`, `production` e `preview` richiedono EAS Secrets.

### Variabili da configurare
| Nome Secret | Valore |
|------------|--------|
| `EXPO_PUBLIC_SUPABASE_URL` | URL del progetto Supabase |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Nuova chiave anon (dopo rotazione) |
| `EXPO_PUBLIC_ONESIGNAL_APP_ID` | OneSignal App ID |
| `EXPO_PUBLIC_OCR_SPACE_API_KEY` | OCR Space API Key |

### Script di configurazione
```powershell
powershell -ExecutionPolicy Bypass -File scripts\Setup-EASSecrets.ps1
```

Lo script chiederà le 4 chiavi reali e le configurerà per tutti e 3 i profili.

### Verifica
```bash
eas secret:list --scope project
```

---

## 3. Configurare Edge Function secrets

**Priorità**: 🔴 CRITICAL
**Motivo**: La Edge Function `send-expiration-notifications` ora richiede autenticazione. Servono 2 variabili d'ambiente.

### Variabili da configurare
| Nome | Descrizione |
|------|-------------|
| `FUNCTION_SECRET_KEY` | Secret per autenticazione Bearer token |
| `CRON_SECRET` | Secret per chiamate da Supabase cron job |

### Script di generazione e configurazione
```powershell
powershell -ExecutionPolicy Bypass -File scripts\Setup-EdgeFunctionSecrets.ps1
```

Lo script genera automaticamente i secret, li copia negli appunti e mostra le istruzioni.

### Link dashboard
https://supabase.com/dashboard/project/tfhjupcybietwzmnpwfh/functions

---

## 4. Pulire git history dalle chiavi esposte

**Priorità**: 🟠 HIGH
**Motivo**: Le chiavi sono nel git history e possono essere recuperate anche dopo la rotazione.

### Opzione A — BFG Repo-Cleaner (consigliato)
1. Installa BFG: https://rtyley.github.io/bfg-repo-cleaner/
2. Crea un file `passwords.txt` con le chiavi da rimuovere (una per riga)
3. Esegui:
   ```bash
   bfg --replace-text passwords.txt
   git reflog expire --expire=now --all
   git gc --prune=now --aggressive
   git push --force
   ```

### Opzione B — git filter-branch
```bash
git filter-branch --force --index-filter \
  'git rm --cached --ignore-unmatch .env' \
  --prune-empty --tag-name-filter cat -- --all
git reflog expire --expire=now --all
git gc --prune=now --aggressive
git push --force
```

⚠️ **Attenzione**: Il force push riscriverà la history per tutti i collaboratori.

---

## Checklist

- [ ] Chiavi Supabase ruotate dalla dashboard
- [ ] `.env` aggiornato con nuova anon key
- [ ] EAS Secrets configurate per tutti i profili
- [ ] Edge Function secrets configurati
- [ ] Git history pulito
- [ ] Force push completato
