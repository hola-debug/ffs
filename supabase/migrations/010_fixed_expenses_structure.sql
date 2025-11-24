-- Create fixed_expenses table
CREATE TABLE IF NOT EXISTS public.fixed_expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pocket_id UUID NOT NULL REFERENCES public.pockets(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  currency TEXT NOT NULL,
  due_day INTEGER NOT NULL CHECK (due_day BETWEEN 1 AND 31),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.fixed_expenses ENABLE ROW LEVEL SECURITY;

-- Add RLS policies
CREATE POLICY "Users can view their own fixed expenses"
ON public.fixed_expenses FOR SELECT
USING (
  pocket_id IN (SELECT id FROM public.pockets WHERE user_id = auth.uid())
);

CREATE POLICY "Users can insert their own fixed expenses"
ON public.fixed_expenses FOR INSERT
WITH CHECK (
  pocket_id IN (SELECT id FROM public.pockets WHERE user_id = auth.uid())
);

CREATE POLICY "Users can update their own fixed expenses"
ON public.fixed_expenses FOR UPDATE
USING (
  pocket_id IN (SELECT id FROM public.pockets WHERE user_id = auth.uid())
);

CREATE POLICY "Users can delete their own fixed expenses"
ON public.fixed_expenses FOR DELETE
USING (
  pocket_id IN (SELECT id FROM public.pockets WHERE user_id = auth.uid())
);

-- Add column to movements table
ALTER TABLE public.movements 
ADD COLUMN IF NOT EXISTS fixed_expense_id UUID REFERENCES public.fixed_expenses(id) ON DELETE SET NULL;

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_fixed_expenses_pocket_id ON public.fixed_expenses(pocket_id);
CREATE INDEX IF NOT EXISTS idx_movements_fixed_expense_id ON public.movements(fixed_expense_id);
