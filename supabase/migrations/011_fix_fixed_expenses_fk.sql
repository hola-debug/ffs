-- Fix incorrect foreign key constraint on fixed_expenses
-- It seems the constraint was pointing to 'accounts' instead of 'pockets'

-- 1. Drop the incorrect constraint
ALTER TABLE public.fixed_expenses 
DROP CONSTRAINT IF EXISTS fixed_expenses_pocket_id_fkey;

-- 2. Add the correct constraint referencing pockets
ALTER TABLE public.fixed_expenses
ADD CONSTRAINT fixed_expenses_pocket_id_fkey
FOREIGN KEY (pocket_id) 
REFERENCES public.pockets(id)
ON DELETE CASCADE;
