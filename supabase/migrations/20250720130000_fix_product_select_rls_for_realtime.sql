-- 1. Rimuove la vecchia policy SELECT che non è ottimale per Realtime
DROP POLICY IF EXISTS "Users can see their own products" ON public.products;

-- 2. Ricrea la policy SELECT specificando il ruolo 'authenticated'
-- Questa sintassi è richiesta dal server Supabase Realtime per funzionare correttamente.
CREATE POLICY "Users can see their own products"
ON public.products
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

COMMENT ON POLICY "Users can see their own products" ON public.products IS 'Users can only see their own products.';
