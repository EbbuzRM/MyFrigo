-- Correct RLS policies for app_settings
-- Allow public read, authenticated insert/update

-- Drop existing policies
DROP POLICY IF EXISTS "Allow authenticated read" ON public.app_settings;
DROP POLICY IF EXISTS "Allow authenticated insert" ON public.app_settings;
DROP POLICY IF EXISTS "Allow authenticated update" ON public.app_settings;

-- Create correct policies
CREATE POLICY "Allow public read" ON public.app_settings
    FOR SELECT
    USING (true);

CREATE POLICY "Allow authenticated insert" ON public.app_settings
    FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Allow authenticated update" ON public.app_settings
    FOR UPDATE
    USING (auth.uid() IS NOT NULL)
    WITH CHECK (auth.uid() IS NOT NULL);

-- Ensure default row exists
INSERT INTO public.app_settings (id, notification_days, theme)
VALUES (1, 3, 'auto')
ON CONFLICT (id) DO NOTHING;