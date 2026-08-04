INSERT INTO public.categories (id, name, icon, is_default, user_id)
VALUES ('salumi', 'Salumi', '🥓', true, NULL)
ON CONFLICT (id) DO NOTHING;
