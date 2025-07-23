-- Pulisce TUTTE le policy esistenti per sicurezza
DROP POLICY IF EXISTS "Enable read access for all authenticated users" ON public.app_settings;
DROP POLICY IF EXISTS "Enable write access for all authenticated users" ON public.app_settings;
DROP POLICY IF EXISTS "Allow full access for authenticated users" ON public.app_settings;

-- Abilita RLS se non è già attiva
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- Crea l'UNICA policy necessaria
CREATE POLICY "Allow full access to authenticated users"
ON public.app_settings
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);
