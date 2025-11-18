import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';
import type { ReactNode } from 'react';
import { supabase } from '../lib/supabaseClient';
import type { Account, AccountCurrency } from '../lib/types';
import { useAuth } from '../contexts/AuthContext';

type AccountWithCurrencies = Omit<Account, 'currencies'> & {
  currencies: AccountCurrency[] | null;
};

type ExchangeRate = {
  from_currency: string;
  to_currency: string;
  rate: number;
  date: string | null;
};

export type AccountBalanceRow = {
  accountId: string;
  accountName: string;
  currency: string;
  balance: number;
};

interface AccountsContextValue {
  accounts: AccountWithCurrencies[];
  exchangeRates: ExchangeRate[];
  accountBalances: AccountBalanceRow[];
  balancesByCurrency: Record<string, number>;
  totalBalanceInBase: number;
  baseCurrency: string;
  convertAmount: (amount: number, fromCurrency: string, toCurrency: string) => number | null;
  getTotalBalance: (targetCurrency: string) => number;
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

const BASE_CURRENCY = 'UYU';

const AccountsContext = createContext<AccountsContextValue | undefined>(undefined);

export function AccountsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const [accounts, setAccounts] = useState<AccountWithCurrencies[]>([]);
  const [exchangeRates, setExchangeRates] = useState<ExchangeRate[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const accountIdsRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    accountIdsRef.current = new Set(accounts.map((account) => account.id));
  }, [accounts]);

  const fetchData = useCallback(
    async (reason: 'initial' | 'realtime' = 'initial') => {
      if (!userId) {
        setAccounts([]);
        setExchangeRates([]);
        setLoading(false);
        setRefreshing(false);
        setError(null);
        return;
      }

      if (reason === 'initial') {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      setError(null);

      try {
        const [
          { data: accountsData, error: accountsError },
          { data: ratesData, error: ratesError }
        ] = await Promise.all([
          supabase
            .from('accounts')
            .select('*, currencies:account_currencies(*)')
            .eq('user_id', userId)
            .order('name', { ascending: true }),
          supabase.from('exchange_rates').select('from_currency, to_currency, rate, date')
        ]);

        if (accountsError) throw accountsError;
        if (ratesError) throw ratesError;

        setAccounts((accountsData as AccountWithCurrencies[]) ?? []);
        setExchangeRates((ratesData as ExchangeRate[]) ?? []);
      } catch (err) {
        console.error('[AccountsStore] Error fetching accounts/balances', err);
        const message =
          err instanceof Error ? err.message : 'Error obteniendo cuentas y balances';
        setError(message);
      } finally {
        if (reason === 'initial') {
          setLoading(false);
        } else {
          setRefreshing(false);
        }
      }
    },
    [userId]
  );

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      setRefreshing(false);
      return;
    }

    fetchData();
  }, [userId, fetchData]);

  useEffect(() => {
    if (!userId) return;

    // Suscripción en tiempo real a Supabase para reflejar cambios de cuentas/balances
    const channel = supabase
      .channel('accounts-store')
      // Cuenta si misma
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'accounts', filter: `user_id=eq.${userId}` },
        () => {
          fetchData('realtime');
        }
      )
      // Balances por divisa
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'account_currencies' },
        (payload) => {
          const nextAccountId =
            ((payload.new as { account_id?: string } | null)?.account_id) ??
            ((payload.old as { account_id?: string } | null)?.account_id);
          if (nextAccountId && accountIdsRef.current.has(nextAccountId)) {
            fetchData('realtime');
          }
        }
      )
      // Movimientos que puedan impactar balances
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'movements', filter: `user_id=eq.${userId}` },
        () => {
          fetchData('realtime');
        }
      )
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          console.error('[AccountsStore] Realtime channel issue', status);
        }
      });

  // Limpieza del canal para evitar fugas
    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, fetchData]);

  const accountBalances = useMemo<AccountBalanceRow[]>(() => {
    return accounts.flatMap((account) =>
      (account.currencies ?? []).map((currency) => ({
        accountId: account.id,
        accountName: account.name,
        currency: currency.currency,
        balance: Number(currency.balance ?? 0)
      }))
    );
  }, [accounts]);

  const balancesByCurrency = useMemo<Record<string, number>>(() => {
    return accountBalances.reduce<Record<string, number>>((acc, row) => {
      acc[row.currency] = (acc[row.currency] ?? 0) + row.balance;
      return acc;
    }, {});
  }, [accountBalances]);

  const conversionGraph = useMemo(() => {
    const graph: Record<string, Array<{ to: string; rate: number }>> = {};
    const normalized = new Map<string, ExchangeRate>();

    const registerEdge = (from: string, to: string, rate: number) => {
      if (!graph[from]) graph[from] = [];
      graph[from].push({ to, rate });
    };

    exchangeRates.forEach((rate) => {
      if (!rate.from_currency || !rate.to_currency) return;
      const key = `${rate.from_currency}-${rate.to_currency}`;
      const prev = normalized.get(key);
      const prevDate = prev?.date ? new Date(prev.date).getTime() : 0;
      const nextDate = rate.date ? new Date(rate.date).getTime() : 0;

      if (!prev || nextDate >= prevDate) {
        normalized.set(key, rate);
      }
    });

    normalized.forEach((rate) => {
      const numericRate = Number(rate.rate);
      if (!Number.isFinite(numericRate) || numericRate <= 0) return;
      registerEdge(rate.from_currency, rate.to_currency, numericRate);
      registerEdge(rate.to_currency, rate.from_currency, 1 / numericRate);
    });

    return graph;
  }, [exchangeRates]);

  const convertAmount = useCallback(
    (amount: number, fromCurrency: string, toCurrency: string) => {
      if (!fromCurrency || !toCurrency) return null;
      if (!Number.isFinite(amount)) return null;
      if (fromCurrency === toCurrency) return amount;

      const visited = new Set<string>([fromCurrency]);
      const queue: Array<{ currency: string; factor: number }> = [
        { currency: fromCurrency, factor: 1 }
      ];

      for (let i = 0; i < queue.length; i += 1) {
        const { currency, factor } = queue[i];
        const edges = conversionGraph[currency] ?? [];

        for (const edge of edges) {
          if (edge.rate <= 0) continue;
          const nextFactor = factor * edge.rate;

          if (edge.to === toCurrency) {
            return amount * nextFactor;
          }

          if (!visited.has(edge.to)) {
            visited.add(edge.to);
            queue.push({ currency: edge.to, factor: nextFactor });
          }
        }
      }

      return null;
    },
    [conversionGraph]
  );

  const getTotalBalance = useCallback(
    (targetCurrency: string) => {
      if (!targetCurrency) return 0;
      return accountBalances.reduce((sum, row) => {
        const converted = convertAmount(row.balance, row.currency, targetCurrency);
        return converted !== null ? sum + converted : sum;
      }, 0);
    },
    [accountBalances, convertAmount]
  );

  const totalBalanceInBase = useMemo(
    () => getTotalBalance(BASE_CURRENCY),
    [getTotalBalance]
  );

  const refetch = useCallback(async () => {
    await fetchData('realtime');
  }, [fetchData]);

  const value = useMemo<AccountsContextValue>(
    () => ({
      accounts,
      exchangeRates,
      accountBalances,
      balancesByCurrency,
      totalBalanceInBase,
      baseCurrency: BASE_CURRENCY,
      convertAmount,
      getTotalBalance,
      loading,
      refreshing,
      error,
      refetch
    }),
    [
      accounts,
      exchangeRates,
      accountBalances,
      balancesByCurrency,
      totalBalanceInBase,
      convertAmount,
      getTotalBalance,
      loading,
      refreshing,
      error,
      refetch
    ]
  );

  return <AccountsContext.Provider value={value}>{children}</AccountsContext.Provider>;
}

export function useAccountsStore() {
  const context = useContext(AccountsContext);
  if (!context) {
    throw new Error('useAccountsStore debe usarse dentro de AccountsProvider');
  }
  return context;
}
