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
import type { Account, AccountCurrency, Pocket } from '../lib/types';
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
  totalBalance: number;
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
  const [pockets, setPockets] = useState<Pocket[]>([]);
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
        setPockets([]);
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
          { data: ratesData, error: ratesError },
          { data: pocketsData, error: pocketsError }
        ] = await Promise.all([
          supabase
            .from('accounts')
            .select('*, currencies:account_currencies(*)')
            .eq('user_id', userId)
            .order('name', { ascending: true }),
          supabase.from('exchange_rates').select('from_currency, to_currency, rate, date'),
          supabase.from('pockets').select('*').eq('user_id', userId).eq('status', 'active')
        ]);

        if (accountsError) throw accountsError;
        if (ratesError) throw ratesError;
        if (pocketsError) throw pocketsError;

        setAccounts((accountsData as AccountWithCurrencies[]) ?? []);
        setExchangeRates((ratesData as ExchangeRate[]) ?? []);
        setPockets((pocketsData as Pocket[]) ?? []);
      } catch (err) {
        console.error('[AccountsStore] Error fetching data', err);
        const message =
          err instanceof Error ? err.message : 'Error obteniendo datos';
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
      setAccounts([]);
      setExchangeRates([]);
      setPockets([]);
      setLoading(false);
      setRefreshing(false);
      setError(null);
      return;
    }

    fetchData();
  }, [userId, fetchData]);

  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel('accounts-store')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'accounts' },
        () => fetchData('realtime')
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'account_currencies' },
        () => fetchData('realtime')
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'pockets' },
        () => fetchData('realtime')
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, fetchData]);

  const convertAmount = useCallback(
    (amount: number, fromCurrency: string, toCurrency: string): number | null => {
      if (fromCurrency === toCurrency) return amount;

      const rate = exchangeRates.find(
        (r) => r.from_currency === fromCurrency && r.to_currency === toCurrency
      );
      if (rate) return amount * rate.rate;

      const inverseRate = exchangeRates.find(
        (r) => r.from_currency === toCurrency && r.to_currency === fromCurrency
      );
      if (inverseRate) return amount / inverseRate.rate;

      return null;
    },
    [exchangeRates]
  );

  const accountBalances = useMemo((): AccountBalanceRow[] => {
    if (!accounts) return [];
    return accounts.flatMap((account) =>
      account.currencies?.map((currency) => ({
        accountId: account.id,
        accountName: account.name,
        currency: currency.currency,
        balance: currency.balance
      })) ?? []
    );
  }, [accounts]);

  const balancesByCurrency = useMemo(() => {
    const balances: Record<string, number> = {};
    accountBalances.forEach((row) => {
      balances[row.currency] = (balances[row.currency] || 0) + row.balance;
    });
    return balances;
  }, [accountBalances]);

  // Helper para entender cuánto "compromete" cada pocket sobre la plata global
  const getPocketReservedAmount = useCallback((pocket: Pocket): number => {
    // Ahorro: cuenta como plata "no disponible" (no tocar)
    if (pocket.type === 'saving') {
      return (
        pocket.amount_saved ??
        pocket.allocated_amount ??
        0
      );
    }

    // Presupuestos / gastos: lo reservado es el allocated_amount
    return pocket.allocated_amount ?? 0;
  }, []);

const getTotalBalance = useCallback(
  (targetCurrency: string): number => {
    // TOTAL = suma de TODAS las cuentas del usuario
    let total = 0;

    for (const currency in balancesByCurrency) {
      const convertedAmount = convertAmount(
        balancesByCurrency[currency],
        currency,
        targetCurrency
      );

      if (convertedAmount !== null && Number.isFinite(convertedAmount)) {
        total += convertedAmount;
      }
    }

    // NO restamos ninguna bolsa
    // Las bolsas son organización, no afectan a la plata real del usuario

    return total;
  },
  [balancesByCurrency, convertAmount]
);


  const totalBalanceInBase = useMemo(
    () => getTotalBalance(BASE_CURRENCY),
    [getTotalBalance]
  );

  const value: AccountsContextValue = {
    accounts,
    exchangeRates,
    accountBalances,
    balancesByCurrency,
    totalBalanceInBase,
    totalBalance: totalBalanceInBase,
    baseCurrency: BASE_CURRENCY,
    convertAmount,
    getTotalBalance,
    loading,
    refreshing,
    error,
    refetch: () => fetchData('initial')
  };

  return (
    <AccountsContext.Provider value={value}>
      {children}
    </AccountsContext.Provider>
  );
}

export function useAccountsStore() {
  const context = useContext(AccountsContext);
  if (context === undefined) {
    throw new Error('useAccountsStore must be used within an AccountsProvider');
  }
  return context;
}
