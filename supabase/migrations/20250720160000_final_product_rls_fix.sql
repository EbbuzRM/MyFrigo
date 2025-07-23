-- Fase 1: Rimuove TUTTE le policy esistenti per una pulizia completa.
DROP POLICY IF EXISTS "Allow SELECT for own products" ON public.products;
DROP POLICY IF EXISTS "Allow INSERT for own products" ON public.products;
DROP POLICY IF EXISTS "Allow UPDATE for own products" ON public.products;
DROP POLICY IF EXISTS "Allow DELETE for own products" ON public.products;

-- Fase 2: Ricrea le policy usando la sintassi UFFICIALE e corretta.

CREATE POLICY "Enable SELECT for authenticated users only"
ON public.products
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Enable INSERT for authenticated users only"
ON public.products
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Enable UPDATE for authenticated users only"
ON public.products
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Enable DELETE for authenticated users only"
ON public.products
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);
