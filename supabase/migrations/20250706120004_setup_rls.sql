
-- Enable Row Level Security for all tables
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.barcode_templates ENABLE ROW LEVEL SECURITY;

-- Create basic policies to allow all access (for now)
-- This should be updated with specific user-based policies later

CREATE POLICY "Allow all access to products" ON public.products
    FOR ALL USING (true) WITH CHECK (true);

-- Drop the overly permissive policy on the users table
DROP POLICY IF EXISTS "Allow all access to users" ON public.users;

-- Allow users to read their own profile
CREATE POLICY "Allow individual user read access"
ON public.users
FOR SELECT
USING (auth.uid() = id);

-- Allow new users to create their own profile
CREATE POLICY "Allow new user creation"
ON public.users
FOR INSERT
WITH CHECK (auth.uid() = id);

CREATE POLICY "Allow all access to app_settings" ON public.app_settings
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all access to barcode_templates" ON public.barcode_templates
    FOR ALL USING (true) WITH CHECK (true);
