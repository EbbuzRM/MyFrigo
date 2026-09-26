-- Remove the public email-existence oracle. Supabase Auth already prevents
-- duplicate email identities and deliberately obfuscates duplicate signups.
DROP FUNCTION IF EXISTS public.check_email_exists(text);
