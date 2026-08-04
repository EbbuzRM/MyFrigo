
-- Drop the existing function if it exists
DROP FUNCTION IF EXISTS public.check_email_exists(TEXT);

-- Recreate the function with the correct security context and search_path to satisfy the Supabase SQL Advisor
CREATE OR REPLACE FUNCTION public.check_email_exists(email_to_check TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public -- Set a safe, minimal search path to satisfy the advisor
AS $$
BEGIN
  -- Explicitly qualify the table name to avoid any ambiguity
  RETURN EXISTS (
    SELECT 1
    FROM auth.users
    WHERE email = email_to_check
  );
END;
$$;

-- Grant execute permission to anon and authenticated roles
GRANT EXECUTE ON FUNCTION public.check_email_exists(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.check_email_exists(TEXT) TO authenticated;
