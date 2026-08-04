-- Ensure app_settings table has at least one default row
INSERT INTO public.app_settings (id, notification_days, theme)
VALUES (1, 3, 'auto')
ON CONFLICT (id) DO NOTHING;
