-- ============================================
-- INSTRUCCIONES PARA APLICAR ESTA MIGRACIÓN
-- ============================================
-- 1. Ve a https://supabase.com/dashboard
-- 2. Selecciona tu proyecto
-- 3. Ve a "SQL Editor" en el menú lateral
-- 4. Haz clic en "New Query"
-- 5. Copia TODO el contenido de este archivo
-- 6. Pégalo en el editor
-- 7. Haz clic en "Run" (o presiona Ctrl+Enter)
-- ============================================

-- Migration: Add detailed invoice fields
-- Date: 2025-11-26
-- Description: Add vendor, date, subtotal, tax, and category fields to invoices table

BEGIN;

-- Add new columns to invoices table
ALTER TABLE public.invoices
  ADD COLUMN IF NOT EXISTS vendor_name text,
  ADD COLUMN IF NOT EXISTS invoice_date date,
  ADD COLUMN IF NOT EXISTS subtotal numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS tax numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS category text,
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'saved' CHECK (status IN ('draft', 'saved', 'processed'));

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_invoices_vendor_name ON public.invoices(vendor_name);
CREATE INDEX IF NOT EXISTS idx_invoices_date ON public.invoices(invoice_date);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON public.invoices(status);

COMMIT;

-- Verify the migration
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'invoices' 
  AND table_schema = 'public'
ORDER BY ordinal_position;
