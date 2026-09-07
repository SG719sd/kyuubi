-- ==============================================================================
-- KYUUBI ENGINE - CONFIGURAZIONE SUPABASE STORAGE & RLS PER 'hubs_media'
-- ==============================================================================
-- Questo script crea il bucket pubblico 'hubs_media' e definisce le policy RLS
-- necessarie affinché le immagini possano essere visualizzate e caricate.
-- ==============================================================================

-- 1. CREAZIONE DEL BUCKET 'hubs_media' (Se non esiste già)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'hubs_media',
  'hubs_media',
  true,
  10485760, -- 10MB massimo
  ARRAY['image/webp', 'image/png', 'image/jpeg', 'image/svg+xml', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['image/webp', 'image/png', 'image/jpeg', 'image/svg+xml', 'image/gif'];

-- 2. ABILITAZIONE ROW LEVEL SECURITY SULLA TABELLA DEGLI OGGETTI STORAGE
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 3. CANCELLAZIONE DI EVENTUALI POLICY PRECEDENTI CON LO STESSO NOME
DROP POLICY IF EXISTS "Lettura pubblica hubs_media" ON storage.objects;
DROP POLICY IF EXISTS "Upload utenti autenticati hubs_media" ON storage.objects;
DROP POLICY IF EXISTS "Aggiornamento utenti autenticati hubs_media" ON storage.objects;
DROP POLICY IF EXISTS "Eliminazione utenti autenticati hubs_media" ON storage.objects;

-- 4. POLICY DI LETTURA PUBBLICA (Tutti possono visualizzare le immagini)
CREATE POLICY "Lettura pubblica hubs_media"
ON storage.objects FOR SELECT
USING (bucket_id = 'hubs_media');

-- 5. POLICY DI CARICAMENTO (INSERT) PER UTENTI AUTENTICATI
CREATE POLICY "Upload utenti autenticati hubs_media"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'hubs_media');

-- 6. POLICY DI AGGIORNAMENTO (UPDATE) PER UTENTI AUTENTICATI
CREATE POLICY "Aggiornamento utenti autenticati hubs_media"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'hubs_media');

-- 7. POLICY DI ELIMINAZIONE (DELETE) PER UTENTI AUTENTICATI
CREATE POLICY "Eliminazione utenti autenticati hubs_media"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'hubs_media');
