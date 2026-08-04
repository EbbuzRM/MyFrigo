-- Creazione dello storage bucket per gli screenshot dei feedback
INSERT INTO storage.buckets (id, name, public) 
VALUES ('feedback-screenshots', 'feedback-screenshots', true)
ON CONFLICT (id) DO NOTHING;

-- Policy per lo storage: permette a chiunque di caricare file
-- Questo è permissivo, ma semplice per questo caso d'uso. 
-- In un'app di produzione con dati sensibili, si dovrebbe restringere agli utenti autenticati.
CREATE POLICY "Allow anyone to upload to feedback-screenshots" 
ON storage.objects FOR INSERT 
TO authenticated, anon
WITH CHECK ( bucket_id = 'feedback-screenshots' );

CREATE POLICY "Allow anyone to read feedback-screenshots" 
ON storage.objects FOR SELECT
TO authenticated, anon
USING ( bucket_id = 'feedback-screenshots' );
