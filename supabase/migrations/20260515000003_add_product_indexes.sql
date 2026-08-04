-- Performance fix: aggiungere indici sulla tabella products per ottimizzare le query più frequenti
--
-- Problema: Le query su products (filtro per user_id, ordinamento per scadenza, ricerca prodotti scaduti)
-- eseguivano sequential scan su tabelle crescenti, causando latenza percepita dall'utente.
--
-- Soluzione: 3 indici mirati:
--   1. idx_products_user_id — ottimizza tutte le query filtrate per utente (caso più comune)
--   2. idx_products_user_status_expiration — indice composto per la query tipica: prodotti di un utente
--      ordinati per scadenza, con eventuale filtro per status
--   3. idx_products_status_expiration — indice parziale per ricerca prodotti scaduti (esclusi archived),
--      usato da moveProductsToHistory e dal sistema di notifiche
--
-- Questi indici riducono i sequential scan e migliorano le performance delle operazioni critiche
-- dell'app senza impatti significativi su scrittura (products non viene scritto ad alta frequenza).

-- Indice su user_id per query di filtro per utente
CREATE INDEX IF NOT EXISTS idx_products_user_id ON public.products(user_id);

-- Indice composto per query comuni: prodotti per utente ordinati per scadenza
CREATE INDEX IF NOT EXISTS idx_products_user_status_expiration 
  ON public.products(user_id, status, expiration_date);

-- Indice per ricerca prodotti scaduti (usata da moveProductsToHistory e notifiche)
CREATE INDEX IF NOT EXISTS idx_products_status_expiration 
  ON public.products(status, expiration_date) 
  WHERE status != 'archived';
