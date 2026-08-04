-- Security fix: Drop overly permissive "Allow all" policy on products table.
-- The policy created in 20250706120004_setup_rls.sql allowed ALL authenticated
-- users to read/modify/delete ALL products regardless of ownership.
-- Proper user-scoped RLS policies should already exist from later migrations.
DROP POLICY IF EXISTS "Allow all access to products" ON public.products;
