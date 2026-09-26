# Email di autenticazione MyFrigo

Il file `baseline.json` contiene gli oggetti e i corpi acquisiti in sola lettura il 23 settembre 2026 dalla configurazione Auth del progetto Supabase `tfhjupcybietwzmnpwfh`. I file HTML e `subjects.json` sono la proposta bilingue italiano/inglese britannico. **Non sono ancora applicati al progetto remoto.**

La configurazione rilevata aveva email attiva, conferma account obbligatoria, cambio email sicuro attivo, notifica di cambio password attiva, OTP di 6 cifre e validità di 600 secondi. Il reinvio della conferma usa lo stesso template `confirmation`. Sono inclusi anche link magico, invito, cambio email e riautenticazione, se invocati da Supabase Auth.

## Applicazione

1. Prima di applicare, rileggere **Authentication → Email Templates** nel progetto Supabase e confrontare oggetti, corpi e durata OTP con `baseline.json`. Se sono cambiati, integrare le modifiche recenti prima di sostituire i template.
2. Per ciascuno dei sette flussi in `subjects.json`, copiare l’oggetto corrispondente e il contenuto del file HTML omonimo nella sezione del template Supabase. Non modificare le variabili `{{ .Token }}`, `{{ .ConfirmationURL }}`, `{{ .Email }}` e `{{ .NewEmail }}`. Salvare un template per volta.
3. Verificare con account di prova conferma iniziale e reinvio, recupero password, cambio email e notifica di cambio password. Per i flussi opzionali, inviare un’email di prova se sono abilitati. Ogni email con OTP o link deve mostrare **un solo** codice o collegamento funzionante. Controllare sia la resa italiana sia quella inglese e il comportamento del codice dopo 10 minuti.

Il controllo statico `npx jest --runInBand supabase/email-templates/__tests__/templates.test.ts` verifica chiavi e cardinalità dei codici/link. Non sostituisce l’invio reale né verifica il rendering nei client email.
