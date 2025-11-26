-- ============================================
-- APLICAR ESTA MIGRACIÓN EN SUPABASE
-- ============================================
-- 1. Ve a https://supabase.com/dashboard
-- 2. Selecciona tu proyecto
-- 3. Ve a "SQL Editor" en el menú lateral
-- 4. Haz clic en "New Query"
-- 5. Copia TODO el contenido de este archivo
-- 6. Pégalo en el editor
-- 7. Haz clic en "Run"
-- ============================================

-- Migration: Fix storage policies for invoice uploads
-- Date: 2025-11-26
-- Description: Add UPDATE and DELETE policies for storage to allow upsert

BEGIN;

-- Add UPDATE policy for storage (needed for upsert)
DROP POLICY IF EXISTS "Users can update their own invoices" ON storage.objects;
CREATE POLICY "Users can update their own invoices"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'invoices' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Add DELETE policy for storage (useful for cleanup)
DROP POLICY IF EXISTS "Users can delete their own invoices" ON storage.objects;
CREATE POLICY "Users can delete their own invoices"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'invoices' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

COMMIT;

-- Verify policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies 
WHERE tablename = 'objects' 
  AND schemaname = 'storage'
ORDER BY policyname;
