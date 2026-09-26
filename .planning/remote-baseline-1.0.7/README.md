# MyFrigo 1.0.7 — baseline remota prima del rollout

Rilevata il 24 settembre 2026 sul progetto Supabase `tfhjupcybietwzmnpwfh`, prima di migration, deploy e aggiornamento email.

- `public.user_push_subscriptions` assente prima del rollout. La migration locale originaria è stata applicata come versione remota `20260924164816`, seguita dalla correzione dei privilegi `20260924165034`; i file locali sono allineati a queste versioni.
- `public.user_devices`: 3 righe, RLS attiva con policy per proprietario su SELECT, INSERT, UPDATE e DELETE.
- `public.user_notification_settings`: 6 righe, RLS attiva con policy per proprietario su SELECT, INSERT e UPDATE.
- `send-expiration-notifications`: versione 26, attiva, SHA EAS/Supabase `c8bf25d2a8c3e4e9022d4a35f1a0ad16c75da7b7ce61412489b7dfb9335a55e9`, `verify_jwt=false` con autenticazione applicativa tramite `FUNCTION_SECRET_KEY` o `CRON_SECRET`. Il sorgente recuperato dal remoto è in `send-expiration-notifications.v26.ts`.
- Cron `send-expiration-notifications`: attivo, `0 9 * * *`, hash MD5 del comando `251fff804cebdec6e742458b4d005172`. I segreti richiesti risultano presenti; i valori non sono stati letti né salvati.
- Auth: email abilitata, signup consentito, conferma email richiesta, cambio email sicuro, notifica cambio password abilitata, OTP di 6 cifre e durata 600 secondi.
- Oggetti e corpi remoti dei sette template sono salvati in `auth-email-current.json` insieme alle impostazioni Auth essenziali. Rispetto a `supabase/email-templates/baseline.json`, sei template sono identici; `recovery` differisce soltanto nella codifica del carattere `à` in “scadrà” nello snapshot precedente. Il remoto corrente usa il carattere corretto.

Per ripristinare la funzione, usare questo sorgente con `verify_jwt=false`, controllando prima che le variabili d'ambiente e il cron siano ancora configurati. Per ripristinare le email, applicare oggetto e corpo di ciascun flusso da `auth-email-current.json`. Nessun valore di segreto è incluso in questa cartella.
