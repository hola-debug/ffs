import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import {
  DailySpendable,
  MonthSummary,
  TodayExpenses,
  RandomExpensesMonth,
  SavingsTotal,
  Account,
  Category,
} from '../lib/types';

export function useDashboardData() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dailySpendable, setDailySpendable] = useState<DailySpendable | null>(null);
  const [monthSummary, setMonthSummary] = useState<MonthSummary | null>(null);
  const [todayExpenses, setTodayExpenses] = useState<TodayExpenses | null>(null);
  const [randomExpenses, setRandomExpenses] = useState<RandomExpensesMonth | null>(null);
  const [savingsTotal, setSavingsTotal] = useState<SavingsTotal[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [
        dailyRes,
        monthRes,
        todayRes,
        randomRes,
        savingsRes,
        accountsRes,
        categoriesRes,
      ] = await Promise.all([
        supabase.from('vw_daily_spendable').select('*').single(),
        supabase.from('vw_month_summary').select('*').single(),
        supabase.from('vw_today_expenses').select('*').single(),
        supabase.from('vw_random_expenses_month').select('*').single(),
        supabase.from('vw_savings_total').select('*'),
        supabase.from('accounts').select('*').order('is_primary', { ascending: false }),
        supabase.from('categories').select('*').order('name'),
      ]);

      if (dailyRes.data) setDailySpendable(dailyRes.data);
      if (monthRes.data) setMonthSummary(monthRes.data);
      if (todayRes.data) setTodayExpenses(todayRes.data);
      if (randomRes.data) setRandomExpenses(randomRes.data);
      if (savingsRes.data) setSavingsTotal(savingsRes.data);
      if (accountsRes.data) setAccounts(accountsRes.data);
      if (categoriesRes.data) setCategories(categoriesRes.data);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return {
    loading,
    error,
    dailySpendable,
    monthSummary,
    todayExpenses,
    randomExpenses,
    savingsTotal,
    accounts,
    categories,
    refetch: fetchData,
  };
}
