-- Rimuove TUTTE le policy esistenti sulla tabella app_settings per fare pulizia completa.
DROP POLICY IF EXISTS "Enable read access for all authenticated users" ON public.app_settings;
DROP POLICY IF EXISTS "Enable write access for all authenticated users" ON public.app_settings;
DROP POLICY IF EXISTS "Allow full access for authenticated users" ON public.app_settings;

-- Abilita la Row Level Security, se non già attiva
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- Crea un'unica, corretta policy che permette agli utenti autenticati di fare TUTTO.
CREATE POLICY "Allow full access for authenticated users"
ON public.app_settings
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

COMMENT ON POLICY "Allow full access for authenticated users" ON public.app_settings IS 'Allows authenticated users full access to the global app settings.';
