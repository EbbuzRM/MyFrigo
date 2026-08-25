-- Restore authenticated users access to barcode_templates
-- Barcode templates are public shared data (barcode → product mapping)
-- All authenticated users can read/write templates

DROP POLICY IF EXISTS "Admin manage barcode templates" ON public.barcode_templates;

CREATE POLICY "Authenticated users manage barcode templates"
ON public.barcode_templates
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);
