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

console.log('🔥🔥🔥 useDashboardData.ts FILE LOADED 🔥🔥🔥');

export function useDashboardData() {
  console.log('🎯 useDashboardData HOOK CALLED');
  
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [justUpdated, setJustUpdated] = useState(false);
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

      // Trigger flash animation when data updates from realtime
      if (isRefresh) {
        setJustUpdated(true);
        setTimeout(() => setJustUpdated(false), 600);
      }

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    console.log('🚀 useDashboardData: useEffect triggered');
    
    let channel: ReturnType<typeof supabase.channel> | null = null;

    const setupRealtimeSubscription = async () => {
      try {
        console.log('🔍 Getting user for realtime subscription...');
        // Obtener el usuario actual para filtrar eventos
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError) {
          console.error('❌ Error getting user:', userError);
          return;
        }
        
        if (!user) {
          console.warn('⚠️ No user found for realtime subscription');
          return;
        }
        
        console.log('✅ User found:', user.id);

        // Suscribirse a cambios en tiempo real SIN filtro para debugging
        console.log('🔧 Setting up realtime channels for user:', user.id);
        channel = supabase
          .channel('dashboard-changes')
          .on(
            'postgres_changes',
            { 
              event: '*', 
              schema: 'public', 
              table: 'transactions'
            },
            (payload) => {
              console.log('🔄 Transaction changed (any user):', payload);
              // Solo refetch si es del usuario actual
              const record = payload.new as any;
              if (record && record.user_id === user.id) {
                console.log('✅ Transaction belongs to current user, refetching...');
                fetchData(true);
              } else {
                console.log('⚠️ Transaction from different user, ignoring');
              }
            }
          )
          .on(
            'postgres_changes',
            { 
              event: '*', 
              schema: 'public', 
              table: 'savings_moves'
            },
            (payload) => {
              console.log('🔄 Savings move changed (any user):', payload);
              const record = payload.new as any;
              if (record && record.user_id === user.id) {
                console.log('✅ Savings move belongs to current user, refetching...');
                fetchData(true);
              }
            }
          )
          .on(
            'postgres_changes',
            { 
              event: '*', 
              schema: 'public', 
              table: 'accounts'
            },
            (payload) => {
              console.log('🔄 Account changed (any user):', payload);
              const record = payload.new as any;
              if (record && record.user_id === user.id) {
                console.log('✅ Account belongs to current user, refetching...');
                fetchData(true);
              }
            }
          )
          .on(
            'postgres_changes',
            { 
              event: '*', 
              schema: 'public', 
              table: 'categories'
            },
            (payload) => {
              console.log('🔄 Category changed (any user):', payload);
              const record = payload.new as any;
              if (record && record.user_id === user.id) {
                console.log('✅ Category belongs to current user, refetching...');
                fetchData(true);
              }
            }
          )
          .on(
            'postgres_changes',
            { 
              event: '*', 
              schema: 'public', 
              table: 'monthly_plan'
            },
            (payload) => {
              console.log('🔄 Monthly plan changed (any user):', payload);
              const record = payload.new as any;
              if (record && record.user_id === user.id) {
                console.log('✅ Monthly plan belongs to current user, refetching...');
                fetchData(true);
              }
            }
          )
          .on(
            'postgres_changes',
            { 
              event: '*', 
              schema: 'public', 
              table: 'periods'
            },
            (payload) => {
              console.log('🔄 Period changed (any user):', payload);
              const record = payload.new as any;
              if (record && record.user_id === user.id) {
                console.log('✅ Period belongs to current user, refetching...');
                fetchData(true);
              }
            }
          )
          .subscribe((status) => {
            console.log('📡 Realtime subscription status:', status);
            if (status === 'SUBSCRIBED') {
              console.log('✅ Successfully subscribed to dashboard realtime changes');
            } else if (status === 'CHANNEL_ERROR') {
              console.error('❌ Realtime subscription error');
            } else if (status === 'TIMED_OUT') {
              console.error('⏱️ Realtime subscription timed out');
            } else if (status === 'CLOSED') {
              console.warn('🚪 Realtime subscription closed');
            }
          });
      } catch (err) {
        console.error('🚫 Error setting up realtime subscription:', err);
      }
    };

    fetchData();
    const unsubscribeRefresh = subscribeToDashboardRefresh(() => fetchData(true));
    setupRealtimeSubscription();

    // Cleanup al desmontar
    return () => {
      console.log('🧹 Cleaning up realtime subscription');
      if (channel) {
        supabase.removeChannel(channel);
      }
      unsubscribeRefresh();
    };
  }, []);

  return {
    loading,
    isRefreshing,
    justUpdated,
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
