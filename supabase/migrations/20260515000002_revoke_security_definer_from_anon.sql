-- Security fix: Revoke EXECUTE on SECURITY DEFINER functions from anon role.
-- These functions should only be callable by authenticated users or internally
-- by the database, not by unauthenticated (anon) callers.
--
-- check_email_exists(text) — prevents email enumeration attacks
-- handle_new_user() — prevents creation of ghost users via direct calls
-- update_updated_at_column() — trigger function, should never be called directly

REVOKE EXECUTE ON FUNCTION public.check_email_exists(text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM anon;
