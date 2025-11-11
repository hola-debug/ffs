-- Enable realtime replication for dashboard tables
-- This allows Supabase Realtime to listen to changes on these tables

-- Enable replication for transactions table
ALTER TABLE public.transactions REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.transactions;

-- Enable replication for savings_moves table
ALTER TABLE public.savings_moves REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.savings_moves;

-- Enable replication for accounts table
ALTER TABLE public.accounts REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.accounts;

-- Enable replication for categories table
ALTER TABLE public.categories REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.categories;

-- Enable replication for monthly_plan table
ALTER TABLE public.monthly_plan REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.monthly_plan;

-- Enable replication for periods table
ALTER TABLE public.periods REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.periods;
