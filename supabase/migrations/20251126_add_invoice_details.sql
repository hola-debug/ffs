-- Migration: Add detailed invoice fields
-- Date: 2025-11-26
-- Description: Add vendor, date, subtotal, tax, and category fields to invoices table

-- Add new columns to invoices table
ALTER TABLE public.invoices
  ADD COLUMN IF NOT EXISTS vendor_name text,
  ADD COLUMN IF NOT EXISTS invoice_date date,
  ADD COLUMN IF NOT EXISTS subtotal numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS tax numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS category text,
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'saved' CHECK (status IN ('draft', 'saved', 'processed'));

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_invoices_vendor_name ON public.invoices(vendor_name);
CREATE INDEX IF NOT EXISTS idx_invoices_date ON public.invoices(invoice_date);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON public.invoices(status);

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Migration completed: Added detailed invoice fields';
END $$;
