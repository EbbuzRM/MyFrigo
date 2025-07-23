-- Rimuove eventuali policy vecchie per sicurezza
DROP POLICY IF EXISTS "Enable read access for all authenticated users" ON public.app_settings;
DROP POLICY IF EXISTS "Enable write access for all authenticated users" ON public.app_settings;

-- Abilita la Row Level Security, se non già attiva
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- Crea un'unica policy che permette a tutti gli utenti autenticati di fare TUTTO (SELECT, INSERT, UPDATE, DELETE)
CREATE POLICY "Allow full access for authenticated users"
ON public.app_settings
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

COMMENT ON POLICY "Allow full access for authenticated users" ON public.app_settings IS 'Allows authenticated users to read, create, and update the global app settings.';
