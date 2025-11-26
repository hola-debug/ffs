-- Migration: Transform restaurant-specific system to generic invoice system
-- Date: 2025-11-26
-- Description: Rename tables, add company types, implement stock control, and AI matching

-- 1. Rename restaurants to companies
ALTER TABLE IF EXISTS public.restaurants RENAME TO companies;

-- 2. Add company_type column
DO $$ BEGIN
  CREATE TYPE company_type AS ENUM ('restaurant', 'warehouse', 'transport', 'retail', 'services', 'other');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

ALTER TABLE public.companies 
  ADD COLUMN IF NOT EXISTS company_type company_type DEFAULT 'restaurant';

-- 3. Rename inventories to invoice_items and add stock control fields
-- 3. Rename inventories to invoice_items and add stock control fields
ALTER TABLE IF EXISTS public.inventories RENAME TO invoice_items;

-- Handle renames safely using DO blocks FIRST
-- Handle renames safely using DO blocks FIRST
DO $$ 
BEGIN
  -- Rename quantity to current_stock if quantity exists AND current_stock does NOT exist
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoice_items' AND column_name = 'quantity') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoice_items' AND column_name = 'current_stock') THEN
        ALTER TABLE public.invoice_items RENAME COLUMN quantity TO current_stock;
    END IF;
  END IF;

  -- Rename restaurant_id to company_id if restaurant_id exists AND company_id does NOT exist
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoice_items' AND column_name = 'restaurant_id') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoice_items' AND column_name = 'company_id') THEN
        ALTER TABLE public.invoice_items RENAME COLUMN restaurant_id TO company_id;
    END IF;
  END IF;
END $$;

-- Add new columns for stock control (will be skipped if they exist, e.g. from rename)
ALTER TABLE public.invoice_items
  ADD COLUMN IF NOT EXISTS current_stock numeric DEFAULT 0 NOT NULL,
  ADD COLUMN IF NOT EXISTS stock_consumed numeric DEFAULT 0 NOT NULL,
  ADD COLUMN IF NOT EXISTS stock_status text DEFAULT 'available' CHECK (stock_status IN ('available', 'low', 'depleted')),
  ADD COLUMN IF NOT EXISTS unit_type text DEFAULT 'units',
  ADD COLUMN IF NOT EXISTS last_updated timestamp with time zone DEFAULT timezone('utc'::text, now());

-- Update existing constraints
ALTER TABLE public.invoice_items 
  DROP CONSTRAINT IF EXISTS inventories_restaurant_id_fkey;

ALTER TABLE public.invoice_items
  DROP CONSTRAINT IF EXISTS invoice_items_company_id_fkey;

ALTER TABLE public.invoice_items
  ADD CONSTRAINT invoice_items_company_id_fkey 
  FOREIGN KEY (company_id) 
  REFERENCES public.companies(id) 
  ON DELETE CASCADE;

-- 4. Update invoices table foreign key
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'restaurant_id') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'company_id') THEN
        ALTER TABLE public.invoices RENAME COLUMN restaurant_id TO company_id;
    END IF;
  END IF;
END $$;

ALTER TABLE public.invoices 
  DROP CONSTRAINT IF EXISTS invoices_restaurant_id_fkey;

ALTER TABLE public.invoices
  DROP CONSTRAINT IF EXISTS invoices_company_id_fkey;

ALTER TABLE public.invoices
  ADD CONSTRAINT invoices_company_id_fkey 
  FOREIGN KEY (company_id) 
  REFERENCES public.companies(id) 
  ON DELETE CASCADE;

-- 5. Create invoice_item_matches table for AI matching tracking
CREATE TABLE IF NOT EXISTS public.invoice_item_matches (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_item_id uuid NOT NULL,
  matched_existing_item_id uuid NOT NULL,
  confidence_score numeric DEFAULT 0 CHECK (confidence_score >= 0 AND confidence_score <= 1),
  match_method text DEFAULT 'manual' CHECK (match_method IN ('ai', 'manual')),
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  CONSTRAINT fk_invoice_item FOREIGN KEY (invoice_item_id) REFERENCES public.invoice_items(id) ON DELETE CASCADE,
  CONSTRAINT fk_matched_item FOREIGN KEY (matched_existing_item_id) REFERENCES public.invoice_items(id) ON DELETE CASCADE
);

-- 6. Update RLS policies for companies (renamed from restaurants)
DROP POLICY IF EXISTS "Users can view their own restaurants" ON public.companies;
DROP POLICY IF EXISTS "Users can insert their own restaurants" ON public.companies;
DROP POLICY IF EXISTS "Users can update their own restaurants" ON public.companies;
DROP POLICY IF EXISTS "Users can delete their own restaurants" ON public.companies;

CREATE POLICY "Users can view their own companies"
  ON public.companies FOR SELECT
  USING (auth.uid() = owner_id);

CREATE POLICY "Users can insert their own companies"
  ON public.companies FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update their own companies"
  ON public.companies FOR UPDATE
  USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete their own companies"
  ON public.companies FOR DELETE
  USING (auth.uid() = owner_id);

-- 7. Update RLS policies for invoice_items (renamed from inventories)
DROP POLICY IF EXISTS "Users can view inventory of their restaurants" ON public.invoice_items;
DROP POLICY IF EXISTS "Users can insert inventory to their restaurants" ON public.invoice_items;
DROP POLICY IF EXISTS "Users can update inventory of their restaurants" ON public.invoice_items;
DROP POLICY IF EXISTS "Users can delete inventory of their restaurants" ON public.invoice_items;

CREATE POLICY "Users can view items of their companies"
  ON public.invoice_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.companies
      WHERE companies.id = invoice_items.company_id
      AND companies.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert items to their companies"
  ON public.invoice_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.companies
      WHERE companies.id = invoice_items.company_id
      AND companies.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can update items of their companies"
  ON public.invoice_items FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.companies
      WHERE companies.id = invoice_items.company_id
      AND companies.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete items of their companies"
  ON public.invoice_items FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.companies
      WHERE companies.id = invoice_items.company_id
      AND companies.owner_id = auth.uid()
    )
  );

-- 8. Update RLS policies for invoices
DROP POLICY IF EXISTS "Users can view invoices of their restaurants" ON public.invoices;
DROP POLICY IF EXISTS "Users can insert invoices to their restaurants" ON public.invoices;

CREATE POLICY "Users can view invoices of their companies"
  ON public.invoices FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.companies
      WHERE companies.id = invoices.company_id
      AND companies.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert invoices to their companies"
  ON public.invoices FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.companies
      WHERE companies.id = invoices.company_id
      AND companies.owner_id = auth.uid()
    )
  );

-- 9. Enable RLS for invoice_item_matches
ALTER TABLE public.invoice_item_matches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own item matches"
  ON public.invoice_item_matches FOR SELECT
  USING (auth.uid() = created_by);

CREATE POLICY "Users can create their own item matches"
  ON public.invoice_item_matches FOR INSERT
  WITH CHECK (auth.uid() = created_by);

-- 10. Create function to auto-update stock_status based on current_stock
CREATE OR REPLACE FUNCTION update_stock_status()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.current_stock <= 0 THEN
    NEW.stock_status := 'depleted';
  ELSIF NEW.current_stock <= (NEW.current_stock + NEW.stock_consumed) * 0.2 THEN
    NEW.stock_status := 'low';
  ELSE
    NEW.stock_status := 'available';
  END IF;
  
  NEW.last_updated := timezone('utc'::text, now());
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for auto-updating stock status
DROP TRIGGER IF EXISTS trigger_update_stock_status ON public.invoice_items;
CREATE TRIGGER trigger_update_stock_status
  BEFORE INSERT OR UPDATE OF current_stock, stock_consumed
  ON public.invoice_items
  FOR EACH ROW
  EXECUTE FUNCTION update_stock_status();

-- 11. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_invoice_items_company_id ON public.invoice_items(company_id);
CREATE INDEX IF NOT EXISTS idx_invoice_items_stock_status ON public.invoice_items(stock_status);
CREATE INDEX IF NOT EXISTS idx_invoices_company_id ON public.invoices(company_id);
CREATE INDEX IF NOT EXISTS idx_invoice_item_matches_invoice_item ON public.invoice_item_matches(invoice_item_id);
CREATE INDEX IF NOT EXISTS idx_invoice_item_matches_matched_item ON public.invoice_item_matches(matched_existing_item_id);

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Migration completed successfully: Generic invoice system created';
END $$;
