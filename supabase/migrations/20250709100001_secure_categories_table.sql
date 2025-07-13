ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated users to read categories" ON public.categories FOR SELECT TO authenticated USING (true);
