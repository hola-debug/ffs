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
        supabase.from('vw_daily_spendable').select('*').maybeSingle(),
        supabase.from('vw_month_summary').select('*').maybeSingle(),
        supabase.from('vw_today_expenses').select('*').maybeSingle(),
        supabase.from('vw_random_expenses_month').select('*').maybeSingle(),
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

    // Suscribirse a cambios en tiempo real
    const channel = supabase
      .channel('dashboard-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'transactions' },
        () => {
          console.log('Transaction changed, refetching data...');
          fetchData();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'savings_moves' },
        () => {
          console.log('Savings move changed, refetching data...');
          fetchData();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'accounts' },
        () => {
          console.log('Account changed, refetching data...');
          fetchData();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'categories' },
        () => {
          console.log('Category changed, refetching data...');
          fetchData();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'monthly_plan' },
        () => {
          console.log('Monthly plan changed, refetching data...');
          fetchData();
        }
      )
      .subscribe();

    // Cleanup al desmontar
    return () => {
      supabase.removeChannel(channel);
    };
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
