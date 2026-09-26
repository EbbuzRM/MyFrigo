-- Trigger functions are invoked by PostgreSQL triggers, never through the API.
-- Remove direct execution inherited through PUBLIC and explicit API roles.
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;

-- Evaluate auth.uid() once per statement instead of once per row and expose
-- these policies only to authenticated callers.
DROP POLICY IF EXISTS "Users can read own notification settings" ON public.user_notification_settings;
CREATE POLICY "Users can read own notification settings"
ON public.user_notification_settings
FOR SELECT
TO authenticated
USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert own notification settings" ON public.user_notification_settings;
CREATE POLICY "Users can insert own notification settings"
ON public.user_notification_settings
FOR INSERT
TO authenticated
WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update own notification settings" ON public.user_notification_settings;
CREATE POLICY "Users can update own notification settings"
ON public.user_notification_settings
FOR UPDATE
TO authenticated
USING ((SELECT auth.uid()) = user_id)
WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can view their own devices" ON public.user_devices;
CREATE POLICY "Users can view their own devices"
ON public.user_devices
FOR SELECT
TO authenticated
USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert their own devices" ON public.user_devices;
CREATE POLICY "Users can insert their own devices"
ON public.user_devices
FOR INSERT
TO authenticated
WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update their own devices" ON public.user_devices;
CREATE POLICY "Users can update their own devices"
ON public.user_devices
FOR UPDATE
TO authenticated
USING ((SELECT auth.uid()) = user_id)
WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete their own devices" ON public.user_devices;
CREATE POLICY "Users can delete their own devices"
ON public.user_devices
FOR DELETE
TO authenticated
USING ((SELECT auth.uid()) = user_id);

-- Public read access already covers authenticated users. Split the previous
-- ALL policy into write-only policies to avoid evaluating two SELECT policies.
DROP POLICY IF EXISTS "Authenticated users manage barcode_templates" ON public.barcode_templates;

CREATE POLICY "Authenticated users insert barcode_templates"
ON public.barcode_templates
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users update barcode_templates"
ON public.barcode_templates
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Authenticated users delete barcode_templates"
ON public.barcode_templates
FOR DELETE
TO authenticated
USING (true);
