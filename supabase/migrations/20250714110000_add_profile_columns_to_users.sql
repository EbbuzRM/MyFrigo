-- Add columns for first name, last name, and updated_at to the existing users table
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS first_name TEXT,
ADD COLUMN IF NOT EXISTS last_name TEXT,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ;

-- Enable Row Level Security on the users table
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to ensure a clean slate
DROP POLICY IF EXISTS "Allow users to view their own data" ON public.users;
DROP POLICY IF EXISTS "Allow users to update their own data" ON public.users;
DROP POLICY IF EXISTS "Allow all access to users" ON public.users; -- Sicurezza aggiuntiva

-- Create a simple, explicit policy for SELECT
CREATE POLICY "Allow users to view their own data"
ON public.users
FOR SELECT
USING (auth.uid() = id);

-- Create a simple, explicit policy for UPDATE
CREATE POLICY "Allow users to update their own data"
ON public.users
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Temporarily remove the trigger and function to isolate the problem
DROP TRIGGER IF EXISTS on_user_update ON public.users;
DROP FUNCTION IF EXISTS public.handle_user_update();
