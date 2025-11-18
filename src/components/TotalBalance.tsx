import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { AccountCurrency } from '../lib/types';

type AccountWithCurrencies = {
  id: string;
  name: string;
  currencies: (AccountCurrency & { balance: number | null })[] | null;
};

type ExchangeRate = {
  from_currency: string;
  to_currency: string;
  rate: number;
  date: string | null;
};

interface TotalBalanceProps {
  className?: string;
}

type AccountBalanceRow = {
  accountId: string;
  accountName: string;
  currency: string;
  balance: number;
};

const noiseBackgroundStyle = {
  backgroundImage: 'url(/noise.bg.webp)',
  backgroundSize: 'cover',
  backgroundPosition: 'center'
};

const BASE_CURRENCY = 'UYU';
const SUPPORTED_TOTAL_CURRENCIES = [
  { code: 'UYU', label: 'Pesos uruguayos' },
  { code: 'USD', label: 'Dólares' }
];

function EyeIcon({ isOpen }: { isOpen: boolean }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-6 w-6"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M1.5 12s3.5-7.5 10.5-7.5S22.5 12 22.5 12 19 19.5 12 19.5 1.5 12 1.5 12Z"
      />
      {isOpen ? (
        <circle cx="12" cy="12" r="3" />
      ) : (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="m4.5 4.5 15 15"
        />
      )}
    </svg>
  );
}

export default function TotalBalance({ className }: TotalBalanceProps) {
  const [accounts, setAccounts] = useState<AccountWithCurrencies[]>([]);
  const [exchangeRates, setExchangeRates] = useState<ExchangeRate[]>([]);
  const [selectedCurrency, setSelectedCurrency] = useState<string>(BASE_CURRENCY);
  const [isCurrencyMenuOpen, setCurrencyMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const currencyMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isCurrencyMenuOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (!currencyMenuRef.current) return;
      if (currencyMenuRef.current.contains(event.target as Node)) return;
      setCurrencyMenuOpen(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isCurrencyMenuOpen]);

  useEffect(() => {
    const supportedCodes = SUPPORTED_TOTAL_CURRENCIES.map((option) => option.code);
    if (!supportedCodes.includes(selectedCurrency)) {
      setSelectedCurrency(BASE_CURRENCY);
    }
  }, [selectedCurrency]);

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        const {
          data: { user }
        } = await supabase.auth.getUser();

        if (!user) {
          throw new Error('Usuario no autenticado');
        }

        const [{ data: accountsData, error: accountsError }, { data: ratesData, error: ratesError }] =
          await Promise.all([
            supabase
              .from('accounts')
              .select('id, name, currencies:account_currencies(id, currency, balance)')
              .eq('user_id', user.id)
              .order('name', { ascending: true }),
            supabase
              .from('exchange_rates')
              .select('from_currency, to_currency, rate, date')
          ]);

        if (accountsError) throw accountsError;
        if (ratesError) throw ratesError;

        if (isMounted) {
          setAccounts((accountsData as AccountWithCurrencies[]) ?? []);
          setExchangeRates((ratesData as ExchangeRate[]) ?? []);
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err.message ?? 'Error obteniendo los saldos');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, []);

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
    (amount: number, from: string, to: string) => {
      if (!from || !to) return null;
      if (!Number.isFinite(amount)) return null;
      if (from === to) return amount;

      const visited = new Set<string>([from]);
      const queue: Array<{ currency: string; factor: number }> = [{ currency: from, factor: 1 }];

      for (let i = 0; i < queue.length; i += 1) {
        const { currency, factor } = queue[i];
        const edges = conversionGraph[currency] ?? [];

        for (const edge of edges) {
          if (edge.rate <= 0) continue;
          const nextFactor = factor * edge.rate;

          if (edge.to === to) {
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

  const totalInSelectedCurrency = useMemo(() => {
    if (!selectedCurrency) return 0;

    return accountBalances.reduce((sum, row) => {
      const converted = convertAmount(row.balance, row.currency, selectedCurrency);
      return converted !== null ? sum + converted : sum;
    }, 0);
  }, [accountBalances, selectedCurrency, convertAmount]);

  const selectedCurrencyInfo = useMemo(
    () =>
      SUPPORTED_TOTAL_CURRENCIES.find((option) => option.code === selectedCurrency) ??
      SUPPORTED_TOTAL_CURRENCIES[0],
    [selectedCurrency]
  );

  const accountRows = useMemo(() => {
    return accountBalances
      .map((row) => ({
        id: `${row.accountId}-${row.currency}`,
        label: `${row.accountName.toUpperCase()} · ${row.currency}`,
        amount: row.balance
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [accountBalances]);

  const handleCurrencySelect = useCallback((currency: string) => {
    setSelectedCurrency(currency);
    setCurrencyMenuOpen(false);
  }, []);

  const numberFormatter = useMemo(
    () =>
      new Intl.NumberFormat('es-UY', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
      }),
    []
  );

  const displayAmount = useCallback(
    (value: number | null) => numberFormatter.format(value ?? 0),
    [numberFormatter]
  );

  const containerClass = ['w-full', className].filter(Boolean).join(' ');

  return (
    <div className={containerClass}>
      <div className="relative overflow-hidden rounded-[28px] border border-white/20 bg-gradient-to-br from-white/20 via-white/5 to-black/30 shadow-[0_20px_70px_rgba(0,0,0,0.25)] text-white">
        <div className="absolute inset-0 opacity-80" style={noiseBackgroundStyle} aria-hidden="true" />
        <div className="absolute inset-0 bg-gradient-to-b from-white/10 via-transparent to-black/40" aria-hidden="true" />

        <div
          className="relative z-10 grid gap-6 p-6 sm:p-8"
          style={{ gridTemplateColumns: 'repeat(2,minmax(0,1fr))' }}
        >
          <div className="flex flex-col gap-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.5em] text-white/80">
                Plata total
              </p>
              <div className="mt-4 flex items-end gap-3">
                <span className="text-sm uppercase tracking-[0.6em] text-white/70">
                  {selectedCurrency || '---'}
                </span>
                <span className="text-[30px] font-semibold leading-none ">
                  {displayAmount(totalInSelectedCurrency)}
                </span>
              </div>
            </div>

            <div className="mt-6">
          
              <div className="mt-2 flex items-center ">
            
                <div className="relative" ref={currencyMenuRef}>
                  <button
                    type="button"
                    onClick={() => setCurrencyMenuOpen((prev) => !prev)}
                    className="flex h-12 w-12 items-center justify-center rounded-full border border-white/30 bg-white/10 text-white transition hover:bg-white/20"
                    aria-label="Cambiar moneda"
                  >
                    <EyeIcon isOpen={isCurrencyMenuOpen} />
                  </button>
                  {isCurrencyMenuOpen && (
                    <div className="absolute right-0 mt-3 w-48 rounded-3xl border border-white/30 bg-black/70 p-2 text-left shadow-2xl backdrop-blur-lg">
                      {SUPPORTED_TOTAL_CURRENCIES.map((option) => (
                        <button
                          key={option.code}
                          type="button"
                          onClick={() => handleCurrencySelect(option.code)}
                          className={`flex w-full flex-col rounded-2xl px-3 py-2 text-left transition ${
                            option.code === selectedCurrency
                              ? 'bg-white/20 text-white'
                              : 'text-white/80 hover:bg-white/10'
                          }`}
                        >
                          <span className="text-xs font-semibold uppercase tracking-[0.4em]">
                            {option.code}
                          </span>
                          <span className="text-[11px] text-white/70">
                            {option.label}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col justify-between gap-6">
            <div className="rounded-3xl border ">
              <div className="text-xs uppercase tracking-[0.4em] text-white/60">
                Cuentas
              </div>
              <div className="mt-4 space-y-3 text-sm">
                {loading && (
                  <div className="animate-pulse text-white/60">Cargando...</div>
                )}
                {!loading && accountRows.length === 0 && (
                  <div className="text-white/70">No hay cuentas con saldo.</div>
                )}
                {!loading &&
                  accountRows.map((row) => (
                    <div className="flex items-center justify-between border-b border-white/10 pb-2 text-base last:border-b-0 last:pb-0" key={row.id}>
                      <span className="tracking-[0.3em] text-white/70">
                        {row.label}
                      </span>
                      <span className="font-semibold">
                        {displayAmount(row.amount)}
                      </span>
                    </div>
                  ))}
              </div>
            </div>

            {error ? (
              <div className="rounded-3xl border border-red-400/40 bg-red-500/10 p-4 text-red-100">
                {error}
              </div>
            ) : (
              <button
                type="button"
                className="rounded-full border border-white/30 bg-black/60 py-3 text-sm uppercase tracking-[0.5em] text-white transition hover:bg-black/40"
              >
                Gestionar
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
