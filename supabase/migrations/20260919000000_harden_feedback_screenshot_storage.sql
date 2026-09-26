-- Feedback screenshots are uploaded only by the service-role Edge Function.
-- Keep the bucket private and reject oversized or unexpected file types at
-- the Storage boundary as a second layer behind function validation.
INSERT INTO storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
VALUES (
  'feedback-screenshots',
  'feedback-screenshots',
  false,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE
SET public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Allow anyone to upload to feedback-screenshots" ON storage.objects;
DROP POLICY IF EXISTS "Allow anyone to read feedback-screenshots" ON storage.objects;
DROP POLICY IF EXISTS "Allow read access to feedback-screenshots" ON storage.objects;

-- Historical/local naming variants are dropped defensively. No direct client
-- policy is recreated: the service-role client bypasses Storage RLS.
DROP POLICY IF EXISTS "Authenticated users can upload feedback screenshots" ON storage.objects;
DROP POLICY IF EXISTS "Public can read feedback screenshots" ON storage.objects;
