-- Trigger to update account balance based on movements
-- This ensures that when an income or expense is registered, the account balance reflects it.

CREATE OR REPLACE FUNCTION public.update_account_balance_from_movement()
RETURNS TRIGGER AS $$
DECLARE
  v_amount NUMERIC;
  v_account_id UUID;
  v_currency TEXT;
  v_type TEXT;
BEGIN
  -- Handle INSERT
  IF TG_OP = 'INSERT' THEN
    v_amount := NEW.amount;
    v_account_id := NEW.account_id;
    v_currency := NEW.currency;
    v_type := NEW.type;
    
    IF v_account_id IS NOT NULL THEN
      -- If income, add to balance
      IF v_type = 'income' OR v_type = 'pocket_return' OR v_type = 'debt_interest' THEN -- debt_interest might be income for the creditor? Assuming standard user flow: income adds.
         -- Wait, debt_interest usually is an expense? Let's check types.
         -- 'income' is definitely add.
         -- 'pocket_return' (money coming back from pocket to account) is add.
         
         UPDATE public.account_currencies
         SET balance = balance + v_amount
         WHERE account_id = v_account_id AND currency = v_currency;
         
      -- If expense, subtract from balance
      ELSE
         -- fixed_expense, saving_deposit, pocket_allocation, pocket_expense, debt_payment
         UPDATE public.account_currencies
         SET balance = balance - v_amount
         WHERE account_id = v_account_id AND currency = v_currency;
      END IF;
    END IF;
    
    RETURN NEW;

  -- Handle DELETE
  ELSIF TG_OP = 'DELETE' THEN
    v_amount := OLD.amount;
    v_account_id := OLD.account_id;
    v_currency := OLD.currency;
    v_type := OLD.type;
    
    IF v_account_id IS NOT NULL THEN
      -- Reverse operation
      IF v_type = 'income' OR v_type = 'pocket_return' THEN
         UPDATE public.account_currencies
         SET balance = balance - v_amount
         WHERE account_id = v_account_id AND currency = v_currency;
      ELSE
         UPDATE public.account_currencies
         SET balance = balance + v_amount
         WHERE account_id = v_account_id AND currency = v_currency;
      END IF;
    END IF;
    
    RETURN OLD;

  -- Handle UPDATE
  ELSIF TG_OP = 'UPDATE' THEN
    -- Revert OLD
    v_amount := OLD.amount;
    v_account_id := OLD.account_id;
    v_currency := OLD.currency;
    v_type := OLD.type;
    
    IF v_account_id IS NOT NULL THEN
      IF v_type = 'income' OR v_type = 'pocket_return' THEN
         UPDATE public.account_currencies
         SET balance = balance - v_amount
         WHERE account_id = v_account_id AND currency = v_currency;
      ELSE
         UPDATE public.account_currencies
         SET balance = balance + v_amount
         WHERE account_id = v_account_id AND currency = v_currency;
      END IF;
    END IF;
    
    -- Apply NEW
    v_amount := NEW.amount;
    v_account_id := NEW.account_id;
    v_currency := NEW.currency;
    v_type := NEW.type;
    
    IF v_account_id IS NOT NULL THEN
      IF v_type = 'income' OR v_type = 'pocket_return' THEN
         UPDATE public.account_currencies
         SET balance = balance + v_amount
         WHERE account_id = v_account_id AND currency = v_currency;
      ELSE
         UPDATE public.account_currencies
         SET balance = balance - v_amount
         WHERE account_id = v_account_id AND currency = v_currency;
      END IF;
    END IF;
    
    RETURN NEW;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists to avoid duplication
DROP TRIGGER IF EXISTS trg_update_account_balance ON public.movements;

-- Create trigger
CREATE TRIGGER trg_update_account_balance
AFTER INSERT OR UPDATE OR DELETE ON public.movements
FOR EACH ROW
EXECUTE FUNCTION public.update_account_balance_from_movement();
