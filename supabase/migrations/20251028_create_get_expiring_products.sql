-- Migration: create_get_expiring_products
-- Synced with remote: 2026-08-04
-- Adds days_remaining column, 1-day reminder branch, SELECT DISTINCT

CREATE OR REPLACE FUNCTION public.get_expiring_products()
 RETURNS TABLE(
   user_id uuid,
   product_id text,
   product_name text,
   notification_type text,
   notification_days integer,
   expiration_date date,
   days_remaining integer
 )
 LANGUAGE plpgsql
 SET search_path TO 'public', 'auth'
AS $function$
BEGIN
  RETURN QUERY
  WITH user_settings AS (
    SELECT uns.user_id, uns.notification_days
    FROM public.user_notification_settings uns
    WHERE uns.notifications_enabled = true
  ),
  candidates AS (
    -- Ramo 1: scaduto oggi
    SELECT us.user_id, p.id::TEXT AS product_id, p.name AS product_name,
           'expired'::TEXT AS notification_type, us.notification_days, p.expiration_date,
           0 AS days_remaining
    FROM user_settings us
    JOIN public.products p ON us.user_id = p.user_id
    WHERE p.expiration_date = CURRENT_DATE AND p.status = 'active'

    UNION ALL

    -- Ramo 2: pre-avviso a N giorni (notification_days)
    SELECT us.user_id, p.id::TEXT, p.name,
           'pre_warning'::TEXT, us.notification_days, p.expiration_date,
           (p.expiration_date - CURRENT_DATE)::INT AS days_remaining
    FROM user_settings us
    JOIN public.products p ON us.user_id = p.user_id
    WHERE us.notification_days > 0
      AND p.expiration_date = (CURRENT_DATE + (us.notification_days || ' days')::INTERVAL)::DATE
      AND p.status = 'active'

    UNION ALL

    -- Ramo 3: promemoria a 1 giorno
    SELECT us.user_id, p.id::TEXT, p.name,
           'pre_warning'::TEXT, us.notification_days, p.expiration_date,
           1 AS days_remaining
    FROM user_settings us
    JOIN public.products p ON us.user_id = p.user_id
    WHERE p.expiration_date = (CURRENT_DATE + INTERVAL '1 day')::DATE
      AND p.status = 'active'
  )
  SELECT DISTINCT
         candidates.user_id, candidates.product_id, candidates.product_name,
         candidates.notification_type, candidates.notification_days,
         candidates.expiration_date, candidates.days_remaining
  FROM candidates;
END;
$function$;
