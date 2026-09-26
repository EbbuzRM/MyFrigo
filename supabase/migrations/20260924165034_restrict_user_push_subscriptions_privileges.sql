-- RLS does not protect TRUNCATE. Supabase's default table grants give anon and
-- authenticated broad privileges, so restrict this new table explicitly.
REVOKE ALL PRIVILEGES ON TABLE public.user_push_subscriptions FROM anon;
REVOKE TRUNCATE, REFERENCES, TRIGGER ON TABLE public.user_push_subscriptions FROM authenticated;
