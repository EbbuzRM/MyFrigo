-- 1. Rimuove la vecchia policy di UPDATE che causa problemi con l'upsert
DROP POLICY IF EXISTS "Users can update their own products" ON public.products;

-- 2. Ricrea la policy di UPDATE in modo corretto, senza la clausola USING
-- La clausola WITH CHECK è sufficiente a garantire che un utente possa modificare solo i propri prodotti.
CREATE POLICY "Users can update their own products"
ON public.products
FOR UPDATE
TO authenticated
WITH CHECK (auth.uid() = user_id);

COMMENT ON POLICY "Users can update their own products" ON public.products IS 'Users can only update their own products.';
