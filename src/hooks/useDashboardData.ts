import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { subscribeToDashboardRefresh } from '../lib/dashboardEvents';
import {
  DailySpendable,
  MonthSummary,
  TodayExpenses,
  RandomExpensesMonth,
  SavingsTotal,
  Account,
  Category,
  Period,
} from '../lib/types';

export function useDashboardData() {
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [dailySpendable, setDailySpendable] = useState<DailySpendable | null>(null);
  const [monthSummary, setMonthSummary] = useState<MonthSummary | null>(null);
  const [todayExpenses, setTodayExpenses] = useState<TodayExpenses | null>(null);
  const [randomExpenses, setRandomExpenses] = useState<RandomExpensesMonth | null>(null);
  const [savingsTotal, setSavingsTotal] = useState<SavingsTotal[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [periods, setPeriods] = useState<Period[]>([]);

  const fetchData = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setIsRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      // Obtener el usuario autenticado actual
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Usuario no autenticado');
      }
      setUserId(user.id);

      const [
        dailyRes,
        monthRes,
        todayRes,
        randomRes,
        savingsRes,
        accountsRes,
        categoriesRes,
        periodsRes,
      ] = await Promise.all([
        supabase.from('vw_daily_spendable').select('*').eq('user_id', user.id).maybeSingle(),
        supabase.from('vw_month_summary').select('*').eq('user_id', user.id).maybeSingle(),
        supabase.from('vw_today_expenses').select('*').eq('user_id', user.id).maybeSingle(),
        supabase.from('vw_random_expenses_month').select('*').eq('user_id', user.id).maybeSingle(),
        supabase.from('vw_savings_total').select('*').eq('user_id', user.id),
        supabase.from('accounts').select('*').eq('user_id', user.id).order('is_primary', { ascending: false }),
        supabase.from('categories').select('*').eq('user_id', user.id).order('name'),
        supabase.from('periods').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
      ]);

      if (dailyRes.data) setDailySpendable(dailyRes.data);
      if (monthRes.data) setMonthSummary(monthRes.data);
      if (todayRes.data) setTodayExpenses(todayRes.data);
      if (randomRes.data) setRandomExpenses(randomRes.data);
      if (savingsRes.data) setSavingsTotal(savingsRes.data);
      if (accountsRes.data) setAccounts(accountsRes.data);
      if (categoriesRes.data) setCategories(categoriesRes.data);
      if (periodsRes.data) {
        console.log('useDashboardData - Periods fetched:', periodsRes.data);
        console.log('useDashboardData - User ID:', user.id);
        setPeriods(periodsRes.data);
      } else {
        console.log('useDashboardData - No periods data');
        setPeriods([]);
      }

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
    const unsubscribeRefresh = subscribeToDashboardRefresh(() => fetchData(true));
    const intervalId = setInterval(() => fetchData(true), 15000);

    // Suscribirse a cambios en tiempo real
    const channel = supabase
      .channel('dashboard-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'transactions' },
        () => {
          console.log('Transaction changed, refetching data...');
          fetchData(true);
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'savings_moves' },
        () => {
          console.log('Savings move changed, refetching data...');
          fetchData(true);
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'accounts' },
        () => {
          console.log('Account changed, refetching data...');
          fetchData(true);
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'categories' },
        () => {
          console.log('Category changed, refetching data...');
          fetchData(true);
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'monthly_plan' },
        () => {
          console.log('Monthly plan changed, refetching data...');
          fetchData(true);
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'periods' },
        () => {
          console.log('Period changed, refetching data...');
          fetchData(true);
        }
      )
      .subscribe();

    // Cleanup al desmontar
    return () => {
      supabase.removeChannel(channel);
      unsubscribeRefresh();
      clearInterval(intervalId);
    };
  }, []);

  return {
    loading,
    isRefreshing,
    error,
    dailySpendable,
    monthSummary,
    todayExpenses,
    randomExpenses,
    savingsTotal,
    accounts,
    categories,
    periods,
    refetch: () => fetchData(true),
  };
}
