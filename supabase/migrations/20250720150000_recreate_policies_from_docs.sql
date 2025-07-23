-- Fase 1: Rimuove TUTTE le policy esistenti sulla tabella products per fare pulizia completa.
DROP POLICY IF EXISTS "Allow authenticated users to SELECT their own products" ON public.products;
DROP POLICY IF EXISTS "Allow authenticated users to INSERT for themselves" ON public.products;
DROP POLICY IF EXISTS "Allow authenticated users to UPDATE their own products" ON public.products;
DROP POLICY IF EXISTS "Allow authenticated users to DELETE their own products" ON public.products;
DROP POLICY IF EXISTS "Users can see their own products" ON public.products;
DROP POLICY IF EXISTS "Users can insert their own products" ON public.products;
DROP POLICY IF EXISTS "Users can update their own products" ON public.products;
DROP POLICY IF EXISTS "Users can delete their own products" ON public.products;


-- Fase 2: Ricrea tutte le policy da zero basandosi sulla documentazione ufficiale.

-- Policy SELECT: Permette agli utenti autenticati di vedere solo i propri prodotti.
CREATE POLICY "Allow SELECT for own products"
ON public.products
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Policy INSERT: Permette agli utenti autenticati di inserire prodotti solo per sé stessi.
CREATE POLICY "Allow INSERT for own products"
ON public.products
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Policy UPDATE: Permette agli utenti autenticati di aggiornare solo i propri prodotti.
-- Questa è la sintassi corretta che usa sia USING che WITH CHECK.
CREATE POLICY "Allow UPDATE for own products"
ON public.products
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policy DELETE: Permette agli utenti autenticati di eliminare solo i propri prodotti.
CREATE POLICY "Allow DELETE for own products"
ON public.products
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);
