-- 1. Add user_id and is_default columns to the categories table
ALTER TABLE public.categories
ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
ADD COLUMN is_default BOOLEAN DEFAULT FALSE;

-- Mark existing categories as default
UPDATE public.categories SET is_default = TRUE;


-- 2. Drop the old, insecure policy
DROP POLICY IF EXISTS "Allow authenticated users to read categories" ON public.categories;


-- 3. Create new, secure RLS policies for categories
CREATE POLICY "Enable read access for own and default categories"
ON public.categories
FOR SELECT USING (auth.uid() = user_id OR is_default = TRUE);

CREATE POLICY "Enable insert for authenticated users"
ON public.categories
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Enable update for owner"
ON public.categories
FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id AND is_default = FALSE);

CREATE POLICY "Enable delete for owner"
ON public.categories
FOR DELETE USING (auth.uid() = user_id AND is_default = FALSE);