-- Migration: Supabase Security Hardening & Performance Optimization
-- Created: 2026-03-24
-- Description: Adattamento alle nuove direttive di sicurezza Supabase (OpenAPI spec) e ottimizzazione indici.

-- 1. Performance: Aggiunta indice su expiration_date per la tabella products
-- Ottimizza le query del tipo: SELECT * FROM products WHERE expiration_date > now()
CREATE INDEX IF NOT EXISTS idx_products_expiration ON public.products(expiration_date);

-- 2. Sicurezza: Rafforzamento RLS per barcode_templates
-- Sostituiamo le policy 'Authenticated' generiche con politiche che proteggono l'integrità dei dati
-- Manteniamo la lettura pubblica poiché i barcode sono dati di consultazione comuni

-- Rimuoviamo le policy esistenti
DROP POLICY IF EXISTS "Authenticated insert" ON public.barcode_templates;
DROP POLICY IF EXISTS "Authenticated update" ON public.barcode_templates;
DROP POLICY IF EXISTS "Authenticated delete" ON public.barcode_templates;

-- Creiamo politiche più restrittive
-- Solo il service_role (admin) o un utente con privilegi speciali può modificare i template globali
-- Nota: Se l'app avesse una sezione Admin, useremmo una tabella di ruoli, ma per ora limitiamo al service_role
-- per le operazioni di scrittura se non sono strettamente necessarie agli utenti finali.

CREATE POLICY "Admin manage barcode templates"
ON public.barcode_templates
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- 3. Ottimizzazione RLS per app_settings (sebbene globale, usiamo subquery per coerenza)
DROP POLICY IF EXISTS "Allow authenticated insert" ON public.app_settings;
DROP POLICY IF EXISTS "Allow authenticated update" ON public.app_settings;

CREATE POLICY "Allow authenticated insert"
ON public.app_settings
FOR INSERT
TO authenticated
WITH CHECK ((SELECT auth.role()) = 'authenticated');

CREATE POLICY "Allow authenticated update"
ON public.app_settings
FOR UPDATE
TO authenticated
USING ((SELECT auth.role()) = 'authenticated')
WITH CHECK ((SELECT auth.role()) = 'authenticated');

COMMIT;
