-- Fase 1: Rimuove TUTTE le policy esistenti per una pulizia completa.
DROP POLICY IF EXISTS "Enable read access for all authenticated users" ON public.app_settings;
DROP POLICY IF EXISTS "Enable write access for all authenticated users" ON public.app_settings;
DROP POLICY IF EXISTS "Allow full access for authenticated users" ON public.app_settings;
DROP POLICY IF EXISTS "Allow full access to authenticated users" ON public.app_settings;

-- Fase 2: Abilita RLS se non è già attiva
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- Fase 3: Crea l'unica policy corretta e robusta basata sulla documentazione
CREATE POLICY "Allow authenticated users full access to settings"
ON public.app_settings
FOR ALL
TO authenticated
USING ( auth.role() = 'authenticated' )
WITH CHECK ( auth.role() = 'authenticated' );

COMMENT ON POLICY "Allow authenticated users full access to settings" ON public.app_settings IS 'Allows any authenticated user to read, create, or update the global app settings.';
