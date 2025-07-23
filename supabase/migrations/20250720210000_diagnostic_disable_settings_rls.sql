-- ATTENZIONE: Questo è un file di migrazione per scopi di diagnostica.
-- Disabilita temporaneamente la Row Level Security sulla tabella delle impostazioni
-- per verificare se le policy sono la causa del blocco dell'app.

ALTER TABLE public.app_settings DISABLE ROW LEVEL SECURITY;
